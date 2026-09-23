import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { ShareChart } from '../../components/ShareChart'
import { ORGANIZATION } from '../../brand'
import {
  SCHOOL_SCOPE, overallDistribution, participation, satisfactionIndex,
  strengthsAndGaps,
} from '../../lib/analysis'
import { delta } from '../../lib/delta'
import { avg, arabicDigits, hijriToday, num, pct } from '../../lib/format'
import { orderedClasses, shortClass, shortGrade } from '../../lib/labels'
import { useSystem } from '../../state/useSystem'

/**
 * لوحة العرض: الشاشة التي تُعرض على الإدارة.
 *
 * هي نفس البيانات ونفس الحسابات، لا نسخة منها: تقرأ من المصدر نفسه
 * الذي تقرأ منه لوحة التعديل، فلا يمكن أن يختلف رقمٌ هنا عن رقمٍ هناك.
 *
 * والفرق أنها بلا أزرار ولا قوائم ولا حقول: كل ما فيها للقراءة من
 * بعد. ولا تحتاج صلاحية جديدة ولا رابطًا مفتوحًا لأحد: من يفتحها هو
 * من دخل بحساب المدرسة أصلًا.
 */
export function DisplayPage() {
  const { state } = useSystem()

  const part = participation(state, SCHOOL_SCOPE)
  const index = satisfactionIndex(state, SCHOOL_SCOPE)
  const overall = overallDistribution(state, SCHOOL_SCOPE)
  const { strengths, gaps } = strengthsAndGaps(state, SCHOOL_SCOPE, 3)

  const grades = state.grades
    .filter((g) => state.classes.some((c) => c.gradeId === g.id))
    .sort((a, b) => a.no - b.no)
    .map((g) => ({ name: shortGrade(g.no), index: satisfactionIndex(state, { gradeId: g.id }) }))

  const rooms = orderedClasses(state.grades, state.classes).map(({ room, grade }) => ({
    id: room.id,
    name: shortClass(grade, room),
    index: satisfactionIndex(state, { classId: room.id }),
    part: participation(state, { classId: room.id }),
  }))

  // العرض على شاشة: الخروج بمفتاح Escape كما يتوقّع من يعرض
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.location.hash = '#/admin'
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const span = index.scaleMax - index.scaleMin || 1
  const place = (v: number) => ((v - index.scaleMin) / span) * 100

  return (
    <div className="show">
      <header className="show__top">
        <img className="show__logo" src={ORGANIZATION.logo} alt="" />
        <div className="show__id">
          <h1 className="show__school">{state.meta.school}</h1>
          <p className="show__survey">
            {state.meta.surveyTitle} {arabicDigits(state.meta.hijriYear)}هـ
            <span className="show__dot" aria-hidden="true">·</span>
            {ORGANIZATION.directorate}
          </p>
        </div>
        <Link className="show__exit no-print" to="/admin">إنهاء العرض</Link>
      </header>

      <div className="show__body">
        <section className="show__index">
          <p className="show__label">مؤشر اتجاه المتعلمات</p>
          <p className="show__big">
            {index.mean === null ? '—' : avg(index.mean)}
            <span>من {num(index.scaleMax)}</span>
          </p>
          {index.mean !== null && (
            <div className="show__track" aria-hidden="true">
              <span className="show__fill" style={{ width: `${place(index.mean)}%` }} />
            </div>
          )}
          <dl className="show__facts">
            <div><dt>طالبة في الكشوف</dt><dd>{num(part.totalStudents)}</dd></div>
            <div><dt>استجابة واردة</dt><dd>{num(part.responsesReceived)}</dd></div>
            <div><dt>نسبة من أجابت</dt><dd>{pct(part.receivedRate)}</dd></div>
          </dl>
        </section>

        <section className="show__panel">
          <h2 className="show__h2">الصفوف</h2>
          <ul className="show__bars">
            {grades.map((g) => (
              <li key={g.name}>
                <span className="show__bar-name">{g.name}</span>
                <span className="show__bar-track">
                  <span
                    className={g.index.mean !== null && index.mean !== null
                      && g.index.mean >= index.mean ? 'show__bar is-above' : 'show__bar'}
                    style={{ width: `${g.index.mean === null ? 0 : place(g.index.mean)}%` }}
                  />
                </span>
                <span className="show__bar-value">
                  {g.index.mean === null ? '—' : avg(g.index.mean)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="show__panel">
          <h2 className="show__h2">التقويم العام</h2>
          {overall.n === 0 ? <p className="muted">لا توجد بيانات.</p> : (
            <ShareChart
              title=""
              n={overall.n}
              shares={overall.rows.map((r, i) => ({
                label: r.value,
                count: r.count,
                percent: r.percent,
                tone: i === 0 ? 'var(--opt-agree)'
                  : i === 1 ? 'var(--opt-middle)' : 'var(--opt-none)',
              }))}
            />
          )}
        </section>

        <section className="show__panel show__panel--wide">
          <h2 className="show__h2">الفصول</h2>
          <ol className="show__rooms">
            {rooms.map((r) => {
              const above = r.index.mean !== null && index.mean !== null
                && r.index.mean >= index.mean
              return (
                <li key={r.id} className="show__room">
                  <span className="show__room-name">{r.name}</span>
                  <strong className="show__room-value">
                    {r.index.mean === null ? '—' : avg(r.index.mean)}
                  </strong>
                  <span className={above ? 'show__room-delta is-above' : 'show__room-delta'}>
                    {r.index.mean !== null && index.mean !== null
                      ? delta(r.index.mean, index.mean) : ''}
                  </span>
                  <span className="show__room-rate">
                    {r.part.totalStudents ? pct(r.part.receivedRate) : '—'}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="show__panel show__panel--half">
          <h2 className="show__h2">أعلى البنود</h2>
          <ol className="show__list">
            {strengths.map((q) => (
              <li key={q.question.id}>
                <span>{q.question.text}</span>
                <strong>{avg(q.adjustedMean as number)}</strong>
              </li>
            ))}
          </ol>
        </section>

        <section className="show__panel show__panel--half">
          <h2 className="show__h2">أولى البنود بالتحسين</h2>
          <ol className="show__list">
            {gaps.map((q) => (
              <li key={q.question.id}>
                <span>{q.question.text}</span>
                <strong>{avg(q.adjustedMean as number)}</strong>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="show__foot">
        <span>{hijriToday()}</span>
        <span>
          المؤشر على مقياس من {num(index.scaleMin)} إلى {num(index.scaleMax)} بعد تصحيح
          اتجاه العبارات العكسية · ن = {num(index.n)} إجابة مُقيَّسة
        </span>
      </footer>
    </div>
  )
}
