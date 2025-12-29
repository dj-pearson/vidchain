// VidChain Upload Edge Function
// Handles video uploads with Mux integration

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";

interface UploadRequest {
  title: string;
  description?: string;
  filename: string;
  file_size: number;
  mime_type: string;
  organization_id: string;
}

interface MuxUploadResponse {
  data: {
    id: string;
    url: string;
    status: string;
    new_asset_settings: {
      playback_policy: string[];
    };
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const muxTokenId = Deno.env.get("MUX_TOKEN_ID")!;
    const muxTokenSecret = Deno.env.get("MUX_TOKEN_SECRET")!;

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const body: UploadRequest = await req.json();
    const { title, description, filename, file_size, mime_type, organization_id } = body;

    // Validate file size (max 5GB)
    const maxSize = 5 * 1024 * 1024 * 1024;
    if (file_size > maxSize) {
      throw new Error("File size exceeds 5GB limit");
    }

    // Validate mime type
    const allowedTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      "video/webm",
      "video/mpeg",
    ];
    if (!allowedTypes.includes(mime_type)) {
      throw new Error("Unsupported video format");
    }

    // Check organization membership
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      throw new Error("Not a member of this organization");
    }

    // Create video record
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .insert({
        title,
        description,
        filename,
        file_size,
        mime_type,
        user_id: user.id,
        organization_id,
        status: "pending",
        processing_status: "pending",
      })
      .select()
      .single();

    if (videoError || !video) {
      throw new Error("Failed to create video record");
    }

    // Create Mux direct upload URL
    const muxAuth = btoa(`${muxTokenId}:${muxTokenSecret}`);
    const muxResponse = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${muxAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cors_origin: "*",
        new_asset_settings: {
          playback_policy: ["public"],
          passthrough: video.id,
          mp4_support: "standard",
        },
        test: Deno.env.get("MUX_TEST_MODE") === "true",
      }),
    });

    if (!muxResponse.ok) {
      const errorText = await muxResponse.text();
      console.error("Mux API error:", errorText);
      throw new Error("Failed to create Mux upload");
    }

    const muxData: MuxUploadResponse = await muxResponse.json();

    // Update video with Mux upload ID
    await supabase
      .from("videos")
      .update({
        mux_upload_id: muxData.data.id,
        status: "uploading",
      })
      .eq("id", video.id);

    // Create Supabase storage signed URL for backup storage
    const storagePath = `${organization_id}/${video.id}/${filename}`;
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from("videos")
      .createSignedUploadUrl(storagePath);

    // Log upload initiation
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "video_upload_started",
      resource_type: "video",
      resource_id: video.id,
      metadata: {
        filename,
        file_size,
        organization_id,
      },
    });

    return corsJsonResponse(req, {
      success: true,
      video_id: video.id,
      mux_upload_url: muxData.data.url,
      mux_upload_id: muxData.data.id,
      supabase_upload_url: signedUrl?.signedUrl,
      storage_path: storagePath,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return corsErrorResponse(
      req,
      error.message,
      error.message === "Unauthorized" ? 401 : 500
    );
  }
});
