import { beforeEach, describe, expect, it } from 'vitest'

import { initialState } from '../data/store'
import {
  addStudent, archiveStudent, confirmMatch, confirmUnambiguousMatches,
  rejectMatch, restoreStudent, submitResponse, updateStudent,
} from '../domain/actions'
import type { SystemState } from '../domain/types'
import { nonRespondents, participation, responsesInScope, studentsInScope } from '../lib/analysis'

let state: SystemState

beforeEach(() => {
  state = initialState()
})

describe('TEST 1 — إضافة طالبة', () => {
  it('تظهر في الفصل الصحيح وتُسجَّل في سجل العمليات', () => {
    const before = studentsInScope(state, { classId: 'g6-c1' }).length
    const next = addStudent(state, { name: 'طالبة اختبار', gradeId: 'g6', classId: 'g6-c1' })

    expect(studentsInScope(next, { classId: 'g6-c1' })).toHaveLength(before + 1)
    expect(next.students.find((s) => s.name === 'طالبة اختبار')?.source).toBe('manual')
    expect(next.audit[0].operation).toBe('إضافة طالبة')
  })

  it('تُدرَج ضمن غير المستجيبات لأنها بلا استجابة', () => {
    const next = addStudent(state, { name: 'طالبة اختبار', gradeId: 'g6', classId: 'g6-c1' })
    expect(nonRespondents(next, { classId: 'g6-c1' }).some((s) => s.name === 'طالبة اختبار')).toBe(true)
  })
})

describe('TEST 2 — تعديل بيانات الطالبة', () => {
  it('يظهر التعديل ويحافظ على المعرّف نفسه', () => {
    const target = state.students[0]
    const next = updateStudent(state, target.id, {
      name: 'اسم بعد التعديل', gradeId: target.gradeId, classId: target.classId,
    })
    const after = next.students.find((s) => s.id === target.id)

    expect(after?.name).toBe('اسم بعد التعديل')
    expect(next.students).toHaveLength(state.students.length)
    expect(next.audit[0].operation).toBe('تعديل طالبة')
  })
})

describe('TEST 3 — نقل طالبة بين الفصول', () => {
  it('تختفي من الفصل السابق وتظهر في الجديد بلا تكرار', () => {
    const target = state.students.find((s) => s.classId === 'g6-c1')!
    const next = updateStudent(state, target.id, {
      name: target.name, gradeId: 'g6', classId: 'g6-c2',
    })

    expect(studentsInScope(next, { classId: 'g6-c1' }).some((s) => s.id === target.id)).toBe(false)
    expect(studentsInScope(next, { classId: 'g6-c2' }).some((s) => s.id === target.id)).toBe(true)
    expect(next.students.filter((s) => s.id === target.id)).toHaveLength(1)
    expect(next.students).toHaveLength(state.students.length)
    expect(next.audit[0].operation).toBe('نقل طالبة')
  })

  it('ينقل استجاباتها معها ولا يفقد أيًّا منها', () => {
    const linked = state.responses.find((r) => r.studentId)!
    const student = state.students.find((s) => s.id === linked.studentId)!
    const next = updateStudent(state, student.id, {
      name: student.name, gradeId: student.gradeId, classId: 'g6-c1',
    })

    expect(next.responses).toHaveLength(state.responses.length)
    expect(next.responses.find((r) => r.id === linked.id)?.classId).toBe('g6-c1')
    expect(responsesInScope(next, { classId: 'g6-c1' }).some((r) => r.id === linked.id)).toBe(true)
  })
})

describe('TEST 4 — الأرشفة', () => {
  it('تختفي من القوائم النشطة ويبقى سجلها وبياناتها', () => {
    const target = state.students.find((s) => s.classId === 'g6-c2')!
    const next = archiveStudent(state, target.id)

    expect(studentsInScope(next, { classId: 'g6-c2' }).some((s) => s.id === target.id)).toBe(false)
    expect(next.students.find((s) => s.id === target.id)?.status).toBe('archived')
    expect(next.students).toHaveLength(state.students.length)
    expect(next.audit[0].operation).toBe('أرشفة طالبة')
  })

  it('لا تفقد استجابات الطالبة المؤرشفة', () => {
    const linked = state.responses.find((r) => r.studentId)!
    const next = archiveStudent(state, linked.studentId as string)
    expect(next.responses).toHaveLength(state.responses.length)
    expect(next.responses.find((r) => r.id === linked.id)?.studentId).toBe(linked.studentId)
  })
})

describe('TEST 5 — الاستعادة', () => {
  it('تعيد الطالبة نشطة كما كانت', () => {
    const target = state.students[5]
    const restored = restoreStudent(archiveStudent(state, target.id), target.id)
    const after = restored.students.find((s) => s.id === target.id)

    expect(after?.status).toBe('active')
    expect(after?.archivedAt).toBeNull()
    expect(after?.classId).toBe(target.classId)
  })
})

