import type { Entry, EntryDraft, EntryStore } from '../types'
import { seedEntries } from './seed'

const STORAGE_KEY = 'mirsad.dashboard.entries.v1'

/** واجهة مصغّرة تكفي لحقن بديل للاختبارات. */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** تخزين في الذاكرة — يُستخدم عندما يكون localStorage غير متاح أو محجوبًا. */
export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
  }
}

function resolveStorage(): KeyValueStorage {
  try {
    const probe = '__mirsad_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    // وضع التصفح الخاص أو حجب ملفات الموقع.
    return createMemoryStorage()
  }
}

function isEntry(value: unknown): value is Entry {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Record<string, unknown>
  return (
    typeof row.id === 'string' &&
    typeof row.title === 'string' &&
    typeof row.category === 'string' &&
    typeof row.amount === 'number' &&
    typeof row.updatedAt === 'number'
  )
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function sanitize(draft: EntryDraft): EntryDraft {
  return {
    title: draft.title.trim(),
    category: draft.category.trim(),
    status: draft.status,
    amount: Number.isFinite(draft.amount) ? draft.amount : 0,
    notes: draft.notes.trim(),
  }
}

/**
 * تخزين محلي كامل الوظائف يعمل دون أي اتصال بالشبكة.
 * هو الوضع الافتراضي حتى تُضبط مفاتيح Firebase الخاصة بهذا المشروع.
 */
export function createLocalStore(storage: KeyValueStorage = resolveStorage()): EntryStore {
  function readAll(): Entry[] {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) {
      const seeded = seedEntries()
      writeAll(seeded)
      return seeded
    }
    try {
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter(isEntry) : []
    } catch {
      return []
    }
  }

  function writeAll(entries: Entry[]): void {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }

  return {
    mode: 'local',

    async list() {
      return readAll().sort((a, b) => b.updatedAt - a.updatedAt)
    },

    async create(draft) {
      const now = Date.now()
      const entry: Entry = {
        id: newId(),
        ownerUid: 'local-user',
        createdAt: now,
        updatedAt: now,
        ...sanitize(draft),
      }
      writeAll([entry, ...readAll()])
      return entry
    },

    async update(id, draft) {
      const entries = readAll()
      const index = entries.findIndex((entry) => entry.id === id)
      if (index === -1) throw new Error(`لا يوجد سجل بالمعرّف ${id}`)

      const updated: Entry = { ...entries[index], ...sanitize(draft), updatedAt: Date.now() }
      entries[index] = updated
      writeAll(entries)
      return updated
    },

    async remove(id) {
      const entries = readAll()
      const remaining = entries.filter((entry) => entry.id !== id)
      if (remaining.length === entries.length) throw new Error(`لا يوجد سجل بالمعرّف ${id}`)
      writeAll(remaining)
    },
  }
}
