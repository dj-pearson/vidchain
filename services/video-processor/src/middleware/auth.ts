import { Request, Response, NextFunction } from 'express';

/**
 * Simple API key authentication middleware
 * In production, you would validate against the database
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  const serviceKey = process.env.SERVICE_API_KEY;

  // Skip auth for health checks
  if (req.path.startsWith('/health')) {
    next();
    return;
  }

  if (!apiKey) {
    res.status(401).json({ error: 'API key required' });
    return;
  }

  // For internal service communication, check against service key
  if (serviceKey && apiKey === serviceKey) {
    next();
    return;
  }

  // For external requests, you would validate against the database
  // This is a placeholder - in production, query the api_keys table
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }

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