describe('TEST 6 — حفظ استجابة القياس', () => {
  it('تحفظ الإجابات وتربطها بالطالبة والدورة', () => {
    const student = nonRespondents(state, { classId: 'g6-c2' })[0]
    const answers = state.questions
      .filter((q) => q.kind === 'likert')
      .map((q) => ({ questionId: q.id, optionId: 'agree_fully', rawValue: 'أوافق تماماً', score: 3 }))

    const { state: next, status, responseId } = submitResponse(state, {
      studentId: student.id, cycleId: 'cy-1448', answers,
    })

    expect(status).toBe('saved')
    expect(next.responses).toHaveLength(state.responses.length + 1)
    const saved = next.responses.find((r) => r.id === responseId)!
    expect(saved.studentId).toBe(student.id)
    expect(saved.cycleId).toBe('cy-1448')
    expect(saved.matchStatus).toBe('MATCHED')
    expect(saved.submittedAt).not.toBeNull()
    expect(next.answers.filter((a) => a.responseId === responseId)).toHaveLength(23)
  })

  it('تحفظ الرأي النصّي في «صوت طالباتنا» بنصّه الأصلي', () => {
    const student = nonRespondents(state, { classId: 'g6-c2' })[0]
    const { state: next } = submitResponse(state, {
      studentId: student.id, cycleId: 'cy-1448',
      answers: [{ questionId: 'q_suggestion', optionId: null, rawValue: 'نرجو تظليل الساحة', score: null }],
    })
    expect(next.suggestions[0].text).toBe('نرجو تظليل الساحة')
    expect(next.suggestions).toHaveLength(state.suggestions.length + 1)
  })
})

describe('TEST 7 — تحديث أرقام اللوحة بعد الاستجابة', () => {
  it('ترتفع المستجيبات وتنخفض غير المستجيبات بمقدار واحد', () => {
    const before = participation(state, { classId: 'g6-c2' })
    const student = nonRespondents(state, { classId: 'g6-c2' })[0]

    const { state: next } = submitResponse(state, {
      studentId: student.id, cycleId: 'cy-1448',
      answers: [{ questionId: 'q01', optionId: 'agree_fully', rawValue: 'أوافق تماماً', score: 3 }],
    })
    const after = participation(next, { classId: 'g6-c2' })

    expect(after.confirmedRespondents).toBe(before.confirmedRespondents + 1)
    expect(after.nonRespondents).toBe(before.nonRespondents - 1)
    expect(after.responsesReceived).toBe(before.responsesReceived + 1)
    expect(after.totalStudents).toBe(before.totalStudents)
  })
})

describe('TEST 8 — قائمة غير المستجيبات', () => {
  it('تستبعد من استجابت وتشمل من لم تستجب', () => {
    const student = nonRespondents(state, { classId: 'g6-c2' })[0]
    const { state: next } = submitResponse(state, {
      studentId: student.id, cycleId: 'cy-1448',
      answers: [{ questionId: 'q01', optionId: 'agree_fully', rawValue: 'أوافق تماماً', score: 3 }],
    })
    expect(nonRespondents(next, { classId: 'g6-c2' }).some((s) => s.id === student.id)).toBe(false)
  })
})

describe('TEST 12 — الاستجابات المتكررة', () => {
  it('تحفظ الاستجابة الثانية للمراجعة ولا تحذف الأولى', () => {
    const student = nonRespondents(state, { classId: 'g6-c2' })[0]
    const payload = {
      studentId: student.id, cycleId: 'cy-1448',
      answers: [{ questionId: 'q01', optionId: 'agree_fully', rawValue: 'أوافق تماماً', score: 3 }],
    }
    const first = submitResponse(state, payload)
    const second = submitResponse(first.state, payload)

    expect(first.status).toBe('saved')
    expect(second.status).toBe('pending_review')
    expect(second.state.responses).toHaveLength(state.responses.length + 2)
    expect(second.state.responses.find((r) => r.id === first.responseId)).toBeDefined()
    expect(second.state.responses.find((r) => r.id === second.responseId)?.duplicateFlag).toBe(true)
  })
})

