import { audit, newId } from '../data/store'
import { normalizeArabic } from '../lib/arabic'
import type {
  Id, ImprovementAction, Student, SuggestionStatus, SystemState,
} from './types'

/** كل دالة هنا تُعيد حالة جديدة ولا تُعدّل الحالة الممرَّرة. */
function clone(state: SystemState): SystemState {
  return { ...state, students: [...state.students], responses: [...state.responses] }
}

// ───────────────── الطالبات ─────────────────

export interface StudentDraft {
  name: string
  gradeId: Id
  classId: Id | null
}

export function addStudent(state: SystemState, draft: StudentDraft): SystemState {
  const next = clone(state)
  const student: Student = {
    id: newId('st'),
    name: draft.name.trim(),
    normalizedName: normalizeArabic(draft.name),
    gradeId: draft.gradeId,
    classId: draft.classId,
    rosterNo: null,
    source: 'manual',
    status: 'active',
    archivedAt: null,
  }
  next.students = [student, ...next.students]
  audit(next, 'إضافة طالبة', 'student', student.id, student.name)
  return next
}

export function updateStudent(state: SystemState, id: Id, draft: StudentDraft): SystemState {
  const next = clone(state)
  const before = next.students.find((s) => s.id === id)
  if (!before) throw new Error('لا توجد طالبة بهذا المعرّف')

  const movedClass = before.classId !== draft.classId || before.gradeId !== draft.gradeId
  next.students = next.students.map((s) =>
    s.id === id
      ? {
          ...s,
          name: draft.name.trim(),
          normalizedName: normalizeArabic(draft.name),
          gradeId: draft.gradeId,
          classId: draft.classId,
        }
      : s,
  )

  // النقل يحدّث ارتباط الاستجابات بالفصل ولا يُنشئ طالبة جديدة
  if (movedClass) {
    next.responses = next.responses.map((r) =>
      r.studentId === id ? { ...r, classId: draft.classId } : r,
    )
    next.suggestions = next.suggestions.map((s) =>
      s.studentId === id ? { ...s, gradeId: draft.gradeId, classId: draft.classId } : s,
    )
    audit(next, 'نقل طالبة', 'student', id,
      `${before.name}: ${before.classId ?? '—'} ← ${draft.classId ?? '—'}`)
  } else {
    audit(next, 'تعديل طالبة', 'student', id, `${before.name} → ${draft.name.trim()}`)
  }
  return next
}

/** أرشفة بدل الحذف: تختفي من القوائم النشطة ويبقى تاريخها كاملًا. */
export function archiveStudent(state: SystemState, id: Id): SystemState {
  const next = clone(state)
  const student = next.students.find((s) => s.id === id)
  if (!student) throw new Error('لا توجد طالبة بهذا المعرّف')
  next.students = next.students.map((s) =>
    s.id === id ? { ...s, status: 'archived', archivedAt: new Date().toISOString() } : s,
  )
  audit(next, 'أرشفة طالبة', 'student', id, student.name)
  return next
}

export function restoreStudent(state: SystemState, id: Id): SystemState {
  const next = clone(state)
  const student = next.students.find((s) => s.id === id)
  if (!student) throw new Error('لا توجد طالبة بهذا المعرّف')
  next.students = next.students.map((s) =>
    s.id === id ? { ...s, status: 'active', archivedAt: null } : s,
  )
  audit(next, 'استعادة طالبة', 'student', id, student.name)
  return next
}

// ───────────────── مراجعة المطابقة ─────────────────

/** تأكيد إداري صريح لربط استجابة بطالبة. لا يحدث هذا تلقائيًا أبدًا. */
export function confirmMatch(state: SystemState, responseId: Id, studentId: Id): SystemState {
  const next = clone(state)
  const student = next.students.find((s) => s.id === studentId)
  if (!student) throw new Error('لا توجد طالبة بهذا المعرّف')

  next.responses = next.responses.map((r) =>
    r.id === responseId
      ? {
          ...r,
          studentId,
          classId: student.classId,
          matchStatus: 'MATCHED',
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'إدارة المدرسة',
        }
      : r,
  )
  next.suggestions = next.suggestions.map((s) =>
    s.responseId === responseId
      ? { ...s, studentId, gradeId: student.gradeId, classId: student.classId }
      : s,
  )
  const response = next.responses.find((r) => r.id === responseId)
  audit(next, 'تأكيد مطابقة', 'response', responseId,
    `«${response?.rawName}» ← ${student.name}`)
  return next
}

