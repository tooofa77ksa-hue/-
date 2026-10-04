import { useEffect, useState } from 'react'

import { ImpactBands, ImpactPraise } from '../../components/ImpactShow'
import { LockToggle } from '../../components/LockToggle'
import { Ring } from '../../components/Ring'
import { ShareChart } from '../../components/ShareChart'
import { ORGANIZATION, SCHOOL_SIGNERS } from '../../brand'
import {
  SCHOOL_SCOPE, overallDistribution, satisfactionIndex, strengthsAndGaps,
} from '../../lib/analysis'
import { coverage } from '../../lib/attendance'
import { improvementBands } from '../../lib/bands'
import { delta } from '../../lib/delta'
import { avg, hijriToday, num } from '../../lib/format'
import { orderedClasses, shortClass, shortGrade, splitQuestion } from '../../lib/labels'
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
/**
 * بنودٌ في الشريحة الواحدة.
 *
 * أحد عشر بندًا في شاشةٍ واحدة تُقصّ البطاقات في منتصف الباركود، فلا
 * يُمسح ولا يُقرأ ما تحته. والعرض لا يُمرَّر بالإصبع أمام لجنة:
 * يُقسَّم شرائح تُقلَّب بالسهم كما تُقلَّب أي شريحة أخرى.
 */
const PER_SLIDE = 4

