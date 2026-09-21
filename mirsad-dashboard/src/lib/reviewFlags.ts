import { normalizeArabic } from './arabic'
import type { Id, SurveyResponse, SystemState } from '../domain/types'

/**
 * طبقة تمييز إدارية بحتة.
 *
 * لا تغيّر بيانات ولا نتائج ولا مطابقة: تشتقّ أسباب المراجعة من الحالة
 * القائمة، ولا تحفظ إلا واقعة «اطّلعت الإدارة على هذه الحالة».
 * إزالة التمييز ليست موافقة على المطابقة ولا تصحيحًا للبيانات.
 *
 * كل ما هنا مقصور على صفحات الإدارة: لا يظهر للطالبة ولا لولي الأمر
 * ولا في رابط القياس العام ولا في Excel ولا في التقارير المطبوعة.
 */

export type ReviewReasonCode =
  | 'no_roster_match'
  | 'grade_mismatch'
  | 'duplicate_name'
  | 'incomplete_name'
  | 'ambiguous_candidates'

export interface ReviewReason {
  code: ReviewReasonCode
  /** جملة قصيرة تشرح سبب التمييز للإدارة. */
  text: string
}

export interface FlaggedCase {
  responseId: Id
  response: SurveyResponse
  reasons: ReviewReason[]
  /** هل أقرّت الإدارة بالاطّلاع على هذه الحالة؟ */
  acknowledged: boolean
  acknowledgedAt: string | null
  acknowledgedBy: string | null
}

const REASON_TEXT: Record<ReviewReasonCode, string> = {
  no_roster_match: 'لم يتم العثور على طالبة مطابقة في الكشف',
  grade_mismatch: 'الصف في الاستجابة يختلف عن الصف في ملف المصدر',
  duplicate_name: 'يوجد اسم مشابه أو مكرر داخل الصف نفسه',
  incomplete_name: 'الاسم غير مكتمل',
  ambiguous_candidates: 'أكثر من طالبة محتملة — يلزم اختيار واحدة',
}

/** الصف المستفاد من اسم ملف المصدر، للمقارنة بالصف المعلن داخله. */
function gradeFromSourceFile(file?: string): Id | null {
  if (!file) return null
  const m = /responses-grade(\d+)\.xlsx$/.exec(file)
  return m ? `g${m[1]}` : null
}

/** هل الاسم ناقص إلى حدّ يتعذّر معه التحقق؟ */
function isIncompleteName(name: string): boolean {
  const normalized = normalizeArabic(name)
  return normalized.length === 0 || normalized.split(' ').filter(Boolean).length < 2
}

/** يشتقّ أسباب المراجعة لاستجابة واحدة. قائمة فارغة تعني لا تمييز. */
export function reasonsFor(response: SurveyResponse): ReviewReason[] {
  const codes: ReviewReasonCode[] = []

  if (response.matchStatus === 'NEW' && !response.studentId) {
    codes.push('no_roster_match')
  }
  if (response.matchStatus === 'POSSIBLE_MATCH' && response.candidateStudentIds.length > 1) {
    codes.push('ambiguous_candidates')
  }

  const fileGrade = gradeFromSourceFile(response.sourceFile)
  if (fileGrade && response.declaredGradeId && fileGrade !== response.declaredGradeId) {
    codes.push('grade_mismatch')
  }

  if (response.duplicateFlag) codes.push('duplicate_name')
  if (isIncompleteName(response.rawName)) codes.push('incomplete_name')

  // لا يُكرَّر السبب نفسه ولو تحقّق أكثر من شرط يؤدي إليه
  return [...new Set(codes)].map((code) => ({ code, text: REASON_TEXT[code] }))
}

/** كل الحالات التي تحتاج نظر الإدارة، مع إقراراتها إن وُجدت. */
export function flaggedCases(state: SystemState): FlaggedCase[] {
  const acks = state.reviewAcks ?? {}
  const out: FlaggedCase[] = []

  for (const response of state.responses) {
    const reasons = reasonsFor(response)
    if (reasons.length === 0) continue
    const ack = acks[response.id]
    out.push({
      responseId: response.id,
      response,
      reasons,
      acknowledged: Boolean(ack),
      acknowledgedAt: ack?.at ?? null,
      acknowledgedBy: ack?.by ?? null,
    })
  }

  // غير المراجَعة أولًا، ثم الأكثر أسبابًا
  return out.sort((a, b) => {
    if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1
    return b.reasons.length - a.reasons.length
  })
}

export interface FlagCounts {
  total: number
  pending: number
  reviewed: number
  byReason: Record<ReviewReasonCode, number>
}

export function flagCounts(state: SystemState): FlagCounts {
  const cases = flaggedCases(state)
  const byReason = {
    no_roster_match: 0, grade_mismatch: 0, duplicate_name: 0,
    incomplete_name: 0, ambiguous_candidates: 0,
  } as Record<ReviewReasonCode, number>

  for (const c of cases) {
    for (const r of c.reasons) byReason[r.code] += 1
  }

  return {
    total: cases.length,
    pending: cases.filter((c) => !c.acknowledged).length,
    reviewed: cases.filter((c) => c.acknowledged).length,
    byReason,
  }
}

/** هل هذه الاستجابة مميَّزة وغير مراجَعة؟ يُستخدم للشارة في الجداول. */
export function needsReview(state: SystemState, responseId: Id): boolean {
  const response = state.responses.find((r) => r.id === responseId)
  if (!response) return false
  if ((state.reviewAcks ?? {})[responseId]) return false
  return reasonsFor(response).length > 0
}

export const REASON_LABELS = REASON_TEXT
