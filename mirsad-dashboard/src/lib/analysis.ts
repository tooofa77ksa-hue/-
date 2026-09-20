import type {
  Answer, Id, Question, Student, SurveyResponse, SystemState,
} from '../domain/types'

/** نطاق التحليل: المدرسة كاملة، أو صف، أو فصل. */
export interface Scope {
  gradeId?: Id | null
  classId?: Id | null
}

export const SCHOOL_SCOPE: Scope = {}

/** الطالبات النشطات داخل النطاق، من الكشوف الرسمية. */
export function studentsInScope(state: SystemState, scope: Scope): Student[] {
  return state.students.filter((s) => {
    if (s.status !== 'active') return false
    if (scope.classId) return s.classId === scope.classId
    if (scope.gradeId) return s.gradeId === scope.gradeId
    return true
  })
}

/**
 * الاستجابات المنسوبة إلى النطاق.
 *
 * تُنسب الاستجابة بأحد طريقين:
 *  - مرتبطة بطالبة مؤكّدة داخل النطاق (linked).
 *  - أو غير مرتبطة، لكنها أعلنت الصف الذي يغطّيه النطاق (declared).
 *
 * على مستوى الفصل لا تُحتسب غير المرتبطة، لأن فصلها غير معروف.
 */
export function responsesInScope(state: SystemState, scope: Scope): SurveyResponse[] {
  const byId = new Map(state.students.map((s) => [s.id, s]))
  return state.responses.filter((r) => {
    const student = r.studentId ? byId.get(r.studentId) : null
    if (student) {
      if (scope.classId) return student.classId === scope.classId
      if (scope.gradeId) return student.gradeId === scope.gradeId
      return true
    }
    if (scope.classId) return r.classId === scope.classId
    if (scope.gradeId) return r.declaredGradeId === scope.gradeId
    return true
  })
}

export interface Participation {
  /** طالبات الكشف الرسمي داخل النطاق. */
  totalStudents: number
  /** طالبات لهنّ استجابة مؤكّدة الارتباط. */
  confirmedRespondents: number
  /** طالبات الكشف بلا استجابة مؤكّدة. */
  nonRespondents: number
  /** نسبة الاستجابة المؤكّدة من طالبات الكشف. */
  rate: number
  /** كل الاستجابات المستلمة المنسوبة للنطاق، مؤكّدة كانت أو لا. */
  responsesReceived: number
  /** استجابات بانتظار تأكيد المطابقة يدويًا. */
  awaitingReview: number
  /** استجابات لا يوجد لصفّها كشف رسمي، فيتعذّر التأكيد. */
  withoutRoster: number
}

export function participation(state: SystemState, scope: Scope): Participation {
  const students = studentsInScope(state, scope)
  const responses = responsesInScope(state, scope)

  const respondentIds = new Set(
    responses.filter((r) => r.studentId).map((r) => r.studentId as Id),
  )
  const confirmed = students.filter((s) => respondentIds.has(s.id)).length

  return {
    totalStudents: students.length,
    confirmedRespondents: confirmed,
    nonRespondents: students.length - confirmed,
    rate: students.length ? (confirmed / students.length) * 100 : 0,
    responsesReceived: responses.length,
    awaitingReview: responses.filter(
      (r) => r.matchStatus === 'POSSIBLE_MATCH' || r.matchStatus === 'NEW',
    ).length,
    withoutRoster: responses.filter((r) => r.matchStatus === 'LEGACY').length,
  }
}

