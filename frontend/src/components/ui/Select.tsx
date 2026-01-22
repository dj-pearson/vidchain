import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

/**
 * Accessible Select component following WCAG 2.1 AA guidelines
 * - Includes proper label association
 * - Supports error states with aria-invalid and aria-describedby
 * - Visible focus indicators
 */

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Label for the select (required for accessibility) */
  label: string;
  /** Whether to visually hide the label (still accessible to screen readers) */
  labelHidden?: boolean;
  /** Error message to display */
  error?: string;
  /** Description/help text for the select */
  description?: string;
  /** Options to render in the select */
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  /** Placeholder option (value will be empty string) */
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    label,
    labelHidden = false,
    error,
    description,
    options,
    placeholder,
    id,
    disabled,
    ...props
  }, ref) => {
    // Generate unique IDs for accessibility
    const generatedId = React.useId();
    const selectId = id || `select-${generatedId}`;
    const errorId = `${selectId}-error`;
    const descriptionId = `${selectId}-description`;

    // Build aria-describedby
    const describedByParts: string[] = [];
    if (error) describedByParts.push(errorId);
    if (description) describedByParts.push(descriptionId);
    const ariaDescribedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

    return (
      <div className="w-full">
        <label
          htmlFor={selectId}
          className={cn(
            'block text-sm font-medium mb-1.5',
            labelHidden && 'sr-only',
            disabled && 'opacity-50'
          )}
        >
          {label}
        </label>

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={ariaDescribedBy}
            className={cn(
              'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus:ring-destructive',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-muted-foreground"
            aria-hidden="true"
          />
        </div>

        {description && !error && (
          <p
            id={descriptionId}
            className="mt-1.5 text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="mt-1.5 text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

/**
 * Simple native select for inline use cases where a separate label exists
 */
export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Accessible label for screen readers */
  'aria-label': string;
  /** Options to render */
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, options, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  )
);
NativeSelect.displayName = 'NativeSelect';

export { Select, NativeSelect };