/**
 * تأكيد جماعي للحالات ذات المرشّح الواحد.
 *
 * لا يجري هذا تلقائيًا في أي وقت: تبدأه الإدارة بضغطة صريحة بعد اطّلاعها
 * على القائمة، ويُسجَّل في سجل العمليات، ويبقى كل ربط قابلًا للفكّ.
 * الحالات متعددة المرشّحين مستثناة دائمًا — قرارها بشري وحده.
 */
export function confirmUnambiguousMatches(state: SystemState): SystemState {
  const next = clone(state)
  const byId = new Map(next.students.map((s) => [s.id, s]))
  const now = new Date().toISOString()
  const linked: { responseId: Id; studentId: Id }[] = []

  next.responses = next.responses.map((r) => {
    if (r.matchStatus !== 'POSSIBLE_MATCH' || r.candidateStudentIds.length !== 1) return r
    const student = byId.get(r.candidateStudentIds[0])
    if (!student) return r
    linked.push({ responseId: r.id, studentId: student.id })
    return {
      ...r,
      studentId: student.id,
      classId: student.classId,
      matchStatus: 'MATCHED' as const,
      reviewedAt: now,
      reviewedBy: 'إدارة المدرسة',
    }
  })

  const map = new Map(linked.map((l) => [l.responseId, l.studentId]))
  next.suggestions = next.suggestions.map((s) => {
    const sid = map.get(s.responseId)
    if (!sid) return s
    const student = byId.get(sid)
    return student
      ? { ...s, studentId: sid, gradeId: student.gradeId, classId: student.classId }
      : s
  })

  audit(next, 'تأكيد جماعي للمطابقة', 'response', 'bulk',
    `${linked.length} استجابة ذات مرشّح واحد`)
  return next
}

/** رفض المطابقة: تبقى الاستجابة محفوظة بلا ربط، وتُعلَّم كجديدة. */
export function rejectMatch(state: SystemState, responseId: Id): SystemState {
  const next = clone(state)
  next.responses = next.responses.map((r) =>
    r.id === responseId
      ? {
          ...r,
          studentId: null,
          classId: null,
          matchStatus: 'NEW',
          candidateStudentIds: [],
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'إدارة المدرسة',
        }
      : r,
  )
  const response = next.responses.find((r) => r.id === responseId)
  audit(next, 'رفض مطابقة', 'response', responseId, `«${response?.rawName}»`)
  return next
}

// ───────────────── تمييز المراجعة ─────────────────

/**
 * «تمت المراجعة ✓» — يزيل التمييز البصري لا غير.
 *
 * لا يحذف سجلًا ولا استجابة، ولا يغيّر نتيجة ولا مطابقة ولا اسم طالبة.
 * يسجّل فقط أن الإدارة اطّلعت على الحالة، ويُدوَّن ذلك في سجل العمليات.
 */
export function markReviewed(state: SystemState, responseId: Id,
                             by = 'إدارة المدرسة'): SystemState {
  const next = clone(state)
  const response = next.responses.find((r) => r.id === responseId)
  next.reviewAcks = { ...next.reviewAcks, [responseId]: { at: new Date().toISOString(), by } }
  audit(next, 'تمت مراجعة حالة', 'review', responseId,
    `«${response?.rawName ?? responseId}» — اطّلاع فقط، بلا تغيير في البيانات`)
  return next
}

/** إعادة التمييز للمراجعة — تراجُع عن الإقرار دون أي أثر على البيانات. */
export function unmarkReviewed(state: SystemState, responseId: Id): SystemState {
  const next = clone(state)
  const response = next.responses.find((r) => r.id === responseId)
  const acks = { ...next.reviewAcks }
  delete acks[responseId]
  next.reviewAcks = acks
  audit(next, 'إعادة تمييز للمراجعة', 'review', responseId,
    `«${response?.rawName ?? responseId}»`)
  return next
}

// ───────────────── آراء الطالبات ─────────────────

export function categorizeSuggestion(
  state: SystemState,
  suggestionId: Id,
  categoryId: Id | null,
): SystemState {
  const next = clone(state)
  next.suggestions = next.suggestions.map((s) =>
    s.id === suggestionId ? { ...s, categoryId } : s,
  )
  audit(next, 'تصنيف رأي', 'suggestion', suggestionId, categoryId ?? 'بلا تصنيف')
  return next
}

export function setSuggestionStatus(
  state: SystemState,
  suggestionId: Id,
  status: SuggestionStatus,
): SystemState {
  const next = clone(state)
  next.suggestions = next.suggestions.map((s) =>
    s.id === suggestionId ? { ...s, status } : s,
  )
  audit(next, 'تغيير حالة رأي', 'suggestion', suggestionId, status)
  return next
}

// ───────────────── إجراءات التحسين ─────────────────