describe('مركز مراجعة المطابقة', () => {
  it('لا يربط أي مطابقة محتملة تلقائيًا', () => {
    const possible = state.responses.filter((r) => r.matchStatus === 'POSSIBLE_MATCH')
    expect(possible.length).toBeGreaterThan(0)
    for (const r of possible) expect(r.studentId).toBeNull()
  })

  it('يربط الاستجابة بعد التأكيد الإداري ويحدّث الأرقام', () => {
    // تُختار حالة مرشّحتها ليست مستجيبة مؤكّدة أصلًا: عدّ المستجيبات
    // يحسب الطالبات المتمايزات، فربط استجابة ثانية بالطالبة نفسها لا يرفعه.
    const linked = new Set(state.responses.filter((r) => r.studentId).map((r) => r.studentId))
    const target = state.responses.find(
      (r) => r.matchStatus === 'POSSIBLE_MATCH'
        && r.candidateStudentIds.length === 1
        && !linked.has(r.candidateStudentIds[0]),
    )!
    const candidate = target.candidateStudentIds[0]
    const gradeId = state.students.find((s) => s.id === candidate)!.gradeId
    const before = participation(state, { gradeId })

    const next = confirmMatch(state, target.id, candidate)
    const after = participation(next, { gradeId })

    expect(next.responses.find((r) => r.id === target.id)?.matchStatus).toBe('MATCHED')
    expect(next.responses.find((r) => r.id === target.id)?.studentId).toBe(candidate)
    expect(after.confirmedRespondents).toBe(before.confirmedRespondents + 1)
    expect(after.awaitingReview).toBe(before.awaitingReview - 1)
    expect(next.audit[0].operation).toBe('تأكيد مطابقة')
  })

  it('لا يرفع عدد المستجيبات عند ربط استجابة ثانية بالطالبة نفسها', () => {
    const linked = state.responses.find((r) => r.studentId)!
    const other = state.responses.find(
      (r) => r.matchStatus === 'POSSIBLE_MATCH' && r.id !== linked.id,
    )!
    const gradeId = state.students.find((s) => s.id === linked.studentId)!.gradeId
    const before = participation(state, { gradeId })
    const next = confirmMatch(state, other.id, linked.studentId as string)
    const after = participation(next, { gradeId })

    expect(after.confirmedRespondents).toBe(before.confirmedRespondents)
    expect(after.responsesReceived).toBe(before.responsesReceived)
    expect(next.responses).toHaveLength(state.responses.length)
  })

  it('يحتفظ بالاستجابة كاملة عند رفض المطابقة', () => {
    const target = state.responses.find((r) => r.matchStatus === 'POSSIBLE_MATCH')!
    const next = rejectMatch(state, target.id)

    expect(next.responses).toHaveLength(state.responses.length)
    expect(next.responses.find((r) => r.id === target.id)?.studentId).toBeNull()
    expect(next.responses.find((r) => r.id === target.id)?.matchStatus).toBe('NEW')
    expect(next.answers.filter((a) => a.responseId === target.id).length).toBeGreaterThan(0)
  })

  it('يمنع فقدان أي استجابة مهما تكرّرت عمليات المراجعة', () => {
    let s = state
    for (const r of state.responses.filter((x) => x.matchStatus === 'POSSIBLE_MATCH').slice(0, 10)) {
      s = confirmMatch(s, r.id, r.candidateStudentIds[0])
    }
    expect(s.responses).toHaveLength(state.responses.length)
    expect(s.answers).toHaveLength(state.answers.length)
  })
})

describe('التأكيد الجماعي للمطابقة', () => {
  it('يربط الحالات ذات المرشّح الواحد فقط، ويستثني ما عداها', () => {
    const unambiguous = state.responses.filter(
      (r) => r.matchStatus === 'POSSIBLE_MATCH' && r.candidateStudentIds.length === 1,
    )
    const ambiguous = state.responses.filter(
      (r) => r.matchStatus === 'POSSIBLE_MATCH' && r.candidateStudentIds.length > 1,
    )
    const newOnes = state.responses.filter((r) => r.matchStatus === 'NEW')
    expect(unambiguous.length).toBeGreaterThan(0)

    const next = confirmUnambiguousMatches(state)

    for (const r of unambiguous) {
      const after = next.responses.find((x) => x.id === r.id)!
      expect(after.matchStatus).toBe('MATCHED')
      expect(after.studentId).toBe(r.candidateStudentIds[0])
      expect(after.reviewedBy).toBe('إدارة المدرسة')
    }
    for (const r of [...ambiguous, ...newOnes]) {
      expect(next.responses.find((x) => x.id === r.id)?.matchStatus).toBe(r.matchStatus)
      expect(next.responses.find((x) => x.id === r.id)?.studentId).toBeNull()
    }
  })

  it('لا يحذف ولا يفقد أي استجابة أو إجابة', () => {
    const next = confirmUnambiguousMatches(state)
    expect(next.responses).toHaveLength(state.responses.length)
    expect(next.answers).toHaveLength(state.answers.length)
    expect(next.suggestions).toHaveLength(state.suggestions.length)
  })

  it('يُسجَّل في سجل العمليات ويبقى قابلًا للفكّ', () => {
    const next = confirmUnambiguousMatches(state)
    expect(next.audit[0].operation).toBe('تأكيد جماعي للمطابقة')

    const one = next.responses.find((r) => r.matchStatus === 'MATCHED' && r.reviewedAt)!
    const undone = rejectMatch(next, one.id)
    expect(undone.responses.find((r) => r.id === one.id)?.studentId).toBeNull()
    expect(undone.answers).toHaveLength(next.answers.length)
  })

  it('يرفع عدد المستجيبات المؤكّدات ويخفض المنتظرة للمراجعة', () => {
    const before = participation(state, {})
    const after = participation(confirmUnambiguousMatches(state), {})
    expect(after.confirmedRespondents).toBeGreaterThan(before.confirmedRespondents)
    expect(after.awaitingReview).toBeLessThan(before.awaitingReview)
    expect(after.totalStudents).toBe(before.totalStudents)
    expect(after.responsesReceived).toBe(before.responsesReceived)
  })
})
