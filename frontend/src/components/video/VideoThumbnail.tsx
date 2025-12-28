import { cn } from '@/lib/utils';
import { Play, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface VideoThumbnailProps {
  src?: string;
  alt?: string;
  duration?: number;
  status?: 'verified' | 'pending' | 'processing' | 'unverified';
  className?: string;
  onClick?: () => void;
  aspectRatio?: string;
  showPlayButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * VideoThumbnail - Display a video thumbnail with status indicators
 */
export function VideoThumbnail({
  src,
  alt = 'Video thumbnail',
  duration,
  status,
  className,
  onClick,
  aspectRatio = '16/9',
  showPlayButton = true,
  size = 'md',
}: VideoThumbnailProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'pending':
        return <Clock className="h-3.5 w-3.5" />;
      case 'processing':
        return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
      case 'unverified':
        return <AlertCircle className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'verified':
        return 'bg-green-600 text-white';
      case 'pending':
        return 'bg-yellow-500 text-black';
      case 'processing':
        return 'bg-blue-600 text-white';
      case 'unverified':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const playButtonSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
        onClick && 'hover:ring-2 hover:ring-primary hover:ring-offset-2',
        className
      )}
      style={{ aspectRatio }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Thumbnail image */}
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Play button */}
      {showPlayButton && onClick && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              'flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-primary',
              playButtonSizes[size]
            )}
          >
            <Play className="h-1/2 w-1/2 fill-current" />
          </div>
        </div>
      )}

      {/* Duration badge */}
      {duration !== undefined && duration > 0 && (
        <div className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(duration)}
        </div>
      )}

      {/* Status badge */}
      {status && (
        <div
          className={cn(
            'absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            getStatusStyles()
          )}
        >
          {getStatusIcon()}
          <span className="capitalize">{status}</span>
        </div>
      )}
    </div>
  );
}
