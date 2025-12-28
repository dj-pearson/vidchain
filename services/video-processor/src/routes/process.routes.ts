import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { enqueueVideo, getJobStatus } from '../queue/processor.js';
import { getVideo, getPendingVideos } from '../services/supabase.service.js';

const router = Router();

// Validation schemas
const processVideoSchema = z.object({
  videoId: z.string().uuid(),
  videoUrl: z.string().url().optional(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  options: z
    .object({
      thumbnailCount: z.number().min(1).max(10).optional(),
      thumbnailWidth: z.number().min(100).max(1920).optional(),
      thumbnailHeight: z.number().min(100).max(1080).optional(),
      thumbnailFormat: z.enum(['jpg', 'png', 'webp']).optional(),
      skipThumbnails: z.boolean().optional(),
      skipMetadata: z.boolean().optional(),
    })
    .optional(),
});

/**
 * POST /process - Add a video to the processing queue
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = processVideoSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
      });
      return;
    }

    const { videoId, videoUrl, organizationId, userId, options } = parsed.data;

    // If no URL provided, fetch from database
    let finalVideoUrl = videoUrl;
    if (!finalVideoUrl) {
      const video = await getVideo(videoId);
      if (!video) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }
      finalVideoUrl = video.storage_url;
    }

    // Enqueue the video for processing
    const jobId = await enqueueVideo({
      videoId,
      videoUrl: finalVideoUrl,
      organizationId,
      userId,
      options,
    });

    res.status(202).json({
      success: true,
      jobId,
      videoId,
      message: 'Video queued for processing',
    });
  } catch (error) {
    console.error('Failed to enqueue video:', error);
    res.status(500).json({
      error: 'Failed to queue video for processing',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /process/:jobId - Get job status
 */
router.get('/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const status = await getJobStatus(jobId);

    if (!status) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json(status);
  } catch (error) {
    console.error('Failed to get job status:', error);
    res.status(500).json({
      error: 'Failed to get job status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /process/batch - Process multiple videos
 */
router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoIds, organizationId, userId, options } = req.body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      res.status(400).json({ error: 'videoIds must be a non-empty array' });
      return;
    }

    if (videoIds.length > 50) {
      res.status(400).json({ error: 'Maximum 50 videos per batch' });
      return;
    }

    const jobs: Array<{ videoId: string; jobId: string }> = [];
    const errors: Array<{ videoId: string; error: string }> = [];

    for (const videoId of videoIds) {
      try {
        const video = await getVideo(videoId);
        if (!video) {
          errors.push({ videoId, error: 'Video not found' });
          continue;
        }

        const jobId = await enqueueVideo({
          videoId,
          videoUrl: video.storage_url,
          organizationId: organizationId || video.organization_id,
          userId: userId || video.user_id,
          options,
        });

        jobs.push({ videoId, jobId });
      } catch (error) {
        errors.push({
          videoId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.status(202).json({
      success: true,
      queued: jobs.length,
      failed: errors.length,
      jobs,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Failed to process batch:', error);
    res.status(500).json({
      error: 'Failed to process batch',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /process/pending - Process all pending videos
 */
router.post('/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const pendingVideos = await getPendingVideos(limit);

    if (pendingVideos.length === 0) {
      res.json({
        success: true,
        queued: 0,
        message: 'No pending videos found',
      });
      return;
    }

    const jobs: Array<{ videoId: string; jobId: string }> = [];

    for (const video of pendingVideos) {
      const jobId = await enqueueVideo({
        videoId: video.id,
        videoUrl: video.storage_url,
        organizationId: video.organization_id,
        userId: video.user_id,
      });
      jobs.push({ videoId: video.id, jobId });
    }

    res.status(202).json({
      success: true,
      queued: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Failed to process pending videos:', error);
    res.status(500).json({
      error: 'Failed to process pending videos',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
