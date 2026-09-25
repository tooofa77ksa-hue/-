/** النسخة الاحتياطية والاستعادة — حماية آخر خط للبيانات. */
import { describe, expect, it } from 'vitest'

import { exportBackup, initialState, inspectBackup, restoreBackup } from '../data/store'
import { markReviewed } from '../domain/actions'
import { flaggedCases } from '../lib/reviewFlags'
import { participation, satisfactionIndex } from '../lib/analysis'

const state = initialState()

describe('تصدير النسخة الاحتياطية', () => {
  it('يحوي كل ما يلزم لإعادة بناء الحالة', () => {
    const file = JSON.parse(exportBackup(state))
    expect(file.format).toBe('qiyas-backup')
    expect(file.summary.students).toBe(294)
    expect(file.summary.responses).toBe(284)
    expect(file.summary.answers).toBe(state.answers.length)
    expect(file.state.students).toHaveLength(294)
    expect(file.checksum).toMatch(/^[0-9a-f]{8}$/)
  })

  it('يحمل عنوان المدرسة والقياس ليُتعرَّف عليه قبل الاستعادة', () => {
    const file = JSON.parse(exportBackup(state))
    expect(file.school).toBe(state.meta.school)
    expect(file.survey).toContain(state.meta.hijriYear)
    expect(file.createdAt).toBeTruthy()
  })
})

describe('فحص الملف قبل الاستعادة', () => {
  it('يقبل نسخة سليمة', () => {
    const r = inspectBackup(exportBackup(state))
    expect(r.ok).toBe(true)
    expect(r.error).toBeNull()
    expect(r.file?.summary.students).toBe(294)
  })

  it('يرفض ملفًا ليس JSON', () => {
    expect(inspectBackup('ليس ملفًا').ok).toBe(false)
  })

  it('يرفض ملف JSON من نظام آخر', () => {
    const r = inspectBackup(JSON.stringify({ hello: 'world' }))
    expect(r.ok).toBe(false)
    expect(r.error).toContain('ليس ملف نسخة احتياطية')
  })

  it('يرفض ملفًا عُبث بمحتواه بعد إنشائه', () => {
    const file = JSON.parse(exportBackup(state))
    file.state.students = file.state.students.slice(0, 10)   // حذف طالبات
    const r = inspectBackup(JSON.stringify(file))
    expect(r.ok).toBe(false)
    expect(r.error).toContain('بصمة الملف لا تطابق محتواه')
  })

  it('يرفض نسخة ببنية بيانات مختلفة', () => {
    const file = JSON.parse(exportBackup(state))
    file.schemaVersion = 99
    expect(inspectBackup(JSON.stringify(file)).ok).toBe(false)
  })

  it('يرفض ملفًا ناقص الأقسام', () => {
    const file = JSON.parse(exportBackup(state))
    delete file.state
    expect(inspectBackup(JSON.stringify(file)).ok).toBe(false)
  })
})

describe('الاستعادة', () => {
  it('تُرجع الحالة كما كانت بالضبط', () => {
    const file = inspectBackup(exportBackup(state)).file!
    const restored = restoreBackup(file)

    expect(restored.students).toEqual(state.students)
    expect(restored.responses).toEqual(state.responses)
    expect(restored.answers).toEqual(state.answers)
    expect(restored.suggestions).toEqual(state.suggestions)
    expect(participation(restored, {})).toEqual(participation(state, {}))
    expect(satisfactionIndex(restored, {})).toEqual(satisfactionIndex(state, {}))
  })

  it('تحفظ عمل الإدارة: إقرارات المراجعة تعود معها', () => {
    const target = flaggedCases(state)[0]
    const worked = markReviewed(state, target.responseId)

    const file = inspectBackup(exportBackup(worked)).file!
    const restored = restoreBackup(file)

    expect(restored.reviewAcks[target.responseId]).toBeTruthy()
    expect(restored.audit.length).toBe(worked.audit.length)
  })

  it('تتحمّل نسخة قديمة بلا إقرارات مراجعة', () => {
    const file = inspectBackup(exportBackup(state)).file!
    delete (file.state as { reviewAcks?: unknown }).reviewAcks
    const restored = restoreBackup(file)
    expect(restored.reviewAcks).toEqual({})
  })

  it('دورة كاملة: تصدير ← استعادة ← تصدير تعطي المحتوى نفسه', () => {
    const first = exportBackup(state)
    const restored = restoreBackup(inspectBackup(first).file!)
    const second = JSON.parse(exportBackup(restored))
    expect(second.summary).toEqual(JSON.parse(first).summary)
    expect(second.checksum).toBe(JSON.parse(first).checksum)
  })
})
