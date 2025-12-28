// VidChain API Key Validation Edge Function
// Validates API keys for third-party integrations

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface ApiKeyValidationResult {
  valid: boolean;
  organization_id?: string;
  organization_name?: string;
  scopes?: string[];
  rate_limit?: {
    remaining: number;
    reset_at: string;
  };
  error?: string;
}

// Hash API key for comparison
async function hashApiKey(key: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key)
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get API key from header or body
    const apiKey =
      req.headers.get("x-api-key") ||
      (await req.json().catch(() => ({}))).api_key;

    if (!apiKey) {
      const result: ApiKeyValidationResult = {
        valid: false,
        error: "API key is required",
      };
      return new Response(JSON.stringify(result), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hash the API key for lookup
    const keyHash = await hashApiKey(apiKey);

    // Look up the API key
    const { data: apiKeyRecord, error: keyError } = await supabase
      .from("api_keys")
      .select(`
        id,
        name,
        organization_id,
        scopes,
        rate_limit,
        expires_at,
        last_used_at,
        is_active,
        organizations!inner(name)
      `)
      .eq("key_hash", keyHash)
      .single();

    if (keyError || !apiKeyRecord) {
      const result: ApiKeyValidationResult = {
        valid: false,
        error: "Invalid API key",
      };
      return new Response(JSON.stringify(result), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if key is active
    if (!apiKeyRecord.is_active) {
      const result: ApiKeyValidationResult = {
        valid: false,
        error: "API key is disabled",
      };
      return new Response(JSON.stringify(result), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if key is expired
    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      const result: ApiKeyValidationResult = {
        valid: false,
        error: "API key has expired",
      };
      return new Response(JSON.stringify(result), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check rate limit
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour window

    const { count: requestCount } = await supabase
      .from("api_requests")
      .select("*", { count: "exact", head: true })
      .eq("api_key_id", apiKeyRecord.id)
      .gte("created_at", windowStart.toISOString());

    const rateLimit = apiKeyRecord.rate_limit || 1000;
    const remaining = Math.max(0, rateLimit - (requestCount || 0));
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000);

    if (remaining <= 0) {
      const result: ApiKeyValidationResult = {
        valid: false,
        error: "Rate limit exceeded",
        rate_limit: {
          remaining: 0,
          reset_at: resetAt.toISOString(),
        },
      };
      return new Response(JSON.stringify(result), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update last used timestamp
    await supabase
      .from("api_keys")
      .update({ last_used_at: now.toISOString() })
      .eq("id", apiKeyRecord.id);

    // Log the API request
    await supabase.from("api_requests").insert({
      api_key_id: apiKeyRecord.id,
      organization_id: apiKeyRecord.organization_id,
      endpoint: req.headers.get("x-forwarded-for") || "unknown",
      method: req.method,
    });

    const result: ApiKeyValidationResult = {
      valid: true,
      organization_id: apiKeyRecord.organization_id,
      organization_name: (apiKeyRecord.organizations as { name: string }).name,
      scopes: apiKeyRecord.scopes || ["read", "verify"],
      rate_limit: {
        remaining,
        reset_at: resetAt.toISOString(),
      },
    };

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Limit": rateLimit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": resetAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("API key validation error:", error);
    const result: ApiKeyValidationResult = {
      valid: false,
      error: "Internal server error",
    };
    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
