/**
 * Enhanced metadata types for video processing
 */

// Video source metadata extracted from file (matches database schema)
export interface VideoSourceMetadata {
  id: string;
  video_id: string;

  // Device & Capture Information
  capture_device_make?: string;
  capture_device_model?: string;
  capture_device_serial?: string;
  capture_software?: string;
  capture_software_version?: string;

  // Timestamps from file metadata
  original_capture_date?: string;
  file_creation_date?: string;
  file_modification_date?: string;

  // GPS/Location Data
  gps_latitude?: number;
  gps_longitude?: number;
  gps_altitude?: number;
  location_name?: string;

  // Embedded Metadata
  embedded_title?: string;
  embedded_artist?: string;
  embedded_copyright?: string;
  embedded_description?: string;
  embedded_comment?: string;

  // Technical Metadata (extended)
  color_space?: string;
  color_primaries?: string;
  color_transfer?: string;
  bit_depth?: number;
  hdr_format?: string;
  rotation?: number;

  // Audio Details
  audio_sample_rate?: number;
  audio_bit_depth?: number;
  audio_language?: string;

  // Container Metadata
  container_format?: string;
  encoder_name?: string;
  encoder_version?: string;

  // Raw metadata JSON
  raw_metadata?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

// Extended video metadata from ffprobe
export interface ExtendedVideoMetadata {
  // Basic info
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  size: number;
  format: string;
  aspectRatio: number;

  // Extended video info
  colorSpace?: string;
  colorPrimaries?: string;
  colorTransfer?: string;
  bitDepth?: number;
  pixelFormat?: string;
  profile?: string;
  level?: number;
  rotation?: number;

  // Audio info
  audioCodec?: string;
  audioChannels?: number;
  audioBitrate?: number;
  audioSampleRate?: number;
  audioBitDepth?: number;

  // Container info
  containerTags?: Record<string, string>;
  creationTime?: string;
}

// Perceptual hash data
export interface PerceptualHashData {
  phash: string;           // Primary perceptual hash (64-bit hex)
  dhash: string;           // Difference hash
  ahash: string;           // Average hash
  frameHashes: FrameHash[];
  colorHistogram: number[];
}

export interface FrameHash {
  timestamp: number;
  phash: string;
  dhash?: string;
}

// Duplicate detection result
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: number;
  originalVerificationId?: string;
  originalVideoId?: string;
  originalCreatorName?: string;
  matches: DuplicateMatch[];
  recommendation: 'allow' | 'warn' | 'block';
}

export interface DuplicateMatch {
  verificationId: string;
  videoId: string;
  hashType: 'sha256' | 'phash' | 'dhash' | 'audio';
  similarity: number;
  distance?: number;
}

// Audio fingerprint data
export interface AudioFingerprintData {
  fingerprint: string;
  duration: number;
  sampleRate: number;
}

// Complete extraction result
export interface MetadataExtractionResult {
  sourceMetadata: VideoSourceMetadata;
  extendedMetadata: ExtendedVideoMetadata;
  perceptualHashes?: PerceptualHashData;
  audioFingerprint?: AudioFingerprintData;
  duplicateCheck?: DuplicateCheckResult;
}

// Content category types
export type ContentCategory =
  | 'art'
  | 'music'
  | 'documentary'
  | 'sports'
  | 'gaming'
  | 'education'
  | 'entertainment'
  | 'news'
  | 'personal'
  | 'commercial'
  | 'other';

export type ContentRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';

// Overlay configuration
export interface OverlayConfig {
  enabled: boolean;
  position: 'corners' | 'bottom' | 'top' | 'watermark';
  opacity: number;
  showOnPlayback: boolean;
  showOnDownload: boolean;
  burnIntoExport: boolean;
}

// Provenance record
export interface ProvenanceRecord {
  id: string;
  verificationId: string;
  action: ProvenanceAction;
  actorId?: string;
  actorAddress?: string;
  actorName?: string;
  transactionHash?: string;
  blockNumber?: number;
  details?: Record<string, unknown>;
  createdAt: string;
}

export type ProvenanceAction =
  | 'created'
  | 'uploaded'
  | 'verified'
  | 'minted'
  | 'transferred'
  | 'listed'
  | 'sold'
  | 'relisted'
  | 'delisted'
  | 'metadata_updated'
  | 'duplicate_detected';
