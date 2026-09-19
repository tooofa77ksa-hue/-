import type { Entry, EntryStatus } from '../types'

export type SortKey = 'updatedAt' | 'title' | 'amount' | 'status'
export type SortDirection = 'asc' | 'desc'

export interface QueryOptions {
  search: string
  status: EntryStatus | 'all'
  category: string | 'all'
  sortKey: SortKey
  sortDirection: SortDirection
}

export const DEFAULT_QUERY: QueryOptions = {
  search: '',
  status: 'all',
  category: 'all',
  sortKey: 'updatedAt',
  sortDirection: 'desc',
}

/**
 * يوحّد النص العربي قبل المقارنة: يزيل التشكيل، ويوحّد الألف والياء
 * والتاء المربوطة، حتى يطابق البحث عن "مراجعه" كلمة "مراجعة".
 */
export function normalizeArabic(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .trim()
}

const STATUS_ORDER: Record<EntryStatus, number> = { active: 0, pending: 1, archived: 2 }

function compare(a: Entry, b: Entry, key: SortKey): number {
  switch (key) {
    case 'title':
      return a.title.localeCompare(b.title, 'ar')
    case 'amount':
      return a.amount - b.amount
    case 'status':
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    case 'updatedAt':
      return a.updatedAt - b.updatedAt
  }
}

/** يطبّق البحث والفلترة والترتيب. لا يغيّر المصفوفة الأصلية. */
export function queryEntries(entries: readonly Entry[], options: QueryOptions): Entry[] {
  const needle = normalizeArabic(options.search)

  const filtered = entries.filter((entry) => {
    if (options.status !== 'all' && entry.status !== options.status) return false
    if (options.category !== 'all' && entry.category !== options.category) return false
    if (!needle) return true

    const haystack = normalizeArabic(`${entry.title} ${entry.category} ${entry.notes}`)
    return haystack.includes(needle)
  })

  const direction = options.sortDirection === 'asc' ? 1 : -1
  return filtered.sort((a, b) => compare(a, b, options.sortKey) * direction)
}

/** قائمة التصنيفات الفريدة المستخرجة من السجلات، مرتّبة عربيًا. */
export function collectCategories(entries: readonly Entry[]): string[] {
  const set = new Set<string>()
  for (const entry of entries) {
    const category = entry.category.trim()
    if (category) set.add(category)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'ar'))
}
