import { useMemo, useState } from 'react'

import { ReportChrome } from '../../components/ReportChrome'
import { ScaleChart } from '../../components/ScaleChart'
import { ShareChart } from '../../components/ShareChart'
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
import { fullClass, orderedClasses, shortClass, shortGrade } from '../../lib/labels'
import { useSystem } from '../../state/useSystem'

const STATUS = { planned: 'مخطط', in_progress: 'جارٍ التنفيذ', completed: 'مكتمل' } as const

/** أقسام التقرير بترتيبها — الفهرس والترقيم يقرآن من هنا وحدهما. */
const SECTIONS = [
  'الملخّص التنفيذي',
  'منهجية القياس وقواعد الحساب',
  'معلومات القياس',
  'التقويم العام للمدرسة',
  'مقارنة الصفوف',
  'الفصول',
  'نقاط القوة وفرص التحسين',
  'تحليل الأسئلة',
  'صوت طالباتنا',
  'استجابة المدرسة — من الرأي إلى التحسين',
  'غير المستجيبات',
] as const

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

  const reportTitle = `${state.meta.surveyTitle} ${arabicDigits(state.meta.hijriYear)}هـ`

  /** رقم وثيقة ثابت للنسخة: يميّز نطاق التقرير وعامه عند الأرشفة. */
  const docRef = arabicDigits(
    `QT/${state.meta.hijriYear}/${classId !== 'all' ? classId : gradeId !== 'all' ? gradeId : 'ALL'}`
      .toUpperCase(),
  )

  /** مقارنة الصفوف: لا تُبنى إلا في نطاق المدرسة. */
  const byGrade = useMemo(() => {
    if (gradeId !== 'all' || classId !== 'all') return []
    return state.grades
      .filter((g) => state.classes.some((c) => c.gradeId === g.id))
      .sort((a, b) => a.no - b.no)
      .map((g) => ({
        grade: g,
        part: participation(state, { gradeId: g.id }),
        index: satisfactionIndex(state, { gradeId: g.id }),
      }))
  }, [state, gradeId, classId])

  /**
   * الفصول بترتيب الصف ثم رقم الفصل: أولى ١، أولى ٢، ثانية ١ …
   *
   * لا تُبنى داخل نطاق فصل واحد: تفصيل فصلٍ إلى نفسه لا يضيف شيئًا.
   */
  const byClass = useMemo(() => {
    if (classId !== 'all') return []
    return orderedClasses(state.grades, state.classes)
      .filter(({ room }) => gradeId === 'all' || room.gradeId === gradeId)
      .map(({ room, grade }) => ({
        room,
        grade,
        part: participation(state, { classId: room.id }),
        index: satisfactionIndex(state, { classId: room.id }),
      }))
  }, [state, gradeId, classId])

  /**
   * الملخّص التنفيذي: جُمل مبنيّة من الأرقام المحسوبة وحدها.
   *
   * لا حكم ولا ترجيح ولا كلمة مدح: القارئ في الوزارة يقرأ ما تقوله
   * البيانات، والرأي فيها له لا لهذه الصفحة.
   */
  const summary = useMemo(() => {
    const lines: string[] = []
    lines.push(
      `شمل القياس ${num(part.totalStudents)} طالبة في ${scopeName}، `
      + `واستُلمت ${num(part.responsesReceived)} استجابة، `
      + `منها ${num(part.confirmedRespondents)} استجابة مؤكّدة المطابقة `
      + `بنسبة ${pct(part.rate)} من طالبات الكشوف.`,
    )
    if (index.mean !== null) {
      lines.push(
        `بلغ مؤشر الاتجاه ${avg(index.mean)} على مقياس من ${num(index.scaleMin)} `
        + `إلى ${num(index.scaleMax)}، أي ${pct(index.percent ?? 0)} من مدى المقياس، `
        + `محسوبًا على ${num(index.n)} إجابة مقيسة في ${num(index.questionCount)} سؤالًا.`,
      )
    }
    if (overall.n > 0 && overall.rows.length > 0) {
      const top = overall.rows[0]
      lines.push(
        `في التقويم العام، اختار ${num(top.count)} من ${num(overall.n)} `
        + `تقدير «${top.value}» بنسبة ${pct(top.percent)}.`,
      )
    }
    // تُذكر البنود بأرقامها لا بنصّها: نص السؤال يُعرض في القسم السادس
    // كما ورد في المصدر حرفًا بحرف، واختصاره هنا يشوّهه
    const numbers = (rows: typeof strengths) =>
      rows.slice(0, 3).map((r) => num(r.question.order)).join(' و')
    if (strengths.length > 0) {
      lines.push(
        `أعلى ثلاثة بنود بالمتوسط المصحَّح هي الأسئلة ${numbers(strengths)} `
        + `(المتوسط الأعلى ${avg(strengths[0].adjustedMean as number)}) — نصّها في القسم ${num(7)}.`,
      )
    }
    if (gaps.length > 0) {
      lines.push(
        `أدنى ثلاثة بنود هي الأسئلة ${numbers(gaps)} `
        + `(المتوسط الأدنى ${avg(gaps[0].adjustedMean as number)}) — وهي مادّة خطة التحسين.`,
      )
    }
    if (voices.length > 0) {
      lines.push(`سجّلت الطالبات ${num(voices.length)} رأيًا ومقترحًا بنصّها الأصلي.`)
    }
    if (part.awaitingReview > 0) {
      lines.push(
        `${num(part.awaitingReview)} استجابة ما زالت بانتظار مراجعة المطابقة، `
        + `فهي داخلة في تحليل الأسئلة وغير داخلة في نسبة الاستجابة المؤكّدة.`,
      )
    }
    return lines
  }, [part, index, overall, strengths, gaps, voices, scopeName])

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

      <ReportChrome title={reportTitle} scope={scopeName}>
      <article className="report">
        {/* الغلاف */}
        <section className="report__cover">
          <img className="report__logo" src={ORGANIZATION.logo} alt={`شعار ${ORGANIZATION.ministry}`} />
          <p className="report__org">{ORGANIZATION.ministry}</p>
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
            <div><dt>رقم الوثيقة</dt><dd>{docRef}</dd></div>
          </dl>
          <p className="report__classification">
            وثيقة داخلية صادرة عن المدرسة — تتضمّن أسماء طالبات في قسم «غير المستجيبات»،
            فلا تُتداول خارج من يخصّه الأمر.
          </p>
        </section>

        {/* فهرس المحتويات */}
        <section className="report__section report__toc">
          <h2 className="report__h2 report__h2--plain">فهرس المحتويات</h2>
          <ol className="toc">
            {SECTIONS.map((title, i) => (
              <li key={title} className="toc__row">
                <span className="toc__no">{num(i + 1)}</span>
                <span className="toc__title">{title}</span>
              </li>
            ))}
          </ol>
          <p className="report__note">
            أعداد الصفحات يضيفها المتصفّح عند الطباعة من خيار «الترويسات والتذييلات».
          </p>
        </section>

        {/* الملخّص التنفيذي */}
        <section className="report__section report__summary">
          <h2 className="report__h2"><span className="report__no">{num(1)}</span> الملخّص التنفيذي</h2>
          <ul className="findings">
            {summary.map((line) => <li key={line} className="finding">{line}</li>)}
          </ul>
          <p className="report__note">
            كل رقم في هذا الملخّص محسوب من البيانات المرفوعة، ومفصَّل في الأقسام التالية
            بقاعدة حسابه.
          </p>
        </section>

        <section className="report__section">
          <h2 className="report__h2"><span className="report__no">{num(2)}</span> منهجية القياس وقواعد الحساب</h2>
          <ol className="method">
            <li>
              <strong>الأداة:</strong> استمارة «{state.meta.surveyTitle}» بأسئلتها وخياراتها
              كما وردت في المصدر، دون تعديل نصّ سؤال ولا خيار إجابة.
            </li>
            <li>
              <strong>المجتمع:</strong> طالبات {scopeName} وفق الكشوف الرسمية المرفوعة
              ({num(part.totalStudents)} طالبة).
            </li>
            <li>
              <strong>الجمع:</strong> استجابة إلكترونية ذاتية، تكتب فيها الطالبة اسمها
              وتراجعه المدرسة ليُطابَق بالكشف. ولا تُنسب استجابة إلى طالبة قبل تأكيد المطابقة.
            </li>
            <li>
              <strong>المقياس:</strong> من {num(index.scaleMin)} إلى {num(index.scaleMax)}.
              الأسئلة العكسية تُصحَّح باتجاهها قبل دخولها المؤشر، فالمتوسط الأعلى يعني
              اتجاهًا أفضل في كل البنود دون استثناء.
            </li>
            <li>
              <strong>قاعدتا الحساب — وهما مختلفتان عمدًا:</strong> نسبة الاستجابة
              تُحسب على الاستجابات المؤكّدة المطابقة وحدها من إجمالي طالبات الكشوف،
              بينما يُحسب مؤشر الاتجاه وتحليل الأسئلة على كل الاستجابات المنسوبة
              إلى النطاق. فلا تُقرأ إحدى النسبتين مكان الأخرى.
            </li>
            <li>
              <strong>المفقود:</strong> السؤال غير المُجاب يخرج من قاعدة حسابه
              ولا يُحتسب صفرًا، ويُذكر عدده تحت كل سؤال.
            </li>
          </ol>
        </section>

        <section className="report__section">
          <h2 className="report__h2"><span className="report__no">{num(3)}</span> معلومات القياس</h2>
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
          <h2 className="report__h2"><span className="report__no">{num(4)}</span> التقويم العام للمدرسة</h2>
          {overall.n === 0 ? <p className="muted">لا توجد بيانات.</p> : (
            <ShareChart
              title="توزيع تقديرات التقويم العام"
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

{byGrade.length > 0 && (
          <section className="report__section">
            <h2 className="report__h2"><span className="report__no">{num(5)}</span> مقارنة الصفوف</h2>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">الصف</th>
                  <th scope="col">عدد الطالبات</th>
                  <th scope="col">المستجيبات المؤكّدات</th>
                  <th scope="col">نسبة الاستجابة</th>
                  <th scope="col">مؤشر الاتجاه</th>
                </tr>
              </thead>
              <tbody>
                {byGrade.map((g) => (
                  <tr key={g.grade.id}>
                    <td><span className="table__title">{g.grade.name}</span></td>
                    <td>{num(g.part.totalStudents)}</td>
                    <td>{num(g.part.confirmedRespondents)}</td>
                    <td>{pct(g.part.rate)}</td>
                    <td>{g.index.mean === null ? '—' : avg(g.index.mean)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ScaleChart
              title="مؤشر الاتجاه لكل صف"
              min={index.scaleMin}
              max={index.scaleMax}
              reference={index.mean}
              referenceLabel="المدرسة"
              rows={byGrade.map((g) => ({
                label: shortGrade(g.grade.no),
                value: g.index.mean,
              }))}
            />
            <p className="report__note">
              نسبة الاستجابة هنا على الكشوف الرسمية للصف. وقد تتجاوز المئة في صفٍّ
              وصلت استجاباته المؤكّدة أكثر مما في كشفه، وهو مؤشر على كشف يحتاج تحديثًا
              لا على خطأ في العدّ.
            </p>
          </section>
        )}

        {byClass.length > 0 && (
          <section className="report__section">
            <h2 className="report__h2"><span className="report__no">{num(6)}</span> الفصول</h2>
            <p className="report__note">
              كل فصل على حدة، بترتيب الصف ثم رقم الفصل. ويُقرأ كل فصل منسوبًا إلى مؤشر
              المدرسة ({index.mean === null ? '—' : avg(index.mean)}) المرسوم خطًّا في الرسم.
            </p>

            <ScaleChart
              title="مؤشر الاتجاه لكل فصل"
              min={index.scaleMin}
              max={index.scaleMax}
              reference={index.mean}
              referenceLabel="المدرسة"
              rows={byClass.map((c) => ({
                label: shortClass(c.grade, c.room),
                value: c.index.mean,
              }))}
            />

            <table className="table">
              <thead>
                <tr>
                  <th scope="col">الفصل</th>
                  <th scope="col">عدد الطالبات</th>
                  <th scope="col">المستجيبات المؤكّدات</th>
                  <th scope="col">الاستجابات المستلمة</th>
                  <th scope="col">نسبة من أجابت</th>
                  <th scope="col">مؤشر الاتجاه</th>
                </tr>
              </thead>
              <tbody>
                {byClass.map((c) => (
                  <tr key={c.room.id}>
                    <td><span className="table__title">{fullClass(c.grade, c.room)}</span></td>
                    <td>{num(c.part.totalStudents)}</td>
                    <td>{num(c.part.confirmedRespondents)}</td>
                    <td>{num(c.part.responsesReceived)}</td>
                    <td>{c.part.totalStudents ? pct(c.part.receivedRate) : '—'}</td>
                    <td>{c.index.mean === null ? '—' : avg(c.index.mean)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="report__section">
          <h2 className="report__h2"><span className="report__no">{num(7)}</span> نقاط القوة وفرص التحسين</h2>
          <h3 className="report__h3">نقاط القوة</h3>
          <RankedList rows={strengths} />
          <h3 className="report__h3">فرص التحسين</h3>
          <RankedList rows={gaps} variant="gap" />
        </section>

        <section className="report__section">
          <h2 className="report__h2"><span className="report__no">{num(8)}</span> تحليل الأسئلة</h2>
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
          <h2 className="report__h2"><span className="report__no">{num(9)}</span> صوت طالباتنا</h2>
          <p className="report__note">
            {num(voices.length)} رأيًا ومقترحًا، معروضة بنصّها الأصلي كما كتبته الطالبات.
          </p>
          <ul className="quotes">
            {voices.slice(0, 40).map((v) => <li key={v.id} className="quote">{v.text}</li>)}
          </ul>
        </section>

        <section className="report__section">
          <h2 className="report__h2"><span className="report__no">{num(10)}</span> استجابة المدرسة — من الرأي إلى التحسين</h2>
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
          <h2 className="report__h2"><span className="report__no">{num(11)}</span> غير المستجيبات</h2>
          <p className="report__note">{num(missing.length)} طالبة في الكشف بلا استجابة مؤكّدة.</p>
          {missing.length > 0 && (
            <ol className="names-grid">
              {missing.map((s) => <li key={s.id}>{s.name}</li>)}
            </ol>
          )}
        </section>

        <section className="report__section report__approval">
          <h2 className="report__h2 report__h2--plain">الاعتماد</h2>
          <div className="approval">
            <div className="approval__box">
              <span className="approval__role">معدّة التقرير</span>
              <span className="approval__line" aria-hidden="true" />
              <span className="approval__hint">الاسم والتوقيع</span>
            </div>
            <div className="approval__box">
              <span className="approval__role">قائدة المدرسة</span>
              <span className="approval__line" aria-hidden="true" />
              <span className="approval__hint">الاسم والتوقيع والختم</span>
            </div>
            <div className="approval__box">
              <span className="approval__role">تاريخ الاعتماد</span>
              <span className="approval__line" aria-hidden="true" />
              <span className="approval__hint">اليوم / الشهر / السنة هـ</span>
            </div>
          </div>
        </section>

        <footer className="report__footer">
          <span>{ORGANIZATION.directorate} — {state.meta.school}</span>
          <span>{docRef}</span>
          <span>{hijriToday()}</span>
        </footer>
      </article>
      </ReportChrome>
    </>
  )
}
