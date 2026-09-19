import { describe, expect, it } from 'vitest'

import { computeStats, percentage } from '../lib/stats'
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

describe('computeStats', () => {
  it('يعيد أصفارًا لقائمة فارغة', () => {
    const stats = computeStats([])
    expect(stats.total).toBe(0)
    expect(stats.totalAmount).toBe(0)
    expect(stats.averageAmount).toBe(0)
    expect(stats.topCategory).toBeNull()
    expect(stats.lastUpdatedAt).toBeNull()
  })

  it('يحسب العدّادات لكل حالة', () => {
    const stats = computeStats([
      entry({ id: '1', status: 'active' }),
      entry({ id: '2', status: 'pending' }),
      entry({ id: '3', status: 'pending' }),
      entry({ id: '4', status: 'archived' }),
    ])

    expect(stats.total).toBe(4)
    expect(stats.active).toBe(1)
    expect(stats.pending).toBe(2)
    expect(stats.archived).toBe(1)
  })

  it('يجمع القيم ويفصل قيمة السجلات النشطة', () => {
    const stats = computeStats([
      entry({ id: '1', status: 'active', amount: 300 }),
      entry({ id: '2', status: 'pending', amount: 200 }),
      entry({ id: '3', status: 'archived', amount: 100 }),
    ])

    expect(stats.totalAmount).toBe(600)
    expect(stats.activeAmount).toBe(300)
    expect(stats.averageAmount).toBe(200)
  })

  it('يختار أكثر التصنيفات تكرارًا', () => {
    const stats = computeStats([
      entry({ id: '1', category: 'تسويق' }),
      entry({ id: '2', category: 'عمليات' }),
      entry({ id: '3', category: 'عمليات' }),
    ])

    expect(stats.topCategory).toEqual({ name: 'عمليات', count: 2 })
  })

  it('يعامل التصنيف الفارغ على أنه «غير مصنّف»', () => {
    const stats = computeStats([entry({ id: '1', category: '   ' })])
    expect(stats.topCategory).toEqual({ name: 'غير مصنّف', count: 1 })
  })

  it('يأخذ أحدث طابع زمني للتحديث', () => {
    const stats = computeStats([
      entry({ id: '1', updatedAt: 500 }),
      entry({ id: '2', updatedAt: 9_000 }),
      entry({ id: '3', updatedAt: 3_000 }),
    ])

    expect(stats.lastUpdatedAt).toBe(9_000)
  })
})

describe('percentage', () => {
  it('يحسب النسبة المئوية مقرّبة', () => {
    expect(percentage(1, 3)).toBe(33)
    expect(percentage(1, 2)).toBe(50)
  })

  it('يتفادى القسمة على صفر', () => {
    expect(percentage(5, 0)).toBe(0)
  })
})
