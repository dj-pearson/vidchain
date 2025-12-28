/**
 * Overlay Renderer Service
 * Burns NFT metadata overlays into video files using FFmpeg
 *
 * Creates permanent overlays in the video file that display:
 * - Verification status and token ID (top-left)
 * - Category and year (top-right)
 * - Location and IPFS CID (bottom-left)
 * - Creator and owner info (bottom-right)
 */

import ffmpeg from 'fluent-ffmpeg';
import { mkdir, writeFile, unlink, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { createCanvas, registerFont } from 'canvas';
import type { OverlayRenderConfig, VideoOverlayData, OverlayPosition } from '../types/overlay.js';

// Default configuration
const DEFAULT_CONFIG: OverlayRenderConfig = {
  fontFamily: 'Inter',
  fontSize: 24,
  textColor: '#FFFFFF',
  backgroundColor: '#000000',
  backgroundOpacity: 0.75,
  cornerRadius: 12,
  padding: 16,
  margin: 24,
  iconSize: 20,
};

// Verification status styles
const STATUS_STYLES = {
  verified: { bg: '#16a34a', text: '#FFFFFF', icon: '✓' },
  pending: { bg: '#eab308', text: '#000000', icon: '⏳' },
  unverified: { bg: '#dc2626', text: '#FFFFFF', icon: '✗' },
};

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  art: '🎨',
  music: '🎵',
  documentary: '🎬',
  sports: '⚽',
  gaming: '🎮',
  education: '📚',
  entertainment: '🎭',
  news: '📰',
  personal: '👤',
  commercial: '💼',
  other: '📹',
};

/**
 * Truncate string for display
 */
function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str || '';
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Truncate IPFS CID for display
 */
function truncateIPFS(cid: string): string {
  if (!cid) return '';
  if (cid.length <= 20) return cid;
  return `${cid.slice(0, 10)}...${cid.slice(-8)}`;
}

/**
 * Generate overlay image for a specific corner
 */
async function generateCornerOverlay(
  position: OverlayPosition,
  data: VideoOverlayData,
  config: OverlayRenderConfig,
  videoWidth: number,
  videoHeight: number
): Promise<{ path: string; x: number; y: number; width: number; height: number }> {
  // Determine content based on position
  let lines: { text: string; color: string; isBadge?: boolean; badgeBg?: string }[] = [];

  switch (position) {
    case 'top-left': {
      const status = STATUS_STYLES[data.verification_status];
      lines = [
        {
          text: `${status.icon} ${data.verification_status.toUpperCase()}${data.token_id ? ` #${data.token_id}` : ''}`,
          color: status.text,
          isBadge: true,
          badgeBg: status.bg,
        },
      ];
      break;
    }
    case 'top-right': {
      const icon = CATEGORY_ICONS[data.category] || '📹';
      const categoryName = data.category.charAt(0).toUpperCase() + data.category.slice(1);
      lines = [
        { text: `${icon} ${categoryName} | ${data.year}`, color: config.textColor },
      ];
      break;
    }
    case 'bottom-left': {
      const locationText = data.location_name
        ? `📍 ${truncate(data.location_name, 20)} |`
        : '';
      lines = [
        { text: `${locationText} 🔗 ipfs://${truncateIPFS(data.ipfs_cid)}`, color: config.textColor },
      ];
      break;
    }
    case 'bottom-right': {
      lines = [
        { text: `Creator: ${truncate(data.original_creator_name, 20)}`, color: config.textColor },
      ];
      if (data.original_creator_name !== data.current_owner_name) {
        lines.push({
          text: `Owner: ${truncate(data.current_owner_name, 20)}`,
          color: config.textColor,
        });
      }
      break;
    }
  }

  // Calculate dimensions
  const lineHeight = config.fontSize * 1.4;
  const contentHeight = lines.length * lineHeight;
  const canvasHeight = contentHeight + config.padding * 2;

  // Create temporary canvas to measure text width
  const measureCanvas = createCanvas(1, 1);
  const measureCtx = measureCanvas.getContext('2d');
  measureCtx.font = `${config.fontSize}px ${config.fontFamily}`;

  let maxWidth = 0;
  for (const line of lines) {
    const width = measureCtx.measureText(line.text).width;
    maxWidth = Math.max(maxWidth, width);
  }
  const canvasWidth = maxWidth + config.padding * 2;

  // Create actual canvas
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Draw rounded rectangle background
  const bgOpacity = Math.round(config.backgroundOpacity * 255);
  ctx.fillStyle = config.backgroundColor + bgOpacity.toString(16).padStart(2, '0');
  roundedRect(ctx, 0, 0, canvasWidth, canvasHeight, config.cornerRadius);
  ctx.fill();

  // Draw text
  ctx.font = `${config.fontSize}px ${config.fontFamily}`;
  ctx.textBaseline = 'middle';

  let y = config.padding + lineHeight / 2;
  for (const line of lines) {
    if (line.isBadge && line.badgeBg) {
      // Draw badge background
      const badgeWidth = ctx.measureText(line.text).width + 16;
      const badgeHeight = config.fontSize * 1.3;
      const badgeX = config.padding;
      const badgeY = y - badgeHeight / 2;

      ctx.fillStyle = line.badgeBg;
      roundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
      ctx.fill();

      ctx.fillStyle = line.color;
      ctx.fillText(line.text, badgeX + 8, y);
    } else {
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, config.padding, y);
    }
    y += lineHeight;
  }

  // Calculate position on video
  let x = 0;
  let posY = 0;

  switch (position) {
    case 'top-left':
      x = config.margin;
      posY = config.margin;
      break;
    case 'top-right':
      x = videoWidth - canvasWidth - config.margin;
      posY = config.margin;
      break;
    case 'bottom-left':
      x = config.margin;
      posY = videoHeight - canvasHeight - config.margin;
      break;
    case 'bottom-right':
      x = videoWidth - canvasWidth - config.margin;
      posY = videoHeight - canvasHeight - config.margin;
      break;
  }

  // Save to temp file
  const tempPath = `/tmp/vidchain/overlay_${position}_${Date.now()}.png`;
  await mkdir(dirname(tempPath), { recursive: true });
  const buffer = canvas.toBuffer('image/png');
  await writeFile(tempPath, buffer);

  return {
    path: tempPath,
    x: Math.round(x),
    y: Math.round(posY),
    width: canvasWidth,
    height: canvasHeight,
  };
}

