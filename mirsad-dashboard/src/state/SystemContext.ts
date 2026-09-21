import { createContext } from 'react'

import type { StorageMode } from '../data/persistence'
import type { Identity } from '../firebase/auth'
import type { SystemState } from '../domain/types'

/** حالة الاتصال بمصدر البيانات، كما تُعرض للإدارة بصراحة. */
export type SyncStatus =
  | 'loading'   // جارٍ القراءة
  | 'ready'     // البيانات محمّلة
  | 'empty'     // قاعدة البيانات متصلة لكنها فارغة: تحتاج رفعًا أوّليًا
  | 'denied'    // متصلة لكن الحساب الحالي بلا صلاحية إدارة
  | 'error'     // تعذّرت القراءة

export interface SystemContextValue {
  state: SystemState
  /** يطبّق تحويلًا على الحالة ويحفظها. */
  apply: (fn: (state: SystemState) => SystemState) => void
  /** يستبدل الحالة كاملة (يُستخدم بعد عملية تُعيد حالة جديدة). */
  replace: (state: SystemState) => void

  /** أين تُحفظ البيانات فعلًا: متصفّح واحد أم قاعدة بيانات. */
  mode: StorageMode
  status: SyncStatus
  identity: Identity
  /** عدد عمليات الحفظ الجارية الآن — تُعرض للإدارة كي لا تغلق الصفحة. */
  saving: number
  /** آخر خطأ حفظ أو قراءة، بنصّه، دون إخفائه. */
  syncError: string | null
  /** إعادة القراءة من المصدر. */
  reload: () => Promise<void>
  /** رفع الحالة الحالية إلى قاعدة البيانات لأول مرة. */
  seedRemote: (state: SystemState) => Promise<number>
}

export const SystemContext = createContext<SystemContextValue | null>(null)
