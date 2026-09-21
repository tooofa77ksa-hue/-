import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { BrandFooter } from '../../components/BrandFooter'
import {
  loadPublicContext, submitPublicResponse, type PublicContext,
} from '../../data/remote/firestoreRepo'
import { submitResponse } from '../../domain/actions'
import type { Id, Question } from '../../domain/types'
import { ensureRespondent } from '../../firebase/auth'
import { normalizeArabic } from '../../lib/arabic'
import { arabicDigits, num } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

const ORG_LOGO = '/brand/moe-logo.png'

/**
 * ترقيم المصدر في أول نص السؤال («1_» و«14_» و«6-») أثر من ملف
 * الاستمارة الأصلي، والشاشة تعرض «السؤال ١ من ٢٥» فوقه أصلًا.
 *
 * هذا إخفاء عند العرض للطالبة فقط: النص المخزَّن لا يُمسّ، والتقارير
 * وملفات Excel وشاشات الإدارة تعرضه كما ورد في المصدر حرفًا بحرف.
 */
const SOURCE_NUMBERING = /^\s*\d+\s*[-_]\s*/

function forDisplay(text: string): string {
  return text.replace(SOURCE_NUMBERING, '').trim() || text
}

type Stage = 'intro' | 'grade' | 'class' | 'student' | 'welcome' | 'ask' | 'review' | 'done'

interface Draft { [questionId: string]: string }

/**
 * رمز يميّز هذا الإرسال بعينه.
 *
 * يُولَّد مرة واحدة لكل قياس مفتوح، فلو ضُغط «إرسال» مرتين أو تعثّرت
 * الشبكة فأُعيدت المحاولة، عرفت الإدارة أن المستندين إرسال واحد مكرّر
 * لا رأيين. ولا يُحذف أي منهما: التكرار يُراجَع ولا يُمحى.
 */
