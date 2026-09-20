import { createContext } from 'react'

import type { SystemState } from '../domain/types'

export interface SystemContextValue {
  state: SystemState
  /** يطبّق تحويلًا على الحالة ويحفظها. */
  apply: (fn: (state: SystemState) => SystemState) => void
  /** يستبدل الحالة كاملة (يُستخدم بعد عملية تُعيد حالة جديدة). */
  replace: (state: SystemState) => void
}

export const SystemContext = createContext<SystemContextValue | null>(null)
