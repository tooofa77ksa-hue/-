import { useMemo, useState } from 'react'

import { BarRow } from '../../components/BarRow'
import { Legend } from '../../components/Legend'
import { RankedList } from '../../components/RankedList'
import { ReverseNote } from '../../components/ReverseNote'
import { StackedBar } from '../../components/StackedBar'
import { OPTION_TONES } from '../../lib/tones'
import { ORGANIZATION } from '../../brand'
import {
  analyzeAllQuestions, nonRespondents, overallDistribution, participation,
  satisfactionIndex, strengthsAndGaps, suggestionsInScope, type Scope,
} from '../../lib/analysis'
import { exportResults } from '../../lib/excel'
import { avg, dateOnly, hijriToday, num, pct, arabicDigits } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

const STATUS = { planned: 'مخطط', in_progress: 'جارٍ التنفيذ', completed: 'مكتمل' } as const

export function ReportsPage() {
  const { state } = useSystem()
  const [gradeId, setGradeId] = useState('all')
  const [classId, setClassId] = useState('all')

  const scope: Scope = useMemo(() => {
    if (classId !== 'all') return { classId }
    if (gradeId !== 'all') return { gradeId }
    return {}
  }, [gradeId, classId])

  const scopeName = useMemo(() => {
    if (classId !== 'all') {
      const c = state.classes.find((x) => x.id === classId)
      const g = c && state.grades.find((x) => x.id === c.gradeId)
      return `${g?.name ?? ''} — فصل ${c?.name ?? ''}`
    }
    if (gradeId !== 'all') return state.grades.find((g) => g.id === gradeId)?.name ?? ''
    return 'المدرسة كاملة'
  }, [gradeId, classId, state.classes, state.grades])

  const part = participation(state, scope)
  const index = satisfactionIndex(state, scope)
  const overall = overallDistribution(state, scope)
  const questions = analyzeAllQuestions(state, scope)
  const { strengths, gaps } = strengthsAndGaps(state, scope, 5)
  const voices = suggestionsInScope(state, scope)
  const missing = nonRespondents(state, scope)
  const actions = state.improvementActions
  const classes = state.classes.filter((c) => gradeId === 'all' || c.gradeId === gradeId)

  return (
    <>
      <section className="toolbar no-print">
        <div className="field">
          <label className="field__label" htmlFor="r-grade">نطاق التقرير</label>
          <select id="r-grade" className="input" value={gradeId}
            onChange={(e) => { setGradeId(e.target.value); setClassId('all') }}>
            <option value="all">التقرير التنفيذي للمدرسة</option>
            {state.grades.map((g) => <option key={g.id} value={g.id}>تقرير {g.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="r-class">الفصل</label>
          <select id="r-class" className="input" value={classId}
            onChange={(e) => setClassId(e.target.value)} disabled={gradeId === 'all'}>
            <option value="all">كل الفصول</option>
            {classes.map((c) => <option key={c.id} value={c.id}>فصل {c.name}</option>)}
          </select>
        </div>
        <button type="button" className="button button--primary" onClick={() => window.print()}>
          طباعة / حفظ PDF
        </button>
        <button type="button" className="button button--small" onClick={() => exportResults(state, scope)}>
          تصدير Excel
        </button>
      </section>

      <article className="report">
        {/* الغلاف */}
        <section className="report__cover">
          <img className="report__logo" src={ORGANIZATION.logo} alt={`شعار ${ORGANIZATION.ministry}`} />
          <p className="report__org">{ORGANIZATION.directorate}</p>
          <h1 className="report__title">
            {state.meta.surveyTitle} {arabicDigits(state.meta.hijriYear)}هـ
          </h1>
          <p className="report__school">{state.meta.school}</p>
          <p className="report__scope">{scopeName}</p>
          <dl className="report__facts">
            <div><dt>العام الدراسي</dt><dd>{arabicDigits(state.meta.academicYear)}هـ</dd></div>
            <div><dt>تاريخ إصدار التقرير</dt><dd>{hijriToday()}</dd></div>
            <div><dt>مصادر البيانات</dt><dd>{num(state.meta.sources.length)} ملفًا</dd></div>
          </dl>
        </section>

        <section className="report__section page-break">
          <h2 className="report__h2">معلومات القياس</h2>
          <div className="report__kpis">
            <div><span>إجمالي الطالبات</span><strong>{num(part.totalStudents)}</strong></div>
            <div><span>المستجيبات المؤكّدات</span><strong>{num(part.confirmedRespondents)}</strong></div>
            <div><span>غير المستجيبات</span><strong>{num(part.nonRespondents)}</strong></div>
            <div><span>نسبة الاستجابة</span><strong>{pct(part.rate)}</strong></div>
            <div><span>الاستجابات المستلمة</span><strong>{num(part.responsesReceived)}</strong></div>
            <div>
              <span>مؤشر الاتجاه</span>
              <strong>{index.mean === null ? '—' : avg(index.mean)}</strong>
            </div>
          </div>
          <p className="report__note">
            قاعدة الحساب: نسبة الاستجابة وغير المستجيبات تُحسبان على طالبات الكشوف الرسمية
            ({num(part.totalStudents)}) والاستجابات المؤكّدة المطابقة فقط. أما مؤشر الاتجاه وتحليل
            الأسئلة فيشملان كل الاستجابات المنسوبة إلى النطاق (ن = {num(index.n)} إجابة مقيسة)،
            على مقياس من {num(index.scaleMin)} إلى {num(index.scaleMax)} بعد تصحيح اتجاه الأسئلة
            العكسية.
          </p>
        </section>

        <section className="report__section">
          <h2 className="report__h2">التقويم العام للمدرسة</h2>
          {overall.n === 0 ? <p className="muted">لا توجد بيانات.</p> : (
            <div className="bars">
              {overall.rows.map((r, i) => (
                <BarRow key={r.value} label={r.value} count={r.count} percent={r.percent}
                  tone={i === 0 ? 'var(--moe-green)' : 'var(--moe-blue)'} />
              ))}
            </div>
          )}
          <p className="report__note">ن = {num(overall.n)} استجابة أجابت على التقويم العام.</p>
        </section>

        <section className="report__section">
          <h2 className="report__h2">نقاط القوة</h2>
          <RankedList rows={strengths} />
          <h2 className="report__h2">فرص التحسين</h2>
          <RankedList rows={gaps} variant="gap" />
        </section>

        <section className="report__section">
          <h2 className="report__h2">تحليل الأسئلة</h2>
          <Legend items={state.options.map((o) => ({ label: o.label, tone: OPTION_TONES[o.id] }))} />
          <ReverseNote />
          <div className="qlist">
            {questions.map((q) => (
              <article key={q.question.id} className="qlist__item">
                <header className="qlist__head">
                  <span className="qlist__text">{num(q.question.order)}. {q.question.text}</span>
                  <span className="qlist__meta">
                    ن = {num(q.n)}{q.adjustedMean !== null && ` · ${avg(q.adjustedMean)}`}
                    {q.question.direction === 'reverse' && <span className="tag">عكسي</span>}
                  </span>
                </header>
                <StackedBar n={q.n} segments={q.counts.map((c) => ({
                  label: c.label, count: c.count, percent: c.percent, tone: OPTION_TONES[c.optionId],
                }))} />
              </article>
            ))}
          </div>
        </section>

        <section className="report__section">
          <h2 className="report__h2">صوت طالباتنا</h2>
          <p className="report__note">
            {num(voices.length)} رأيًا ومقترحًا، معروضة بنصّها الأصلي كما كتبته الطالبات.
          </p>
          <ul className="quotes">
            {voices.slice(0, 40).map((v) => <li key={v.id} className="quote">{v.text}</li>)}
          </ul>
        </section>

        <section className="report__section">
          <h2 className="report__h2">استجابة المدرسة — من الرأي إلى التحسين</h2>
          {actions.length === 0 ? (
            <p className="muted">لم تُسجَّل إجراءات تحسين بعد.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">الإجراء</th>
                  <th scope="col">المشكلة</th>
                  <th scope="col">المسؤول</th>
                  <th scope="col">الحالة</th>
                  <th scope="col">الإنجاز</th>
                  <th scope="col">الأثر</th>
                  <th scope="col">الدليل</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id}>
                    <td><span className="table__title">{a.title}</span></td>
                    <td>{a.problem || '—'}</td>
                    <td>{a.owner || '—'}</td>
                    <td>{STATUS[a.status]}</td>
                    <td>{dateOnly(a.doneDate)}</td>
                    <td>{a.impact || '—'}</td>
                    <td>{a.evidence.length ? num(a.evidence.length) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="report__section">
          <h2 className="report__h2">غير المستجيبات</h2>
          <p className="report__note">{num(missing.length)} طالبة في الكشف بلا استجابة مؤكّدة.</p>
          {missing.length > 0 && (
            <ol className="names-grid">
              {missing.map((s) => <li key={s.id}>{s.name}</li>)}
            </ol>
          )}
        </section>

        <footer className="report__footer">
          <span>{ORGANIZATION.directorate} — {state.meta.school}</span>
          <span>{hijriToday()}</span>
        </footer>
      </article>
    </>
  )
}
