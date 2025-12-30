/**
 * Toast Store (Zustand)
 *
 * AIDEV-NOTE: Manages toast notification state.
 * Toasts are temporary messages shown to the user for feedback.
 *
 * Features:
 * - Multiple toast variants (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Manual dismiss
 * - Stack of toasts (newest on top)
 *
 * Integration with verboseExceptions setting:
 * - When verboseExceptions is true, error toasts show full stack trace
 * - When false, show only the error message
 */

import { create } from 'zustand';
import { getAdvancedSettings } from './appStore';

// ============================================================================
// Types
// ============================================================================

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  /** Unique ID for the toast */
  id: string;
  /** Toast message */
  message: string;
  /** Optional detailed description (shown when verboseExceptions is enabled) */
  details?: string;
  /** Toast variant/type */
  variant: ToastVariant;
  /** Duration in milliseconds (0 = no auto-dismiss) */
  duration: number;
  /** Timestamp when toast was created */
  createdAt: number;
}

export interface ToastOptions {
  /** Toast message */
  message: string;
  /** Optional detailed description */
  details?: string;
  /** Toast variant (default: 'info') */
  variant?: ToastVariant;
  /** Duration in milliseconds (default: 5000, 0 = no auto-dismiss) */
  duration?: number;
}

interface ToastState {
  /** Active toasts */
  toasts: Toast[];

  /** Add a toast notification */
  addToast: (options: ToastOptions) => string;

  /** Remove a toast by ID */
  removeToast: (id: string) => void;

  /** Clear all toasts */
  clearToasts: () => void;

  /** Convenience methods */
  success: (message: string, details?: string) => string;
  error: (message: string, details?: string) => string;
  warning: (message: string, details?: string) => string;
  info: (message: string, details?: string) => string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DURATION = 5000; // 5 seconds
const ERROR_DURATION = 8000; // 8 seconds for errors
const MAX_TOASTS = 5; // Maximum number of toasts to show at once

let toastIdCounter = 0;

function generateToastId(): string {
  return `toast-${++toastIdCounter}-${Date.now()}`;
}

// ============================================================================
// Store
// ============================================================================

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  addToast: (options) => {
    const id = generateToastId();
    const variant = options.variant ?? 'info';
    const duration = options.duration ?? (variant === 'error' ? ERROR_DURATION : DEFAULT_DURATION);

    const toast: Toast = {
      id,
      message: options.message,
      details: options.details,
      variant,
      duration,
      createdAt: Date.now(),
    };

    set((state) => {
      // Keep only the most recent toasts
      const newToasts = [toast, ...state.toasts].slice(0, MAX_TOASTS);
      return { toasts: newToasts };
    });

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Convenience methods
  success: (message, details) => {
    return get().addToast({ message, details, variant: 'success' });
  },

  error: (message, details) => {
    return get().addToast({ message, details, variant: 'error' });
  },

  warning: (message, details) => {
    return get().addToast({ message, details, variant: 'warning' });
  },

  info: (message, details) => {
    return get().addToast({ message, details, variant: 'info' });
  },
}));

// ============================================================================
// Non-hook Accessors (for use outside React components)
// ============================================================================

/**
 * Show a toast notification (can be used outside React components)
 */
export function showToast(options: ToastOptions): string {
  return useToastStore.getState().addToast(options);
}

/**
 * Show an error toast, respecting verboseExceptions setting
 * AIDEV-NOTE: This is the main function to use for error handling
 *
 * @param message - User-friendly error message
 * @param error - Optional Error object or string with details
 */
export function showErrorToast(message: string, error?: Error | string): string {
  const advancedSettings = getAdvancedSettings();
  let details: string | undefined;

  if (error) {
    if (advancedSettings.verboseExceptions) {
      // Show full details when verbose mode is enabled
      if (error instanceof Error) {
        details = error.stack ?? error.message;
      } else {
        details = error;
      }
    }
    // When verbose is off, we just show the message without details
  }

  return useToastStore.getState().error(message, details);
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string): string {
  return useToastStore.getState().success(message);
}

/**
 * Show a warning toast
 */
export function showWarningToast(message: string, details?: string): string {
  return useToastStore.getState().warning(message, details);
}

/**
 * Show an info toast
 */
export function showInfoToast(message: string): string {
  return useToastStore.getState().info(message);
}
