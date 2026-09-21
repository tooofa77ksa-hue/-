import { useMemo, useState } from 'react'

import { EmptyState } from '../../components/EmptyState'
import { ReviewBadge, ReviewedBadge } from '../../components/ReviewBadge'
import { SectionTitle } from '../../components/SectionTitle'
import { StatCard } from '../../components/StatCard'
import { markReviewed, unmarkReviewed } from '../../domain/actions'
import { normalizeArabic } from '../../lib/arabic'
import { dateTime, num } from '../../lib/format'
import { REASON_LABELS, flagCounts, flaggedCases, type ReviewReasonCode } from '../../lib/reviewFlags'
import { useSystem } from '../../state/useSystem'

type Filter = 'all' | 'pending' | 'reviewed'

const MATCH_LABELS: Record<string, string> = {
  MATCHED: 'مطابقة مؤكّدة',
  POSSIBLE_MATCH: 'مطابقة محتملة',
  NEW: 'جديدة',
  LEGACY: 'بلا كشف رسمي',
  DUPLICATE: 'مكرّرة',
}

export function ReviewQueuePage() {
  const { state, replace } = useSystem()
  const [filter, setFilter] = useState<Filter>('pending')
  const [reason, setReason] = useState<ReviewReasonCode | 'all'>('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const counts = useMemo(() => flagCounts(state), [state])
  const cases = useMemo(() => flaggedCases(state), [state])

  const gradeById = new Map(state.grades.map((g) => [g.id, g]))
  const classById = new Map(state.classes.map((c) => [c.id, c]))
  const studentById = new Map(state.students.map((s) => [s.id, s]))

  const rows = useMemo(() => {
    const needle = normalizeArabic(search)
    return cases
      .filter((c) => filter === 'all'
        || (filter === 'pending' ? !c.acknowledged : c.acknowledged))
      .filter((c) => reason === 'all' || c.reasons.some((r) => r.code === reason))
      .filter((c) => !needle || normalizeArabic(c.response.rawName).includes(needle))
  }, [cases, filter, reason, search])

  return (
    <>
      <SectionTitle note="أداة إدارية داخلية: لا تظهر للطالبة ولا في التقارير ولا في ملفات Excel">
        حالات تحتاج مراجعتك
      </SectionTitle>

      <section className="stats">
        <StatCard tone="sand" label="ما زالت تحتاج مراجعتك" value={num(counts.pending)}
          meta={`من ${num(counts.total)} حالة مميَّزة`} />
        <StatCard tone="green" label="تمت مراجعتها" value={num(counts.reviewed)}
          meta="اطّلعتِ عليها — البيانات كما هي" />
        <StatCard tone="blue" label="بلا طالبة مطابقة"
          value={num(counts.byReason.no_roster_match)} />
        <StatCard tone="purple" label="أسماء مكرّرة أو مشابهة"
          value={num(counts.byReason.duplicate_name)} />
      </section>

      <p className="basis-note">
        التمييز لا يغيّر أي بيانات ولا نتيجة ولا مطابقة. وزر «تمت المراجعة» يزيل
        التمييز فقط ويسجّل أنك اطّلعتِ على الحالة — وليس موافقةً على المطابقة ولا
        تصحيحًا للبيانات.
      </p>

      <section className="toolbar no-print">
        <div className="field field--grow">
          <label className="field__label" htmlFor="rv-search">بحث بالاسم</label>
          <input id="rv-search" type="search" className="input" value={search}
            onChange={(e) => setSearch(e.target.value)} placeholder="اسم كما ورد في الاستجابة…" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="rv-filter">الحالة</label>
          <select id="rv-filter" className="input" value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}>
            <option value="all">الكل ({num(counts.total)})</option>
            <option value="pending">يحتاج مراجعة ({num(counts.pending)})</option>
            <option value="reviewed">تمت مراجعته ({num(counts.reviewed)})</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="rv-reason">سبب التمييز</label>
          <select id="rv-reason" className="input" value={reason}
            onChange={(e) => setReason(e.target.value as ReviewReasonCode | 'all')}>
            <option value="all">كل الأسباب</option>
            {(Object.keys(REASON_LABELS) as ReviewReasonCode[])
              .filter((c) => counts.byReason[c] > 0)
              .map((c) => (
                <option key={c} value={c}>
                  {REASON_LABELS[c]} ({num(counts.byReason[c])})
                </option>
              ))}
          </select>
        </div>
        <p className="toolbar__count">{num(rows.length)} حالة</p>
      </section>

      <section className="panel">
        {rows.length === 0 ? (
          <EmptyState
            title={filter === 'pending' ? 'لا توجد حالات تنتظر مراجعتك' : 'لا توجد حالات مطابقة'}
            description={filter === 'pending'
              ? 'راجعتِ كل ما يحتاج نظرك. البيانات كما هي دائمًا.'
              : undefined}
          />
        ) : (
          <ul className="review-list">
            {rows.map((c) => {
              const r = c.response
              const student = r.studentId ? studentById.get(r.studentId) : null
              const grade = r.declaredGradeId ? gradeById.get(r.declaredGradeId) : null
              const klass = r.classId ? classById.get(r.classId) : null
              const isOpen = open === r.id
              const answers = state.answers.filter((a) => a.responseId === r.id && a.rawValue).length

              return (
                <li key={r.id} className={c.acknowledged ? 'review-case is-done' : 'review-case'}>
                  <div className="review-case__head">
                    <button
                      type="button"
                      className="review-case__toggle"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : r.id)}
                    >
                      <span className="review-case__name">«{r.rawName}»</span>
                      <span className="review-case__chev" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
                    </button>
                    {c.acknowledged ? <ReviewedBadge /> : <ReviewBadge count={c.reasons.length} />}
                  </div>

                  <ul className="review-case__reasons">
                    {c.reasons.map((reasonItem) => (
                      <li key={reasonItem.code}>{reasonItem.text}</li>
                    ))}
                  </ul>

                  {isOpen && (
                    <dl className="review-case__detail">
                      <div><dt>الاسم كما ورد</dt><dd>{r.rawName || '—'}</dd></div>
                      <div><dt>الصف المعلن</dt><dd>{grade?.name ?? '—'}</dd></div>
                      <div>
                        <dt>الفصل</dt>
                        <dd>{klass ? `فصل ${klass.name}` : 'غير محدّد — لم تُربط بطالبة'}</dd>
                      </div>
                      <div>
                        <dt>مصدر السجل</dt>
                        <dd>{r.source === 'import'
                          ? `${r.sourceFile ?? '—'} · صف ${num(r.sourceRow ?? 0)}`
                          : 'أُرسلت من رابط القياس'}</dd>
                      </div>
                      <div><dt>حالة المطابقة</dt><dd>{MATCH_LABELS[r.matchStatus]}</dd></div>
                      <div>
                        <dt>مرتبطة بطالبة</dt>
                        <dd>{student ? `نعم — ${student.name}` : 'لا'}</dd>
                      </div>
                      <div>
                        <dt>هل لها استجابة محفوظة</dt>
                        <dd>نعم — {num(answers)} إجابة محفوظة</dd>
                      </div>
                      <div>
                        <dt>وقت الإرسال</dt>
                        <dd>{r.submittedAt ? dateTime(r.submittedAt) : 'غير مسجَّل في المصدر'}</dd>
                      </div>
                      {c.acknowledged && (
                        <div>
                          <dt>راجعتها</dt>
                          <dd>{c.acknowledgedBy} — {dateTime(c.acknowledgedAt)}</dd>
                        </div>
                      )}
                    </dl>
                  )}

                  <div className="review-case__actions no-print">
                    {c.acknowledged ? (
                      <button type="button" className="button button--small"
                        onClick={() => replace(unmarkReviewed(state, r.id))}>
                        إعادة التمييز للمراجعة
                      </button>
                    ) : (
                      <button type="button" className="button button--small button--primary"
                        onClick={() => replace(markReviewed(state, r.id))}>
                        تمت المراجعة ✓
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
