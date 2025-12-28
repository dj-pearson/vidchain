import MuxPlayer from '@mux/mux-player-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useCallback } from 'react';

interface VideoPlayerProps {
  // Mux-specific props
  playbackId?: string;
  streamType?: 'on-demand' | 'live' | 'll-live';
  // Fallback for non-Mux videos
  src?: string;
  // Common props
  poster?: string;
  title?: string;
  aspectRatio?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  // Verification overlay
  showVerificationBadge?: boolean;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
  // Callbacks
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onError?: (error: Error) => void;
}

/**
 * VideoPlayer - A video player component with Mux integration
 * Supports both Mux playback IDs and direct video URLs
 */
export function VideoPlayer({
  playbackId,
  streamType = 'on-demand',
  src,
  poster,
  title,
  aspectRatio = '16/9',
  autoPlay = false,
  muted = false,
  loop = false,
  className,
  showVerificationBadge = false,
  verificationStatus,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onError,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onEnded?.();
  }, [onEnded]);

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      onTimeUpdate?.(video.currentTime);
    },
    [onTimeUpdate]
  );

  const handleError = useCallback(
    (e: Event) => {
      setHasError(true);
      onError?.(new Error('Video playback error'));
    },
    [onError]
  );

  // Get verification badge content
  const getVerificationBadge = () => {
    if (!showVerificationBadge || !verificationStatus) return null;

    const badgeStyles = {
      verified:
        'bg-green-600 text-white',
      pending: 'bg-yellow-500 text-black',
      unverified: 'bg-red-600 text-white',
    };

    const badgeText = {
      verified: 'Verified',
      pending: 'Pending',
      unverified: 'Unverified',
    };

    return (
      <div
        className={cn(
          'absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-lg',
          badgeStyles[verificationStatus]
        )}
      >
        {verificationStatus === 'verified' && (
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {badgeText[verificationStatus]}
      </div>
    );
  };

  // Error state
  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-gray-900',
          className
        )}
        style={{ aspectRatio }}
      >
        <div className="text-center text-gray-400">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2">Failed to load video</p>
        </div>
      </div>
    );
  }

  // Use Mux Player if playbackId is provided
  if (playbackId) {
    return (
      <div className={cn('relative overflow-hidden rounded-lg', className)}>
        {getVerificationBadge()}
        <MuxPlayer
          playbackId={playbackId}
          streamType={streamType}
          metadata={{
            video_title: title || 'VidChain Video',
            player_name: 'VidChain Player',
          }}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          style={{ aspectRatio, width: '100%' }}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={handleError}
          accentColor="#6366f1"
        />
      </div>
    );
  }

  // Fallback to native video player for direct URLs
  if (src) {
    return (
      <div className={cn('relative overflow-hidden rounded-lg', className)}>
        {getVerificationBadge()}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          controls
          className="w-full"
          style={{ aspectRatio }}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onError={() => setHasError(true)}
        >
          <track kind="captions" />
        </video>
      </div>
    );
  }

  // No video source
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800',
        className
      )}
      style={{ aspectRatio }}
    >
      <div className="text-center text-gray-500">
        <svg
          className="mx-auto h-12 w-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2">No video source</p>
      </div>
    </div>
  );
}
