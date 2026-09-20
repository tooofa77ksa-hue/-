import { useContext } from 'react'

import { SystemContext, type SystemContextValue } from './SystemContext'

export function useSystem(): SystemContextValue {
  const ctx = useContext(SystemContext)
  if (!ctx) throw new Error('useSystem يجب أن يُستخدم داخل SystemProvider')
  return ctx
}
