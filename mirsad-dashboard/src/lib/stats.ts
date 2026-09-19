import type { Entry, EntryStatus } from '../types'

export interface DashboardStats {
  total: number
  active: number
  pending: number
  archived: number
  totalAmount: number
  activeAmount: number
  averageAmount: number
  /** أكثر تصنيف تكرارًا، أو null عند غياب السجلات. */
  topCategory: { name: string; count: number } | null
  /** آخر وقت تحديث في المجموعة كلها. */
  lastUpdatedAt: number | null
}

const EMPTY_STATS: DashboardStats = {
  total: 0,
  active: 0,
  pending: 0,
  archived: 0,
  totalAmount: 0,
  activeAmount: 0,
  averageAmount: 0,
  topCategory: null,
  lastUpdatedAt: null,
}

/** يحسب كل أرقام البطاقات العلوية من قائمة السجلات في مرور واحد. */
export function computeStats(entries: readonly Entry[]): DashboardStats {
  if (entries.length === 0) return { ...EMPTY_STATS }

  const byStatus: Record<EntryStatus, number> = { active: 0, pending: 0, archived: 0 }
  const byCategory = new Map<string, number>()

  let totalAmount = 0
  let activeAmount = 0
  let lastUpdatedAt = 0

  for (const entry of entries) {
    byStatus[entry.status] += 1
    totalAmount += entry.amount
    if (entry.status === 'active') activeAmount += entry.amount

    const category = entry.category.trim() || 'غير مصنّف'
    byCategory.set(category, (byCategory.get(category) ?? 0) + 1)

    if (entry.updatedAt > lastUpdatedAt) lastUpdatedAt = entry.updatedAt
  }

  let topCategory: DashboardStats['topCategory'] = null
  for (const [name, count] of byCategory) {
    if (!topCategory || count > topCategory.count) topCategory = { name, count }
  }

  return {
    total: entries.length,
    active: byStatus.active,
    pending: byStatus.pending,
    archived: byStatus.archived,
    totalAmount,
    activeAmount,
    averageAmount: totalAmount / entries.length,
    topCategory,
    lastUpdatedAt: lastUpdatedAt || null,
  }
}

/** نسبة مئوية آمنة (تتفادى القسمة على صفر). */
export function percentage(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 100)
}
