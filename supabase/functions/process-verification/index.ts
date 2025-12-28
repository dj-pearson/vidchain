// VidChain Process Verification Edge Function
// Handles video hash computation, IPFS upload, and verification record creation

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessVerificationRequest {
  video_id: string;
  user_id: string;
  auto_mint: boolean;
}

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const pinataJwt = Deno.env.get("PINATA_JWT")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { video_id, user_id, auto_mint }: ProcessVerificationRequest = await req.json();

    // 1. Fetch video record
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", video_id)
      .single();

    if (videoError || !video) {
      throw new Error("Video not found");
    }

    // 2. Download video from storage
    const { data: videoFile, error: downloadError } = await supabase.storage
      .from("videos")
      .download(video.storage_path);

    if (downloadError || !videoFile) {
      throw new Error("Failed to download video");
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
      throw new Error("Failed to upload to IPFS");
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
      throw new Error("Failed to create verification record");
    }

    // 8. Update video status
    await supabase
      .from("videos")
      .update({ status: "ready" })
      .eq("id", video_id);

    // 9. If auto_mint, trigger NFT minting
    if (auto_mint) {
      // Trigger mint-nft function
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
  } catch (error) {
    console.error("Process verification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
