import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { emptyDraft, isValid, validateDraft, type FieldErrors } from '../lib/validate'
import { ENTRY_STATUSES, STATUS_LABELS, type Entry, type EntryDraft } from '../types'

interface EntryFormProps {
  /** السجل قيد التعديل، أو null لإنشاء سجل جديد. */
  entry: Entry | null
  saving: boolean
  onSubmit: (draft: EntryDraft) => void
  onCancel: () => void
}

function draftFrom(entry: Entry | null): EntryDraft {
  if (!entry) return emptyDraft()
  return {
    title: entry.title,
    category: entry.category,
    status: entry.status,
    amount: entry.amount,
    notes: entry.notes,
  }
}

export function EntryForm({ entry, saving, onSubmit, onCancel }: EntryFormProps) {
  const [draft, setDraft] = useState<EntryDraft>(() => draftFrom(entry))
  const [touched, setTouched] = useState(false)
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const baseId = useId()

  useEffect(() => {
    setDraft(draftFrom(entry))
    setTouched(false)
  }, [entry])

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  const errors: FieldErrors = useMemo(() => validateDraft(draft), [draft])
  const showError = (field: keyof EntryDraft) => (touched ? errors[field] : undefined)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!isValid(errors)) return
    onSubmit(draft)
  }

  return (
    <div className="overlay" role="presentation" onMouseDown={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-heading`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="modal__heading" id={`${baseId}-heading`}>
          {entry ? 'تعديل السجل' : 'سجل جديد'}
        </h2>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor={`${baseId}-title`}>
              العنوان <span aria-hidden="true">*</span>
            </label>
            <input
              id={`${baseId}-title`}
              ref={firstFieldRef}
              className="input"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              aria-invalid={showError('title') ? true : undefined}
              aria-describedby={showError('title') ? `${baseId}-title-error` : undefined}
            />
            {showError('title') && (
              <p className="field__error" id={`${baseId}-title-error`}>
                {errors.title}
              </p>
            )}
          </div>

          <div className="form__row">
            <div className="field">
              <label className="field__label" htmlFor={`${baseId}-category`}>
                التصنيف
              </label>
              <input
                id={`${baseId}-category`}
                className="input"
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                placeholder="مثال: عمليات"
              />
              {showError('category') && <p className="field__error">{errors.category}</p>}
            </div>

            <div className="field">
              <label className="field__label" htmlFor={`${baseId}-status`}>
                الحالة
              </label>
              <select
                id={`${baseId}-status`}
                className="input"
                value={draft.status}
                onChange={(event) =>
                  setDraft({ ...draft, status: event.target.value as EntryDraft['status'] })
                }
              >
                {ENTRY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor={`${baseId}-amount`}>
                القيمة
              </label>
              <input
                id={`${baseId}-amount`}
                className="input"
                type="number"
                min={0}
                step="0.01"
                value={Number.isFinite(draft.amount) ? draft.amount : 0}
                onChange={(event) =>
                  setDraft({ ...draft, amount: event.target.valueAsNumber })
                }
                aria-invalid={showError('amount') ? true : undefined}
              />
              {showError('amount') && <p className="field__error">{errors.amount}</p>}
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor={`${baseId}-notes`}>
              ملاحظات
            </label>
            <textarea
              id={`${baseId}-notes`}
              className="input input--area"
              rows={3}
              value={draft.notes}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            />
            {showError('notes') && <p className="field__error">{errors.notes}</p>}
          </div>

          <div className="modal__actions">
            <button type="button" className="button button--ghost" onClick={onCancel}>
              إلغاء
            </button>
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? 'جارٍ الحفظ…' : entry ? 'حفظ التعديلات' : 'إضافة السجل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
