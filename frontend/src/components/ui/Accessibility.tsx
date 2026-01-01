import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * SkipLink - Allows keyboard users to skip navigation and jump to main content
 * Becomes visible when focused, hidden otherwise
 */
export function SkipLink({
  href = '#main-content',
  children = 'Skip to main content',
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:fixed focus:left-4 focus:top-4 focus:z-50',
        'focus:rounded-md focus:bg-primary focus:px-4 focus:py-2',
        'focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring'
      )}
    >
      {children}
    </a>
  );
}

/**
 * VisuallyHidden - Hides content visually but keeps it accessible to screen readers
 */
export function VisuallyHidden({
  children,
  as: Component = 'span',
}: {
  children: React.ReactNode;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'label';
}) {
  return <Component className="sr-only">{children}</Component>;
}

/**
 * FocusTrap - Traps focus within a container (useful for modals, dialogs)
 */
export function FocusTrap({
  children,
  active = true,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    firstElement?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

/**
 * LiveRegion - Announces dynamic content changes to screen readers
 */
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  className,
}: {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

/**
 * AnnouncementRegion - For screen reader announcements that should be visible
 */
export function AnnouncementRegion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * KeyboardShortcutHint - Displays keyboard shortcut hints
 */
export function KeyboardShortcutHint({
  shortcut,
  description,
  className,
}: {
  shortcut: string;
  description: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">
        {shortcut}
      </kbd>
      <span className="sr-only">{description}</span>
    </span>
  );
}

/**
 * MainContent - Wrapper for main content with proper landmark
 */
export function MainContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn('outline-none', className)}
      aria-label="Main content"
    >
      {children}
    </main>
  );
}

/**
 * useAnnounce - Hook for making screen reader announcements
 */
export function useAnnounce() {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcement element if it doesn't exist
    let element = document.getElementById('sr-announcements') as HTMLDivElement | null;
    if (!element) {
      element = document.createElement('div');
      element.id = 'sr-announcements';
      element.setAttribute('role', 'status');
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
      element.className = 'sr-only';
      document.body.appendChild(element);
    }
    announceRef.current = element;

    return () => {
      // Don't remove on unmount as other components might use it
    };
  }, []);

  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', politeness);
      // Clear and set with delay to ensure announcement
      announceRef.current.textContent = '';
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = message;
        }
      }, 100);
    }
  };

  return announce;
}

/**
 * ReducedMotion - Respects user's reduced motion preferences
 */
export function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * FormFieldDescription - Accessible form field description
 */
export function FormFieldDescription({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      id={id}
      className={cn('text-sm text-muted-foreground', className)}
    >
      {children}
    </p>
  );
}

/**
 * FormFieldError - Accessible form field error message
 */
export function FormFieldError({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      id={id}
      role="alert"
      className={cn('text-sm text-destructive', className)}
    >
      {children}
    </p>
  );
}
