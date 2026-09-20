import { describe, expect, it } from 'vitest'

import { initialState } from '../data/store'

const state = initialState()

describe('سلامة مجموعة البيانات المستوردة', () => {
  it('تحمل هوية القياس والمدرسة الصحيحة', () => {
    expect(state.meta.school).toBe('الابتدائية الخامسة والستون بعد المائة')
    expect(state.meta.surveyTitle).toBe('قياس اتجاه المتعلمين')
    expect(state.meta.hijriYear).toBe('1448')
    expect(state.meta.academicYear).toBe('1447-1448')
  })

  it('تحتوي ٢٣ سؤالًا مقيسًا + التقويم العام + الاقتراحات', () => {
    expect(state.questions.filter((q) => q.kind === 'likert')).toHaveLength(23)
    expect(state.questions.filter((q) => q.kind === 'overall')).toHaveLength(1)
    expect(state.questions.filter((q) => q.kind === 'text')).toHaveLength(1)
  })

  it('تحفظ نصوص الأسئلة كما وردت في المصدر بلا إعادة صياغة', () => {
    const first = state.questions.find((q) => q.order === 1)
    expect(first?.text).toBe('1_توضح االمدرسة تعليماتها من بداية العام الدراسي لجميع الطلاب')
    const sixth = state.questions.find((q) => q.order === 6)
    expect(sixth?.text).toBe('6-لانراعي المدرسة اختلاف القدرات بين الطالبات')
  })

  it('تعلّم ستة أسئلة بأنها عكسية الاتجاه مع تعليل كل واحد', () => {
    const reverse = state.questions.filter((q) => q.direction === 'reverse')
    expect(reverse.map((q) => q.order).sort((a, b) => a - b)).toEqual([6, 7, 16, 17, 19, 21])
    for (const q of reverse) expect(q.reverseNote).toBeTruthy()
  })

  it('تستخدم مقياسًا ثلاثيًا بثلاثة خيارات فقط', () => {
    expect(state.options).toHaveLength(3)
    expect(state.meta.scale).toEqual({ min: 1, max: 3 })
    expect(state.options.map((o) => o.score).sort()).toEqual([1, 2, 3])
  })

  it('تعرض خيارات التقويم العام كما وردت في المصدر دون افتراض فئات', () => {
    expect(state.overallOptions).toEqual(['ممتاز', 'جيد'])
  })

  it('تستورد ٩٩ طالبة من الكشوف الرسمية موزّعات على أربعة فصول', () => {
    expect(state.students).toHaveLength(99)
    expect(state.classes).toHaveLength(4)
    const counts = Object.fromEntries(
      state.classes.map((c) => [c.id, state.students.filter((s) => s.classId === c.id).length]),
    )
    expect(counts).toEqual({ 'g3-c1': 23, 'g3-c2': 26, 'g6-c1': 22, 'g6-c2': 28 })
  })

  it('تستورد ١٣٦ استجابة من ملفات Excel الثلاثة', () => {
    expect(state.responses).toHaveLength(136)
  })

  it('لا تربط أي استجابة بطالبة إلا إذا كانت مطابقتها مؤكّدة', () => {
    for (const r of state.responses) {
      if (r.studentId) expect(r.matchStatus).toBe('MATCHED')
      if (r.matchStatus !== 'MATCHED') expect(r.studentId).toBeNull()
    }
  })

  it('تحافظ على كل معرّف طالبة مرجعيًا داخل قائمة الطالبات', () => {
    const ids = new Set(state.students.map((s) => s.id))
    for (const r of state.responses) {
      if (r.studentId) expect(ids.has(r.studentId)).toBe(true)
      for (const c of r.candidateStudentIds) expect(ids.has(c)).toBe(true)
    }
  })

  it('تربط كل إجابة باستجابة وسؤال موجودين', () => {
    const rids = new Set(state.responses.map((r) => r.id))
    const qids = new Set(state.questions.map((q) => q.id))
    for (const a of state.answers) {
      expect(rids.has(a.responseId)).toBe(true)
      expect(qids.has(a.questionId)).toBe(true)
    }
  })

  it('تخصّص خانة إجابة لكل سؤال مقيس في كل استجابة', () => {
    const likert = state.answers.filter((a) => /^q\d+$/.test(a.questionId))
    expect(likert).toHaveLength(136 * 23)
  })

  it('توحّد كل صيغ الإجابات المكتوبة بأخطاء إملائية إلى الخيارات الثلاثة', () => {
    const recognized = state.answers.filter((a) => a.optionId !== null)
    const unrecognized = state.answers.filter(
      (a) => a.rawValue !== null && a.optionId === null && /^q\d+$/.test(a.questionId),
    )
    expect(recognized.length).toBe(3027)
    expect(unrecognized).toHaveLength(0)
  })

  it('تحفظ ٥٨ رأيًا بنصّها الأصلي', () => {
    expect(state.suggestions).toHaveLength(58)
    for (const s of state.suggestions) expect(s.text.trim().length).toBeGreaterThan(0)
  })

  it('ترصد الأسماء المتكرّرة دون حذفها أو دمجها', () => {
    expect(state.duplicateGroups.length).toBeGreaterThan(0)
    const flagged = state.responses.filter((r) => r.duplicateFlag)
    const expected = state.duplicateGroups.reduce((n, g) => n + g.responseIds.length, 0)
    expect(flagged).toHaveLength(expected)
  })
})
