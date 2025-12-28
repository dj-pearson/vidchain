import { Router, Request, Response } from 'express';
import { getQueue } from '../queue/processor.js';

const router = Router();

/**
 * GET /health - Basic health check
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'healthy',
    service: 'video-processor',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/ready - Readiness check (checks Redis connection)
 */
router.get('/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    const queue = getQueue();
    await queue.client; // This will throw if Redis is not connected

    res.json({
      status: 'ready',
      redis: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      redis: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/queue - Queue statistics
 */
router.get('/queue', async (req: Request, res: Response): Promise<void> => {
  try {
    const queue = getQueue();

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    res.json({
      status: 'healthy',
      queue: {
        name: queue.name,
        waiting,
        active,
        completed,
        failed,
        delayed,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
