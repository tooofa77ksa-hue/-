import { describe, expect, it } from 'vitest'

import { emptyDraft, isValid, MAX_NOTES, MAX_TITLE, validateDraft } from '../lib/validate'
import type { EntryDraft } from '../types'

function draft(overrides: Partial<EntryDraft> = {}): EntryDraft {
  return { ...emptyDraft(), title: 'عنوان صالح', ...overrides }
}

describe('validateDraft', () => {
  it('يقبل مسودة صحيحة', () => {
    expect(isValid(validateDraft(draft()))).toBe(true)
  })

  it('يرفض العنوان الفارغ', () => {
    expect(validateDraft(draft({ title: '   ' })).title).toBeTruthy()
  })

  it('يرفض العنوان الطويل', () => {
    expect(validateDraft(draft({ title: 'ع'.repeat(MAX_TITLE + 1) })).title).toBeTruthy()
  })

  it('يرفض القيمة السالبة', () => {
    expect(validateDraft(draft({ amount: -1 })).amount).toBeTruthy()
  })

  it('يرفض القيمة غير الرقمية', () => {
    expect(validateDraft(draft({ amount: Number.NaN })).amount).toBeTruthy()
  })

  it('يقبل القيمة صفر', () => {
    expect(validateDraft(draft({ amount: 0 })).amount).toBeUndefined()
  })

  it('يرفض الملاحظات الطويلة', () => {
    expect(validateDraft(draft({ notes: 'م'.repeat(MAX_NOTES + 1) })).notes).toBeTruthy()
  })

  it('يرفض حالة غير معروفة', () => {
    const invalid = { ...draft(), status: 'unknown' } as unknown as EntryDraft
    expect(validateDraft(invalid).status).toBeTruthy()
  })
})

describe('emptyDraft', () => {
  it('يبدأ بحالة «قيد المراجعة» وقيمة صفر', () => {
    const value = emptyDraft()
    expect(value.status).toBe('pending')
    expect(value.amount).toBe(0)
    expect(value.title).toBe('')
  })
})
