import { useMemo, useState } from 'react'

import { BarRow } from '../../components/BarRow'
import { EmptyState } from '../../components/EmptyState'
import { VoiceImprovement } from '../../components/VoiceImprovement'
import { SectionTitle } from '../../components/SectionTitle'
import { StatCard } from '../../components/StatCard'
import {
  categorizeSuggestion, excludeSuggestion, restoreSuggestion, setSuggestionStatus, setVoiceKind,
} from '../../domain/actions'
import { excludedInScope, suggestionsInScope, type Scope } from '../../lib/analysis'
import type { ImprovementAction, VoiceKind } from '../../domain/types'
import { KIND_LABELS, KIND_NOTES, voiceKind } from '../../lib/voiceKind'
import { normalizeArabic } from '../../lib/arabic'
import { exportSuggestions } from '../../lib/excel'
import { dateOnly, num, pct } from '../../lib/format'
import { clusterVoices } from '../../lib/similar'
import { useSystem } from '../../state/useSystem'

const STATUS_LABELS = {
  new: 'جديد', reviewed: 'مُراجَع', linked: 'مرتبط بإجراء', closed: 'مغلق',
} as const

export function VoicePage() {
  const { state, replace } = useSystem()
  const [gradeId, setGradeId] = useState('all')
  const [categoryId, setCategoryId] = useState('all')
  const [search, setSearch] = useState('')

  const [kind, setKind] = useState<VoiceKind>('improve')

  const scope: Scope = gradeId === 'all' ? {} : { gradeId }
  const all = suggestionsInScope(state, scope)
  const excluded = excludedInScope(state, scope)

  /** الآراء موزَّعةً على أبوابها الثلاثة. */
  const byKind = useMemo(() => {
    const out: Record<VoiceKind, typeof all> = { improve: [], positive: [], empty: [] }
    for (const s of all) out[voiceKind(s)].push(s)
    return out
  }, [all])

  /** الباب المعروض وحده هو مجال البحث والتصفية والتصدير. */
  const inKind = byKind[kind]

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
    return inKind
      .filter((s) => categoryId === 'all'
        || (categoryId === 'none' ? !s.categoryId : s.categoryId === categoryId))
      .filter((s) => !needle || normalizeArabic(s.text).includes(needle))
  }, [inKind, categoryId, search])

  /** المؤشّرات على ما يحتاج تحسينًا وحده: الشكر لا يُصنَّف ولا يُعالَج. */
  const needWork = byKind.improve

  const byCategory = useMemo(() => {
    const tally = new Map<string, number>()
    for (const s of needWork) tally.set(s.categoryId ?? 'none', (tally.get(s.categoryId ?? 'none') ?? 0) + 1)
    return [...tally.entries()]
      .map(([id, count]) => ({
        id,
        name: id === 'none' ? 'بلا تصنيف' : state.categories.find((c) => c.id === id)?.name ?? id,
        count,
        percent: needWork.length ? (count / needWork.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [needWork, state.categories])

  /**
   * الموضوعات المتكرّرة: الشكوى الواحدة مهما اختلفت عباراتها.
   *
   * التصنيف أعلاه يقول «المرافق»، وهذا يقول «تكييف الساحة» — وهو ما
   * يُتَّخذ عليه إجراء فعلًا، وأول ما تسأل عنه الوزارة.
   */
  const repeated = useMemo(() => {
    const top = clusterVoices(needWork).slice(0, 8)
    const largest = top[0]?.members.length ?? 1
    return top.map((c) => ({
      id: c.head.id,
      name: c.keywords.join('، ') || c.head.text.slice(0, 40),
      sample: c.head.text,
      count: c.members.length,
      percent: needWork.length ? (c.members.length / needWork.length) * 100 : 0,
      // عرض الشريط نسبةً إلى أكبر موضوع لا إلى الآراء كلها: الموازنة
      // هنا بين الموضوعات بعضها ببعض، ولولاه لبدت كلها خيوطًا
      share: (c.members.length / largest) * 100,
      answered: c.members.filter((m) => answeredBy.has(m.id)).length,
    }))
  }, [needWork, answeredBy])

  const gradeById = new Map(state.grades.map((g) => [g.id, g]))
  const respById = new Map(state.responses.map((r) => [r.id, r]))

  return (
    <>
      <SectionTitle note="النصوص معروضة كما كتبتها الطالبات حرفيًا، بلا أي تحرير">
        صوت طالباتنا
      </SectionTitle>

      <section className="stats">
        <StatCard tone="purple" label="تحتاج تحسين" value={num(needWork.length)}
          meta={`من ${num(all.length)} رأيًا`} />
        <StatCard tone="blue" label="أكثر موضوع تكرارًا"
          value={byCategory[0]?.name ?? '—'}
          meta={byCategory[0] ? `${num(byCategory[0].count)} رأيًا` : undefined} />
        <StatCard tone="sand" label="بانتظار التصنيف"
          value={num(needWork.filter((s) => !s.categoryId).length)} />
        <StatCard tone="green" label="عليها إجراء تحسين"
          value={num(needWork.filter((s) => s.status === 'linked').length)} />
      </section>

      <section className="panel panel--pad">
        <SectionTitle note={`القاعدة: ${num(needWork.length)} رأيًا مما يحتاج تحسينًا`}>
          الموضوعات الأكثر تكرارًا
        </SectionTitle>
        {byCategory.length === 0 ? <p className="muted">لا توجد آراء.</p> : (
          <div className="bars">
            {byCategory.map((c) => (
              <BarRow key={c.id} label={c.name} count={c.count} percent={c.percent}
                tone={c.id === 'none' ? 'var(--moe-grey)' : 'var(--moe-purple)'} />
            ))}
          </div>
        )}
      </section>

      {repeated.length > 0 && (
        <section className="panel panel--pad">
          <SectionTitle note="الشكوى الواحدة وإن اختلفت عباراتها — تُجمع بالكلمات المشتركة">
            الموضوعات المتكرّرة
          </SectionTitle>
          <ul className="repeat">
            {repeated.map((r) => (
              <li key={r.id} className="repeat__row">
                <div className="repeat__head">
                  <span className="repeat__name">{r.name}</span>
                  <span className="repeat__count">{num(r.count)} رأيًا · {pct(r.percent)}</span>
                  <span className={r.answered > 0 ? 'chip chip--linked' : 'chip'}>
                    {r.answered > 0 ? `عولج منها ${num(r.answered)}` : 'بلا إجراء بعد'}
                  </span>
                </div>
                <div className="repeat__bar">
                  <span className="repeat__fill" style={{ inlineSize: `${r.share}%` }} />
                </div>
                <p className="repeat__sample">«{r.sample}»</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="kinds no-print" aria-label="أبواب الآراء">
        {(['improve', 'positive', 'empty'] as VoiceKind[]).map((k) => (
          <button
            key={k} type="button"
            className={k === kind ? `kind kind--${k} is-on` : `kind kind--${k}`}
            aria-pressed={k === kind}
            onClick={() => { setKind(k); setCategoryId('all'); setSearch('') }}
          >
            <span className="kind__n">{num(byKind[k].length)}</span>
            <span className="kind__t">{KIND_LABELS[k]}</span>
          </button>
        ))}
      </nav>
      <p className="kinds__note no-print">{KIND_NOTES[kind]}</p>

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

                    {kind === 'improve' ? (
                      <>
                        <span className={`chip chip--${s.status}`}>{STATUS_LABELS[s.status]}</span>
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
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            // «مرتبط بإجراء» حالةٌ تتبع الربط لا تُختار بيد:
                            // اختيارها هنا كان يُمحى عند أول تعديل إجراء
                            <option key={k} value={k} disabled={k === 'linked' && s.status !== 'linked'}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      // الشكر وما لا مضمون فيه لا يُصنَّف ولا يُتَّخذ عليه إجراء،
                      // فلا تُعرض أدواته — ويبقى النقل متاحًا إن أخطأ الفرز
                      <button
                        type="button" className="button button--small no-print"
                        onClick={() => replace(setVoiceKind(state, s.id, 'improve'))}
                      >
                        انقليه إلى «تحتاج تحسين»
                      </button>
                    )}

                    {kind === 'improve' && (
                      <select
                        className="input input--inline no-print"
                        aria-label="نقل الرأي إلى باب آخر"
                        value=""
                        onChange={(e) => {
                          const target = e.target.value as VoiceKind | ''
                          if (target) replace(setVoiceKind(state, s.id, target))
                        }}
                      >
                        <option value="">انقليه إلى…</option>
                        <option value="positive">شكر وثناء</option>
                        <option value="empty">بلا مضمون</option>
                      </select>
                    )}

                    <button
                      type="button" className="button button--small button--quiet no-print"
                      onClick={() => {
                        const reason = window.prompt(
                          'سبب استبعاد هذا الرأي من العرض والتقرير؟\nالنص لا يُمحى، ويُسجَّل السبب والتاريخ.',
                        )
                        if (reason && reason.trim()) replace(excludeSuggestion(state, s.id, reason))
                      }}
                    >
                      استبعاد
                    </button>

                    {kind === 'improve' && (
                      <VoiceImprovement
                        voice={s}
                        action={answeredBy.get(s.id) ?? null}
                        state={state}
                        replace={replace}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      {excluded.length > 0 && (
        <section className="panel panel--pad no-print">
          <SectionTitle note="مرفوعة عن العرض والتقرير — ونصّها محفوظ ويمكن إعادتها">
            آراء مستبعَدة ({num(excluded.length)})
          </SectionTitle>
          <ul className="gone">
            {excluded.map((s) => (
              <li key={s.id} className="gone__row">
                <blockquote className="gone__text">{s.text}</blockquote>
                <p className="gone__why">
                  السبب: {s.excluded?.reason} — {dateOnly(s.excluded?.at ?? null)}
                </p>
                <button type="button" className="button button--small"
                  onClick={() => replace(restoreSuggestion(state, s.id))}>
                  أعيديه إلى العرض
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="basis-note">
        نسبة الآراء المصنّفة: {pct(needWork.length
          ? (needWork.filter((s) => s.categoryId).length / needWork.length) * 100 : 0)}
        {excluded.length > 0 && <> · استُبعد {num(excluded.length)} رأيًا من العرض والتقرير</>}
      </p>
    </>
  )
}
