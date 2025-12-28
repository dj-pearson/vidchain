import { Job, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { join } from 'path';
import type { ProcessVideoRequest, ProcessingResult, ThumbnailResult } from '../types/index.js';
import {
  computeVideoHash,
  downloadVideo,
  extractMetadata,
  generateThumbnails,
  createTempProcessingDir,
  removeTempProcessingDir,
} from '../services/ffmpeg.service.js';
import {
  updateVideoStatus,
  saveProcessingResult,
  uploadThumbnail,
  saveThumbnailUrls,
  createVerificationRecord,
} from '../services/supabase.service.js';

const QUEUE_NAME = 'video-processing';

let connection: IORedis | null = null;
let queue: Queue<ProcessVideoRequest> | null = null;
let worker: Worker<ProcessVideoRequest, ProcessingResult> | null = null;

/**
 * Get Redis connection
 */
function getRedisConnection(): IORedis {
  if (!connection) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

/**
 * Get or create the processing queue
 */
export function getQueue(): Queue<ProcessVideoRequest> {
  if (!queue) {
    queue = new Queue<ProcessVideoRequest>(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 60 * 60, // 24 hours
        },
        removeOnFail: {
          count: 50,
          age: 7 * 24 * 60 * 60, // 7 days
        },
      },
    });
  }
  return queue;
}

/**
 * Process a video job
 */
async function processVideo(
  job: Job<ProcessVideoRequest>
): Promise<ProcessingResult> {
  const { videoId, videoUrl, organizationId, userId, options = {} } = job.data;
  const tempDir = await createTempProcessingDir(job.id || videoId);
  const videoPath = join(tempDir, 'video');

  try {
    // Step 1: Download video
    await updateVideoStatus(videoId, 'downloading', 10);
    await job.updateProgress(10);
    console.log(`[${videoId}] Downloading video...`);
    await downloadVideo(videoUrl, videoPath);

    // Step 2: Compute hash
    await updateVideoStatus(videoId, 'hashing', 30);
    await job.updateProgress(30);
    console.log(`[${videoId}] Computing SHA-256 hash...`);
    const sha256Hash = await computeVideoHash(videoPath);
    console.log(`[${videoId}] Hash: ${sha256Hash}`);

    // Step 3: Extract metadata
    await updateVideoStatus(videoId, 'extracting_metadata', 50);
    await job.updateProgress(50);
    console.log(`[${videoId}] Extracting metadata...`);
    const metadata = await extractMetadata(videoPath);
    console.log(`[${videoId}] Duration: ${metadata.duration}s, Resolution: ${metadata.width}x${metadata.height}`);

    // Step 4: Generate thumbnails
    let thumbnails: ThumbnailResult[] = [];
    if (!options.skipThumbnails) {
      await updateVideoStatus(videoId, 'generating_thumbnails', 70);
      await job.updateProgress(70);
      console.log(`[${videoId}] Generating thumbnails...`);
      const thumbnailDir = join(tempDir, 'thumbnails');
      thumbnails = await generateThumbnails(videoPath, thumbnailDir, options);
      console.log(`[${videoId}] Generated ${thumbnails.length} thumbnails`);
    }

    // Step 5: Upload thumbnails to storage
    await updateVideoStatus(videoId, 'uploading', 85);
    await job.updateProgress(85);
    const thumbnailUrls: string[] = [];
    for (let i = 0; i < thumbnails.length; i++) {
      console.log(`[${videoId}] Uploading thumbnail ${i + 1}/${thumbnails.length}...`);
      const url = await uploadThumbnail(videoId, thumbnails[i].path, i);
      thumbnailUrls.push(url);
      thumbnails[i].url = url;
    }

    // Step 6: Save results
    const result: ProcessingResult = {
      sha256Hash,
      thumbnails,
      metadata,
      processedAt: new Date().toISOString(),
    };

    await saveProcessingResult(videoId, result);
    await saveThumbnailUrls(videoId, thumbnailUrls);

    // Step 7: Create verification record
    await createVerificationRecord(videoId, sha256Hash, organizationId, userId);

    await updateVideoStatus(videoId, 'completed', 100);
    await job.updateProgress(100);
    console.log(`[${videoId}] Processing completed successfully`);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${videoId}] Processing failed:`, message);
    await updateVideoStatus(videoId, 'failed', 0, message);
    throw error;
  } finally {
    // Cleanup temp files
    await removeTempProcessingDir(job.id || videoId);
  }
}

/**
 * Start the worker
 */
export function startWorker(): Worker<ProcessVideoRequest, ProcessingResult> {
  if (worker) {
    return worker;
  }

  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '2');

  worker = new Worker<ProcessVideoRequest, ProcessingResult>(
    QUEUE_NAME,
    processVideo,
    {
      connection: getRedisConnection(),
      concurrency,
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed: ${result.sha256Hash}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  console.log(`Worker started with concurrency: ${concurrency}`);
  return worker;
}

/**
 * Stop the worker
 */
export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
  if (connection) {
    await connection.quit();
    connection = null;
  }
}

/**
 * Add a video to the processing queue
 */
export async function enqueueVideo(data: ProcessVideoRequest): Promise<string> {
  const q = getQueue();
  const job = await q.add(`process-${data.videoId}`, data, {
    jobId: `video-${data.videoId}`,
  });
  console.log(`Enqueued video ${data.videoId} with job ID ${job.id}`);
  return job.id || data.videoId;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<{
  status: string;
  progress: number;
  result?: ProcessingResult;
  error?: string;
} | null> {
  const q = getQueue();
  const job = await q.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress as number;

  return {
    status: state,
    progress: typeof progress === 'number' ? progress : 0,
    result: job.returnvalue as ProcessingResult | undefined,
    error: job.failedReason,
  };
}
