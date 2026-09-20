import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { loadState, saveState } from '../data/store'
import type { SystemState } from '../domain/types'
import { SystemContext } from './SystemContext'

export function SystemProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SystemState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const apply = useCallback((fn: (s: SystemState) => SystemState) => {
    setState((prev) => fn(prev))
  }, [])

  const replace = useCallback((next: SystemState) => setState(next), [])

  const value = useMemo(() => ({ state, apply, replace }), [state, apply, replace])
  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
}
