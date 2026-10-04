/** من شاركت فعلًا: ثلاث درجات من الأثر، ونسبةٌ بالمنافسة لا بالفحص المنفرد. */
import { describe, expect, it } from 'vitest'

import { initialState } from '../data/store'
import { attendance, coverage, nameFit, nonParticipants } from '../lib/attendance'
import { participation } from '../lib/analysis'
import { archiveStudent } from '../domain/actions'

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

describe('تغطية القياس', () => {
  it('لا تتجاوز المئة مهما تكرّرت الأوراق', () => {
    // «الاستجابات ÷ الطالبات» تتجاوزها حين تُرسل طالبة مرتين،
    // والتغطية تعدّ الطالبة لا الورقة فتبقى في حدّها
    const twice = {
      ...state,
      responses: [...state.responses, ...state.responses.map((r, i) => ({ ...r, id: `${r.id}-x${i}` }))],
    }
    expect(participation(twice, {}).receivedRate).toBeGreaterThan(100)
    expect(coverage(twice, {}).rate).toBeLessThanOrEqual(100)
  })

  it('ولا تنتظر تأكيد المطابقة', () => {
    // فصلٌ وصلت استجاباته ولم تُربط بعد: التغطية تراها، والنسبة
    // المبنية على الربط المؤكَّد وحده تهبط به إلى الصفر
    const unlinked = {
      ...state,
      responses: state.responses.map((r) => ({ ...r, studentId: null, classId: null })),
    }
    expect(coverage(unlinked, {}).traced).toBeGreaterThan(0)
  })

  it('وتُسقط المؤرشفة من البسط والمقام معًا', () => {
    const [first] = state.students
    const after = coverage(archiveStudent(state, first.id), {})
    expect(after.students).toBe(coverage(state, {}).students - 1)
    expect(after.rate).toBeGreaterThan(0)
  })
})
