import { useState, useEffect, useCallback } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from './Button';
import { FocusTrap } from './Accessibility';
import { cn } from '@/lib/utils';

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Tab'], description: 'Move to next interactive element' },
      { keys: ['Shift', 'Tab'], description: 'Move to previous interactive element' },
      { keys: ['Enter', 'Space'], description: 'Activate focused button or link' },
      { keys: ['Esc'], description: 'Close modal, dropdown, or dialog' },
      { keys: ['↑', '↓'], description: 'Navigate within menus and lists' },
      { keys: ['Home'], description: 'Go to first item in list' },
      { keys: ['End'], description: 'Go to last item in list' },
    ],
  },
  {
    title: 'Video Player',
    shortcuts: [
      { keys: ['Space'], description: 'Play/Pause video' },
      { keys: ['←', '→'], description: 'Seek backward/forward 5 seconds' },
      { keys: ['↑', '↓'], description: 'Increase/decrease volume' },
      { keys: ['M'], description: 'Mute/unmute' },
      { keys: ['F'], description: 'Toggle fullscreen' },
      { keys: ['C'], description: 'Toggle captions' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Open keyboard shortcuts (this dialog)' },
      { keys: ['/', 'Ctrl', 'K'], description: 'Focus search (when available)' },
      { keys: ['G', 'H'], description: 'Go to home/dashboard' },
      { keys: ['G', 'U'], description: 'Go to upload page' },
      { keys: ['G', 'V'], description: 'Go to videos page' },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: KeyboardShortcutsDialogProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <FocusTrap active={isOpen}>
        <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-background shadow-lg">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between border-b bg-background px-6 py-4">
            <div className="flex items-center gap-3">
              <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="keyboard-shortcuts-title" className="text-lg font-semibold">
                Keyboard Shortcuts
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close keyboard shortcuts dialog"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {shortcutGroups.map((group) => (
              <section key={group.title} aria-labelledby={`group-${group.title}`}>
                <h3
                  id={`group-${group.title}`}
                  className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4"
                >
                  {group.title}
                </h3>
                <div className="space-y-3">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd
                              className={cn(
                                'inline-flex items-center justify-center',
                                'min-w-[2rem] px-2 py-1',
                                'rounded border bg-muted',
                                'text-xs font-mono font-medium',
                                'shadow-sm'
                              )}
                            >
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-xs" aria-hidden="true">
                                +
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4">
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 rounded border bg-muted text-xs font-mono">?</kbd> anywhere to open this dialog
            </p>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}

/**
 * Hook to manage keyboard shortcuts dialog state and global keyboard listener
 */
export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (event.key === '?' && !isInputFocused) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

/**
 * Keyboard shortcuts button to trigger the dialog
 */
export function KeyboardShortcutsButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('gap-2', className)}
      aria-label="Open keyboard shortcuts"
    >
      <Keyboard className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Shortcuts</span>
      <kbd className="hidden sm:inline px-1.5 py-0.5 rounded border bg-muted text-xs font-mono">
        ?
      </kbd>
    </Button>
  );
}
