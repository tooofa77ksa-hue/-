import { BarRow } from './BarRow'
import { Legend } from './Legend'
import { RankedList } from './RankedList'
import { ReverseNote } from './ReverseNote'
import { SectionTitle } from './SectionTitle'
import { StatCard } from './StatCard'
import { StackedBar } from './StackedBar'
import { OPTION_TONES } from '../lib/tones'
import {
  analyzeAllQuestions, overallDistribution, participation,
  satisfactionIndex, strengthsAndGaps, suggestionsInScope, type Scope,
} from '../lib/analysis'
import { avg, num, pct } from '../lib/format'
import { useSystem } from '../state/useSystem'

interface ScopeDashboardProps {
  scope: Scope
  /** يوضّح قاعدة الحساب للمستخدم، خصوصًا على مستوى الفصل. */
  basisNote?: string
}

/** لوحة نتائج مشتركة بين الصف والفصل — نفس الحسابات ونفس العرض. */
export function ScopeDashboard({ scope, basisNote }: ScopeDashboardProps) {
  const { state } = useSystem()
  const part = participation(state, scope)
  const index = satisfactionIndex(state, scope)
  const overall = overallDistribution(state, scope)
  const questions = analyzeAllQuestions(state, scope)
  const { strengths, gaps } = strengthsAndGaps(state, scope, 3)
  const voices = suggestionsInScope(state, scope)

  return (
    <>
      <section className="stats">
        <StatCard tone="blue" label="عدد الطالبات" value={num(part.totalStudents)} />
        <StatCard
          tone="green" label="المستجيبات المؤكّدات" value={num(part.confirmedRespondents)}
          progress={part.rate} meta={`نسبة ${pct(part.rate)}`}
        />
        <StatCard tone="sand" label="غير المستجيبات" value={num(part.nonRespondents)} />
        <StatCard
          tone="navy" label="مؤشر الاتجاه"
          value={index.mean === null ? '—' : avg(index.mean)}
          meta={index.mean === null ? 'لا توجد إجابات' : `ن = ${num(index.n)}`}
        />
      </section>

      {basisNote && <p className="basis-note">{basisNote}</p>}

      <div className="grid-2">
        <section className="panel panel--pad">
          <SectionTitle note={`ن = ${num(overall.n)}`}>التقويم العام</SectionTitle>
          {overall.n === 0 ? (
            <p className="muted">لا توجد بيانات تقويم عام في هذا النطاق.</p>
          ) : (
            <div className="bars">
              {overall.rows.map((r, i) => (
                <BarRow key={r.value} label={r.value} count={r.count} percent={r.percent}
                  tone={i === 0 ? 'var(--moe-green)' : 'var(--moe-blue)'} />
              ))}
            </div>
          )}
        </section>

        <section className="panel panel--pad">
          <SectionTitle>نقاط القوة وفرص التحسين</SectionTitle>
          {questions.length === 0 ? (
            <p className="muted">لا توجد إجابات كافية.</p>
          ) : (
            <>
              <p className="sub-label">الأعلى</p>
              <RankedList rows={strengths} />
              <p className="sub-label">الأدنى</p>
              <RankedList rows={gaps} variant="gap" />
            </>
          )}
        </section>
      </div>

      <section className="panel panel--pad">
        <SectionTitle note="النسب محسوبة على الإجابات الصالحة لكل سؤال">نتائج الأسئلة</SectionTitle>
        <Legend items={state.options.map((o) => ({ label: o.label, tone: OPTION_TONES[o.id] }))} />
        <ReverseNote />
        <div className="qlist">
          {questions.map((q) => (
            <article key={q.question.id} className="qlist__item">
              <header className="qlist__head">
                <span className="qlist__text">
                  {q.question.text}
                  {q.question.direction === 'reverse' && <span className="tag">عكسي</span>}
                </span>
                <span className="qlist__meta">
                  ن = {num(q.n)}
                  {q.missing > 0 && ` · مفقود ${num(q.missing)}`}
                  {q.adjustedMean !== null && ` · المتوسط ${avg(q.adjustedMean)}`}
                </span>
              </header>
              <StackedBar n={q.n} segments={q.counts.map((c) => ({
                label: c.label, count: c.count, percent: c.percent, tone: OPTION_TONES[c.optionId],
              }))} />
            </article>
          ))}
          {questions.length === 0 && <p className="muted">لا توجد إجابات في هذا النطاق.</p>}
        </div>
      </section>

      <section className="panel panel--pad">
        <SectionTitle note={`${num(voices.length)} رأيًا`}>الآراء والمقترحات</SectionTitle>
        {voices.length === 0 ? (
          <p className="muted">لا توجد آراء في هذا النطاق.</p>
        ) : (
          <ul className="quotes">
            {voices.slice(0, 12).map((v) => (
              <li key={v.id} className="quote">{v.text}</li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
