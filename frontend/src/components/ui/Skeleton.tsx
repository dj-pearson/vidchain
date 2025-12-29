import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'shimmer' | 'none';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', animation = 'shimmer', ...props }, ref) => {
    const variants = {
      default: 'rounded-md',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
    };

    const animations = {
      pulse: 'animate-pulse',
      shimmer: 'skeleton-shimmer',
      none: '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-muted',
          variants[variant],
          animations[animation],
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

// Text skeleton with multiple lines
interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  lastLineWidth?: string;
}

function SkeletonText({ lines = 3, lastLineWidth = '60%', className, ...props }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
    </div>
  );
}

// Avatar skeleton
interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

function SkeletonAvatar({ size = 'md', className, ...props }: SkeletonAvatarProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <Skeleton
      variant="circular"
      className={cn(sizes[size], className)}
      {...props}
    />
  );
}

// Card skeleton
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border bg-card p-6 shadow-sm', className)}
      {...props}
    >
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

// Stats card skeleton (for dashboard)
function SkeletonStatsCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border bg-card p-6 shadow-sm', className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton variant="circular" className="h-10 w-10" />
      </div>
    </div>
  );
}

// Video card skeleton (for video lists)
function SkeletonVideoCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border bg-card overflow-hidden shadow-sm', className)}
      {...props}
    >
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center gap-2">
          <SkeletonAvatar size="sm" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

// Table row skeleton
function SkeletonTableRow({ columns = 4, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { columns?: number }) {
  return (
    <div
      className={cn('flex items-center gap-4 py-4 border-b', className)}
      {...props}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === 0 ? '30%' : `${Math.floor(70 / (columns - 1))}%`,
          }}
        />
      ))}
    </div>
  );
}

// NFT/Marketplace card skeleton
function SkeletonNFTCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border bg-card overflow-hidden shadow-sm', className)}
      {...props}
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <div className="flex items-center gap-2">
          <SkeletonAvatar size="sm" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// List skeleton (generic list of items)
interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  itemClassName?: string;
}

function SkeletonList({ count = 5, itemClassName, className, ...props }: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('flex items-center gap-4', itemClassName)}>
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonStatsCard,
  SkeletonVideoCard,
  SkeletonTableRow,
  SkeletonNFTCard,
  SkeletonList,
};
