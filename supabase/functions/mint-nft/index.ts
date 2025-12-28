// VidChain Mint NFT Edge Function
// Mints verification NFT on Polygon blockchain

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { ethers } from "https://esm.sh/ethers@6.9.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MintNftRequest {
  verification_id: string;
  recipient_address?: string;
}

// VidChainNFT ABI (minimal for minting)
const VIDCHAIN_NFT_ABI = [
  "function mintAuthenticated(bytes32 _sha256Hash, string calldata _ipfsCid, address _to) external returns (uint256)",
  "event VideoAuthenticated(uint256 indexed tokenId, bytes32 indexed sha256Hash, string ipfsCid, address indexed creator, uint64 timestamp)",
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
    const privateKey = Deno.env.get("VIDCHAIN_PRIVATE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { verification_id, recipient_address }: MintNftRequest = await req.json();

    // 1. Fetch verification record
    const { data: verification, error: verificationError } = await supabase
      .from("verifications")
      .select("*, users!inner(wallet_address)")
      .eq("id", verification_id)
      .single();

    if (verificationError || !verification) {
      throw new Error("Verification not found");
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
      throw new Error("No recipient address provided");
    }

    // 3. Update verification status to processing
    await supabase
      .from("verifications")
      .update({ status: "processing" })
      .eq("id", verification_id);

    // 4. Connect to Polygon
    const network = Deno.env.get("POLYGON_NETWORK") || "mumbai";
    const rpcUrl =
      network === "mainnet"
        ? `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
        : `https://polygon-mumbai.g.alchemy.com/v2/${alchemyApiKey}`;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
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
    const { data: updatedVerification, error: updateError } = await supabase
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

    if (updateError) {
      console.error("Failed to update verification:", updateError);
    }

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
        network,
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
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { verification_id } = await req.clone().json();

      await supabase
        .from("verifications")
        .update({ status: "failed" })
        .eq("id", verification_id);
    } catch {
      // Ignore cleanup errors
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
