import { isFirebaseConfigured } from '../firebase/env'
import type { EntryStore } from '../types'
import { createLocalStore } from './localStore'

let cached: EntryStore | null = null
let pending: Promise<EntryStore> | null = null

async function build(): Promise<EntryStore> {
  // لا يوجد سوى مسارين: مشروع Firebase الخاص بـ"مرصد"، أو التخزين المحلي.
  if (isFirebaseConfigured()) {
    try {
      // استيراد ديناميكي: لا تُحمَّل حزمة Firebase إطلاقًا في الوضع المحلي.
      const [{ getDb, resolveOwnerUid }, { createFirestoreStore }] = await Promise.all([
        import('../firebase/config'),
        import('./firestoreStore'),
      ])

      const db = getDb()
      const ownerUid = db ? await resolveOwnerUid() : null
      if (db && ownerUid) return createFirestoreStore(db, ownerUid)
    } catch (error) {
      // تعذّر الاتصال أو المصادقة — نُكمل محليًا بدل تعطيل اللوحة.
      console.warn('[مرصد] تعذّر تهيئة Firestore، سيعمل التطبيق محليًا.', error)
    }
  }
  return createLocalStore()
}

/** يهيّئ مصدر البيانات مرة واحدة لكل جلسة ويعيد النسخة نفسها لاحقًا. */
export function getEntryStore(): Promise<EntryStore> {
  if (cached) return Promise.resolve(cached)
  if (!pending) {
    pending = build().then((store) => {
      cached = store
      pending = null
      return store
    })
  }
  return pending
}

/** للاختبارات فقط: يُفرغ المصدر المحفوظ. */
export function resetEntryStore(): void {
  cached = null
  pending = null
}
