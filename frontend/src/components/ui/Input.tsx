import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error message to display below the input */
  error?: string;
  /** Description text for the input (for aria-describedby) */
  description?: string;
  /** Custom error ID (auto-generated if not provided) */
  errorId?: string;
  /** Custom description ID (auto-generated if not provided) */
  descriptionId?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    error,
    description,
    errorId,
    descriptionId,
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props
  }, ref) => {
    // Generate unique IDs for accessibility
    const generatedId = React.useId();
    const inputId = id || `input-${generatedId}`;
    const finalErrorId = errorId || `${inputId}-error`;
    const finalDescriptionId = descriptionId || `${inputId}-description`;

    // Build aria-describedby from error, description, and custom value
    const describedByParts: string[] = [];
    if (ariaDescribedBy) describedByParts.push(ariaDescribedBy);
    if (error) describedByParts.push(finalErrorId);
    if (description) describedByParts.push(finalDescriptionId);
    const finalAriaDescribedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

    return (
      <div className="w-full">
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          aria-invalid={ariaInvalid ?? (error ? true : undefined)}
          aria-describedby={finalAriaDescribedBy}
          {...props}
        />
        {description && !error && (
          <p
            id={finalDescriptionId}
            className="mt-1 text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}
        {error && (
          <p
            id={finalErrorId}
            role="alert"
            aria-live="polite"
            className="mt-1 text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
