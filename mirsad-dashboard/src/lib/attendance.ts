/**
 * من شاركت في القياس فعلًا، ومن لا أثر لها إطلاقًا.
 *
 * «بلا استجابة مؤكَّدة» غير «لم تشارك». أكثر الاستجابات تصل باسمٍ
 * كتبته الطالبة بيدها، فتنتظر تأكيد الإدارة في مراجعة المطابقة. فلو
 * عُدَّ كل من لم تُؤكَّد غائبةً لخرج كشفٌ بمئتين وخمسين اسمًا أكثرهن
 * شاركن — وهو كشفٌ يُرفع إلى الوزارة فيُكذّبه أول من يقرؤه.
 *
 * فالأثر هنا ثلاث درجات: استجابة مؤكَّدة، أو استجابة رُشِّحت لها في
 * المراجعة، أو استجابة باسمٍ هي أولى الطالبات به. ومن لم يكن لها شيء
 * من ذلك فلا أثر لها.
 *
 * والنسبة بالمنافسة لا بالفحص المنفرد: «روز بندر محمد المطيري»
 * و«ريفال بندر محمد المطيري» أختان، واسمٌ واحد في الاستجابات لا
 * يكفيهما معًا — يذهب إلى أقربهما، وتبقى الأخرى غائبة.
 */
import { coreTokens, isNameCandidate, normalizeArabic } from './arabic'
import { responsesInScope, studentsInScope, type Scope } from './analysis'
import type { Id, Student, SurveyResponse, SystemState } from '../domain/types'

/** مسافة تحرير مُسوّاة على الطول: 1 تطابق تام، 0 لا شيء مشترك. */
function similarity(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (!m || !n) return 0
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i += 1) {
    const row = [i, ...Array<number>(n).fill(0)]
    for (let j = 1; j <= n; j += 1) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = row
  }
  return 1 - prev[n] / Math.max(m, n)
}

/**
 * درجة قرب استجابةٍ من طالبة، أو صفر إن لم تقترب.
 *
 * الاسم الأول شرط: اختلافه يعني شخصًا آخر مهما تشابه الباقي — إلا أن
 * يقرّه الترشيح، فقد يكون الاسم الأول التصق بما بعده («سماعبدالله»).
 */
export function nameFit(studentName: string, rawName: string): number {
  const student = coreTokens(studentName)
  const raw = coreTokens(rawName)
  if (!student.length || !raw.length) return 0

  const candidate = isNameCandidate(rawName, studentName)
  let first = similarity(student[0], raw[0])
  if (first < 0.7 && !candidate) return 0
  if (first < 0.7) first = 0.7

  const shared = raw.filter((t) => student.includes(t)).length
  const whole = similarity(normalizeArabic(studentName), normalizeArabic(rawName))
  return first * 2 + shared + whole + (candidate ? 1 : 0)
}

export type TraceKind = 'confirmed' | 'candidate' | 'name'

export interface Attendance {
  /** الطالبة ← نوع الأثر الذي وُجد لها. */
  trace: Map<Id, TraceKind>
  /** استجابات لم تُنسب إلى طالبة في الكشف. */
  orphans: SurveyResponse[]
}

/**
 * نسبة الاستجابات إلى الطالبات.
 *
 * تُبنى مرة واحدة على المدرسة كلها لا على النطاق: الطالبة قد تكتب
 * صفًّا غير صفّها، والإجراء لا يتغيّر بتغيّر الشاشة.
 */
/**
 * ذاكرة لكل حالة: الحساب يمرّ على كل استجابة أمام كل طالبة، وهو ثقيل.
 *
 * والحالة لا تُعدَّل في مكانها — كل إجراء يُعيد حالةً جديدة — فالمفتاح
 * كائن الحالة نفسه، ولا تقادم في القيمة المحفوظة. و«WeakMap» تُفلت
 * الحالات القديمة وحدها فلا تتراكم.
 */
const CACHE = new WeakMap<SystemState, Attendance>()

export function attendance(state: SystemState): Attendance {
  const cached = CACHE.get(state)
  if (cached) return cached
  const computed = computeAttendance(state)
  CACHE.set(state, computed)
  return computed
}

function computeAttendance(state: SystemState): Attendance {
  const students = state.students.filter((s) => s.status === 'active')
  const trace = new Map<Id, TraceKind>()
  const orphans: SurveyResponse[] = []

  const pending: SurveyResponse[] = []
  for (const response of state.responses) {
    if (response.studentId) { trace.set(response.studentId, 'confirmed'); continue }
    for (const id of response.candidateStudentIds ?? []) {
      if (!trace.has(id)) trace.set(id, 'candidate')
    }
    pending.push(response)
  }

  for (const response of pending) {
    const raw = (response.rawName ?? '').trim()
    if (!raw) continue
    let best: { student: Student; fit: number } | null = null
    for (const student of students) {
      const fit = nameFit(student.name, raw)
      if (fit > 0 && (!best || fit > best.fit)) best = { student, fit }
    }
    if (!best) {
      // اسم لا يقابله أحد في الكشف: طالبة جديدة أو اسم كُتب بصورة بعيدة
      if (normalizeArabic(raw).length >= 4) orphans.push(response)
      continue
    }
    if (!trace.has(best.student.id)) trace.set(best.student.id, 'name')
  }

  return { trace, orphans }
}

/** طالبات النطاق اللاتي لا أثر لهن في القياس إطلاقًا. */
export function nonParticipants(state: SystemState, scope: Scope): Student[] {
  const { trace } = attendance(state)
  return studentsInScope(state, scope)
    .filter((s) => !trace.has(s.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
}

/** عدّ الاستجابات التي ما زالت تنتظر تأكيد اسم صاحبتها في النطاق. */
export function awaitingConfirmation(state: SystemState, scope: Scope): number {
  return responsesInScope(state, scope).filter((r) => !r.studentId).length
}
