import { useCallback, useEffect, useRef, useState } from 'react'

import { getEntryStore } from '../data/repository'
import type { Entry, EntryDraft, StorageMode } from '../types'

interface EntriesState {
  entries: Entry[]
  mode: StorageMode
  loading: boolean
  error: string | null
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
}

/** يدير دورة حياة السجلات: التحميل، الإضافة، التعديل، الحذف. */
export function useEntries() {
  const [state, setState] = useState<EntriesState>({
    entries: [],
    mode: 'local',
    loading: true,
    error: null,
  })

  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const store = await getEntryStore()
      const entries = await store.list()
      if (!alive.current) return
      setState({ entries, mode: store.mode, loading: false, error: null })
    } catch (error) {
      if (!alive.current) return
      setState((prev) => ({ ...prev, loading: false, error: messageOf(error) }))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(async (draft: EntryDraft) => {
    const store = await getEntryStore()
    const created = await store.create(draft)
    if (alive.current) {
      setState((prev) => ({ ...prev, entries: [created, ...prev.entries] }))
    }
    return created
  }, [])

  const update = useCallback(async (id: string, draft: EntryDraft) => {
    const store = await getEntryStore()
    const updated = await store.update(id, draft)
    if (alive.current) {
      setState((prev) => ({
        ...prev,
        entries: prev.entries.map((entry) => (entry.id === id ? updated : entry)),
      }))
    }
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    const store = await getEntryStore()
    await store.remove(id)
    if (alive.current) {
      setState((prev) => ({ ...prev, entries: prev.entries.filter((entry) => entry.id !== id) }))
    }
  }, [])

  return { ...state, refresh, create, update, remove }
}
