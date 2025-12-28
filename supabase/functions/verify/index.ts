// VidChain Public Verify Edge Function
// Public endpoint for verifying video authenticity

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { ethers } from "https://esm.sh/ethers@6.9.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  query: string; // Token ID, transaction hash, or SHA-256 hash
}

interface VerificationResult {
  status: "verified" | "unverified" | "modified" | "unknown";
  confidence: number;
  token_id?: number;
  sha256_hash: string;
  ipfs_cid: string;
  blockchain_timestamp?: string;
  transaction_hash?: string;
  owner_address?: string;
  checks: {
    hash_match: boolean;
    cid_valid: boolean;
    chain_unbroken: boolean;
    metadata_consistent: boolean;
  };
  warnings: string[];
  certificate_url?: string;
}

// VidChainNFT ABI (minimal for verification)
const VIDCHAIN_NFT_ABI = [
  "function verify(uint256 _tokenId) external view returns (bytes32 sha256Hash, bytes32 ipfsCidHash, uint64 timestamp, address owner, bool exists)",
  "function verifyByHash(bytes32 _sha256Hash) external view returns (uint256 tokenId, uint64 timestamp, address owner, bool exists)",
  "function videoRecords(uint256) external view returns (bytes32 sha256Hash, bytes32 ipfsCidHash, uint64 timestamp, uint32 version)",
];

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const alchemyApiKey = Deno.env.get("ALCHEMY_API_KEY")!;
    const contractAddress = Deno.env.get("VIDCHAIN_CONTRACT_ADDRESS")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { query }: VerifyRequest = await req.json();

    if (!query) {
      throw new Error("Query parameter is required");
    }

    // Determine query type
    const isTokenId = /^\d+$/.test(query);
    const isTransactionHash = /^0x[a-fA-F0-9]{64}$/.test(query);
    const isSha256Hash = /^[a-fA-F0-9]{64}$/.test(query);

    let verification = null;
    let onChainData = null;

    // 1. Try to find in database first
    if (isTokenId) {
      const { data } = await supabase
        .from("verifications")
        .select("*")
        .eq("token_id", parseInt(query))
        .single();
      verification = data;
    } else if (isTransactionHash) {
      const { data } = await supabase
        .from("verifications")
        .select("*")
        .eq("transaction_hash", query)
        .single();
      verification = data;
    } else if (isSha256Hash) {
      const { data } = await supabase
        .from("verifications")
        .select("*")
        .eq("sha256_hash", query)
        .single();
      verification = data;
    }

    // 2. Verify on blockchain
    const network = Deno.env.get("POLYGON_NETWORK") || "mumbai";
    const rpcUrl =
      network === "mainnet"
        ? `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
        : `https://polygon-mumbai.g.alchemy.com/v2/${alchemyApiKey}`;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, VIDCHAIN_NFT_ABI, provider);

    if (isTokenId && parseInt(query) > 0) {
      try {
        const result = await contract.verify(parseInt(query));
        if (result.exists) {
          onChainData = {
            token_id: parseInt(query),
            sha256_hash: result.sha256Hash.slice(2),
            ipfs_cid_hash: result.ipfsCidHash.slice(2),
            timestamp: Number(result.timestamp),
            owner: result.owner,
          };
        }
      } catch {
        // Token doesn't exist
      }
    } else if (isSha256Hash) {
      try {
        const result = await contract.verifyByHash("0x" + query);
        if (result.exists) {
          onChainData = {
            token_id: Number(result.tokenId),
            sha256_hash: query,
            timestamp: Number(result.timestamp),
            owner: result.owner,
          };
        }
      } catch {
        // Hash not found
      }
    }

    // 3. Build verification result
    const warnings: string[] = [];
    let hashMatch = false;
    let cidValid = false;
    let chainUnbroken = true;
    let metadataConsistent = true;

    if (verification && onChainData) {
      // Cross-validate database and blockchain data
      hashMatch = verification.sha256_hash === onChainData.sha256_hash;

      if (!hashMatch) {
        warnings.push("SHA-256 hash mismatch between database and blockchain");
        chainUnbroken = false;
      }

      // Verify IPFS CID is accessible
      try {
        const ipfsResponse = await fetch(
          `https://gateway.pinata.cloud/ipfs/${verification.ipfs_cid}`,
          { method: "HEAD" }
        );
        cidValid = ipfsResponse.ok;
      } catch {
        cidValid = false;
        warnings.push("IPFS content not accessible");
      }
    } else if (onChainData && !verification) {
      // Found on blockchain but not in database
      warnings.push("Verification found on blockchain but not in VidChain database");
      hashMatch = true;
      cidValid = true;
    } else if (verification && !onChainData) {
      // Found in database but not on blockchain
      if (verification.status === "pending" || verification.status === "processing") {
        warnings.push("Verification is still being processed");
      } else {
        warnings.push("Verification not found on blockchain");
        chainUnbroken = false;
      }
    }

    // 4. Determine final status
    let status: VerificationResult["status"] = "unknown";
    let confidence = 0;

    if (hashMatch && cidValid && chainUnbroken && metadataConsistent) {
      status = "verified";
      confidence = 100;
    } else if (verification || onChainData) {
      if (!hashMatch || !chainUnbroken) {
        status = "modified";
        confidence = 30;
      } else {
        status = "unverified";
        confidence = 50;
      }
    }

    const result: VerificationResult = {
      status,
      confidence,
      token_id: verification?.token_id || onChainData?.token_id,
      sha256_hash: verification?.sha256_hash || onChainData?.sha256_hash || query,
      ipfs_cid: verification?.ipfs_cid || "",
      blockchain_timestamp: verification?.blockchain_timestamp ||
        (onChainData?.timestamp ? new Date(onChainData.timestamp * 1000).toISOString() : undefined),
      transaction_hash: verification?.transaction_hash,
      owner_address: verification?.owner_address || onChainData?.owner,
      checks: {
        hash_match: hashMatch,
        cid_valid: cidValid,
        chain_unbroken: chainUnbroken,
        metadata_consistent: metadataConsistent,
      },
      warnings,
      certificate_url: verification?.token_id
        ? `https://vidchain.io/verify/${verification.token_id}`
        : undefined,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