export function DisplayPage() {
  const { state } = useSystem()
  const [screen, setScreen] = useState(0)

  const bands = improvementBands(state)
  // بلا بنود: تُطوى شرائح التحسين ولا تبقى شريحةٌ بيضاء
  const bandSlides = Math.ceil(bands.length / PER_SLIDE)
  const SCREENS = [
    'الأرقام',
    ...Array.from({ length: bandSlides }, (_, i) =>
      bandSlides > 1 ? `التحسين ${i + 1}` : 'من الرأي إلى التحسين'),
    'صوت طالباتنا',
  ]
  const last = SCREENS.length - 1

  const cover = coverage(state, SCHOOL_SCOPE)
  const index = satisfactionIndex(state, SCHOOL_SCOPE)
  const overall = overallDistribution(state, SCHOOL_SCOPE)
  const { strengths, gaps } = strengthsAndGaps(state, SCHOOL_SCOPE, 4)

  const grades = state.grades
    .filter((g) => state.classes.some((c) => c.gradeId === g.id))
    .sort((a, b) => a.no - b.no)
    .map((g) => ({ name: shortGrade(g.no), index: satisfactionIndex(state, { gradeId: g.id }) }))

  const rooms = orderedClasses(state.grades, state.classes).map(({ room, grade }) => ({
    id: room.id,
    name: shortClass(grade, room),
    index: satisfactionIndex(state, { classId: room.id }),
    cover: coverage(state, { classId: room.id }),
  }))

  // العرض على شاشة: الخروج بمفتاح Escape، والتنقّل بين الشرائح
  // بالأسهم ومسطرة المسافة — كما يتوقّع من يعرض على جهاز عرض
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { window.location.hash = '#/admin'; return }
      // لوحة عربية: السهم الأيمن يتقدّم لأن القراءة من اليمين
      if (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        setScreen((n) => Math.min(n + 1, last))
      }
      if (e.key === 'ArrowRight' || e.key === 'PageUp') {
        e.preventDefault()
        setScreen((n) => Math.max(n - 1, 0))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last])

  const span = index.scaleMax - index.scaleMin || 1
  const place = (v: number) => ((v - index.scaleMin) / span) * 100
  /** موضع مؤشر المدرسة على المسطرة: الخط الذي تُقاس إليه الصفوف. */
  const mark = index.mean === null ? null : place(index.mean)

  const item = (q: { question: { id: string; text: string }; adjustedMean: number | null }) => {
    const { no, body } = splitQuestion(q.question.text)
    return (
      <li key={q.question.id}>
        {no && <span className="show__no">{no}</span>}
        <span className="show__item">{body}</span>
        <strong>{avg(q.adjustedMean as number)}</strong>
      </li>
    )
  }

  return (
    <div className="show">
      <header className="show__top">
        <img className="show__logo" src={ORGANIZATION.logo} alt="" />
        <div className="show__id">
          <h1 className="show__school">{state.meta.school}</h1>
          <p className="show__survey">
            {state.meta.surveyTitle} {state.meta.hijriYear}هـ
            <span className="show__dot" aria-hidden="true">·</span>
            {ORGANIZATION.directorate}
          </p>
        </div>
        <div className="show__exit no-print"><LockToggle locked /></div>
      </header>

      {screen === 0 && (
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
            <div><dt>طالبة في الكشوف</dt><dd>{num(cover.students)}</dd></div>
            <div><dt>سُمع صوتها</dt><dd>{num(cover.traced)}</dd></div>
            <div><dt>إجابة مُقيَّسة</dt><dd>{num(index.n)}</dd></div>
          </dl>
        </section>

        <section className="show__panel show__panel--ring">
          <h2 className="show__h2">المشاركة</h2>
          <Ring done={cover.traced} total={cover.students} />
          <p className="show__note">
            {cover.students - cover.traced === 0
              ? 'لم تبقَ طالبة واحدة بلا صوت'
              : `بقيت ${num(cover.students - cover.traced)} طالبة`}
          </p>
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
          <h2 className="show__h2">
            الفصول
            <span className="show__legend">
              المؤشر من {num(index.scaleMin)} إلى {num(index.scaleMax)} · والشريط نسبة من سُمع صوتها
            </span>
          </h2>
          <ol className="show__rooms">
            {rooms.map((r) => {
              const full = r.cover.students > 0 && r.cover.traced === r.cover.students
              return (
                <li key={r.id} className={full ? 'show__room is-full' : 'show__room'}>
                  <span className="show__room-name">{r.name}</span>
                  <strong className="show__room-value">
                    {r.index.mean === null ? '—' : avg(r.index.mean)}
                  </strong>
                  <span className={r.index.mean !== null && index.mean !== null
                    && r.index.mean >= index.mean
                    ? 'show__room-delta is-above' : 'show__room-delta'}>
                    {r.index.mean !== null && index.mean !== null
                      ? delta(r.index.mean, index.mean) : ''}
                  </span>
                  <span className="show__room-track" aria-hidden="true">
                    <span className="show__room-fill" style={{ width: `${r.cover.rate}%` }} />
                  </span>
                  <span className="show__room-rate">
                    {full ? 'كاملة ✓' : `${num(r.cover.traced)} من ${num(r.cover.students)}`}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="show__panel">
          <h2 className="show__h2">
            الصفوف
            <span className="show__legend">الخطّ = المدرسة</span>
          </h2>
          <ul className="show__bars">
            {grades.map((g) => (
              <li key={g.name}>
                <span className="show__bar-name">{g.name}</span>
                <span className="show__bar-track">
                  {mark !== null && (
                    <span className="show__bar-mark" style={{ insetInlineStart: `${mark}%` }} />
                  )}
                  <span
                    className="show__bar"
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
          <h2 className="show__h2">أعلى البنود</h2>
          <ol className="show__list">{strengths.map(item)}</ol>
        </section>

        <section className="show__panel">
          <h2 className="show__h2">أولى البنود بالتحسين</h2>
          <ol className="show__list">{gaps.map(item)}</ol>
        </section>
      </div>
      )}

      {screen > 0 && screen < last && bands.length > 0 && (
        <ImpactBands
          bands={bands.slice((screen - 1) * PER_SLIDE, screen * PER_SLIDE)}
          all={bands} page={screen - 1} pages={bandSlides}
        />
      )}

      {screen === last && <ImpactPraise state={state} bands={bands.length} />}

      <nav className="show__dots no-print" aria-label="شرائح العرض">
        {SCREENS.map((name, i) => (
          <button
            key={name} type="button"
            className={i === screen ? 'show__dot-btn is-on' : 'show__dot-btn'}
            aria-current={i === screen}
            onClick={() => setScreen(i)}
          >
            {name}
          </button>
        ))}
      </nav>

      <footer className="show__foot">
        <dl className="show__signers">
          {SCHOOL_SIGNERS.map((s) => (
            <div key={s.name}>
              <dt>{s.role}</dt>
              <dd>{s.name}</dd>
            </div>
          ))}
        </dl>

        <div className="show__fine">
          <span>{hijriToday()}</span>
          <span>
            المؤشر على مقياس من {num(index.scaleMin)} إلى {num(index.scaleMax)} بعد تصحيح
            اتجاه العبارات العكسية · ن = {num(index.n)} إجابة مُقيَّسة ·
            المشاركة بالطالبة لا بالورقة
          </span>
        </div>
      </footer>
    </div>
  )
}
