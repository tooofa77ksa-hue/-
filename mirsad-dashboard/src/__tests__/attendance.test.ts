/** من شاركت فعلًا: ثلاث درجات من الأثر، ونسبةٌ بالمنافسة لا بالفحص المنفرد. */
import { describe, expect, it } from 'vitest'

import { initialState } from '../data/store'
import { attendance, nameFit, nonParticipants } from '../lib/attendance'
import { participation } from '../lib/analysis'

const state = initialState()

describe('قرب الاسم', () => {
  it('صفر إذا اختلف الاسم الأول', () => {
    expect(nameFit('هند محمد العتيبي', 'سارة محمد العتيبي')).toBe(0)
  })

  it('وأعلى لمن اشتركت معها في أكثر', () => {
    const near = nameFit('ليان خالد سعد الحربي', 'ليان خالد الحربي')
    const far = nameFit('ليان عمر الزهراني', 'ليان خالد الحربي')
    expect(near).toBeGreaterThan(far)
  })
})

describe('حصر من لا أثر لها', () => {
  it('أقلّ بكثير ممن ليس لها استجابة مؤكَّدة', () => {
    // الفرق هو الاستجابات المنتظِرة تأكيد الاسم — ليست غيابًا
    const strict = participation(state, {}).nonRespondents
    const real = nonParticipants(state, {}).length
    expect(real).toBeLessThan(strict)
    expect(real).toBeGreaterThan(0)
  })

  it('ولا تتجاوز طالبات الكشف', () => {
    const total = participation(state, {}).totalStudents
    expect(nonParticipants(state, {}).length).toBeLessThanOrEqual(total)
  })

  it('واستجابة واحدة لا تُخرج طالبتين من الغياب', () => {
    const { trace } = attendance(state)
    const byName = [...trace.entries()].filter(([, kind]) => kind === 'name').length
    const pending = state.responses.filter((r) => !r.studentId).length
    expect(byName).toBeLessThanOrEqual(pending)
  })

  it('والنطاق يضيّق الكشف ولا يوسّعه', () => {
    const all = nonParticipants(state, {}).length
    const oneGrade = nonParticipants(state, { gradeId: state.grades[0].id }).length
    expect(oneGrade).toBeLessThanOrEqual(all)
  })

  it('والاستجابات بلا صاحبة تُجمع لتُراجَع لا تُهمل', () => {
    const { orphans } = attendance(state)
    expect(Array.isArray(orphans)).toBe(true)
    for (const o of orphans) expect(o.studentId).toBeNull()
  })
})
