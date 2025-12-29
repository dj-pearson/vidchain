// VidChain Mux Webhook Handler
// Handles Mux video processing events

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";

interface MuxWebhookEvent {
  type: string;
  id: string;
  created_at: string;
  data: {
    id: string;
    status?: string;
    passthrough?: string;
    playback_ids?: Array<{ id: string; policy: string }>;
    duration?: number;
    aspect_ratio?: string;
    resolution_tier?: string;
    max_stored_resolution?: string;
    max_stored_frame_rate?: number;
    tracks?: Array<{
      type: string;
      max_width?: number;
      max_height?: number;
      max_frame_rate?: number;
      duration?: number;
    }>;
    upload_id?: string;
    errors?: Array<{ type: string; message: string }>;
  };
}

// Verify Mux webhook signature
async function verifyMuxSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const signaturePart = parts.find((p) => p.startsWith("v1="));

    if (!timestampPart || !signaturePart) return false;

    const timestamp = timestampPart.substring(2);
    const expectedSignature = signaturePart.substring(3);

    // Check timestamp is within 5 minutes
    const age = Date.now() / 1000 - parseInt(timestamp);
    if (age > 300) return false;

    // Compute signature
    const payload = `${timestamp}.${rawBody}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payload)
    );
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSignature === expectedSignature;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const muxWebhookSecret = Deno.env.get("MUX_WEBHOOK_SECRET");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("mux-signature");

    // Verify signature if secret is configured
    if (muxWebhookSecret && signature) {
      const isValid = await verifyMuxSignature(rawBody, signature, muxWebhookSecret);
      if (!isValid) {
        console.error("Invalid Mux webhook signature");
        return new Response("Invalid signature", { status: 401 });
      }
    }

    const event: MuxWebhookEvent = JSON.parse(rawBody);
    console.log("Mux webhook event:", event.type, event.id);

    const { type, data } = event;

    // Handle different event types
    switch (type) {
      case "video.upload.created": {
        // Upload URL created, video is being uploaded
        if (data.passthrough) {
          await supabase
            .from("videos")
            .update({
              mux_upload_id: data.id,
              status: "uploading",
            })
            .eq("id", data.passthrough);
        }
        break;
      }

      case "video.upload.asset_created": {
        // Upload complete, asset created
        if (data.passthrough) {
          await supabase
            .from("videos")
            .update({
              mux_asset_id: data.id,
              status: "processing",
              processing_status: "processing",
            })
            .eq("id", data.passthrough);
        }
        break;
      }

      case "video.asset.ready": {
        // Video is ready for playback
        const playbackId = data.playback_ids?.[0]?.id;
        const videoTrack = data.tracks?.find((t) => t.type === "video");

        // Find video by asset ID or passthrough
        let videoId = data.passthrough;
        if (!videoId) {
          const { data: video } = await supabase
            .from("videos")
            .select("id")
            .eq("mux_asset_id", data.id)
            .single();
          videoId = video?.id;
        }

        if (videoId) {
          await supabase
            .from("videos")
            .update({
              mux_playback_id: playbackId,
              duration: data.duration,
              width: videoTrack?.max_width,
              height: videoTrack?.max_height,
              fps: videoTrack?.max_frame_rate,
              status: "ready",
              processing_status: "completed",
              processing_progress: 100,
              processed_at: new Date().toISOString(),
            })
            .eq("id", videoId);

          // Trigger verification processing
          await fetch(`${supabaseUrl}/functions/v1/process-verification`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              video_id: videoId,
              auto_mint: false,
            }),
          });
        }
        break;
      }

      case "video.asset.errored": {
        // Video processing failed
        let videoId = data.passthrough;
        if (!videoId) {
          const { data: video } = await supabase
            .from("videos")
            .select("id")
            .eq("mux_asset_id", data.id)
            .single();
          videoId = video?.id;
        }

        if (videoId) {
          const errorMessage = data.errors?.map((e) => e.message).join(", ") || "Unknown error";
          await supabase
            .from("videos")
            .update({
              status: "failed",
              processing_status: "failed",
              processing_error: errorMessage,
            })
            .eq("id", videoId);
        }
        break;
      }

      case "video.asset.deleted": {
        // Asset was deleted
        const { data: video } = await supabase
          .from("videos")
          .select("id")
          .eq("mux_asset_id", data.id)
          .single();

        if (video) {
          await supabase
            .from("videos")
            .update({
              mux_asset_id: null,
              mux_playback_id: null,
              status: "deleted",
            })
            .eq("id", video.id);
        }
        break;
      }

      case "video.upload.errored": {
        // Upload failed
        if (data.passthrough) {
          const errorMessage = data.errors?.map((e) => e.message).join(", ") || "Upload failed";
          await supabase
            .from("videos")
            .update({
              status: "failed",
              processing_status: "failed",
              processing_error: errorMessage,
            })
            .eq("id", data.passthrough);
        }
        break;
      }

      default:
        console.log("Unhandled Mux event type:", type);
    }

    // Store webhook event for debugging
    await supabase.from("webhook_events").insert({
      provider: "mux",
      event_type: type,
      event_id: event.id,
      payload: event,
    });

    return corsJsonResponse(req, { received: true });
  } catch (error) {
    console.error("Mux webhook error:", error);
    return corsErrorResponse(req, error.message, 500);
  }
});
