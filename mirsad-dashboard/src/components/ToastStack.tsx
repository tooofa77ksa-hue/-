import type { Toast } from '../hooks/useToasts'

interface ToastStackProps {
  toasts: readonly Toast[]
  onDismiss: (id: number) => void
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`}>
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => onDismiss(toast.id)}
            aria-label="إغلاق التنبيه"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