function newToken(): string {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const prefersStill = () =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

export function SurveyPage() {
  const { classId: classFromLink } = useParams()
  const { state, replace, mode } = useSystem()
  const remote = mode === 'remote'

  // الوضع البعيد لا يحمّل أي بيانات مدرسة: يقرأ ما يلزم القياس فقط.
  const [context, setContext] = useState<PublicContext | null>(null)
  const [ready, setReady] = useState(!remote)
  const [loadError, setLoadError] = useState<string | null>(null)

  const token = useRef(newToken())
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const [gradeId, setGradeId] = useState<Id | null>(null)
  const [classId, setClassId] = useState<Id | null>(null)
  const [studentId, setStudentId] = useState<Id | null>(null)
  const [typedName, setTypedName] = useState('')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<Draft>({})
  const [cursor, setCursor] = useState(0)
  const [stage, setStage] = useState<Stage>('intro')
  const [outcome, setOutcome] = useState<'saved' | 'pending_review' | null>(null)
  const [highlight, setHighlight] = useState<Id | null>(null)

  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!remote) return
    let alive = true
    void (async () => {
      try {
        await ensureRespondent()
        const ctx = await loadPublicContext()
        if (!alive) return
        if (!ctx) setLoadError('لا يوجد قياس مفتوح حاليًا.')
        else setContext(ctx)
      } catch (error) {
        const raw = error instanceof Error ? error.message : String(error)
        // الدخول المجهول معطّل: القياس مقصور على الإدارة، لا أن النظام معطوب.
        const closed = /admin-restricted-operation|operation-not-allowed/.test(raw)
        if (alive) {
          setLoadError(closed
            ? 'القياس مقصور على الإدارة حاليًا. للدخول إلى اللوحة استخدمي رابط الإدارة.'
            : raw)
        }
      } finally {
        if (alive) setReady(true)
      }
    })()
    return () => { alive = false }
  }, [remote])

  const source = useMemo(() => (remote && context ? {
    cycleId: context.cycle.id,
    questionIds: context.cycle.questionIds,
    grades: context.grades,
    classes: context.classes,
    questions: context.questions,
    options: context.options,
    overallOptions: context.overallOptions,
  } : {
    cycleId: state.cycles[0]?.id ?? '',
    questionIds: state.cycles[0]?.questionIds ?? [],
    grades: state.grades,
    classes: state.classes,
    questions: state.questions,
    options: state.options,
    overallOptions: state.overallOptions,
  }), [remote, context, state])

  const linkedClass = source.classes.find((c) => c.id === classFromLink) ?? null

  // رابط فصل مباشر: يُطبَّق بعد وصول بيانات القياس لا قبلها
  useEffect(() => {
    if (!linkedClass) return
    setGradeId(linkedClass.gradeId)
    setClassId(linkedClass.id)
  }, [linkedClass])

  /** خطوات القياس بترتيب المصدر — لا يُغيَّر نص ولا خيار ولا ترتيب. */
  const steps = useMemo(
    () => source.questions
      .filter((q) => q.active && source.questionIds.includes(q.id))
      .sort((a, b) => a.order - b.order),
    [source],
  )

  const likert = steps.filter((q) => q.kind === 'likert')
  const required = steps.filter((q) => q.required)
  const missing = required.filter((q) => !draft[q.id]?.trim())
  const current = steps[cursor] ?? null

  const grades = useMemo(
    () => source.grades.filter((g) => source.classes.some((c) => c.gradeId === g.id)),
    [source],
  )
  const classes = useMemo(
    () => source.classes.filter((c) => c.gradeId === gradeId),
    [source, gradeId],
  )
  const students = useMemo(() => {
    // الوضع البعيد لا يحمّل أسماء الطالبات إطلاقًا، فالقائمة فارغة عمدًا
    if (remote) return []
    const needle = normalizeArabic(search)
    return state.students
      .filter((s) => s.classId === classId && s.status === 'active')
      .filter((s) => !needle || normalizeArabic(s.name).includes(needle))
      .sort((a, b) => (a.rosterNo ?? 0) - (b.rosterNo ?? 0))
  }, [remote, state.students, classId, search])

  const respondentName = remote
    ? typedName.trim()
    : state.students.find((s) => s.id === studentId)?.name ?? ''

  // كل انتقال يُعيد التركيز إلى العنوان، فتتبع قارئة الشاشة المسار
  useEffect(() => {
    headingRef.current?.focus()
  }, [stage, cursor])

  function beginAnswering() {
    setCursor(0)
    setStage('ask')
  }

  function choose(questionId: Id, value: string) {
    setDraft((d) => ({ ...d, [questionId]: value }))
    setHighlight(questionId)
    const advance = () => {
      setHighlight(null)
      setCursor((i) => {
        if (i + 1 < steps.length) return i + 1
        setStage('review')
        return i
      })
    }
    if (prefersStill()) advance()
    else window.setTimeout(advance, 260)
  }

  function goNext() {
    if (cursor + 1 < steps.length) setCursor(cursor + 1)
    else setStage('review')
  }

  function goBack() {
    if (cursor > 0) setCursor(cursor - 1)
    else setStage('welcome')
  }

  /** ينتقل إلى سؤال بعينه دون المساس بأي إجابة سابقة. */
  function jumpTo(questionId: Id) {
    const index = steps.findIndex((q) => q.id === questionId)
    if (index < 0) return
    setCursor(index)
    setStage('ask')
  }

  const buildAnswers = useCallback(() => steps.map((q) => {
    const raw = draft[q.id]?.trim() || null
    if (q.kind === 'likert' && raw) {
      const option = source.options.find((o) => o.id === raw)
      return {
        questionId: q.id, optionId: option?.id ?? null,
        rawValue: option?.label ?? null, score: option?.score ?? null,
      }
    }
    return { questionId: q.id, optionId: null, rawValue: raw, score: null }
  }), [steps, draft, source.options])

  async function send() {
    setSendError(null)
    if (missing.length > 0) {
      jumpTo(missing[0].id)
      return
    }
    if (sending) return

    if (!remote) {
      const result = submitResponse(state, {
        studentId: studentId!, cycleId: source.cycleId, answers: buildAnswers(),
      })
      replace(result.state)
      setOutcome(result.status)
      setStage('done')
      return
    }

    setSending(true)
    try {
      await submitPublicResponse({
        cycleId: source.cycleId,
        rawName: typedName,
        declaredGradeId: gradeId,
        classId,
        answers: buildAnswers(),
        clientToken: token.current,
      })
      setOutcome('saved')
      setStage('done')
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error)
      setSendError(/permission/i.test(raw)
        ? 'تعذّر الإرسال. تأكّدي من الاتصال بالإنترنت، أو راجعي المدرسة.'
        : `تعذّر الإرسال: ${raw}`)
    } finally {
      setSending(false)
    }
  }

  const school = state.meta.school
  const title = `${state.meta.surveyTitle} ${arabicDigits(state.meta.hijriYear)}هـ`

  function Frame({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
    return (
      <div className="app app--survey">
        <main className={wide ? 'survey survey--wide' : 'survey'}>{children}</main>
        <BrandFooter />
      </div>
    )
  }

  // ───────── حالات التحميل والخطأ ─────────

  if (remote && !ready) {
    return (
      <Frame>
        <div className="survey__state">
          <span className="survey__spinner" aria-hidden="true" />
          <p role="status">جارٍ فتح القياس…</p>
        </div>
      </Frame>
    )
  }

  if (remote && loadError) {
    return (
      <Frame>
        <div className="survey__state">
          <h1 className="survey__q" tabIndex={-1} ref={headingRef}>تعذّر فتح القياس</h1>
          <p className="survey__lead">{loadError}</p>
          <button type="button" className="survey__cta" onClick={() => window.location.reload()}>
            المحاولة من جديد
          </button>
        </div>
      </Frame>
    )
  }

  // ───────── شاشة النجاح ─────────

  if (stage === 'done') {
    return (
      <Frame>
        <div className="cover cover--done">
          <span className="cover__seal" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="34" height="34" role="presentation">
              <path d="M13 25.5 20.5 33 35 16" fill="none" stroke="currentColor"
                strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="cover__title" tabIndex={-1} ref={headingRef}>شكرًا لمشاركتك 🌷</h1>
          <p className="cover__lead">
            تم استلام إجابتك بنجاح، ورأيك يساعدنا في تطوير تجربتك المدرسية.
          </p>
          {outcome === 'pending_review' && (
            <p className="cover__note">
              توجد إجابة سابقة بالاسم نفسه، فستراجعها المدرسة. لم تُحذف أي إجابة.
            </p>
          )}
          <p className="cover__school">{school}</p>
        </div>
      </Frame>
    )
  }

  // ───────── صفحة البداية ─────────

  if (stage === 'intro') {
    return (
      <Frame>
        <div className="cover">
          <img className="cover__logo" src={ORG_LOGO} alt="شعار وزارة التعليم" />
          <p className="cover__org">{state.meta.directorate}</p>
          <p className="cover__school">{school}</p>
          <h1 className="cover__title" tabIndex={-1} ref={headingRef}>{title}</h1>
          <p className="cover__lead">
            رأيك يساعد المدرسة على تطوير البيئة التعليمية وتحسين تجربتك المدرسية.
          </p>
          <button
            type="button"
            className="survey__cta"
            onClick={() => setStage(linkedClass ? 'student' : 'grade')}
          >
            ابدئي القياس
          </button>
          <p className="cover__note">
            {num(likert.length)} سؤالًا قصيرًا — إجابتك تصل المدرسة وحدها.
          </p>
        </div>
      </Frame>
    )
  }

  // ───────── الصف والفصل والاسم ─────────

  if (stage === 'grade') {
    return (
      <Frame>
        <h1 className="survey__q" tabIndex={-1} ref={headingRef}>في أي صف أنتِ؟</h1>
        <div className="picks">
          {grades.map((g) => (
            <button key={g.id} type="button" className="pick"
              onClick={() => { setGradeId(g.id); setStage('class') }}>
              {g.name}
            </button>
          ))}
        </div>
        {grades.length === 0 && (
          <p className="survey__lead">لا توجد فصول مُعرَّفة بعد. راجعي إدارة المدرسة.</p>
        )}
      </Frame>
    )
  }

  if (stage === 'class') {
    return (
      <Frame>
        <h1 className="survey__q" tabIndex={-1} ref={headingRef}>وأي فصل؟</h1>
        <div className="picks">
          {classes.map((c) => (
            <button key={c.id} type="button" className="pick"
              onClick={() => { setClassId(c.id); setStage('student') }}>
              فصل {c.name}
            </button>
          ))}
        </div>
        <button type="button" className="survey__back" onClick={() => setStage('grade')}>
          الرجوع إلى الصفوف
        </button>
      </Frame>
    )
  }

  if (stage === 'student') {
    const ok = remote ? typedName.trim().length >= 2 : studentId !== null
    return (
      <Frame>
        <h1 className="survey__q" tabIndex={-1} ref={headingRef}>
          {remote ? 'اكتبي اسمك' : 'اختاري اسمك'}
        </h1>

        {remote ? (
          <>
            <p className="survey__lead">
              اكتبي اسمك كما هو في كشف الفصل. تراجع المدرسة الأسماء لاحقًا، فلا تقلقي إن اختلف حرف.
            </p>
            <input
              id="survey-name" type="text" className="field-line" value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              autoComplete="off" maxLength={120} aria-label="الاسم"
            />
          </>
        ) : (
          <>
            <input
              type="search" className="field-line" placeholder="ابحثي عن اسمك…"
              value={search} onChange={(e) => setSearch(e.target.value)} aria-label="بحث عن الاسم"
            />
            <ul className="names">
              {students.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={s.id === studentId ? 'name is-picked' : 'name'}
                    onClick={() => setStudentId(s.id)}
                    aria-pressed={s.id === studentId}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
            {students.length === 0 && <p className="survey__lead">لا توجد نتائج مطابقة.</p>}
          </>
        )}

        <button type="button" className="survey__cta" disabled={!ok} onClick={() => setStage('welcome')}>
          متابعة
        </button>
        {!linkedClass && (
          <button type="button" className="survey__back" onClick={() => setStage('class')}>
            الرجوع إلى الفصول
          </button>
        )}
      </Frame>
    )
  }

  // ───────── ترحيب قصير ─────────

  if (stage === 'welcome') {
    return (
      <Frame>
        <div className="cover cover--tight">
          <h1 className="cover__title" tabIndex={-1} ref={headingRef}>
            أهلًا {respondentName}
          </h1>
          <p className="cover__lead">
            لا توجد إجابة صحيحة وأخرى خاطئة — اختاري ما يعبّر عن رأيك أنتِ.
          </p>
          <button type="button" className="survey__cta" onClick={beginAnswering}>
            هيّا نبدأ
          </button>
        </div>
      </Frame>
    )
  }

  // ───────── مراجعة قبل الإرسال ─────────

  if (stage === 'review') {
    const answered = required.length - missing.length
    return (
      <Frame>
        <h1 className="survey__q" tabIndex={-1} ref={headingRef}>
          {missing.length === 0 ? 'أجبتِ على كل الأسئلة' : 'بقي القليل'}
        </h1>
        <p className="survey__lead">
          أجبتِ على {num(answered)} من {num(required.length)} سؤالًا مطلوبًا.
        </p>

        {missing.length > 0 && (
          <ul className="gaps">
            {missing.map((q) => (
              <li key={q.id}>
                <button type="button" className="gap" onClick={() => jumpTo(q.id)}>
                  <span className="gap__no">{num(q.order)}</span>
                  <span className="gap__text">{forDisplay(q.text)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {sendError && <p className="survey__error" role="alert">{sendError}</p>}

        <button type="button" className="survey__cta" disabled={sending} onClick={() => void send()}>
          {sending ? 'جارٍ الإرسال…' : 'إرسال القياس'}
        </button>
        <button type="button" className="survey__back" onClick={() => { setCursor(steps.length - 1); setStage('ask') }}>
          الرجوع إلى الأسئلة
        </button>
      </Frame>
    )
  }

  // ───────── سؤال واحد في الشاشة ─────────

  if (!current) return <Frame><p className="survey__lead">لا توجد أسئلة في هذا القياس.</p></Frame>

  const position = cursor + 1
  const percent = Math.round((position / steps.length) * 100)

  return (
    <div className="app app--survey">
      <div className="progress" role="progressbar" aria-valuenow={position}
        aria-valuemin={1} aria-valuemax={steps.length}
        aria-label={`السؤال ${position} من ${steps.length}`}>
        <span className="progress__fill" style={{ width: `${percent}%` }} />
      </div>

      <main className="survey survey--ask">
        <p className="survey__count">
          السؤال {num(position)} من {num(steps.length)}
        </p>

        <Step
          question={current}
          options={source.options}
          overallOptions={source.overallOptions}
          value={draft[current.id] ?? ''}
          flashing={highlight === current.id}
          headingRef={headingRef}
          onChoose={(v) => choose(current.id, v)}
          onType={(v) => setDraft((d) => ({ ...d, [current.id]: v }))}
        />

        <div className="survey__nav">
          <button type="button" className="survey__back" onClick={goBack}>
            {cursor === 0 ? 'رجوع' : 'السؤال السابق'}
          </button>
          {current.kind === 'likert' ? (
            // مخرج هادئ للسؤال الذي ترددت فيه: بغيره تُغلق الصفحة
            // فتُفقد الاستجابة كلها. ولا يخلّ هذا بالإلزام — شاشة
            // المراجعة تمنع الإرسال حتى يُجاب عليه.
            !draft[current.id] && (
              <button type="button" className="survey__skip" onClick={goNext}>
                تخطّي مؤقتًا
              </button>
            )
          ) : (
            <button type="button" className="survey__cta survey__cta--inline" onClick={goNext}>
              {cursor + 1 === steps.length ? 'مراجعة وإرسال' : 'التالي'}
            </button>
          )}
        </div>
      </main>

      <BrandFooter />
    </div>
  )
}

interface StepProps {
  question: Question
  options: { id: string; label: string }[]
  overallOptions: string[]
  value: string
  flashing: boolean
  headingRef: React.RefObject<HTMLHeadingElement>
  onChoose: (value: string) => void
  onType: (value: string) => void
}

/**
 * خطوة واحدة من القياس.
 *
 * الخيارات الثلاثة متساوية الوزن البصري عمدًا: ستة أسئلة في هذا القياس
 * عكسية («أشعر بالقلق أثناء وجودي في المدرسة»)، فتلوين «أوافق تماماً»
 * بالأخضر يوحي للطالبة أن الموافقة هي الإجابة الصحيحة — وهي في تلك
 * الأسئلة عكس ذلك. التمييز اللوني للمختار وحده، لا لقيمته.
 */
function Step({
  question, options, overallOptions, value, flashing, headingRef, onChoose, onType,
}: StepProps) {
  if (question.kind === 'text') {
    return (
      <section className="step step--voice">
        <h1 className="survey__q" tabIndex={-1} ref={headingRef}>صوتك يهمنا</h1>
        <p className="survey__lead">
          شاركي المدرسة برأيك أو مقترحك الذي ترغبين أن نعرفه.
        </p>
        <label className="sr-only" htmlFor="voice-field">{question.text}</label>
        <textarea
          id="voice-field" className="field-area" rows={5} value={value}
          onChange={(e) => onType(e.target.value)}
          placeholder="اكتبي هنا…"
        />
        <p className="survey__hint">هذا الحقل اختياري.</p>
      </section>
    )
  }

  if (question.kind === 'overall') {
    return (
      <section className="step step--overall">
        <h1 className="survey__q" tabIndex={-1} ref={headingRef}>{forDisplay(question.text)}</h1>
        <div className="verdicts">
          {overallOptions.map((label) => (
            <button
              key={label} type="button" aria-pressed={value === label}
              className={value === label ? 'verdict is-chosen' : 'verdict'}
              onClick={() => onChoose(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="survey__hint">هذا السؤال اختياري.</p>
      </section>
    )
  }

  return (
    <section className={flashing ? 'step step--flash' : 'step'}>
      <h1 className="survey__q" tabIndex={-1} ref={headingRef}>{forDisplay(question.text)}</h1>
      <div className="answers">
        {options.map((opt) => (
          <button
            key={opt.id} type="button" aria-pressed={value === opt.id}
            className={value === opt.id ? 'answer is-chosen' : 'answer'}
            onClick={() => onChoose(opt.id)}
          >
            <span className="answer__dot" aria-hidden="true" />
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
