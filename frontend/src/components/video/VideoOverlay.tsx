/**
 * VideoOverlay - Displays NFT metadata on video corners
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────┐
 * │ [Top Left]                             [Top Right]      │
 * │ ✓ VERIFIED #1234                    Documentary | 2024 │
 * │                                                         │
 * │                    [VIDEO CONTENT]                      │
 * │                                                         │
 * │ [Bottom Left]                        [Bottom Right]     │
 * │ 📍 NYC | ipfs://Qm...               👤 Creator | Owner  │
 * └─────────────────────────────────────────────────────────┘
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type {
  VideoOverlayData,
  OverlaySettings,
  ContentCategory,
} from '@/types';

interface VideoOverlayProps {
  data: VideoOverlayData;
  settings?: Partial<OverlaySettings>;
  className?: string;
  visible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

// Category display config
const CATEGORY_CONFIG: Record<ContentCategory, { label: string; icon: string }> = {
  art: { label: 'Art', icon: '🎨' },
  music: { label: 'Music', icon: '🎵' },
  documentary: { label: 'Documentary', icon: '🎬' },
  sports: { label: 'Sports', icon: '⚽' },
  gaming: { label: 'Gaming', icon: '🎮' },
  education: { label: 'Education', icon: '📚' },
  entertainment: { label: 'Entertainment', icon: '🎭' },
  news: { label: 'News', icon: '📰' },
  personal: { label: 'Personal', icon: '👤' },
  commercial: { label: 'Commercial', icon: '💼' },
  other: { label: 'Other', icon: '📹' },
};

// Verification status config
const VERIFICATION_CONFIG = {
  verified: {
    label: 'VERIFIED',
    bgColor: 'bg-green-600',
    textColor: 'text-white',
    icon: (
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  pending: {
    label: 'PENDING',
    bgColor: 'bg-yellow-500',
    textColor: 'text-black',
    icon: (
      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    ),
  },
  unverified: {
    label: 'UNVERIFIED',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    icon: (
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
};

// Default overlay settings
const DEFAULT_SETTINGS: OverlaySettings = {
  id: '',
  verification_id: '',
  top_left_content: { type: 'verification_status', show_token_id: true },
  top_right_content: { type: 'category_year' },
  bottom_left_content: { type: 'location_ipfs' },
  bottom_right_content: { type: 'creator_owner' },
  font_family: 'Inter',
  font_size: 12,
  text_color: '#FFFFFF',
  background_color: '#000000',
  background_opacity: 0.75,
  corner_radius: 8,
  padding: 10,
  margin: 12,
  show_on_playback: true,
  show_on_download: true,
  burn_into_export: true,
  fade_in_duration: 300,
  auto_hide_after: 0,
  created_at: '',
  updated_at: '',
};

/**
 * Truncate IPFS CID for display
 */
function truncateIPFS(cid: string): string {
  if (!cid) return '';
  if (cid.length <= 16) return cid;
  return `${cid.slice(0, 8)}...${cid.slice(-6)}`;
}

/**
 * CornerBadge - Individual corner overlay element
 */
