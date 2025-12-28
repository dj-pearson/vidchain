import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, showLabel = false, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variants = {
      default: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
    };

    return (
      <div className={cn('w-full', className)}>
        <div
          ref={ref}
          className="relative h-4 w-full overflow-hidden rounded-full bg-secondary"
          {...props}
        >
          <div
            className={cn('h-full transition-all', variants[variant])}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <p className="mt-1 text-sm text-muted-foreground">{Math.round(percentage)}%</p>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
