import type { Answer, Student, Suggestion, SurveyResponse } from './types'

/** معرّف السؤال المفتوح في القياس: «الاقتراحات لتطوير المدرسة». */
export const FREE_TEXT_QUESTION = 'q_suggestion'

/**
 * آراءٌ وصلت من رابط القياس العام ولم تُسجَّل في مجموعة الآراء.
 *
 * القياس العام يكتب الاستجابة وإجاباتها ولا يكتب شيئًا في
 * «suggestions»: قواعد الأمان تمنع الزائر من الكتابة فيها، وهي
 * تمنعه بحق. فكان رأي وليّ الأمر يصل كاملًا في إجابته المفتوحة ثم
 * لا يظهر في شاشة الآراء ولا في شاشة العرض ولا في سجلّ الشكاوى —
 * فيُقرأ القياس وكأن أولياء الأمور لم يكتبوا شيئًا.
 *
 * والرأي ليس سجلًّا مستقلًّا بطبعه: هو إجابة السؤال المفتوح نفسها.
 * فتُشتقّ منه هنا عند القراءة، بمعرّف ثابت مبني على معرّف الاستجابة
 * كي يبقى الربط بإجراء التحسين صالحًا بعد كل تحميل.
 */
export function derivedVoices(
  responses: SurveyResponse[],
  answers: Answer[],
  existing: Suggestion[],
  students: Student[],
): Suggestion[] {
  const covered = new Set(existing.map((s) => s.responseId))
  const byId = new Map(students.map((s) => [s.id, s]))
  const byResponse = new Map<string, string>()
  for (const a of answers) {
    if (a.questionId !== FREE_TEXT_QUESTION) continue
    const text = a.rawValue?.trim()
    if (text) byResponse.set(a.responseId, text)
  }

  const out: Suggestion[] = []
  for (const r of responses) {
    if (covered.has(r.id)) continue
    const text = byResponse.get(r.id)
    if (!text) continue
    const student = r.studentId ? byId.get(r.studentId) : undefined
    out.push({
      id: `sg-web-${r.id}`,
      responseId: r.id,
      studentId: student?.id ?? null,
      gradeId: student?.gradeId ?? r.declaredGradeId ?? null,
      classId: student?.classId ?? r.classId ?? null,
      text,
      categoryId: null,
      status: 'new',
    })
  }
  return out
}
