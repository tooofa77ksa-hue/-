/** رأي وليّ الأمر يصل من رابط القياس كإجابة مفتوحة، لا كسجلّ رأي. */
import { describe, expect, it } from 'vitest'

import { derivedVoices, FREE_TEXT_QUESTION } from '../domain/voices'
import type { Answer, Student, Suggestion, SurveyResponse } from '../domain/types'

const student = {
  id: 'st-1', name: 'سارة محمد', normalizedName: 'سارة محمد',
  gradeId: 'g3', classId: 'g3-c1', rosterNo: 4, source: 'roster',
  status: 'active', archivedAt: null,
} as Student

const web = {
  id: 'rs-web', cycleId: 'c1', rawName: 'سارة محمد', declaredGradeId: 'g3',
  classId: 'g3-c1', matchStatus: 'NEW', studentId: null, candidateStudentIds: [],
  duplicateFlag: false, source: 'web', submittedAt: '2026-10-04T08:00:00.000Z',
  reviewedAt: null, reviewedBy: null,
} as unknown as SurveyResponse

const answer = (responseId: string, rawValue: string | null): Answer => ({
  responseId, questionId: FREE_TEXT_QUESTION, rawValue, optionId: null, score: null,
})

describe('آراء القياس العام', () => {
  it('تُشتقّ من الإجابة المفتوحة بنصّها', () => {
    const [voice] = derivedVoices([web], [answer('rs-web', ' تكثر الملازم ')], [], [student])
    expect(voice.text).toBe('تكثر الملازم')
    expect(voice.responseId).toBe('rs-web')
    expect(voice.classId).toBe('g3-c1')
  })

  it('ولا تُشتقّ لمن سجّل رأيه أصلًا، فلا يتكرّر الرأي مرتين', () => {
    const stored = [{ id: 'sg-1', responseId: 'rs-web', text: 'نصٌّ مسجَّل' } as Suggestion]
    expect(derivedVoices([web], [answer('rs-web', 'نصّ')], stored, [student])).toHaveLength(0)
  })

  it('ولا لإجابةٍ فارغة أو بلا نصّ', () => {
    expect(derivedVoices([web], [answer('rs-web', '   ')], [], [student])).toHaveLength(0)
    expect(derivedVoices([web], [answer('rs-web', null)], [], [student])).toHaveLength(0)
    expect(derivedVoices([web], [], [], [student])).toHaveLength(0)
  })

  it('ومعرّفها ثابت، فلا ينفكّ ربطها ببند التحسين بعد كل تحميل', () => {
    const once = derivedVoices([web], [answer('rs-web', 'نصّ')], [], [student])
    const twice = derivedVoices([web], [answer('rs-web', 'نصّ')], [], [student])
    expect(once[0].id).toBe(twice[0].id)
    expect(once[0].id).toContain('rs-web')
  })

  it('وتُنسب إلى فصل صاحبتها إن تأكّد ربطها، لا إلى الصف الذي أُعلن', () => {
    const linked = { ...web, studentId: 'st-1', declaredGradeId: 'g1', classId: 'g1-c2' }
    const [voice] = derivedVoices([linked], [answer('rs-web', 'نصّ')], [], [student])
    expect(voice.gradeId).toBe('g3')
    expect(voice.classId).toBe('g3-c1')
  })
})
