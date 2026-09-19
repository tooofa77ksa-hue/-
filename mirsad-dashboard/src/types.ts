/** حالات السجل المتاحة في لوحة التحكم. */
export type EntryStatus = 'active' | 'pending' | 'archived'

export const ENTRY_STATUSES: readonly EntryStatus[] = ['active', 'pending', 'archived']

export const STATUS_LABELS: Record<EntryStatus, string> = {
  active: 'نشط',
  pending: 'قيد المراجعة',
  archived: 'مؤرشف',
}

/** سجل واحد داخل لوحة التحكم. */
export interface Entry {
  id: string
  title: string
  category: string
  status: EntryStatus
  amount: number
  ownerUid: string
  notes: string
  createdAt: number
  updatedAt: number
}

/** الحقول التي يحرّرها المستخدم في النموذج. */
export type EntryDraft = Pick<Entry, 'title' | 'category' | 'status' | 'amount' | 'notes'>

/** مصدر البيانات الفعلي الذي يعمل عليه التطبيق حاليًا. */
export type StorageMode = 'firestore' | 'local'

/**
 * العقد الذي تلتزم به كل طبقات التخزين.
 * يسمح بتبديل Firestore بالتخزين المحلي دون أي تغيير في الواجهة.
 */
export interface EntryStore {
  readonly mode: StorageMode
  list(): Promise<Entry[]>
  create(draft: EntryDraft): Promise<Entry>
  update(id: string, draft: EntryDraft): Promise<Entry>
  remove(id: string): Promise<void>
}
