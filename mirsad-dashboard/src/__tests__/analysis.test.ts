import { describe, expect, it } from 'vitest'

import { initialState } from '../data/store'
import {
  SCHOOL_SCOPE, adjustScore, analyzeAllQuestions, analyzeQuestion, nonRespondents,
  overallDistribution, participation, responsesInScope, satisfactionIndex,
  strengthsAndGaps, studentsInScope, suggestionsInScope,
} from '../lib/analysis'
import type { Question } from '../domain/types'

const state = initialState()

describe('عكس درجات الأسئلة السلبية', () => {
  const positive = { direction: 'positive' } as Question
  const reverse = { direction: 'reverse' } as Question

  it('يترك السؤال الإيجابي كما هو', () => {
    expect(adjustScore(3, positive, 1, 3)).toBe(3)
    expect(adjustScore(1, positive, 1, 3)).toBe(1)
  })

  it('يقلب طرفَي المقياس في السؤال العكسي', () => {
    expect(adjustScore(3, reverse, 1, 3)).toBe(1)
    expect(adjustScore(1, reverse, 1, 3)).toBe(3)
    expect(adjustScore(2, reverse, 1, 3)).toBe(2)
  })
})

describe('نطاق التحليل', () => {
  it('يشمل نطاق المدرسة كل الطالبات النشطات', () => {
    expect(studentsInScope(state, SCHOOL_SCOPE)).toHaveLength(99)
  })

  it('يحصر نطاق الصف طالباته وحدهم', () => {
    expect(studentsInScope(state, { gradeId: 'g6' })).toHaveLength(50)
    expect(studentsInScope(state, { gradeId: 'g3' })).toHaveLength(49)
  })

  it('يحصر نطاق الفصل طالباته وحدهم', () => {
    expect(studentsInScope(state, { classId: 'g6-c2' })).toHaveLength(28)
  })

  it('ينسب كل الاستجابات إلى نطاق المدرسة', () => {
    expect(responsesInScope(state, SCHOOL_SCOPE)).toHaveLength(136)
  })

  it('لا ينسب إلى الفصل إلا الاستجابات المرتبطة بطالبة مؤكّدة', () => {
    const rows = responsesInScope(state, { classId: 'g6-c2' })
    for (const r of rows) expect(r.studentId).not.toBeNull()
  })
})

describe('نِسَب الاستجابة', () => {
  it('تحسب غير المستجيبات كفرق بين طالبات الكشف والمستجيبات المؤكّدات', () => {
    const p = participation(state, SCHOOL_SCOPE)
    expect(p.totalStudents).toBe(99)
    expect(p.confirmedRespondents + p.nonRespondents).toBe(p.totalStudents)
  })

  it('تطابق قائمة غير المستجيبات عددَها في مؤشّر الاستجابة', () => {
    for (const scope of [SCHOOL_SCOPE, { gradeId: 'g6' }, { classId: 'g6-c1' }]) {
      const p = participation(state, scope)
      expect(nonRespondents(state, scope)).toHaveLength(p.nonRespondents)
    }
  })

  it('تعدّ الاستجابات غير المؤكّدة ضمن «بانتظار المراجعة» لا ضمن المستجيبات', () => {
    const p = participation(state, SCHOOL_SCOPE)
    expect(p.awaitingReview).toBe(
      state.responses.filter((r) => r.matchStatus === 'POSSIBLE_MATCH' || r.matchStatus === 'NEW').length,
    )
    expect(p.confirmedRespondents).toBeLessThanOrEqual(p.responsesReceived)
  })

  it('تعطي نسبة صفرية عند غياب الكشف الرسمي بدل القسمة على صفر', () => {
    const p = participation(state, { gradeId: 'g2' })
    expect(p.totalStudents).toBe(0)
    expect(p.rate).toBe(0)
    expect(p.withoutRoster).toBe(42)
  })
})

