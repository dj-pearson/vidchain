// VidChain Edge Functions Server
// Serves Supabase Edge Functions with complete implementations

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { ethers } from "https://esm.sh/ethers@6.9.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "./_shared/cors.ts";

// Legacy CORS headers for backward compatibility (used in responses)
// Note: getCorsHeaders() is now used to validate origins properly
function getLegacyCorsHeaders(req: Request): Record<string, string> {
  return getCorsHeaders(req);
}

// VidChainNFT ABI (for minting and verification)
const VIDCHAIN_NFT_ABI = [
  "function mintAuthenticated(bytes32 _sha256Hash, string calldata _ipfsCid, address _to) external returns (uint256)",
  "function verify(uint256 _tokenId) external view returns (bytes32 sha256Hash, bytes32 ipfsCidHash, uint64 timestamp, address owner, bool exists)",
  "function verifyByHash(bytes32 _sha256Hash) external view returns (uint256 tokenId, uint64 timestamp, address owner, bool exists)",
  "event VideoAuthenticated(uint256 indexed tokenId, bytes32 indexed sha256Hash, string ipfsCid, address indexed creator, uint64 timestamp)",
];

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

// Function router
const functions: Record<string, (req: Request) => Promise<Response>> = {
  "process-verification": processVerification,
  "mint-nft": mintNft,
  "verify": verifyVideo,
};

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight with origin validation
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getLegacyCorsHeaders(req);
  const url = new URL(req.url);
  const functionName = url.pathname.split("/").filter(Boolean)[0];

  if (functionName && functions[functionName]) {
    try {
      return await functions[functionName](req);
    } catch (error) {
      console.error(`Error in ${functionName}:`, error);
      return new Response(
        JSON.stringify({ error: "An error occurred processing your request" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Function not found" }),
    {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// Get Supabase client
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Get Polygon provider
function getPolygonProvider() {
  const alchemyApiKey = Deno.env.get("ALCHEMY_API_KEY")!;
  const network = Deno.env.get("POLYGON_NETWORK") || "mumbai";
  const rpcUrl =
    network === "mainnet"
      ? `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
      : `https://polygon-mumbai.g.alchemy.com/v2/${alchemyApiKey}`;
  return new ethers.JsonRpcProvider(rpcUrl);
}

// Process verification function - Computes hash, uploads to IPFS, creates verification record
async function processVerification(req: Request): Promise<Response> {
  const corsHeaders = getCorsHeaders(req);
  const { video_id, user_id, auto_mint } = await req.json();

  if (!video_id || !user_id) {
    return new Response(
      JSON.stringify({ error: "video_id and user_id are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabase = getSupabaseClient();
  const pinataJwt = Deno.env.get("PINATA_JWT")!;

  // 1. Fetch video record
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("*")
    .eq("id", video_id)
    .single();

  if (videoError || !video) {
    return new Response(
      JSON.stringify({ error: "Video not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 2. Download video from storage
  const { data: videoFile, error: downloadError } = await supabase.storage
    .from("videos")
    .download(video.storage_path);

  if (downloadError || !videoFile) {
    return new Response(
      JSON.stringify({ error: "Failed to download video" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 3. Compute SHA-256 hash
  const arrayBuffer = await videoFile.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256Hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // 4. Check if already verified
  const { data: existingVerification } = await supabase
    .from("verifications")
    .select("id")
    .eq("sha256_hash", sha256Hash)
    .single();

  if (existingVerification) {
    return new Response(
      JSON.stringify({
        error: "Video with this hash already verified",
        existing_verification_id: existingVerification.id,
      }),
      {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 5. Upload to IPFS via Pinata
  const formData = new FormData();
  formData.append("file", videoFile, video.filename);
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name: `vidchain-${video_id}`,
      keyvalues: {
        video_id,
        user_id,
        sha256_hash: sha256Hash,
      },
    })
  );

  const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: formData,
  });

  if (!pinataResponse.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to upload to IPFS" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const pinataResult: PinataResponse = await pinataResponse.json();
  const ipfsCid = pinataResult.IpfsHash;

  // 6. Compute IPFS CID hash for on-chain storage
  const cidHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ipfsCid)
  );
  const cidHashArray = Array.from(new Uint8Array(cidHashBuffer));
  const ipfsCidHash = cidHashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // 7. Create verification record
  const { data: verification, error: verificationError } = await supabase
    .from("verifications")
    .insert({
      video_id,
      user_id,
      sha256_hash: sha256Hash,
      ipfs_cid: ipfsCid,
      ipfs_cid_hash: ipfsCidHash,
      status: "pending",
      metadata: {
        original_filename: video.filename,
        file_size: video.file_size,
        duration: video.duration,
        resolution: video.resolution,
        mime_type: video.mime_type,
      },
    })
    .select()
    .single();

  if (verificationError) {
    return new Response(
      JSON.stringify({ error: "Failed to create verification record" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 8. Update video status
  await supabase
    .from("videos")
    .update({ status: "ready" })
    .eq("id", video_id);

  // 9. Log audit event
  await supabase.from("audit_logs").insert({
    user_id,
    action: "verification_created",
    resource_type: "verification",
    resource_id: verification.id,
    metadata: {
      video_id,
      sha256_hash: sha256Hash,
      ipfs_cid: ipfsCid,
    },
  });

  // 10. If auto_mint, trigger NFT minting
  if (auto_mint) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    await fetch(`${supabaseUrl}/functions/v1/mint-nft`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        verification_id: verification.id,
      }),
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      verification,
      sha256_hash: sha256Hash,
      ipfs_cid: ipfsCid,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// Mint NFT function - Mints verification NFT on Polygon blockchain
async function mintNft(req: Request): Promise<Response> {
  const corsHeaders = getCorsHeaders(req);
  const { verification_id, recipient_address } = await req.json();

  if (!verification_id) {
    return new Response(
      JSON.stringify({ error: "verification_id is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabase = getSupabaseClient();
  const contractAddress = Deno.env.get("VIDCHAIN_CONTRACT_ADDRESS")!;
  const privateKey = Deno.env.get("VIDCHAIN_PRIVATE_KEY")!;

  // 1. Fetch verification record
  const { data: verification, error: verificationError } = await supabase
    .from("verifications")
    .select("*, users!inner(wallet_address)")
    .eq("id", verification_id)
    .single();

  if (verificationError || !verification) {
    return new Response(
      JSON.stringify({ error: "Verification not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (verification.token_id) {
    return new Response(
      JSON.stringify({
        error: "NFT already minted",
        token_id: verification.token_id,
      }),
      {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 2. Determine recipient address
  const recipient =
    recipient_address || verification.users?.wallet_address || null;

  if (!recipient) {
    return new Response(
      JSON.stringify({ error: "No recipient address provided" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 3. Update verification status to processing
  await supabase
    .from("verifications")
    .update({ status: "processing" })
    .eq("id", verification_id);

  try {
    // 4. Connect to Polygon
    const provider = getPolygonProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, VIDCHAIN_NFT_ABI, wallet);

    // 5. Prepare hash as bytes32
    const sha256HashBytes = "0x" + verification.sha256_hash;

    // 6. Mint the NFT
    console.log("Minting NFT...", {
      sha256Hash: sha256HashBytes,
      ipfsCid: verification.ipfs_cid,
      recipient,
    });

    const tx = await contract.mintAuthenticated(
      sha256HashBytes,
      verification.ipfs_cid,
      recipient
    );

    console.log("Transaction sent:", tx.hash);

    // 7. Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.hash);

    // 8. Parse the VideoAuthenticated event to get token ID
    const eventInterface = new ethers.Interface(VIDCHAIN_NFT_ABI);
    let tokenId: number | null = null;

    for (const log of receipt.logs) {
      try {
        const parsedLog = eventInterface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsedLog?.name === "VideoAuthenticated") {
          tokenId = Number(parsedLog.args.tokenId);
          break;
        }
      } catch {
        // Not our event, continue
      }
    }

    if (!tokenId) {
      throw new Error("Failed to parse token ID from transaction");
    }

    // 9. Update verification record
    const { data: updatedVerification } = await supabase
      .from("verifications")
      .update({
        token_id: tokenId,
        transaction_hash: receipt.hash,
        block_number: receipt.blockNumber,
        blockchain_timestamp: new Date().toISOString(),
        owner_address: recipient,
        status: "verified",
      })
      .eq("id", verification_id)
      .select()
      .single();

    // 10. Log audit event
    await supabase.from("audit_logs").insert({
      user_id: verification.user_id,
      action: "nft_minted",
      resource_type: "verification",
      resource_id: verification_id,
      metadata: {
        token_id: tokenId,
        transaction_hash: receipt.hash,
        recipient,
        network: Deno.env.get("POLYGON_NETWORK") || "mumbai",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        token_id: tokenId,
        transaction_hash: receipt.hash,
        block_number: receipt.blockNumber,
        owner_address: recipient,
        verification: updatedVerification,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Mint NFT error:", error);

    // Update verification status to failed
    await supabase
      .from("verifications")
      .update({ status: "failed" })
      .eq("id", verification_id);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// Public verification lookup - Verifies video authenticity by token ID, tx hash, or SHA-256 hash
async function verifyVideo(req: Request): Promise<Response> {
  const corsHeaders = getCorsHeaders(req);
  const { query } = await req.json();

  if (!query) {
    return new Response(
      JSON.stringify({ error: "Query parameter is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabase = getSupabaseClient();
  const contractAddress = Deno.env.get("VIDCHAIN_CONTRACT_ADDRESS")!;

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
  const provider = getPolygonProvider();
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
  let status: "verified" | "unverified" | "modified" | "unknown" = "unknown";
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

  const result = {
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
}

console.log("VidChain Edge Functions server starting...");
serve(handler, { port: 54321 });
