/**
 * Toast Components
 *
 * AIDEV-NOTE: Toast notification system for user feedback.
 * Uses a portal to render outside the normal DOM hierarchy.
 *
 * Components:
 * - Toast: Individual toast notification
 * - ToastContainer: Container that renders all active toasts
 */

import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { cn } from '../../lib/utils';
import { type Toast as ToastType, type ToastVariant, useToastStore } from '../../store/toastStore';
import { useAdvancedSettings } from '../../store/appStore';

// ============================================================================
// Toast Component
// ============================================================================

interface ToastProps {
  toast: ToastType;
  onDismiss: () => void;
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-500/10 border-green-500/50 text-green-500',
  error: 'bg-red-500/10 border-red-500/50 text-red-500',
  warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500',
  info: 'bg-blue-500/10 border-blue-500/50 text-blue-500',
};

const variantIcons: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

function Toast({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const advancedSettings = useAdvancedSettings();

  const Icon = variantIcons[toast.variant];

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation before removing
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  // Auto-dismiss progress (visual feedback)
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration <= 0) return;

    const startTime = toast.createdAt;
    const endTime = startTime + toast.duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const pct = (remaining / toast.duration) * 100;
      setProgress(pct);

      if (pct > 0) {
        requestAnimationFrame(updateProgress);
      }
    };

    const animationId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationId);
  }, [toast.duration, toast.createdAt]);

  // Should we show details toggle?
  const hasDetails = toast.details && advancedSettings.verboseExceptions;

  return (
    <div
      className={cn(
        'relative flex w-full max-w-sm flex-col rounded-lg border p-4 shadow-lg backdrop-blur-sm',
        'transition-all duration-200',
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
        variantStyles[toast.variant]
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{toast.message}</p>

          {hasDetails && (
            <button
              type="button"
              className="mt-1 text-xs underline opacity-70 hover:opacity-100"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          )}

          {showDetails && toast.details && (
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-black/20 p-2 text-xs font-mono whitespace-pre-wrap break-words">
              {toast.details}
            </pre>
          )}
        </div>

        <button
          type="button"
          className="flex-shrink-0 rounded p-1 opacity-70 hover:opacity-100 hover:bg-foreground/10"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg">
          <div
            className={cn(
              'h-full transition-all duration-100',
              toast.variant === 'success' && 'bg-green-500',
              toast.variant === 'error' && 'bg-red-500',
              toast.variant === 'warning' && 'bg-yellow-500',
              toast.variant === 'info' && 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ToastContainer Component
// ============================================================================

/**
 * Container that renders all active toasts.
 * Should be placed at the root of the app (e.g., in App.tsx).
 */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <section
      className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </section>
  );
}

export default ToastContainer;
