import { formatCount } from '../lib/format'
import type { QueryOptions, SortKey } from '../lib/filter'
import { ENTRY_STATUSES, STATUS_LABELS } from '../types'

interface ToolbarProps {
  query: QueryOptions
  categories: readonly string[]
  resultCount: number
  onChange: (patch: Partial<QueryOptions>) => void
  onReset: () => void
}

const SORT_LABELS: Record<SortKey, string> = {
  updatedAt: 'آخر تحديث',
  title: 'العنوان',
  amount: 'القيمة',
  status: 'الحالة',
}

export function Toolbar({ query, categories, resultCount, onChange, onReset }: ToolbarProps) {
  const isFiltered =
    query.search !== '' || query.status !== 'all' || query.category !== 'all'

  return (
    <section className="toolbar" aria-label="أدوات التصفية">
      <div className="field field--grow">
        <label className="field__label" htmlFor="toolbar-search">
          بحث
        </label>
        <input
          id="toolbar-search"
          type="search"
          className="input"
          placeholder="ابحث في العناوين والتصنيفات والملاحظات…"
          value={query.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="toolbar-status">
          الحالة
        </label>
        <select
          id="toolbar-status"
          className="input"
          value={query.status}
          onChange={(event) => onChange({ status: event.target.value as QueryOptions['status'] })}
        >
          <option value="all">كل الحالات</option>
          {ENTRY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="toolbar-category">
          التصنيف
        </label>
        <select
          id="toolbar-category"
          className="input"
          value={query.category}
          onChange={(event) => onChange({ category: event.target.value })}
        >
          <option value="all">كل التصنيفات</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="toolbar-sort">
          الترتيب
        </label>
        <select
          id="toolbar-sort"
          className="input"
          value={query.sortKey}
          onChange={(event) => onChange({ sortKey: event.target.value as SortKey })}
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="button button--ghost"
        onClick={() =>
          onChange({ sortDirection: query.sortDirection === 'asc' ? 'desc' : 'asc' })
        }
        aria-label={query.sortDirection === 'asc' ? 'ترتيب تنازلي' : 'ترتيب تصاعدي'}
        title={query.sortDirection === 'asc' ? 'تصاعدي' : 'تنازلي'}
      >
        {query.sortDirection === 'asc' ? '↑' : '↓'}
      </button>

      <p className="toolbar__count" role="status">
        {formatCount(resultCount)} نتيجة
        {isFiltered && (
          <button type="button" className="link" onClick={onReset}>
            إزالة التصفية
          </button>
        )}
      </p>
    </section>
  )
}
