import { useMemo, useState } from 'react'

import { EmptyState } from '../../components/EmptyState'
import { SectionTitle } from '../../components/SectionTitle'
import { StatCard } from '../../components/StatCard'
import { confirmMatch, rejectMatch } from '../../domain/actions'
import type { MatchStatus } from '../../domain/types'
import { isNameCandidate, normalizeArabic } from '../../lib/arabic'
import { num } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

const STATUS_LABELS: Record<MatchStatus, string> = {
  MATCHED: 'مطابقة مؤكّدة',
  POSSIBLE_MATCH: 'مطابقة محتملة',
  NEW: 'جديدة',
  LEGACY: 'بلا كشف رسمي',
  DUPLICATE: 'مكرّرة',
}

export function MatchReviewPage() {
  const { state, replace } = useSystem()
  const [status, setStatus] = useState<MatchStatus | 'all'>('POSSIBLE_MATCH')
  const [gradeId, setGradeId] = useState('all')
  const [search, setSearch] = useState('')

  const studentById = useMemo(
    () => new Map(state.students.map((s) => [s.id, s])), [state.students],
  )
  const classById = new Map(state.classes.map((c) => [c.id, c]))
  const gradeById = new Map(state.grades.map((g) => [g.id, g]))

  const rows = useMemo(() => {
    const needle = normalizeArabic(search)
    return state.responses
      .filter((r) => status === 'all' || r.matchStatus === status)
      .filter((r) => gradeId === 'all' || r.declaredGradeId === gradeId)
      .filter((r) => !needle || normalizeArabic(r.rawName).includes(needle))
  }, [state.responses, status, gradeId, search])

  const tally = useMemo(() => {
    const t: Record<string, number> = {}
    for (const r of state.responses) t[r.matchStatus] = (t[r.matchStatus] ?? 0) + 1
    return t
  }, [state.responses])

  /** مرشّحون إضافيون داخل الصف المعلن — للمساعدة فقط، بلا ربط تلقائي. */
  function suggestCandidates(rawName: string, declaredGradeId: string | null) {
    if (!declaredGradeId) return []
    return state.students
      .filter((s) => s.gradeId === declaredGradeId && s.status === 'active')
      .filter((s) => isNameCandidate(rawName, s.name))
      .slice(0, 6)
  }

  return (
    <>
      <SectionTitle note="لا يُربط أي اسم تلقائيًا ولا تُحذف أي استجابة — كل ربط يحتاج تأكيدك">
        مركز مراجعة المطابقة
      </SectionTitle>

      <section className="stats">
        <StatCard tone="green" label="مطابقة مؤكّدة" value={num(tally.MATCHED ?? 0)} />
        <StatCard tone="sand" label="مطابقة محتملة" value={num(tally.POSSIBLE_MATCH ?? 0)}
          meta="تحتاج قرارك" />
        <StatCard tone="blue" label="جديدة" value={num(tally.NEW ?? 0)}
          meta="لا مرشّح في الكشف" />
        <StatCard tone="purple" label="بلا كشف رسمي" value={num(tally.LEGACY ?? 0)}
          meta="صفوف لم يُرفع كشفها" />
      </section>

      {state.duplicateGroups.length > 0 && (
        <div className="alert alert--info">
          <span>
            <strong>{num(state.duplicateGroups.length)}</strong> مجموعة أسماء متطابقة بعد التطبيع
            داخل الصف نفسه — قد تكون استجابات مكرّرة. لم تُحذف ولم تُدمج.
          </span>
        </div>
      )}

      <section className="toolbar no-print">
        <div className="field field--grow">
          <label className="field__label" htmlFor="m-search">بحث بالاسم</label>
          <input id="m-search" type="search" className="input" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="m-status">الحالة</label>
          <select id="m-status" className="input" value={status}
            onChange={(e) => setStatus(e.target.value as MatchStatus | 'all')}>
            <option value="all">الكل</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="m-grade">الصف المعلن</label>
          <select id="m-grade" className="input" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
            <option value="all">كل الصفوف</option>
            {state.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <p className="toolbar__count">{num(rows.length)} استجابة</p>
      </section>

      <section className="panel">
        {rows.length === 0 ? <EmptyState title="لا توجد حالات في هذا التصنيف" /> : (
          <ul className="match-list">
            {rows.slice(0, 80).map((r) => {
              const linked = r.studentId ? studentById.get(r.studentId) : null
              const candidates = r.candidateStudentIds.length
                ? r.candidateStudentIds.map((id) => studentById.get(id)).filter(Boolean)
                : suggestCandidates(r.rawName, r.declaredGradeId)

              return (
                <li key={r.id} className="match">
                  <div className="match__head">
                    <span className="match__name">«{r.rawName}»</span>
                    <span className={`status status--match-${r.matchStatus.toLowerCase()}`}>
                      {STATUS_LABELS[r.matchStatus]}
                    </span>
                    <span className="chip">
                      {r.declaredGradeId ? gradeById.get(r.declaredGradeId)?.name ?? '—' : 'صف غير معلن'}
                    </span>
                    {r.duplicateFlag && <span className="chip chip--warn">احتمال تكرار</span>}
                    {r.sourceFile && <span className="muted">{r.sourceFile} · صف {r.sourceRow}</span>}
                  </div>

                  {linked ? (
                    <p className="match__linked">
                      مرتبطة بـ <strong>{linked.name}</strong>
                      {linked.classId && ` — فصل ${classById.get(linked.classId)?.name}`}
                      <button type="button" className="button button--small button--danger no-print"
                        onClick={() => replace(rejectMatch(state, r.id))}>
                        فكّ الارتباط
                      </button>
                    </p>
                  ) : candidates.length > 0 ? (
                    <ul className="match__candidates no-print">
                      {candidates.map((c) => c && (
                        <li key={c.id}>
                          <span>{c.name}{c.classId && ` — فصل ${classById.get(c.classId)?.name}`}</span>
                          <button type="button" className="button button--small button--primary"
                            onClick={() => replace(confirmMatch(state, r.id, c.id))}>
                            تأكيد
                          </button>
                        </li>
                      ))}
                      <li>
                        <button type="button" className="button button--small"
                          onClick={() => replace(rejectMatch(state, r.id))}>
                          لا ينطبق أي منهم
                        </button>
                      </li>
                    </ul>
                  ) : (
                    <p className="muted">
                      {r.matchStatus === 'LEGACY'
                        ? 'لا يوجد كشف رسمي لهذا الصف، فيتعذّر التأكيد. ارفعي الكشف ثم أعيدي المراجعة.'
                        : 'لا يوجد مرشّح في الكشف الرسمي لهذا الصف.'}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {rows.length > 80 && (
          <p className="muted">يُعرض أول ٨٠ سجلًا. ضيّقي البحث لعرض البقية.</p>
        )}
      </section>
    </>
  )
}