/**
 * Draw rounded rectangle
 */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Get video dimensions using ffprobe
 */
async function getVideoDimensions(
  videoPath: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = data.streams.find((s) => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      resolve({
        width: videoStream.width || 1920,
        height: videoStream.height || 1080,
      });
    });
  });
}

/**
 * Render video with burned-in overlays
 */
export async function renderVideoWithOverlay(
  inputPath: string,
  outputPath: string,
  overlayData: VideoOverlayData,
  config: Partial<OverlayRenderConfig> = {}
): Promise<void> {
  const fullConfig: OverlayRenderConfig = { ...DEFAULT_CONFIG, ...config };

  // Get video dimensions
  const dimensions = await getVideoDimensions(inputPath);

  // Generate overlay images for all corners
  const overlays = await Promise.all([
    generateCornerOverlay('top-left', overlayData, fullConfig, dimensions.width, dimensions.height),
    generateCornerOverlay('top-right', overlayData, fullConfig, dimensions.width, dimensions.height),
    generateCornerOverlay('bottom-left', overlayData, fullConfig, dimensions.width, dimensions.height),
    generateCornerOverlay('bottom-right', overlayData, fullConfig, dimensions.width, dimensions.height),
  ]);

  // Ensure output directory exists
  await mkdir(dirname(outputPath), { recursive: true });

  // Build FFmpeg filter complex
  const filterComplex = overlays
    .map((overlay, i) => {
      const input = i === 0 ? '[0:v]' : `[v${i}]`;
      const output = i === overlays.length - 1 ? '[vout]' : `[v${i + 1}]`;
      return `${input}[${i + 1}:v]overlay=${overlay.x}:${overlay.y}${output}`;
    })
    .join(';');

  // Run FFmpeg
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);

    // Add overlay images as inputs
    for (const overlay of overlays) {
      command = command.input(overlay.path);
    }

    command
      .complexFilter(filterComplex, 'vout')
      .outputOptions([
        '-map', '[vout]',
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'copy',
      ])
      .output(outputPath)
      .on('end', async () => {
        // Cleanup temp overlay files
        await Promise.all(overlays.map((o) => unlink(o.path).catch(() => {})));
        resolve();
      })
      .on('error', async (err) => {
        // Cleanup temp overlay files
        await Promise.all(overlays.map((o) => unlink(o.path).catch(() => {})));
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .run();
  });
}

/**
 * Generate overlay preview image
 */
export async function generateOverlayPreview(
  overlayData: VideoOverlayData,
  config: Partial<OverlayRenderConfig> = {},
  dimensions = { width: 1920, height: 1080 }
): Promise<Buffer> {
  const fullConfig: OverlayRenderConfig = { ...DEFAULT_CONFIG, ...config };

  // Create canvas for full video frame
  const canvas = createCanvas(dimensions.width, dimensions.height);
  const ctx = canvas.getContext('2d');

  // Draw background (simulating video frame)
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  // Draw grid pattern to show video area
  ctx.strokeStyle = '#2a2a4e';
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x < dimensions.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, dimensions.height);
    ctx.stroke();
  }
  for (let y = 0; y < dimensions.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(dimensions.width, y);
    ctx.stroke();
  }

  // Generate and composite overlays
  const positions: OverlayPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  for (const position of positions) {
    const overlay = await generateCornerOverlay(
      position,
      overlayData,
      fullConfig,
      dimensions.width,
      dimensions.height
    );

    // Load overlay image and draw
    const { loadImage } = await import('canvas');
    const overlayImage = await loadImage(overlay.path);
    ctx.drawImage(overlayImage, overlay.x, overlay.y);

    // Cleanup
    await unlink(overlay.path).catch(() => {});
  }

  return canvas.toBuffer('image/png');
}

