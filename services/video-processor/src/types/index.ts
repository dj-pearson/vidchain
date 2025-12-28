export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  size: number;
  format: string;
  audioCodec?: string;
  audioChannels?: number;
  audioBitrate?: number;
}

export interface ProcessingResult {
  sha256Hash: string;
  thumbnails: ThumbnailResult[];
  metadata: VideoMetadata;
  processedAt: string;
}

export interface ThumbnailResult {
  timestamp: number;
  path: string;
  url?: string;
  width: number;
  height: number;
}

export interface ProcessingJob {
  id: string;
  videoId: string;
  videoUrl: string;
  organizationId: string;
  userId: string;
  status: ProcessingStatus;
  progress: number;
  result?: ProcessingResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProcessingStatus =
  | 'pending'
  | 'downloading'
  | 'hashing'
  | 'extracting_metadata'
  | 'generating_thumbnails'
  | 'uploading'
  | 'completed'
  | 'failed';

export interface ProcessVideoRequest {
  videoId: string;
  videoUrl: string;
  organizationId: string;
  userId: string;
  options?: ProcessingOptions;
}

export interface ProcessingOptions {
  thumbnailCount?: number;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  thumbnailFormat?: 'jpg' | 'png' | 'webp';
  skipThumbnails?: boolean;
  skipMetadata?: boolean;

  // Enhanced metadata extraction
  extractSourceMetadata?: boolean;    // Extract EXIF/container metadata
  computePerceptualHash?: boolean;    // Compute pHash for duplicate detection
  checkForDuplicates?: boolean;       // Check against existing videos
  reverseGeocode?: boolean;           // Convert GPS to location name

  // Overlay rendering
  generateOverlayPreview?: boolean;   // Generate preview with overlay
  burnOverlayIntoExport?: boolean;    // Burn overlay into downloadable video
}

// Re-export enhanced types
export * from './metadata.js';
export * from './overlay.js';

export interface WebhookPayload {
  event: 'processing.started' | 'processing.progress' | 'processing.completed' | 'processing.failed';
  jobId: string;
  videoId: string;
  organizationId: string;
  data: {
    status: ProcessingStatus;
    progress: number;
    result?: ProcessingResult;
    error?: string;
  };
  timestamp: string;
}
