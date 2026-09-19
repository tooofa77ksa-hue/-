import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'

import { ENTRIES_COLLECTION } from '../firebase/config'
import type { Entry, EntryDraft, EntryStore } from '../types'
import { ENTRY_STATUSES } from '../types'

function toMillis(value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as { toMillis(): number }).toMillis()
  }
  return 0
}

function toEntry(snapshot: QueryDocumentSnapshot<DocumentData>): Entry {
  const data = snapshot.data()
  const status = ENTRY_STATUSES.includes(data.status) ? data.status : 'pending'

  return {
    id: snapshot.id,
    title: typeof data.title === 'string' ? data.title : '',
    category: typeof data.category === 'string' ? data.category : '',
    status,
    amount: typeof data.amount === 'number' ? data.amount : 0,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    notes: typeof data.notes === 'string' ? data.notes : '',
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  }
}

function sanitize(draft: EntryDraft) {
  return {
    title: draft.title.trim(),
    category: draft.category.trim(),
    status: draft.status,
    amount: Number.isFinite(draft.amount) ? draft.amount : 0,
    notes: draft.notes.trim(),
  }
}

/**
 * طبقة Firestore الخاصة بمشروع "مرصد".
 * تعمل حصرًا على قاعدة بيانات مشروع Firebase المعرّف في .firebaserc
 * داخل هذا المجلد، وعلى مجموعة entries وحدها.
 */
export function createFirestoreStore(db: Firestore, ownerUid: string): EntryStore {
  const entriesRef = collection(db, ENTRIES_COLLECTION)

  return {
    mode: 'firestore',

    async list() {
      const snapshot = await getDocs(query(entriesRef, orderBy('updatedAt', 'desc')))
      return snapshot.docs.map(toEntry)
    },

    async create(draft) {
      const now = Date.now()
      const payload = { ...sanitize(draft), ownerUid, createdAt: now, updatedAt: now }
      const created = await addDoc(entriesRef, payload)
      return { id: created.id, ...payload }
    },

    async update(id, draft) {
      const ref = doc(db, ENTRIES_COLLECTION, id)
      const payload = { ...sanitize(draft), updatedAt: Date.now() }
      await updateDoc(ref, payload)

      const fresh = await getDoc(ref)
      if (!fresh.exists()) throw new Error(`لا يوجد سجل بالمعرّف ${id}`)
      return toEntry(fresh as QueryDocumentSnapshot<DocumentData>)
    },

    async remove(id) {
      await deleteDoc(doc(db, ENTRIES_COLLECTION, id))
    },
  }
}
