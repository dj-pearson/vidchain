import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  /** Accessible label describing what the progress bar represents */
  'aria-label'?: string;
  /** ID of an element that labels the progress bar */
  'aria-labelledby'?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({
    className,
    value = 0,
    max = 100,
    showLabel = false,
    variant = 'default',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    ...props
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const labelId = React.useId();

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
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          className="relative h-4 w-full overflow-hidden rounded-full bg-secondary"
          {...props}
        >
          <div
            className={cn('h-full transition-all motion-reduce:transition-none', variants[variant])}
            style={{ width: `${percentage}%` }}
            aria-hidden="true"
          />
        </div>
        {showLabel && (
          <p
            id={labelId}
            className="mt-1 text-sm text-muted-foreground"
            aria-live="polite"
          >
            {Math.round(percentage)}% complete
          </p>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
