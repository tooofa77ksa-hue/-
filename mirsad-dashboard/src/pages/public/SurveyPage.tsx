import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { BrandFooter } from '../../components/BrandFooter'
import { BrandHeader } from '../../components/BrandHeader'
import { submitResponse } from '../../domain/actions'
import type { Id, Question } from '../../domain/types'
import { normalizeArabic } from '../../lib/arabic'
import { useSystem } from '../../state/useSystem'

type Step = 'grade' | 'class' | 'student' | 'form' | 'done'

interface Draft {
  [questionId: string]: string
}

export function SurveyPage() {
  const { classId: classFromLink } = useParams()
  const { state, replace } = useSystem()

  const linkedClass = state.classes.find((c) => c.id === classFromLink) ?? null

  const [gradeId, setGradeId] = useState<Id | null>(linkedClass?.gradeId ?? null)
  const [classId, setClassId] = useState<Id | null>(linkedClass?.id ?? null)
  const [studentId, setStudentId] = useState<Id | null>(null)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<Draft>({})
  const [touched, setTouched] = useState(false)
  const [step, setStep] = useState<Step>(linkedClass ? 'student' : 'grade')
  const [outcome, setOutcome] = useState<'saved' | 'pending_review' | null>(null)

  const cycle = state.cycles[0]
  const questions = useMemo(
    () => state.questions.filter((q) => q.active && cycle.questionIds.includes(q.id)),
    [state.questions, cycle.questionIds],
  )

  // الصفوف التي لها فصول فعلية في الكشوف الرسمية فقط
  const grades = useMemo(
    () => state.grades.filter((g) => state.classes.some((c) => c.gradeId === g.id)),
    [state.grades, state.classes],
  )
  const classes = useMemo(
    () => state.classes.filter((c) => c.gradeId === gradeId),
    [state.classes, gradeId],
  )
  const students = useMemo(() => {
    const needle = normalizeArabic(search)
    return state.students
      .filter((s) => s.classId === classId && s.status === 'active')
      .filter((s) => !needle || normalizeArabic(s.name).includes(needle))
      .sort((a, b) => (a.rosterNo ?? 0) - (b.rosterNo ?? 0))
  }, [state.students, classId, search])

  const missing = questions.filter((q) => q.required && !draft[q.id]?.trim())

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (missing.length > 0 || !studentId) {
      document.querySelector('.question--invalid')?.scrollIntoView({ block: 'center' })
      return
    }

    const answers = questions.map((q) => {
      const raw = draft[q.id]?.trim() || null
      if (q.kind === 'likert' && raw) {
        const option = state.options.find((o) => o.id === raw)
        return { questionId: q.id, optionId: option?.id ?? null, rawValue: option?.label ?? null, score: option?.score ?? null }
      }
      return { questionId: q.id, optionId: null, rawValue: raw, score: null }
    })

    const result = submitResponse(state, { studentId, cycleId: cycle.id, answers })
    replace(result.state)
    setOutcome(result.status)
    setStep('done')
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

        {step === 'student' && (
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
          <form className="survey__card" onSubmit={handleSubmit} noValidate>
            <h2 className="survey__heading">
              {state.students.find((s) => s.id === studentId)?.name}
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

            <button type="submit" className="button button--primary button--block">
              إرسال الإجابات
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
