import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { BarRow } from '../../components/BarRow'
import { EmptyState } from '../../components/EmptyState'
import { SectionTitle } from '../../components/SectionTitle'
import { StatCard } from '../../components/StatCard'
import { categorizeSuggestion, setSuggestionStatus } from '../../domain/actions'
import { suggestionsInScope, type Scope } from '../../lib/analysis'
import type { ImprovementAction } from '../../domain/types'
import { normalizeArabic } from '../../lib/arabic'
import { exportSuggestions } from '../../lib/excel'
import { num, pct } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

const STATUS_LABELS = {
  new: 'جديد', reviewed: 'مُراجَع', linked: 'مرتبط بإجراء', closed: 'مغلق',
} as const

export function VoicePage() {
  const { state, replace } = useSystem()
  const [gradeId, setGradeId] = useState('all')
  const [categoryId, setCategoryId] = useState('all')
  const [search, setSearch] = useState('')

  const scope: Scope = gradeId === 'all' ? {} : { gradeId }
  const all = suggestionsInScope(state, scope)

  /** الرأي ← الإجراء الذي اتُّخذ عليه، إن وُجد. */
  const answeredBy = useMemo(() => {
    const map = new Map<string, ImprovementAction>()
    for (const action of state.improvementActions) {
      for (const id of action.linkedSuggestionIds) map.set(id, action)
    }
    return map
  }, [state.improvementActions])

  const rows = useMemo(() => {
    const needle = normalizeArabic(search)
    return all
      .filter((s) => categoryId === 'all'
        || (categoryId === 'none' ? !s.categoryId : s.categoryId === categoryId))
      .filter((s) => !needle || normalizeArabic(s.text).includes(needle))
  }, [all, categoryId, search])

  const byCategory = useMemo(() => {
    const tally = new Map<string, number>()
    for (const s of all) tally.set(s.categoryId ?? 'none', (tally.get(s.categoryId ?? 'none') ?? 0) + 1)
    return [...tally.entries()]
      .map(([id, count]) => ({
        id,
        name: id === 'none' ? 'بلا تصنيف' : state.categories.find((c) => c.id === id)?.name ?? id,
        count,
        percent: all.length ? (count / all.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [all, state.categories])

  const gradeById = new Map(state.grades.map((g) => [g.id, g]))
  const respById = new Map(state.responses.map((r) => [r.id, r]))

  return (
    <>
      <SectionTitle note="النصوص معروضة كما كتبتها الطالبات حرفيًا، بلا أي تحرير">
        صوت طالباتنا
      </SectionTitle>

      <section className="stats">
        <StatCard tone="purple" label="إجمالي الآراء" value={num(all.length)} />
        <StatCard tone="blue" label="أكثر موضوع تكرارًا"
          value={byCategory[0]?.name ?? '—'}
          meta={byCategory[0] ? `${num(byCategory[0].count)} رأيًا` : undefined} />
        <StatCard tone="sand" label="بانتظار التصنيف"
          value={num(all.filter((s) => !s.categoryId).length)} />
        <StatCard tone="green" label="مرتبطة بإجراء تحسين"
          value={num(all.filter((s) => s.status === 'linked').length)} />
      </section>

      <section className="panel panel--pad">
        <SectionTitle note={`القاعدة: ${num(all.length)} رأيًا`}>الموضوعات الأكثر تكرارًا</SectionTitle>
        {byCategory.length === 0 ? <p className="muted">لا توجد آراء.</p> : (
          <div className="bars">
            {byCategory.map((c) => (
              <BarRow key={c.id} label={c.name} count={c.count} percent={c.percent}
                tone={c.id === 'none' ? 'var(--moe-grey)' : 'var(--moe-purple)'} />
            ))}
          </div>
        )}
      </section>

      <section className="toolbar no-print">
        <div className="field field--grow">
          <label className="field__label" htmlFor="v-search">بحث في النصوص</label>
          <input id="v-search" type="search" className="input" value={search}
            onChange={(e) => setSearch(e.target.value)} placeholder="كلمة في رأي الطالبة…" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="v-grade">الصف</label>
          <select id="v-grade" className="input" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
            <option value="all">كل الصفوف</option>
            {state.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="v-cat">التصنيف</label>
          <select id="v-cat" className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="all">الكل</option>
            <option value="none">بلا تصنيف</option>
            {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button type="button" className="button button--small" onClick={() => exportSuggestions(state, scope)}>
          تصدير Excel
        </button>
        <p className="toolbar__count">{num(rows.length)} رأيًا</p>
      </section>

      <section className="panel">
        {rows.length === 0 ? <EmptyState title="لا توجد آراء مطابقة" /> : (
          <ul className="voice-list">
            {rows.map((s) => {
              const gid = s.gradeId ?? respById.get(s.responseId)?.declaredGradeId ?? null
              return (
                <li key={s.id} className="voice">
                  <blockquote className="voice__text">{s.text}</blockquote>
                  <div className="voice__meta">
                    <span className="chip">{gid ? gradeById.get(gid)?.name ?? '—' : 'صف غير محدد'}</span>
                    <span className={`chip chip--${s.status}`}>{STATUS_LABELS[s.status]}</span>
                    {answeredBy.get(s.id) ? (
                      <Link className="chip chip--action" to="/admin/improvement">
                        إجراء المدرسة: {answeredBy.get(s.id)?.title || 'بلا عنوان'}
                      </Link>
                    ) : (
                      <Link
                        className="button button--small no-print"
                        to="/admin/improvement"
                        state={{ fromSuggestion: s.id }}
                      >
                        أنشئي إجراء تحسين من هذا الرأي
                      </Link>
                    )}
                    <select
                      className="input input--inline no-print"
                      aria-label="تصنيف الرأي"
                      value={s.categoryId ?? ''}
                      onChange={(e) => replace(categorizeSuggestion(state, s.id, e.target.value || null))}
                    >
                      <option value="">بلا تصنيف</option>
                      {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select
                      className="input input--inline no-print"
                      aria-label="حالة المعالجة"
                      value={s.status}
                      onChange={(e) => replace(setSuggestionStatus(state, s.id, e.target.value as never))}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <p className="basis-note">
        نسبة الآراء المصنّفة: {pct(all.length ? (all.filter((s) => s.categoryId).length / all.length) * 100 : 0)}
      </p>
    </>
  )
}
