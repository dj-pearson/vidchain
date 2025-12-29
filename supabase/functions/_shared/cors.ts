/**
 * Shared CORS configuration for VidChain edge functions
 *
 * Security: Restricts cross-origin requests to allowed domains only.
 * Configure allowed origins via ALLOWED_ORIGINS environment variable.
 */

// Default allowed origins for production
const DEFAULT_ALLOWED_ORIGINS = [
  'https://vidchain.io',
  'https://www.vidchain.io',
  'https://app.vidchain.io',
];

/**
 * Get list of allowed origins from environment or defaults
 */
function getAllowedOrigins(): string[] {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
  }
  return DEFAULT_ALLOWED_ORIGINS;
}

/**
 * Check if an origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();

  // Check for exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check for wildcard patterns (e.g., https://*.vidchain.io)
  for (const allowed of allowedOrigins) {
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get CORS headers for a request
 * Returns headers with the specific origin if allowed, or rejects with empty origin
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  const allowedOrigin = isOriginAllowed(origin) ? origin : '';

  return {
    'Access-Control-Allow-Origin': allowedOrigin || '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const headers = getCorsHeaders(req);

    // If origin is not allowed, return 403
    if (!headers['Access-Control-Allow-Origin']) {
      return new Response('Forbidden', { status: 403 });
    }

    return new Response('ok', { headers });
  }
  return null;
}

/**
 * Create a JSON response with CORS headers
 */
export function corsJsonResponse(
  req: Request,
  data: unknown,
  status: number = 200
): Response {
  const corsHeaders = getCorsHeaders(req);

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an error response with CORS headers
 */
export function corsErrorResponse(
  req: Request,
  message: string,
  status: number = 500
): Response {
  return corsJsonResponse(req, { error: message }, status);
}
