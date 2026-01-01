import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

// Base skeleton component with animation
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      aria-hidden="true"
    />
  );
}

// Text line skeleton
export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// Card skeleton for dashboard cards
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-6 shadow-sm',
        className
      )}
      aria-hidden="true"
      role="presentation"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
    </div>
  );
}

// Stats grid skeleton for dashboard
export function SkeletonStatsGrid({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      aria-label="Loading statistics"
      role="status"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
      <span className="sr-only">Loading statistics...</span>
    </div>
  );
}

// Video list item skeleton
export function SkeletonVideoItem({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border p-4',
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="h-16 w-24 shrink-0 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// Video list skeleton
export function SkeletonVideoList({ count = 5 }: { count?: number }) {
  return (
    <div
      className="space-y-4"
      aria-label="Loading videos"
      role="status"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonVideoItem key={i} />
      ))}
      <span className="sr-only">Loading videos...</span>
    </div>
  );
}

// Table skeleton
export function SkeletonTable({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div
      className="w-full space-y-3"
      aria-label="Loading table data"
      role="status"
    >
      {/* Header */}
      <div className="flex gap-4 border-b pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading table data...</span>
    </div>
  );
}

// Avatar skeleton
export function SkeletonAvatar({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <Skeleton
      className={cn('rounded-full', sizes[size])}
    />
  );
}

// Profile header skeleton
export function SkeletonProfileHeader() {
  return (
    <div
      className="flex items-center gap-4"
      aria-hidden="true"
    >
      <SkeletonAvatar size="lg" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

// Form skeleton
export function SkeletonForm({ fields = 3 }: { fields?: number }) {
  return (
    <div
      className="space-y-6"
      aria-label="Loading form"
      role="status"
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
      <span className="sr-only">Loading form...</span>
    </div>
  );
}

// Dashboard page skeleton
export function SkeletonDashboard() {
  return (
    <div className="space-y-8" aria-label="Loading dashboard" role="status">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats */}
      <SkeletonStatsGrid />

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border p-6">
          <Skeleton className="h-5 w-32" />
          <SkeletonVideoList count={3} />
        </div>
        <div className="space-y-4 rounded-lg border p-6">
          <Skeleton className="h-5 w-40" />
          <SkeletonVideoList count={3} />
        </div>
      </div>
      <span className="sr-only">Loading dashboard...</span>
    </div>
  );
}

// Verification result skeleton
export function SkeletonVerificationResult() {
  return (
    <div
      className="space-y-6"
      aria-label="Loading verification result"
      role="status"
    >
      {/* Status Card */}
      <div className="flex items-center gap-4 rounded-lg border p-6">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Checks */}
      <div className="rounded-lg border p-6">
        <Skeleton className="mb-4 h-5 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-lg border p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading verification result...</span>
    </div>
  );
}