/** طالبات الكشف اللاتي ليس لهنّ استجابة مؤكّدة داخل النطاق. */
export function nonRespondents(state: SystemState, scope: Scope): Student[] {
  const responses = responsesInScope(state, scope)
  const respondentIds = new Set(
    responses.filter((r) => r.studentId).map((r) => r.studentId as Id),
  )
  return studentsInScope(state, scope)
    .filter((s) => !respondentIds.has(s.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
}

export interface OptionCount {
  optionId: Id
  label: string
  score: number
  count: number
  percent: number
}

export interface QuestionAnalysis {
  question: Question
  /** عدد الإجابات الصالحة — قاعدة حساب النسب. */
  n: number
  /** استجابات داخل النطاق لم تُجب على هذا السؤال. */
  missing: number
  counts: OptionCount[]
  /** متوسط الدرجة الخام (قبل عكس الاتجاه). */
  rawMean: number | null
  /** متوسط الدرجة بعد تصحيح اتجاه السؤال. */
  adjustedMean: number | null
}

function answersFor(state: SystemState, responseIds: Set<Id>): Answer[] {
  return state.answers.filter((a) => responseIds.has(a.responseId))
}

/** يعكس الدرجة وفق حدّي المقياس الفعليين. */
export function adjustScore(score: number, question: Question, min: number, max: number): number {
  return question.direction === 'reverse' ? min + max - score : score
}

export function analyzeQuestion(
  state: SystemState,
  questionId: Id,
  scope: Scope,
): QuestionAnalysis | null {
  const question = state.questions.find((q) => q.id === questionId)
  if (!question) return null

  const responseIds = new Set(responsesInScope(state, scope).map((r) => r.id))
  const rows = answersFor(state, responseIds).filter((a) => a.questionId === questionId)

  const valid = rows.filter((a) => a.optionId !== null)
  const n = valid.length
  const { min, max } = state.meta.scale

  const counts: OptionCount[] = state.options.map((opt) => {
    const count = valid.filter((a) => a.optionId === opt.id).length
    return {
      optionId: opt.id,
      label: opt.label,
      score: opt.score,
      count,
      percent: n ? (count / n) * 100 : 0,
    }
  })

  const scores = valid.map((a) => a.score as number)
  const rawMean = n ? scores.reduce((s, v) => s + v, 0) / n : null
  const adjustedMean = n
    ? scores.map((s) => adjustScore(s, question, min, max)).reduce((s, v) => s + v, 0) / n
    : null

  return {
    question,
    n,
    missing: responseIds.size - n,
    counts,
    rawMean,
    adjustedMean,
  }
}

export function analyzeAllQuestions(state: SystemState, scope: Scope): QuestionAnalysis[] {
  return state.questions
    .filter((q) => q.kind === 'likert' && q.active)
    .map((q) => analyzeQuestion(state, q.id, scope))
    .filter((x): x is QuestionAnalysis => x !== null)
}

export interface SatisfactionIndex {
  /** متوسط الدرجة المصحّحة على المقياس الفعلي. */
  mean: number | null
  /** المتوسط محوّلًا إلى نسبة مئوية من مدى المقياس. */
  percent: number | null
  /** عدد الإجابات الداخلة في الحساب. */
  n: number
  /** عدد الأسئلة الداخلة في المؤشر. */
  questionCount: number
  scaleMin: number
  scaleMax: number
}

/**
 * مؤشر الاتجاه: متوسط درجات الأسئلة المقيسة النشطة فقط،
 * بعد عكس اتجاه الأسئلة السلبية. لا تدخل فيه الأسئلة النصّية
 * ولا التقويم العام ولا الإجابات المفقودة.
 */
export function satisfactionIndex(state: SystemState, scope: Scope): SatisfactionIndex {
  const { min, max } = state.meta.scale
  const scored = state.questions.filter((q) => q.kind === 'likert' && q.active && q.scored)
  const byQuestion = new Map(scored.map((q) => [q.id, q]))

  const responseIds = new Set(responsesInScope(state, scope).map((r) => r.id))
  const values: number[] = []

  for (const a of state.answers) {
    if (!responseIds.has(a.responseId) || a.score === null) continue
    const q = byQuestion.get(a.questionId)
    if (!q) continue
    values.push(adjustScore(a.score, q, min, max))
  }

  if (!values.length) {
    return { mean: null, percent: null, n: 0, questionCount: scored.length, scaleMin: min, scaleMax: max }
  }

  const mean = values.reduce((s, v) => s + v, 0) / values.length
  return {
    mean,
    percent: ((mean - min) / (max - min)) * 100,
    n: values.length,
    questionCount: scored.length,
    scaleMin: min,
    scaleMax: max,
  }
}

export interface OverallRow {
  value: string
  count: number
  percent: number
}

/** توزيع التقويم العام بالقيم الواردة في المصدر حرفيًا. */
export function overallDistribution(state: SystemState, scope: Scope): {
  rows: OverallRow[]
  n: number
  missing: number
} {
  const responseIds = new Set(responsesInScope(state, scope).map((r) => r.id))
  const rows = state.answers.filter(
    (a) => a.questionId === 'q_overall' && responseIds.has(a.responseId) && a.rawValue,
  )
  const n = rows.length
  const tally = new Map<string, number>()
  for (const a of rows) tally.set(a.rawValue as string, (tally.get(a.rawValue as string) ?? 0) + 1)

  return {
    rows: state.overallOptions
      .filter((v) => tally.has(v))
      .map((value) => ({
        value,
        count: tally.get(value) as number,
        percent: n ? ((tally.get(value) as number) / n) * 100 : 0,
      })),
    n,
    missing: responseIds.size - n,
  }
}

/** أقوى الأسئلة وأضعفها وفق المتوسط المصحّح. */
export function strengthsAndGaps(state: SystemState, scope: Scope, take = 5) {
  const rows = analyzeAllQuestions(state, scope)
    .filter((a) => a.adjustedMean !== null && a.n > 0)
    .sort((a, b) => (b.adjustedMean as number) - (a.adjustedMean as number))
  return { strengths: rows.slice(0, take), gaps: rows.slice(-take).reverse() }
}

export function suggestionsInScope(state: SystemState, scope: Scope) {
  const responseIds = new Set(responsesInScope(state, scope).map((r) => r.id))
  return state.suggestions.filter((s) => responseIds.has(s.responseId))
}
