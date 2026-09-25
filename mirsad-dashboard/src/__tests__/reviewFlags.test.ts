/**
 * طبقة تمييز المراجعة.
 *
 * الشرط الحاكم: التمييز أداة عرض إدارية بحتة — لا يغيّر بيانات ولا نتائج
 * ولا مطابقة، ولا يظهر خارج صفحات الإدارة.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { initialState } from '../data/store'
import { markReviewed, unmarkReviewed } from '../domain/actions'
import type { SystemState } from '../domain/types'
import {
  analyzeAllQuestions, nonRespondents, overallDistribution,
  participation, satisfactionIndex,
} from '../lib/analysis'
import { flagCounts, flaggedCases, needsReview, reasonsFor } from '../lib/reviewFlags'
import { nonRespondentRows, questionRows, summaryRows } from '../lib/reportRows'

let state: SystemState

beforeEach(() => {
  state = initialState()
})

describe('اشتقاق الحالات المميَّزة', () => {
  it('يميّز ٤٠ حالة موزّعة على الأسباب المطلوبة', () => {
    const c = flagCounts(state)
    expect(c.total).toBe(40)
    expect(c.pending).toBe(40)
    expect(c.reviewed).toBe(0)
    expect(c.byReason.no_roster_match).toBe(16)
    expect(c.byReason.grade_mismatch).toBe(14)
    expect(c.byReason.duplicate_name).toBe(15)
    expect(c.byReason.incomplete_name).toBe(3)
    // «ترف» وحدها: اسمٌ واحد في الرابع وفيه ترفان — تنتظر قرار الإدارة
    expect(c.byReason.ambiguous_candidates).toBe(1)
  })

  it('يميّز كل استجابة NEW غير مرتبطة بطالبة', () => {
    const news = state.responses.filter((r) => r.matchStatus === 'NEW' && !r.studentId)
    expect(news).toHaveLength(16)
    for (const r of news) {
      expect(reasonsFor(r).some((x) => x.code === 'no_roster_match')).toBe(true)
    }
  })

  it('يميّز الاستجابات التي يخالف صفّها المعلن ملف مصدرها', () => {
    const flagged = state.responses.filter(
      (r) => reasonsFor(r).some((x) => x.code === 'grade_mismatch'),
    )
    expect(flagged).toHaveLength(14)
  })

  it('يميّز طرفَي كل مجموعة أسماء متكرّرة', () => {
    const flagged = state.responses.filter(
      (r) => reasonsFor(r).some((x) => x.code === 'duplicate_name'),
    )
    expect(state.duplicateGroups.length).toBeGreaterThanOrEqual(6)
    expect(flagged).toHaveLength(15)
  })

  it('يميّز الاسم غير المكتمل', () => {
    const flagged = state.responses.filter(
      (r) => reasonsFor(r).some((x) => x.code === 'incomplete_name'),
    )
    expect(flagged).toHaveLength(3)
  })

  it('لا يميّز الاستجابات السليمة', () => {
    const clean = state.responses.filter((r) => reasonsFor(r).length === 0)
    expect(clean.length).toBe(state.responses.length - 40)
    for (const r of clean) expect(needsReview(state, r.id)).toBe(false)
  })

  it('يشرح لكل حالة سببها بجملة واضحة', () => {
    for (const c of flaggedCases(state)) {
      expect(c.reasons.length).toBeGreaterThan(0)
      for (const r of c.reasons) expect(r.text.length).toBeGreaterThan(10)
    }
  })
})

describe('«تمت المراجعة ✓» ثم إعادة التمييز', () => {
  it('يزيل التمييز ويسجّل الاطّلاع في سجل العمليات', () => {
    const target = flaggedCases(state)[0]
    const next = markReviewed(state, target.responseId)

    expect(needsReview(next, target.responseId)).toBe(false)
    expect(flagCounts(next).pending).toBe(flagCounts(state).pending - 1)
    expect(flagCounts(next).reviewed).toBe(1)
    expect(flagCounts(next).total).toBe(flagCounts(state).total)
    expect(next.audit[0].operation).toBe('تمت مراجعة حالة')
    expect(next.reviewAcks[target.responseId].at).toBeTruthy()
    expect(next.reviewAcks[target.responseId].by).toBe('إدارة المدرسة')
  })

  it('لا يحذف سجلًا ولا استجابة ولا إجابة ولا رأيًا', () => {
    const target = flaggedCases(state)[0]
    const next = markReviewed(state, target.responseId)

    expect(next.responses).toHaveLength(state.responses.length)
    expect(next.answers).toHaveLength(state.answers.length)
    expect(next.students).toHaveLength(state.students.length)
    expect(next.suggestions).toHaveLength(state.suggestions.length)
  })

  it('لا يغيّر المطابقة ولا اسم الطالبة ولا أي حقل في السجل', () => {
    const target = flaggedCases(state)[0]
    const before = state.responses.find((r) => r.id === target.responseId)!
    const next = markReviewed(state, target.responseId)
    const after = next.responses.find((r) => r.id === target.responseId)!

    expect(after).toEqual(before)
    expect(next.students).toEqual(state.students)
  })

  it('لا يغيّر أي نتيجة ولا عدد', () => {
    const target = flaggedCases(state)[0]
    const next = markReviewed(state, target.responseId)

    expect(participation(next, {})).toEqual(participation(state, {}))
    expect(satisfactionIndex(next, {})).toEqual(satisfactionIndex(state, {}))
    expect(overallDistribution(next, {})).toEqual(overallDistribution(state, {}))
    expect(nonRespondents(next, {})).toEqual(nonRespondents(state, {}))
    expect(analyzeAllQuestions(next, {})).toEqual(analyzeAllQuestions(state, {}))
  })

  it('يعيد التمييز عند التراجع، وتعود الأرقام كما كانت', () => {
    const target = flaggedCases(state)[0]
    const marked = markReviewed(state, target.responseId)
    const restored = unmarkReviewed(marked, target.responseId)

    expect(needsReview(restored, target.responseId)).toBe(true)
    expect(flagCounts(restored)).toEqual(flagCounts(state))
    expect(restored.reviewAcks[target.responseId]).toBeUndefined()
    expect(restored.audit[0].operation).toBe('إعادة تمييز للمراجعة')
    expect(restored.responses).toEqual(state.responses)
  })

  it('يتحمّل مراجعة كل الحالات ثم التراجع عنها كلها', () => {
    let s = state
    for (const c of flaggedCases(state)) s = markReviewed(s, c.responseId)
    expect(flagCounts(s).pending).toBe(0)
    expect(flagCounts(s).reviewed).toBe(40)

    for (const c of flaggedCases(s)) s = unmarkReviewed(s, c.responseId)
    expect(flagCounts(s).pending).toBe(40)
    expect(s.responses).toEqual(state.responses)
    expect(s.answers).toEqual(state.answers)
  })
})

describe('التمييز لا يتسرّب إلى المخرجات الرسمية', () => {
  it('لا يظهر في صفوف Excel لغير المستجيبات', () => {
    const target = flaggedCases(state)[0]
    const next = markReviewed(state, target.responseId)
    expect(nonRespondentRows(next, {})).toEqual(nonRespondentRows(state, {}))

    const json = JSON.stringify(nonRespondentRows(state, {}))
    expect(json).not.toContain('يحتاج مراجعة')
    expect(json).not.toContain('reviewAck')
  })

  it('لا يظهر في ملخّص القياس ولا في نتائج الأسئلة', () => {
    for (const rows of [summaryRows(state, {}), questionRows(state, {})]) {
      const json = JSON.stringify(rows)
      expect(json).not.toContain('يحتاج مراجعة')
      expect(json).not.toContain('acknowledged')
    }
  })

  it('لا يغيّر صفوف التقارير عند تغيّر حالة المراجعة', () => {
    let s = state
    for (const c of flaggedCases(state)) s = markReviewed(s, c.responseId)
    expect(summaryRows(s, {})).toEqual(summaryRows(state, {}))
    expect(questionRows(s, {})).toEqual(questionRows(state, {}))
    expect(nonRespondentRows(s, {})).toEqual(nonRespondentRows(state, {}))
  })
})
