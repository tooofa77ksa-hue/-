import { describe, expect, it } from 'vitest'

import {
  collectCategories,
  DEFAULT_QUERY,
  normalizeArabic,
  queryEntries,
  type QueryOptions,
} from '../lib/filter'
import type { Entry } from '../types'

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'x',
    title: 'سجل',
    category: 'عام',
    status: 'active',
    amount: 100,
    ownerUid: 'u',
    notes: '',
    createdAt: 1_000,
    updatedAt: 2_000,
    ...overrides,
  }
}

function withQuery(patch: Partial<QueryOptions>): QueryOptions {
  return { ...DEFAULT_QUERY, ...patch }
}

describe('normalizeArabic', () => {
  it('يزيل التشكيل', () => {
    expect(normalizeArabic('مُرَاجَعَة')).toBe(normalizeArabic('مراجعة'))
  })

  it('يوحّد أشكال الألف', () => {
    expect(normalizeArabic('أحمد')).toBe(normalizeArabic('احمد'))
    expect(normalizeArabic('إدارة')).toBe(normalizeArabic('ادارة'))
  })

  it('يوحّد التاء المربوطة والألف المقصورة', () => {
    expect(normalizeArabic('مراجعة')).toBe(normalizeArabic('مراجعه'))
    expect(normalizeArabic('مستوى')).toBe(normalizeArabic('مستوي'))
  })
})

describe('queryEntries', () => {
  const entries = [
    entry({ id: '1', title: 'حملة تسويق', category: 'تسويق', status: 'pending', amount: 500, updatedAt: 30 }),
    entry({ id: '2', title: 'أجهزة مكتبية', category: 'عمليات', status: 'active', amount: 900, updatedAt: 10 }),
    entry({ id: '3', title: 'عقود قديمة', category: 'عقود', status: 'archived', amount: 100, updatedAt: 20 }),
  ]

  it('يعيد كل السجلات دون تصفية', () => {
    expect(queryEntries(entries, DEFAULT_QUERY)).toHaveLength(3)
  })

  it('يصفّي حسب الحالة', () => {
    const result = queryEntries(entries, withQuery({ status: 'active' }))
    expect(result.map((row) => row.id)).toEqual(['2'])
  })

  it('يصفّي حسب التصنيف', () => {
    const result = queryEntries(entries, withQuery({ category: 'عقود' }))
    expect(result.map((row) => row.id)).toEqual(['3'])
  })

  it('يبحث مع تجاهل اختلاف الهمزة', () => {
    const result = queryEntries(entries, withQuery({ search: 'اجهزة' }))
    expect(result.map((row) => row.id)).toEqual(['2'])
  })

  it('يبحث داخل الملاحظات', () => {
    const withNotes = [entry({ id: '9', title: 'بند', notes: 'بانتظار الاعتماد' })]
    expect(queryEntries(withNotes, withQuery({ search: 'الاعتماد' }))).toHaveLength(1)
  })

  it('يرتّب تنازليًا حسب آخر تحديث افتراضيًا', () => {
    expect(queryEntries(entries, DEFAULT_QUERY).map((row) => row.id)).toEqual(['1', '3', '2'])
  })

  it('يرتّب تصاعديًا حسب القيمة', () => {
    const result = queryEntries(entries, withQuery({ sortKey: 'amount', sortDirection: 'asc' }))
    expect(result.map((row) => row.amount)).toEqual([100, 500, 900])
  })

  it('لا يغيّر المصفوفة الأصلية', () => {
    const original = [...entries]
    queryEntries(entries, withQuery({ sortKey: 'amount', sortDirection: 'asc' }))
    expect(entries).toEqual(original)
  })

  it('يعيد قائمة فارغة عند عدم وجود مطابقات', () => {
    expect(queryEntries(entries, withQuery({ search: 'لا يوجد هذا النص' }))).toEqual([])
  })
})

describe('collectCategories', () => {
  it('يعيد تصنيفات فريدة مرتّبة ويتجاهل الفارغ', () => {
    const result = collectCategories([
      entry({ id: '1', category: 'عمليات' }),
      entry({ id: '2', category: 'تسويق' }),
      entry({ id: '3', category: 'عمليات' }),
      entry({ id: '4', category: '  ' }),
    ])

    expect(result).toHaveLength(2)
    expect(new Set(result)).toEqual(new Set(['عمليات', 'تسويق']))
  })
})
