import { beforeEach, describe, expect, it } from 'vitest'

import { createLocalStore, createMemoryStorage, type KeyValueStorage } from '../data/localStore'
import type { EntryDraft, EntryStore } from '../types'

function draft(overrides: Partial<EntryDraft> = {}): EntryDraft {
  return { title: 'سجل تجريبي', category: 'عام', status: 'pending', amount: 250, notes: '', ...overrides }
}

describe('createLocalStore', () => {
  let storage: KeyValueStorage
  let store: EntryStore

  beforeEach(() => {
    storage = createMemoryStorage()
    store = createLocalStore(storage)
  })

  it('يعلن أن وضعه محلي', () => {
    expect(store.mode).toBe('local')
  })

  it('يزرع بيانات أولية عند أول قراءة', async () => {
    const entries = await store.list()
    expect(entries.length).toBeGreaterThan(0)
  })

  it('يضيف سجلًا جديدًا بمعرّف وطوابع زمنية', async () => {
    const created = await store.create(draft({ title: 'بند جديد' }))

    expect(created.id).toBeTruthy()
    expect(created.title).toBe('بند جديد')
    expect(created.createdAt).toBeGreaterThan(0)
    expect(created.updatedAt).toBe(created.createdAt)

    const entries = await store.list()
    expect(entries.some((entry) => entry.id === created.id)).toBe(true)
  })

  it('يقلّم المسافات الزائدة قبل الحفظ', async () => {
    const created = await store.create(draft({ title: '  بند  ', category: '  مالية  ' }))
    expect(created.title).toBe('بند')
    expect(created.category).toBe('مالية')
  })

  it('يعدّل سجلًا قائمًا', async () => {
    const created = await store.create(draft({ title: 'قبل' }))
    const updated = await store.update(created.id, draft({ title: 'بعد', status: 'active' }))

    expect(updated.id).toBe(created.id)
    expect(updated.title).toBe('بعد')
    expect(updated.status).toBe('active')
    expect(updated.createdAt).toBe(created.createdAt)
  })

  it('يرفض تعديل معرّف غير موجود', async () => {
    await expect(store.update('لا-يوجد', draft())).rejects.toThrow()
  })

  it('يحذف سجلًا', async () => {
    const created = await store.create(draft())
    await store.remove(created.id)

    const entries = await store.list()
    expect(entries.some((entry) => entry.id === created.id)).toBe(false)
  })

  it('يرفض حذف معرّف غير موجود', async () => {
    await expect(store.remove('لا-يوجد')).rejects.toThrow()
  })

  it('يبقي البيانات بين نسختين تتشاركان التخزين نفسه', async () => {
    const created = await store.create(draft({ title: 'باقٍ' }))

    const reopened = createLocalStore(storage)
    const entries = await reopened.list()

    expect(entries.some((entry) => entry.id === created.id)).toBe(true)
  })

  it('يرتّب النتائج من الأحدث إلى الأقدم', async () => {
    const entries = await store.list()
    const timestamps = entries.map((entry) => entry.updatedAt)
    expect([...timestamps].sort((a, b) => b - a)).toEqual(timestamps)
  })

  it('يتعافى من محتوى تخزين تالف', async () => {
    const broken = createMemoryStorage()
    broken.setItem('mirsad.dashboard.entries.v1', '{ليس JSON صالحًا')

    const recovered = createLocalStore(broken)
    await expect(recovered.list()).resolves.toEqual([])
  })
})