describe('تحليل الأسئلة', () => {
  it('يجعل مجموع النسب ١٠٠٪ عند وجود إجابات', () => {
    for (const a of analyzeAllQuestions(state, SCHOOL_SCOPE)) {
      if (a.n === 0) continue
      const total = a.counts.reduce((s, c) => s + c.percent, 0)
      expect(total).toBeCloseTo(100, 6)
    }
  })

  it('يجعل مجموع التكرارات مساويًا لقاعدة الحساب ن', () => {
    for (const a of analyzeAllQuestions(state, SCHOOL_SCOPE)) {
      expect(a.counts.reduce((s, c) => s + c.count, 0)).toBe(a.n)
    }
  })

  it('يحسب ن + المفقود = عدد الاستجابات في النطاق', () => {
    const total = responsesInScope(state, SCHOOL_SCOPE).length
    for (const a of analyzeAllQuestions(state, SCHOOL_SCOPE)) {
      expect(a.n + a.missing).toBe(total)
    }
  })

  it('يعكس متوسط السؤال السلبي بالنسبة إلى متوسطه الخام', () => {
    const q = state.questions.find((x) => x.order === 21)
    const a = analyzeQuestion(state, q!.id, SCHOOL_SCOPE)
    expect(a?.adjustedMean).toBeCloseTo(1 + 3 - (a?.rawMean as number), 6)
  })

  it('يبقي متوسط السؤال الإيجابي كما هو', () => {
    const q = state.questions.find((x) => x.order === 1)
    const a = analyzeQuestion(state, q!.id, SCHOOL_SCOPE)
    expect(a?.adjustedMean).toBeCloseTo(a?.rawMean as number, 6)
  })

  it('يعيد قاعدة حساب صفرية لنطاق بلا إجابات', () => {
    const a = analyzeQuestion(state, 'q01', { classId: 'g3-c1' })
    expect(a?.n).toBe(0)
    expect(a?.counts.every((c) => c.percent === 0)).toBe(true)
  })
})

describe('مؤشر الاتجاه', () => {
  it('يقع داخل حدّي المقياس', () => {
    const idx = satisfactionIndex(state, SCHOOL_SCOPE)
    expect(idx.mean).not.toBeNull()
    expect(idx.mean as number).toBeGreaterThanOrEqual(idx.scaleMin)
    expect(idx.mean as number).toBeLessThanOrEqual(idx.scaleMax)
  })

  it('يحوّل المتوسط إلى نسبة من مدى المقياس بصورة متّسقة', () => {
    const idx = satisfactionIndex(state, SCHOOL_SCOPE)
    const expected = (((idx.mean as number) - idx.scaleMin) / (idx.scaleMax - idx.scaleMin)) * 100
    expect(idx.percent).toBeCloseTo(expected, 6)
  })

  it('يستبعد الأسئلة النصّية والتقويم العام والإجابات المفقودة', () => {
    const idx = satisfactionIndex(state, SCHOOL_SCOPE)
    const scored = state.answers.filter(
      (a) => /^q\d+$/.test(a.questionId) && a.score !== null,
    ).length
    expect(idx.n).toBe(scored)
    expect(idx.questionCount).toBe(23)
  })

  it('يعيد قيمة فارغة لا صفرًا عند غياب الإجابات', () => {
    const idx = satisfactionIndex(state, { classId: 'g3-c1' })
    expect(idx.mean).toBeNull()
    expect(idx.percent).toBeNull()
    expect(idx.n).toBe(0)
  })
})

describe('التقويم العام والآراء', () => {
  it('يوزّع التقويم العام بقيم المصدر ونسب مجموعها ١٠٠٪', () => {
    const d = overallDistribution(state, SCHOOL_SCOPE)
    expect(d.n).toBe(131)
    expect(d.rows.map((r) => r.value)).toEqual(['ممتاز', 'جيد'])
    expect(d.rows.reduce((s, r) => s + r.percent, 0)).toBeCloseTo(100, 6)
    expect(d.rows.reduce((s, r) => s + r.count, 0)).toBe(d.n)
  })

  it('يحصر الآراء داخل النطاق المطلوب', () => {
    expect(suggestionsInScope(state, SCHOOL_SCOPE)).toHaveLength(58)
    const g6 = suggestionsInScope(state, { gradeId: 'g6' })
    expect(g6.length).toBeLessThan(58)
  })

  it('يرتّب نقاط القوة تنازليًا وفرص التحسين تصاعديًا', () => {
    const { strengths, gaps } = strengthsAndGaps(state, SCHOOL_SCOPE, 5)
    for (let i = 1; i < strengths.length; i += 1) {
      expect(strengths[i - 1].adjustedMean as number).toBeGreaterThanOrEqual(strengths[i].adjustedMean as number)
    }
    for (let i = 1; i < gaps.length; i += 1) {
      expect(gaps[i - 1].adjustedMean as number).toBeLessThanOrEqual(gaps[i].adjustedMean as number)
    }
    expect(strengths[0].adjustedMean as number).toBeGreaterThanOrEqual(gaps[0].adjustedMean as number)
  })
})