/**
 * Render video with animated overlay (fade in/out)
 */
export async function renderVideoWithAnimatedOverlay(
  inputPath: string,
  outputPath: string,
  overlayData: VideoOverlayData,
  config: Partial<OverlayRenderConfig> = {},
  animationConfig = {
    fadeInDuration: 0.5,
    fadeOutDuration: 0.5,
    displayDuration: 5, // 0 = always visible
    startTime: 0,
  }
): Promise<void> {
  const fullConfig: OverlayRenderConfig = { ...DEFAULT_CONFIG, ...config };

  // Get video dimensions and duration
  const dimensions = await getVideoDimensions(inputPath);

  const { duration: videoDuration } = await new Promise<{ duration: number }>((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
      if (err) reject(err);
      else resolve({ duration: data.format.duration || 0 });
    });
  });

  // Generate overlay images
  const overlays = await Promise.all([
    generateCornerOverlay('top-left', overlayData, fullConfig, dimensions.width, dimensions.height),
    generateCornerOverlay('top-right', overlayData, fullConfig, dimensions.width, dimensions.height),
    generateCornerOverlay('bottom-left', overlayData, fullConfig, dimensions.width, dimensions.height),
    generateCornerOverlay('bottom-right', overlayData, fullConfig, dimensions.width, dimensions.height),
  ]);

  await mkdir(dirname(outputPath), { recursive: true });

  // Build animation filter
  const { fadeInDuration, fadeOutDuration, displayDuration, startTime } = animationConfig;
  const alwaysVisible = displayDuration === 0;

  const endTime = alwaysVisible
    ? videoDuration
    : Math.min(startTime + fadeInDuration + displayDuration + fadeOutDuration, videoDuration);

  // Build filter for each overlay with fade animation
  const filters: string[] = [];
  let currentInput = '[0:v]';

  for (let i = 0; i < overlays.length; i++) {
    const overlay = overlays[i];
    const overlayInput = `[${i + 1}:v]`;
    const nextInput = i === overlays.length - 1 ? '[vout]' : `[v${i + 1}]`;

    if (alwaysVisible) {
      // Simple overlay without animation
      filters.push(
        `${currentInput}${overlayInput}overlay=${overlay.x}:${overlay.y}:format=auto${nextInput}`
      );
    } else {
      // With fade animation
      filters.push(
        `${overlayInput}fade=t=in:st=${startTime}:d=${fadeInDuration}:alpha=1,` +
          `fade=t=out:st=${endTime - fadeOutDuration}:d=${fadeOutDuration}:alpha=1[ov${i}]`,
        `${currentInput}[ov${i}]overlay=${overlay.x}:${overlay.y}:` +
          `enable='between(t,${startTime},${endTime})':format=auto${nextInput}`
      );
    }

    currentInput = nextInput;
  }

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);

    for (const overlay of overlays) {
      command = command.input(overlay.path);
    }

    command
      .complexFilter(filters.join(';'), 'vout')
      .outputOptions([
        '-map', '[vout]',
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'copy',
      ])
      .output(outputPath)
      .on('end', async () => {
        await Promise.all(overlays.map((o) => unlink(o.path).catch(() => {})));
        resolve();
      })
      .on('error', async (err) => {
        await Promise.all(overlays.map((o) => unlink(o.path).catch(() => {})));
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .run();
  });
}

/**
 * Add watermark to video (subtle branding)
 */
export async function addWatermark(
  inputPath: string,
  outputPath: string,
  watermarkText: string,
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = 'bottom-right',
  opacity = 0.5
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });

  // Position mapping for FFmpeg drawtext
  const positionMap = {
    'bottom-right': 'x=w-tw-20:y=h-th-20',
    'bottom-left': 'x=20:y=h-th-20',
    'top-right': 'x=w-tw-20:y=20',
    'top-left': 'x=20:y=20',
  };

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters([
        {
          filter: 'drawtext',
          options: {
            text: watermarkText,
            fontsize: 24,
            fontcolor: `white@${opacity}`,
            ...parsePosition(positionMap[position]),
            shadowcolor: 'black@0.5',
            shadowx: 2,
            shadowy: 2,
          },
        },
      ])
      .outputOptions(['-c:a', 'copy'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .run();
  });
}

/**
 * Parse position string to object
 */
function parsePosition(posStr: string): Record<string, string> {
  const parts = posStr.split(':');
  const result: Record<string, string> = {};
  for (const part of parts) {
    const [key, value] = part.split('=');
    result[key] = value;
  }
  return result;
}
