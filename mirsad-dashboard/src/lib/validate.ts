import { ENTRY_STATUSES, type EntryDraft } from '../types'

export type FieldErrors = Partial<Record<keyof EntryDraft, string>>

export const MAX_TITLE = 120
export const MAX_CATEGORY = 60
export const MAX_NOTES = 1000

/**
 * يتحقق من المسودة قبل الحفظ، بنفس الحدود التي تفرضها قواعد
 * Firestore في firestore.rules — حتى لا ينجح الحفظ محليًا ثم يُرفض على الخادم.
 */
export function validateDraft(draft: EntryDraft): FieldErrors {
  const errors: FieldErrors = {}

  const title = draft.title.trim()
  if (!title) errors.title = 'العنوان مطلوب'
  else if (title.length > MAX_TITLE) errors.title = `العنوان يتجاوز ${MAX_TITLE} حرفًا`

  if (draft.category.trim().length > MAX_CATEGORY) {
    errors.category = `التصنيف يتجاوز ${MAX_CATEGORY} حرفًا`
  }

  if (!ENTRY_STATUSES.includes(draft.status)) errors.status = 'حالة غير معروفة'

  if (!Number.isFinite(draft.amount)) errors.amount = 'القيمة يجب أن تكون رقمًا'
  else if (draft.amount < 0) errors.amount = 'القيمة لا يمكن أن تكون سالبة'

  if (draft.notes.length > MAX_NOTES) errors.notes = `الملاحظات تتجاوز ${MAX_NOTES} حرفًا`

  return errors
}

export function isValid(errors: FieldErrors): boolean {
  return Object.keys(errors).length === 0
}

/** مسودة فارغة لفتح نموذج "سجل جديد". */
export function emptyDraft(): EntryDraft {
  return { title: '', category: '', status: 'pending', amount: 0, notes: '' }
}