function CornerBadge({
  children,
  position,
  settings,
  visible,
}: {
  children: React.ReactNode;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  settings: OverlaySettings;
  visible: boolean;
}) {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  };

  const bgOpacity = Math.round(settings.background_opacity * 255)
    .toString(16)
    .padStart(2, '0');

  return (
    <div
      className={cn(
        'absolute z-20 transition-opacity',
        positionClasses[position],
        visible ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        margin: settings.margin,
        transitionDuration: `${settings.fade_in_duration}ms`,
      }}
    >
      <div
        className="flex items-center gap-2 shadow-lg"
        style={{
          fontFamily: settings.font_family,
          fontSize: settings.font_size,
          color: settings.text_color,
          backgroundColor: `${settings.background_color}${bgOpacity}`,
          borderRadius: settings.corner_radius,
          padding: settings.padding,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * TopLeftOverlay - Verification status and token ID
 */
function TopLeftOverlay({
  data,
  settings,
  visible,
}: {
  data: VideoOverlayData;
  settings: OverlaySettings;
  visible: boolean;
}) {
  const config = VERIFICATION_CONFIG[data.verification_status];

  return (
    <CornerBadge position="top-left" settings={settings} visible={visible}>
      <span
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
          config.bgColor,
          config.textColor
        )}
      >
        {config.icon}
        {config.label}
      </span>
      {data.token_id && settings.top_left_content.show_token_id && (
        <span className="font-mono text-sm opacity-90">#{data.token_id}</span>
      )}
    </CornerBadge>
  );
}

/**
 * TopRightOverlay - Category and year
 */
function TopRightOverlay({
  data,
  settings,
  visible,
}: {
  data: VideoOverlayData;
  settings: OverlaySettings;
  visible: boolean;
}) {
  const category = CATEGORY_CONFIG[data.category] || CATEGORY_CONFIG.other;

  return (
    <CornerBadge position="top-right" settings={settings} visible={visible}>
      <span className="text-sm">{category.icon}</span>
      <span className="font-medium">{category.label}</span>
      <span className="opacity-60">|</span>
      <span className="font-mono">{data.year}</span>
    </CornerBadge>
  );
}

/**
 * BottomLeftOverlay - Location and IPFS link
 */
function BottomLeftOverlay({
  data,
  settings,
  visible,
}: {
  data: VideoOverlayData;
  settings: OverlaySettings;
  visible: boolean;
}) {
  return (
    <CornerBadge position="bottom-left" settings={settings} visible={visible}>
      {data.location_name && (
        <>
          <span className="text-sm">📍</span>
          <span className="max-w-[120px] truncate">{data.location_name}</span>
          <span className="opacity-60">|</span>
        </>
      )}
      <span className="text-sm">🔗</span>
      <span className="font-mono text-xs opacity-90">
        ipfs://{truncateIPFS(data.ipfs_cid)}
      </span>
    </CornerBadge>
  );
}

/**
 * BottomRightOverlay - Creator and owner
 */
function BottomRightOverlay({
  data,
  settings,
  visible,
}: {
  data: VideoOverlayData;
  settings: OverlaySettings;
  visible: boolean;
}) {
  const isSameOwner =
    data.original_creator_name === data.current_owner_name;

  return (
    <CornerBadge position="bottom-right" settings={settings} visible={visible}>
      <div className="flex flex-col gap-0.5 text-right">
        <div className="flex items-center gap-1.5">
          <span className="text-xs opacity-70">Creator:</span>
          <span className="max-w-[100px] truncate font-medium">
            {data.original_creator_name}
          </span>
        </div>
        {!isSameOwner && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs opacity-70">Owner:</span>
            <span className="max-w-[100px] truncate font-medium">
              {data.current_owner_name}
            </span>
          </div>
        )}
      </div>
    </CornerBadge>
  );
}

/**
 * VideoOverlay - Main overlay component
 */
export function VideoOverlay({
  data,
  settings: customSettings,
  className,
  visible = true,
  onVisibilityChange,
}: VideoOverlayProps) {
  const [isVisible, setIsVisible] = useState(visible);
  const settings = { ...DEFAULT_SETTINGS, ...customSettings };

  // Handle auto-hide
  useEffect(() => {
    if (settings.auto_hide_after > 0 && visible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onVisibilityChange?.(false);
      }, settings.auto_hide_after);

      return () => clearTimeout(timer);
    }
  }, [visible, settings.auto_hide_after, onVisibilityChange]);

  // Sync with external visible prop
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  if (!settings.show_on_playback) {
    return null;
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-10 overflow-hidden',
        className
      )}
    >
      <TopLeftOverlay data={data} settings={settings} visible={isVisible} />
      <TopRightOverlay data={data} settings={settings} visible={isVisible} />
      <BottomLeftOverlay data={data} settings={settings} visible={isVisible} />
      <BottomRightOverlay data={data} settings={settings} visible={isVisible} />
    </div>
  );
}

/**
 * VideoOverlayWrapper - Wraps video player with overlay
 */
export function VideoOverlayWrapper({
  children,
  overlayData,
  overlaySettings,
  showOverlay = true,
  className,
}: {
  children: React.ReactNode;
  overlayData?: VideoOverlayData;
  overlaySettings?: Partial<OverlaySettings>;
  showOverlay?: boolean;
  className?: string;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Show overlay when hovering or paused
  const shouldShowOverlay = showOverlay && overlayData && (isHovering || !isPlaying);

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
      {overlayData && (
        <VideoOverlay
          data={overlayData}
          settings={overlaySettings}
          visible={shouldShowOverlay}
        />
      )}
    </div>
  );
}

/**
 * MiniVerificationBadge - Compact verification badge for thumbnails
 */
export function MiniVerificationBadge({
  status,
  tokenId,
  className,
}: {
  status: 'verified' | 'pending' | 'unverified';
  tokenId?: number;
  className?: string;
}) {
  const config = VERIFICATION_CONFIG[status];

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shadow-md',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {config.icon}
      {tokenId && <span className="font-mono">#{tokenId}</span>}
    </div>
  );
}

export default VideoOverlay;
