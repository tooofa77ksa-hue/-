import { useEffect, useId, useRef } from 'react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const baseId = useId()

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div className="overlay" role="presentation" onMouseDown={onCancel}>
      <div
        className="modal modal--narrow"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-heading`}
        aria-describedby={`${baseId}-body`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="modal__heading" id={`${baseId}-heading`}>
          {title}
        </h2>
        <p className="modal__body" id={`${baseId}-body`}>
          {message}
        </p>
        <div className="modal__actions">
          <button type="button" className="button button--ghost" onClick={onCancel}>
            إلغاء
          </button>
          <button
            type="button"
            ref={confirmRef}
            className="button button--danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'جارٍ التنفيذ…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
