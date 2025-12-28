/**
 * Overlay types for video rendering
 */

export type OverlayPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

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

export type VerificationStatus = 'verified' | 'pending' | 'unverified';

/**
 * Data required to render video overlay
 */
export interface VideoOverlayData {
  // Verification info (top-left)
  verification_status: VerificationStatus;
  token_id?: number;

  // Category info (top-right)
  category: ContentCategory;
  year: number;

  // Location/IPFS info (bottom-left)
  location_name?: string;
  ipfs_cid: string;

  // Creator/Owner info (bottom-right)
  original_creator_name: string;
  current_owner_name: string;

  // Additional metadata
  sha256_hash: string;
  mint_date?: string;
}

/**
 * Configuration for overlay rendering
 */
export interface OverlayRenderConfig {
  // Typography
  fontFamily: string;
  fontSize: number;
  textColor: string;

  // Background
  backgroundColor: string;
  backgroundOpacity: number;
  cornerRadius: number;

  // Spacing
  padding: number;
  margin: number;

  // Icons
  iconSize: number;
}

/**
 * Animation configuration for overlay
 */
export interface OverlayAnimationConfig {
  fadeInDuration: number;  // seconds
  fadeOutDuration: number; // seconds
  displayDuration: number; // 0 = always visible
  startTime: number;       // seconds from video start
}

/**
 * Result of overlay generation
 */
export interface OverlayGenerationResult {
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Overlay settings stored in database
 */
export interface OverlaySettings {
  id: string;
  verification_id: string;

  // Corner content configuration
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
  fade_in_duration: number;  // milliseconds
  auto_hide_after: number;   // 0 = never hide

  created_at: string;
  updated_at: string;
}

/**
 * Corner content type configuration
 */
export interface OverlayCornerContent {
  type: 'verification_status' | 'category_year' | 'location_ipfs' | 'creator_owner' | 'custom';
  show_token_id?: boolean;
  custom_text?: string;
  custom_icon?: string;
}

/**
 * Export options for video with overlay
 */
export interface VideoExportOptions {
  quality: 'low' | 'medium' | 'high' | 'original';
  format: 'mp4' | 'webm' | 'mov';
  includeOverlay: boolean;
  animateOverlay: boolean;
  animationConfig?: OverlayAnimationConfig;
  watermark?: {
    text: string;
    position: OverlayPosition;
    opacity: number;
  };
}

/**
 * Quality presets for video export
 */
export const QUALITY_PRESETS = {
  low: {
    width: 640,
    height: 360,
    bitrate: '500k',
    crf: 28,
  },
  medium: {
    width: 1280,
    height: 720,
    bitrate: '2500k',
    crf: 23,
  },
  high: {
    width: 1920,
    height: 1080,
    bitrate: '5000k',
    crf: 20,
  },
  original: {
    width: null,
    height: null,
    bitrate: null,
    crf: 18,
  },
} as const;
