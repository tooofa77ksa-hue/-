import { isFirebaseConfigured } from '../firebase/env'
import type { SystemState } from '../domain/types'
import { loadState, saveState } from './store'
import { loadRemoteState, persistRemote } from './remote/firestoreRepo'

/**
 * أين تُحفظ البيانات فعلًا.
 *
 * `local`  — متصفّح واحد فقط (localStorage). مناسب للتجربة على جهاز
 *            واحد، وغير مقبول بعد النشر: لا يُشارَك ولا يُنسخ ولا
 *            تحكمه صلاحيات.
 * `remote` — Firestore: قاعدة بيانات فعلية تحكمها firestore.rules،
 *            تُقرأ من أي جهاز وتُحفظ خارج المتصفّح.
 *
 * الاختيار ليس إعدادًا يدويًا بل نتيجة اكتمال متغيّرات Firebase، حتى
 * لا يمكن نشر النسخة وهي تظن أنها متصلة وهي ليست كذلك.
 */
export type StorageMode = 'local' | 'remote'

export function storageMode(): StorageMode {
  return isFirebaseConfigured() ? 'remote' : 'local'
}

export interface LoadResult {
  mode: StorageMode
  /** الحالة المقروءة، أو null في الوضع البعيد قبل رفع البيانات. */
  state: SystemState | null
}

/** يقرأ الحالة من مصدرها الفعلي حسب الوضع. */
export async function loadPersisted(): Promise<LoadResult> {
  const mode = storageMode()
  if (mode === 'local') return { mode, state: loadState() }
  return { mode, state: await loadRemoteState() }
}

/** يحفظ ما تغيّر بين حالتين. يُعيد عدد المستندات المكتوبة. */
export async function savePersisted(
  prev: SystemState | null,
  next: SystemState,
): Promise<number> {
  if (storageMode() === 'local') {
    saveState(next)
    return 1
  }
  return persistRemote(prev, next)
}