export type ActionDraft = Omit<ImprovementAction, 'id' | 'createdAt' | 'updatedAt' | 'evidence'> & {
  evidence?: ImprovementAction['evidence']
}

/**
 * حالة الرأي تتبع ارتباطه بإجراء، لا تُكتب بيدٍ منفصلة.
 *
 * وإلّا ربطت الإدارة رأيًا بإجراء وبقي مكتوبًا عليه «جديد»، فعدّته
 * لوحة الصدر رأيًا بلا جواب وهو مُجاب. والعكس عند فكّ الربط: يعود
 * «مُراجَعًا» لا «جديدًا»، لأن الإدارة قرأته فعلًا.
 */
function syncLinkedStatus(next: SystemState): void {
  const linked = new Set<Id>()
  for (const action of next.improvementActions) {
    for (const sid of action.linkedSuggestionIds) linked.add(sid)
  }
  next.suggestions = next.suggestions.map((s) => {
    if (linked.has(s.id)) return s.status === 'linked' ? s : { ...s, status: 'linked' }
    return s.status === 'linked' ? { ...s, status: 'reviewed' } : s
  })
}

export function addAction(state: SystemState, draft: ActionDraft): SystemState {
  const next = clone(state)
  const now = new Date().toISOString()
  const action: ImprovementAction = {
    ...draft,
    evidence: draft.evidence ?? [],
    id: newId('ia'),
    createdAt: now,
    updatedAt: now,
  }
  next.improvementActions = [action, ...next.improvementActions]
  syncLinkedStatus(next)
  audit(next, 'إضافة إجراء تحسين', 'action', action.id, action.title)
  return next
}

export function updateAction(state: SystemState, id: Id, draft: ActionDraft): SystemState {
  const next = clone(state)
  next.improvementActions = next.improvementActions.map((a) =>
    a.id === id
      ? { ...a, ...draft, evidence: draft.evidence ?? a.evidence, updatedAt: new Date().toISOString() }
      : a,
  )
  syncLinkedStatus(next)
  audit(next, 'تعديل إجراء تحسين', 'action', id, draft.title)
  return next
}

export function removeAction(state: SystemState, id: Id): SystemState {
  const next = clone(state)
  const action = next.improvementActions.find((a) => a.id === id)
  next.improvementActions = next.improvementActions.filter((a) => a.id !== id)
  syncLinkedStatus(next)
  audit(next, 'حذف إجراء تحسين', 'action', id, action?.title ?? '')
  return next
}

// ───────────────── استجابات القياس من الويب ─────────────────

export interface WebSubmission {
  studentId: Id
  cycleId: Id
  answers: { questionId: Id; optionId: Id | null; rawValue: string | null; score: number | null }[]
}

export interface SubmitOutcome {
  state: SystemState
  status: 'saved' | 'pending_review'
  responseId: Id
}

/**
 * حفظ استجابة جديدة. إن كانت للطالبة استجابة سابقة في الدورة نفسها،
 * تُحفظ الجديدة كاملة وتُعلَّم للمراجعة بدل حذف السابقة أو استبدالها.
 */
export function submitResponse(state: SystemState, payload: WebSubmission): SubmitOutcome {
  const next = clone(state)
  const student = next.students.find((s) => s.id === payload.studentId)
  if (!student) throw new Error('لا توجد طالبة بهذا المعرّف')

  const previous = next.responses.some(
    (r) => r.studentId === payload.studentId && r.cycleId === payload.cycleId,
  )

  const id = newId('rs')
  next.responses = [
    {
      id,
      cycleId: payload.cycleId,
      studentId: student.id,
      rawName: student.name,
      declaredGradeId: student.gradeId,
      classId: student.classId,
      matchStatus: 'MATCHED',
      candidateStudentIds: [student.id],
      duplicateFlag: previous,
      source: 'web',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    },
    ...next.responses,
  ]

  next.answers = [
    ...next.answers,
    ...payload.answers.map((a) => ({ responseId: id, ...a })),
  ]

  const free = payload.answers.find((a) => a.questionId === 'q_suggestion' && a.rawValue)
  if (free) {
    next.suggestions = [
      {
        id: newId('sg'),
        responseId: id,
        studentId: student.id,
        gradeId: student.gradeId,
        classId: student.classId,
        text: free.rawValue as string,
        categoryId: null,
        status: 'new',
      },
      ...next.suggestions,
    ]
  }

  audit(next, previous ? 'استجابة مكرّرة للمراجعة' : 'استجابة جديدة', 'response', id, student.name)
  return { state: next, status: previous ? 'pending_review' : 'saved', responseId: id }
}
