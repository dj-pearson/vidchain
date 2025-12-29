import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore, type Toast as ToastType } from '@/stores/toastStore';

interface ToastProps {
  toast: ToastType;
  onClose: () => void;
}

const variantStyles = {
  default: 'bg-card border-border text-card-foreground',
  success: 'bg-success/10 border-success/30 text-success',
  error: 'bg-destructive/10 border-destructive/30 text-destructive',
  warning: 'bg-warning/10 border-warning/30 text-warning',
};

const variantIcons = {
  default: Info,
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
};

function ToastItem({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);

  React.useEffect(() => {
    // Trigger enter animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, toast.duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 200);
  };

  const Icon = variantIcons[toast.variant];

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-200',
        variantStyles[toast.variant],
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        {toast.title && (
          <p className="text-sm font-semibold">{toast.title}</p>
        )}
        <p className={cn('text-sm', toast.title ? 'opacity-90' : '')}>{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen flex-col gap-2 p-4 sm:bottom-4 sm:right-4 sm:max-w-sm">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Hook for using toast in components
export function useToast() {
  const { addToast, removeToast, clearToasts } = useToastStore();

  return {
    toast: {
      success: (message: string, title?: string) =>
        addToast({ message, title, variant: 'success' }),
      error: (message: string, title?: string) =>
        addToast({ message, title, variant: 'error' }),
      warning: (message: string, title?: string) =>
        addToast({ message, title, variant: 'warning' }),
      info: (message: string, title?: string) =>
        addToast({ message, title, variant: 'default' }),
    },
    dismiss: removeToast,
    clearAll: clearToasts,
  };
}

export { ToastItem };
