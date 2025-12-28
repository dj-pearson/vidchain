// Core VidChain Types

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  wallet_address?: string;
  organization_id?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'user' | 'admin' | 'organization_admin';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  tier: SubscriptionTier;
  verification_limit: number;
  api_key?: string;
  created_at: string;
  updated_at: string;
}

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise' | 'academic';

// Video types
export interface Video {
  id: string;
  user_id: string;
  organization_id?: string;
  title: string;
  description?: string;
  filename: string;
  file_size: number;
  duration: number;
  resolution: string;
  mime_type: string;
  storage_path: string;
  thumbnail_url?: string;
  status: VideoStatus;
  created_at: string;
  updated_at: string;
}

export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'failed';

// Verification types
export interface Verification {
  id: string;
  video_id: string;
  user_id: string;
  sha256_hash: string;
  ipfs_cid: string;
  ipfs_cid_hash: string;
  perceptual_hash?: string;
  token_id?: number;
  transaction_hash?: string;
  block_number?: number;
  blockchain_timestamp?: string;
  owner_address?: string;
  status: VerificationStatus;
  metadata: VideoMetadata;
  created_at: string;
  updated_at: string;
}

export type VerificationStatus = 'pending' | 'processing' | 'verified' | 'failed';

export interface VideoMetadata {
  original_filename: string;
  file_size: number;
  duration: number;
  resolution: string;
  codec?: string;
  frame_rate?: number;
  bit_rate?: number;
  capture_device?: string;
  capture_date?: string;
  gps_location?: {
    lat: number;
    lng: number;
  };
}

// ============================================================================
// ENHANCED NFT METADATA TYPES
// ============================================================================

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

// Video source metadata extracted from file
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

// Enhanced verification with NFT metadata
export interface EnhancedVerification extends Verification {
  // Classification
  category: ContentCategory;
  subcategory?: string;
  content_rating: ContentRating;
  tags: string[];

  // Creator/Owner tracking
  original_creator_id?: string;
  original_creator_name?: string;
  uploader_id?: string;
  uploader_name?: string;
  current_owner_name?: string;

  // Integrity hashes
  audio_fingerprint?: string;
  color_histogram?: number[];
  frame_hashes?: { timestamp: number; hash: string }[];

  // Duplicate detection
  original_verification_id?: string;
  is_duplicate: boolean;
  duplicate_confidence?: number;
  original_source_hash?: string;

  // Display preferences
  overlay_enabled: boolean;
  overlay_position: string;
  overlay_opacity: number;

  // Timestamps
  mint_date?: string;
  last_transfer_date?: string;

  // Related data
  source_metadata?: VideoSourceMetadata;
  provenance?: ProvenanceRecord[];
  overlay_settings?: OverlaySettings;
}

// Provenance record for chain of custody
export interface ProvenanceRecord {
  id: string;
  verification_id: string;
  action: ProvenanceAction;
  actor_id?: string;
  actor_address?: string;
  actor_name?: string;
  transaction_hash?: string;
  block_number?: number;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  from_address?: string;
  to_address?: string;
  price_amount?: number;
  price_currency?: string;
  created_at: string;
}

// Perceptual hash for similarity matching
export interface PerceptualHashIndex {
  id: string;
  verification_id: string;
  video_id: string;
  phash_video: string;
  phash_thumbnail?: string;
  dhash_video?: string;
  ahash_video?: string;
  frame_phashes?: { timestamp: number; hash: string }[];
  duration_seconds: number;
  aspect_ratio: number;
  created_at: string;
}

// Overlay corner content configuration
export interface OverlayCornerContent {
  type: 'verification_status' | 'category_year' | 'location_ipfs' | 'creator_owner' | 'custom';
  show_token_id?: boolean;
  custom_text?: string;
  custom_icon?: string;
}

// Overlay display settings
export interface OverlaySettings {
  id: string;
  verification_id: string;

  // Corner content
  top_left_content: OverlayCornerContent;
  top_right_content: OverlayCornerContent;
  bottom_left_content: OverlayCornerContent;
  bottom_right_content: OverlayCornerContent;

  // Styling
  font_family: string;
  font_size: number;
  text_color: string;
  background_color: string;
  background_opacity: number;
  corner_radius: number;
  padding: number;
  margin: number;

  // Visibility
  show_on_playback: boolean;
  show_on_download: boolean;
  burn_into_export: boolean;

  // Animation
  fade_in_duration: number;
  auto_hide_after: number;

  created_at: string;
  updated_at: string;
}

// Duplicate detection result
export interface DuplicateCheckResult {
  is_duplicate: boolean;
  confidence: number;
  original_verification_id?: string;
  original_video_id?: string;
  original_creator_name?: string;
  matching_hashes: {
    type: 'sha256' | 'perceptual' | 'audio';
    similarity: number;
  }[];
  recommendation: 'allow' | 'warn' | 'block';
}

// Video overlay data for display
export interface VideoOverlayData {
  // Top Left - Verification Status
  verification_status: 'verified' | 'pending' | 'unverified';
  token_id?: number;

  // Top Right - Category & Year
  category: ContentCategory;
  year: number;

  // Bottom Left - Location & IPFS
  location_name?: string;
  ipfs_cid: string;

  // Bottom Right - Creator & Owner
  original_creator_name: string;
  current_owner_name: string;

  // Additional
  mint_date?: string;
  sha256_hash: string;
}

// Verification result for API responses
export interface VerificationResult {
  status: 'verified' | 'unverified' | 'modified' | 'unknown';
  confidence: number;
  token_id?: number;
  sha256_hash: string;
  ipfs_cid: string;
  blockchain_timestamp?: string;
  transaction_hash?: string;
  owner_address?: string;
  checks: VerificationChecks;
  warnings: string[];
  certificate_url?: string;
}

export interface VerificationChecks {
  hash_match: boolean;
  cid_valid: boolean;
  chain_unbroken: boolean;
  metadata_consistent: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Upload types
export interface UploadProgress {
  file_id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface UploadRequest {
  file: File;
  title: string;
  description?: string;
  auto_mint?: boolean;
}

// Blockchain types
export interface MintRequest {
  video_id: string;
  recipient_address?: string;
}

export interface MintResult {
  token_id: number;
  transaction_hash: string;
  block_number: number;
  gas_used: number;
}

// Dashboard stats
export interface DashboardStats {
  total_videos: number;
  verified_videos: number;
  pending_verifications: number;
  total_mints: number;
  verifications_this_month: number;
  storage_used_mb: number;
}

// Embed widget config
export interface EmbedConfig {
  video_id: string;
  theme: 'light' | 'dark';
  show_details: boolean;
  custom_css?: string;
}
