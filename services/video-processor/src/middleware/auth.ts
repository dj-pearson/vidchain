import { Request, Response, NextFunction } from 'express';

// Valid API keys for development/testing (should be loaded from secure storage in production)
const VALID_DEV_API_KEYS = new Set([
  process.env.DEV_API_KEY,
  process.env.TEST_API_KEY,
].filter(Boolean));

/**
 * API key authentication middleware
 * Validates API keys against service key or configured development keys.
 *
 * SECURITY NOTE: In production, implement database-based API key validation
 * by querying the api_keys table with hashed key comparison.
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  const serviceKey = process.env.SERVICE_API_KEY;

  // Skip auth for health checks only
  if (req.path.startsWith('/health')) {
    next();
    return;
  }

  if (!apiKey) {
    res.status(401).json({ error: 'API key required' });
    return;
  }

  // Validate against service key for internal service communication
  if (serviceKey && apiKey === serviceKey) {
    next();
    return;
  }

  // Validate against configured development/test API keys
  if (VALID_DEV_API_KEYS.has(apiKey)) {
    next();
    return;
  }

  // TODO: For production, implement database validation:
  // 1. Hash the provided API key
  // 2. Query api_keys table for matching key_hash
  // 3. Check key is active and not expired
  // 4. Log the API request for audit purposes

  res.status(403).json({ error: 'Invalid API key' });
}

/**
 * Request logging middleware for debugging
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
}
