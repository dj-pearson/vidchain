import ffmpeg from 'fluent-ffmpeg';
import { createHash } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, unlink, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { pipeline } from 'stream/promises';
import type { VideoMetadata, ThumbnailResult, ProcessingOptions } from '../types/index.js';

// Set FFmpeg paths if provided via environment
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/vidchain';
const DEFAULT_THUMBNAIL_COUNT = 3;
const DEFAULT_THUMBNAIL_WIDTH = 640;
const DEFAULT_THUMBNAIL_FORMAT = 'jpg';

/**
 * Compute SHA-256 hash of a video file
 */
export async function computeVideoHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Compute SHA-256 hash from a readable stream
 */
export async function computeStreamHash(stream: NodeJS.ReadableStream): Promise<string> {
  const hash = createHash('sha256');

  for await (const chunk of stream) {
    hash.update(chunk);
  }

  return hash.digest('hex');
}

/**
 * Extract video metadata using ffprobe
 */
export async function extractMetadata(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) {
        reject(new Error(`Failed to extract metadata: ${err.message}`));
        return;
      }

      const videoStream = data.streams.find((s) => s.codec_type === 'video');
      const audioStream = data.streams.find((s) => s.codec_type === 'audio');
      const format = data.format;

      if (!videoStream) {
        reject(new Error('No video stream found in file'));
        return;
      }

      // Parse frame rate
      let fps = 0;
      if (videoStream.r_frame_rate) {
        const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
        fps = den ? num / den : num;
      }

      const metadata: VideoMetadata = {
        duration: format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps: Math.round(fps * 100) / 100,
        codec: videoStream.codec_name || 'unknown',
        bitrate: format.bit_rate ? parseInt(format.bit_rate) : 0,
        size: format.size ? parseInt(format.size) : 0,
        format: format.format_name || 'unknown',
        audioCodec: audioStream?.codec_name,
        audioChannels: audioStream?.channels,
        audioBitrate: audioStream?.bit_rate ? parseInt(audioStream.bit_rate) : undefined,
      };

      resolve(metadata);
    });
  });
}

/**
 * Generate thumbnail images from video at specified timestamps
 */
export async function generateThumbnails(
  filePath: string,
  outputDir: string,
  options: ProcessingOptions = {}
): Promise<ThumbnailResult[]> {
  const {
    thumbnailCount = DEFAULT_THUMBNAIL_COUNT,
    thumbnailWidth = DEFAULT_THUMBNAIL_WIDTH,
    thumbnailHeight,
    thumbnailFormat = DEFAULT_THUMBNAIL_FORMAT,
  } = options;

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  // Get video duration first
  const metadata = await extractMetadata(filePath);
  const duration = metadata.duration;

  if (duration <= 0) {
    throw new Error('Cannot generate thumbnails for video with zero duration');
  }

  // Calculate timestamps evenly distributed through the video
  const timestamps: number[] = [];
  for (let i = 0; i < thumbnailCount; i++) {
    // Start from 10% and go to 90% of the video to avoid black frames
    const position = 0.1 + (0.8 * i) / Math.max(1, thumbnailCount - 1);
    timestamps.push(Math.floor(duration * position));
  }

  const thumbnails: ThumbnailResult[] = [];

  // Generate each thumbnail
  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const outputPath = join(outputDir, `thumbnail_${i}.${thumbnailFormat}`);

    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg(filePath)
        .seekInput(timestamp)
        .frames(1)
        .size(thumbnailHeight ? `${thumbnailWidth}x${thumbnailHeight}` : `${thumbnailWidth}x?`);

      // Set format-specific options
      if (thumbnailFormat === 'jpg') {
        command = command.outputOptions(['-q:v 2']);
      } else if (thumbnailFormat === 'webp') {
        command = command.outputOptions(['-quality 80']);
      }

      command
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new Error(`Thumbnail generation failed: ${err.message}`)))
        .run();
    });

    // Get the actual dimensions of the generated thumbnail
    const thumbMeta = await extractMetadata(outputPath);

    thumbnails.push({
      timestamp,
      path: outputPath,
      width: thumbMeta.width,
      height: thumbMeta.height,
    });
  }

  return thumbnails;
}

/**
 * Download a video from URL to local file
 */
export async function downloadVideo(url: string, outputPath: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const writeStream = createWriteStream(outputPath);
  // @ts-ignore - Node 18+ has ReadableStream.from
  await pipeline(response.body, writeStream);
}

/**
 * Clean up temporary files
 */
export async function cleanupTempFiles(paths: string[]): Promise<void> {
  for (const path of paths) {
    try {
      await unlink(path);
    } catch {
      // Ignore errors - file may not exist
    }
  }
}

/**
 * Get file size
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await stat(filePath);
  return stats.size;
}

/**
 * Create a unique temp directory for processing
 */
export async function createTempProcessingDir(jobId: string): Promise<string> {
  const dir = join(TEMP_DIR, jobId);
  await mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Remove temp processing directory and all contents
 */
export async function removeTempProcessingDir(jobId: string): Promise<void> {
  const dir = join(TEMP_DIR, jobId);
  const { rm } = await import('fs/promises');
  try {
    await rm(dir, { recursive: true, force: true });
  } catch {
    // Ignore errors
  }
}
