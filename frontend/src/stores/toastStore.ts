import { create } from 'zustand';
import { generateId } from '@/lib/utils';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions for common toast types
export const toast = {
  success: (message: string, title?: string) =>
    useToastStore.getState().addToast({ message, title, variant: 'success' }),

  error: (message: string, title?: string) =>
    useToastStore.getState().addToast({ message, title, variant: 'error' }),

  warning: (message: string, title?: string) =>
    useToastStore.getState().addToast({ message, title, variant: 'warning' }),

  info: (message: string, title?: string) =>
    useToastStore.getState().addToast({ message, title, variant: 'default' }),
};
