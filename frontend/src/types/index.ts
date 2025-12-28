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
