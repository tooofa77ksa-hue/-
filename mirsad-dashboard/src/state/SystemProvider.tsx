import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { loadPersisted, savePersisted, storageMode } from '../data/persistence'
import { initialState } from '../data/store'
import type { SystemState } from '../domain/types'
import { ANONYMOUS, watchIdentity, type Identity } from '../firebase/auth'
import { SystemContext, type SyncStatus } from './SystemContext'

/**
 * مصدر الحالة الوحيد في التطبيق.
 *
 * في الوضع البعيد لا يُكتب شيء في localStorage إطلاقًا: قاعدة البيانات
 * هي المصدر، والمتصفّح مجرّد نافذة عليها. الحفظ يمرّ في طابور متسلسل
 * فلا تتسابق كتابتان على المستند نفسه، وأي إخفاق يُعرض للإدارة بنصّه
 * بدل أن يُبتلع ويوهمها أن العمل حُفظ.
 */
export function SystemProvider({ children }: { children: ReactNode }) {
  const mode = storageMode()
  const [state, setState] = useState<SystemState>(() => initialState())
  const [status, setStatus] = useState<SyncStatus>(mode === 'local' ? 'loading' : 'loading')
  const [identity, setIdentity] = useState<Identity>(ANONYMOUS)
  const [saving, setSaving] = useState(0)
  const [syncError, setSyncError] = useState<string | null>(null)

  /** آخر حالة وصلت إلى المصدر فعلًا — أساس حساب الفرق. */
  const persisted = useRef<SystemState | null>(null)
  /** طابور الحفظ: وعد متسلسل يمنع تسابق الكتابات. */
  const queue = useRef<Promise<unknown>>(Promise.resolve())

  const read = useCallback(async () => {
    setStatus('loading')
    setSyncError(null)
    try {
      const { state: loaded } = await loadPersisted()
      if (loaded) {
        setState(loaded)
        persisted.current = loaded
        setStatus('ready')
      } else {
        // قاعدة بيانات متصلة وفارغة: نعرض بيانات المصدر المستوردة
        // كمسوّدة، ولا نكتب شيئًا إلا بأمر صريح من الإدارة.
        persisted.current = null
        setStatus('empty')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setSyncError(message)
      setStatus(/permission|insufficient/i.test(message) ? 'denied' : 'error')
    }
  }, [])

  // مراقبة الهوية: الدور يقرّر ما يُسمح بقراءته من قاعدة البيانات
  useEffect(() => {
    if (mode === 'local') return
    let dispose = () => {}
    let alive = true
    watchIdentity((next) => {
      if (alive) setIdentity(next)
    }).then((fn) => {
      if (alive) dispose = fn
      else fn()
    })
    return () => {
      alive = false
      dispose()
    }
  }, [mode])

  // القراءة: محليًا فورًا، وبعيدًا بعد ثبوت صلاحية الإدارة
  useEffect(() => {
    if (mode === 'local') {
      void read()
      return
    }
    if (identity.role === 'admin') void read()
    else if (identity.role === 'respondent') setStatus('denied')
  }, [mode, identity.role, read])

  const enqueue = useCallback((next: SystemState) => {
    setSaving((n) => n + 1)
    queue.current = queue.current
      .then(async () => {
        const written = await savePersisted(persisted.current, next)
        persisted.current = next
        setSyncError(null)
        return written
      })
      .catch((error: unknown) => {
        // لا نحدّث persisted: المحاولة التالية ستعيد إرسال ما لم يصل.
        setSyncError(error instanceof Error ? error.message : String(error))
      })
      .finally(() => setSaving((n) => n - 1))
  }, [])

  const commit = useCallback((next: SystemState) => {
    setState(next)
    // في الوضع البعيد قبل الرفع الأوّلي لا نكتب: الإدارة ترفع صراحةً.
    if (storageMode() === 'remote' && persisted.current === null) return
    enqueue(next)
  }, [enqueue])

  const apply = useCallback((fn: (s: SystemState) => SystemState) => {
    setState((prev) => {
      const next = fn(prev)
      if (storageMode() === 'local' || persisted.current !== null) enqueue(next)
      return next
    })
  }, [enqueue])

  const replace = useCallback((next: SystemState) => commit(next), [commit])

  const seedRemote = useCallback(async (source: SystemState) => {
    setSaving((n) => n + 1)
    try {
      const written = await savePersisted(null, source)
      persisted.current = source
      setState(source)
      setStatus('ready')
      setSyncError(null)
      return written
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : String(error))
      throw error
    } finally {
      setSaving((n) => n - 1)
    }
  }, [])

  const value = useMemo(
    () => ({ state, apply, replace, mode, status, identity, saving, syncError, reload: read, seedRemote }),
    [state, apply, replace, mode, status, identity, saving, syncError, read, seedRemote],
  )
  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
}
