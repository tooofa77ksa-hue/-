import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { BrandFooter } from '../../components/BrandFooter'
import { BrandHeader } from '../../components/BrandHeader'
import {
  loadPublicContext, submitPublicResponse, type PublicContext,
} from '../../data/remote/firestoreRepo'
import { submitResponse } from '../../domain/actions'
import type { Id, Question } from '../../domain/types'
import { ensureRespondent } from '../../firebase/auth'
import { normalizeArabic } from '../../lib/arabic'
import { useSystem } from '../../state/useSystem'

type Step = 'grade' | 'class' | 'student' | 'form' | 'done'

/**
 * رمز يميّز هذا الإرسال بعينه.
 *
 * يُولَّد مرة واحدة لكل نموذج مفتوح، فلو ضغطت الطالبة «إرسال» مرتين
 * أو اهتزّت الشبكة فأُعيدت المحاولة، عرفت الإدارة أن المستندين إرسال
 * واحد مكرّر لا رأيين. ولا يُحذف أي منهما: التكرار يُراجَع ولا يُمحى.
 */
function newToken(): string {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

interface Draft {
  [questionId: string]: string
}

export function SurveyPage() {
  const { classId: classFromLink } = useParams()
  const { state, replace, mode } = useSystem()
  const remote = mode === 'remote'

  // في الوضع البعيد لا يحمل المتصفّح أي بيانات مدرسة: يقرأ ما يلزم
  // القياس فقط (الصفوف والفصول والأسئلة) ولا يرى اسم طالبة واحدة.
  const [context, setContext] = useState<PublicContext | null>(null)
  const [ready, setReady] = useState(!remote)
  const [loadError, setLoadError] = useState<string | null>(null)
  const token = useRef(newToken())
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [typedName, setTypedName] = useState('')

  useEffect(() => {
    if (!remote) return
    let alive = true
    ;(async () => {
      try {
        await ensureRespondent()
        const ctx = await loadPublicContext()
        if (!alive) return
        if (!ctx) setLoadError('لا يوجد قياس مفتوح حاليًا.')
        else setContext(ctx)
      } catch (error) {
        if (alive) setLoadError(error instanceof Error ? error.message : String(error))
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

  const [gradeId, setGradeId] = useState<Id | null>(linkedClass?.gradeId ?? null)
  const [classId, setClassId] = useState<Id | null>(linkedClass?.id ?? null)
  const [studentId, setStudentId] = useState<Id | null>(null)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<Draft>({})
  const [touched, setTouched] = useState(false)
  const [step, setStep] = useState<Step>(linkedClass ? 'student' : 'grade')
  const [outcome, setOutcome] = useState<'saved' | 'pending_review' | null>(null)

  // رابط فصل بعينه: يُطبَّق بعد وصول بيانات القياس لا قبلها
  useEffect(() => {
    if (!linkedClass) return
    setGradeId(linkedClass.gradeId)
    setClassId(linkedClass.id)
    setStep((current) => (current === 'grade' ? 'student' : current))
  }, [linkedClass])

  const questions = useMemo(
    () => source.questions.filter((q) => q.active && source.questionIds.includes(q.id)),
    [source],
  )

  // الصفوف التي لها فصول فعلية في الكشوف الرسمية فقط
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

  const missing = questions.filter((q) => q.required && !draft[q.id]?.trim())
  const nameOk = typedName.trim().length >= 2

  const buildAnswers = useCallback(() => questions.map((q) => {
    const raw = draft[q.id]?.trim() || null
    if (q.kind === 'likert' && raw) {
      const option = source.options.find((o) => o.id === raw)
      return {
        questionId: q.id, optionId: option?.id ?? null,
        rawValue: option?.label ?? null, score: option?.score ?? null,
      }
    }
    return { questionId: q.id, optionId: null, rawValue: raw, score: null }
  }), [questions, draft, source.options])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setTouched(true)
    setSendError(null)
    if (missing.length > 0 || (remote ? !nameOk : !studentId)) {
      document.querySelector('.question--invalid')?.scrollIntoView({ block: 'center' })
      return
    }
    // إرسالة واحدة في كل مرة: الضغط المتكرر لا ينتج نسخًا إضافية
    if (sending) return

    if (!remote) {
      const result = submitResponse(state, { studentId: studentId!, cycleId: source.cycleId, answers: buildAnswers() })
      replace(result.state)
      setOutcome(result.status)
      setStep('done')
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
      setStep('done')
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error)
      setSendError(/permission/i.test(raw)
        ? 'تعذّر الإرسال: القياس مغلق أو البيانات غير مكتملة. راجعي المدرسة.'
        : `تعذّر الإرسال: ${raw}`)
    } finally {
      setSending(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="app app--survey">
        <BrandHeader compact />
        <main className="survey">
          <div className="survey__done">
            <div className="survey__done-mark" aria-hidden="true">✓</div>
            <h2>تم استلام إجابتك بنجاح</h2>
            <p>
              {outcome === 'pending_review'
                ? 'سُجّلت إجابتك، ولوجود إجابة سابقة باسمك ستراجعها المدرسة. لم تُحذف أي إجابة.'
                : 'شكرًا لك — رأيك يسهم في تطوير مدرستنا.'}
            </p>
          </div>
        </main>
        <BrandFooter />
      </div>
    )
  }

  if (remote && !ready) {
    return (
      <div className="app app--survey">
        <BrandHeader compact />
        <main className="survey">
          <p className="loading" role="status">جارٍ فتح القياس…</p>
        </main>
        <BrandFooter />
      </div>
    )
  }

  if (remote && loadError) {
    return (
      <div className="app app--survey">
        <BrandHeader compact />
        <main className="survey">
          <section className="survey__card">
            <h2 className="survey__heading">تعذّر فتح القياس</h2>
            <p className="survey__note">{loadError}</p>
            <button type="button" className="button button--primary button--block"
              onClick={() => window.location.reload()}>
              إعادة المحاولة
            </button>
          </section>
        </main>
        <BrandFooter />
      </div>
    )
  }

  return (
    <div className="app app--survey">
      <BrandHeader compact />

      <main className="survey">
        <ol className="survey__steps" aria-label="مراحل القياس">
          {(['اختيار الطالبة', 'الإجابة', 'الإرسال'] as const).map((label, i) => {
            const activeIndex = step === 'form' ? 1 : 0
            return (
              <li key={label} className={i <= activeIndex ? 'is-active' : undefined}>
                <span aria-hidden="true">{i + 1}</span> {label}
              </li>
            )
          })}
        </ol>

        {step === 'grade' && (
          <section className="survey__card">
            <h2 className="survey__heading">اختاري الصف</h2>
            <div className="choice-grid">
              {grades.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="choice"
                  onClick={() => {
                    setGradeId(g.id)
                    setStep('class')
                  }}
                >
                  {g.name}
                </button>
              ))}
            </div>
            {grades.length === 0 && (
              <p className="survey__note">لا توجد فصول مُعرَّفة بعد. راجعي إدارة المدرسة.</p>
            )}
          </section>
        )}

        {step === 'class' && (
          <section className="survey__card">
            <h2 className="survey__heading">اختاري الفصل</h2>
            <div className="choice-grid">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="choice"
                  onClick={() => {
                    setClassId(c.id)
                    setStep('student')
                  }}
                >
                  فصل {c.name}
                </button>
              ))}
            </div>
            <button type="button" className="link" onClick={() => setStep('grade')}>
              رجوع
            </button>
          </section>
        )}

        {step === 'student' && remote && (
          <section className="survey__card">
            <h2 className="survey__heading">اكتبي اسمك</h2>
            <p className="survey__note">
              اكتبي اسمك كما هو في كشف الفصل. تُراجع المدرسة الأسماء لاحقًا، فلا تقلقي إن
              اختلف حرف.
            </p>
            <label className="field__label" htmlFor="survey-name">الاسم</label>
            <input
              id="survey-name"
              type="text"
              className="input"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              autoComplete="off"
              maxLength={120}
            />
            {typedName.length > 0 && !nameOk && (
              <p className="field__error">اكتبي اسمك كاملًا.</p>
            )}
            <button
              type="button"
              className="button button--primary button--block"
              disabled={!nameOk}
              onClick={() => setStep('form')}
            >
              متابعة
            </button>
            {!linkedClass && (
              <button type="button" className="link" onClick={() => setStep('class')}>
                رجوع
              </button>
            )}
          </section>
        )}

        {step === 'student' && !remote && (
          <section className="survey__card">
            <h2 className="survey__heading">اختاري اسمك</h2>
            <input
              type="search"
              className="input"
              placeholder="ابحثي عن اسمك…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="بحث عن الاسم"
            />
            <ul className="student-picker">
              {students.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="student-picker__item"
                    onClick={() => {
                      setStudentId(s.id)
                      setStep('form')
                    }}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
            {students.length === 0 && <p className="survey__note">لا توجد نتائج مطابقة.</p>}
            {!linkedClass && (
              <button type="button" className="link" onClick={() => setStep('class')}>
                رجوع
              </button>
            )}
          </section>
        )}

        {step === 'form' && (
          <form className="survey__card" onSubmit={(e) => { void handleSubmit(e) }} noValidate>
            <h2 className="survey__heading">
              {remote ? typedName.trim() : state.students.find((s) => s.id === studentId)?.name}
            </h2>
            <p className="survey__note">
              اختاري الإجابة التي تعبّر عن رأيك. كل الأسئلة مطلوبة عدا التقويم والاقتراحات.
            </p>

            {questions.map((q) => (
              <QuestionField
                key={q.id}
                question={q}
                options={state.options}
                overallOptions={state.overallOptions}
                value={draft[q.id] ?? ''}
                invalid={touched && q.required && !draft[q.id]?.trim()}
                onChange={(v) => setDraft((d) => ({ ...d, [q.id]: v }))}
              />
            ))}

            {touched && missing.length > 0 && (
              <p className="alert alert--error" role="alert">
                بقي {missing.length} سؤالًا بلا إجابة.
              </p>
            )}

            {sendError && <p className="alert alert--error" role="alert">{sendError}</p>}

            <button type="submit" className="button button--primary button--block" disabled={sending}>
              {sending ? 'جارٍ الإرسال…' : 'إرسال الإجابات'}
            </button>
          </form>
        )}
      </main>

      <BrandFooter />
    </div>
  )
}

interface QuestionFieldProps {
  question: Question
  options: { id: string; label: string }[]
  overallOptions: string[]
  value: string
  invalid: boolean
  onChange: (value: string) => void
}

function QuestionField({ question, options, overallOptions, value, invalid, onChange }: QuestionFieldProps) {
  const name = `q-${question.id}`

  if (question.kind === 'text') {
    return (
      <div className="question">
        <label className="question__text" htmlFor={name}>
          {question.text}
        </label>
        <textarea
          id={name}
          className="input input--area"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    )
  }

  const choices =
    question.kind === 'overall'
      ? overallOptions.map((v) => ({ id: v, label: v }))
      : options

  return (
    <fieldset className={invalid ? 'question question--invalid' : 'question'}>
      <legend className="question__text">
        {question.text}
        {question.required && <span aria-hidden="true"> *</span>}
      </legend>
      <div className="question__options">
        {choices.map((opt) => (
          <label key={opt.id} className={value === opt.id ? 'option is-selected' : 'option'}>
            <input
              type="radio"
              name={name}
              value={opt.id}
              checked={value === opt.id}
              onChange={() => onChange(opt.id)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
