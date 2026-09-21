import { describe, expect, it } from 'vitest'

import { diffById, keyed, keyedRecord, sameValue } from '../data/remote/diff'
import { planWrites } from '../data/remote/firestoreRepo'
import { fromResponseDocs, toResponseDocs } from '../data/remote/schema'
import { hasSchoolData, initialState } from '../data/store'
import { archiveStudent, markReviewed } from '../domain/actions'
import type { SystemState } from '../domain/types'

const base = initialState()

describe('مقارنة القيم', () => {
  it('تتجاهل ترتيب المفاتيح ولا تتجاهل اختلاف القيم', () => {
    expect(sameValue({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
    expect(sameValue({ a: 1 }, { a: 2 })).toBe(false)
    expect(sameValue([1, 2], [2, 1])).toBe(false)
    expect(sameValue(null, undefined)).toBe(false)
  })
})

describe('استخراج الفرق', () => {
  it('لا يُبلّغ بأي تغيير حين لا يتغيّر شيء', () => {
    const change = diffById(keyed(base.students), keyed(base.students))
    expect(change.upserts).toHaveLength(0)
    expect(change.removedIds).toHaveLength(0)
  })

  it('يرصد التعديل وحده دون بقية السجلات', () => {
    const edited = base.students.map((s, i) => (i === 0 ? { ...s, rosterNo: 999 } : s))
    const change = diffById(keyed(base.students), keyed(edited))
    expect(change.upserts).toHaveLength(1)
    expect(change.upserts[0].id).toBe(base.students[0].id)
  })

  it('يرصد المفقود من الحالة الجديدة', () => {
    const fewer = base.students.slice(1)
    expect(diffById(keyed(base.students), keyed(fewer)).removedIds).toEqual([base.students[0].id])
  })

  it('يتعامل مع السجلات ذات المفاتيح النصية', () => {
    const change = diffById(keyedRecord({}), keyedRecord({ r1: { at: 'x', by: 'y' } }))
    expect(change.upserts).toEqual([{ id: 'r1', value: { at: 'x', by: 'y' } }])
  })
})

describe('تخزين الاستجابة مع إجاباتها', () => {
  it('يجمع ثم يعيد التسطيح دون فقد إجابة واحدة', () => {
    const docs = toResponseDocs(base.responses, base.answers)
    expect(docs).toHaveLength(base.responses.length)

    const back = fromResponseDocs(docs.map((d) => ({ id: d.id, doc: d.doc })))
    expect(back.responses).toHaveLength(base.responses.length)
    expect(back.answers).toHaveLength(base.answers.length)

    const before = new Set(base.answers.map((a) => `${a.responseId}|${a.questionId}`))
    const after = new Set(back.answers.map((a) => `${a.responseId}|${a.questionId}`))
    expect(after).toEqual(before)
  })

  it('لا يُسقط استجابة بلا إجابات', () => {
    const docs = toResponseDocs(base.responses, [])
    expect(docs).toHaveLength(base.responses.length)
    expect(docs.every((d) => d.doc.answers.length === 0)).toBe(true)
  })
})

describe('خطة الكتابة إلى قاعدة البيانات', () => {
  it('ترفع كل شيء حين تكون قاعدة البيانات فارغة', () => {
    const ops = planWrites(null, base)
    const counts = ops.reduce<Record<string, number>>((acc, op) => {
      acc[op.path] = (acc[op.path] ?? 0) + 1
      return acc
    }, {})
    expect(counts.students).toBe(base.students.length)
    expect(counts.responses).toBe(base.responses.length)
    expect(counts.questions).toBe(base.questions.length)
    expect(ops.every((op) => op.kind === 'set')).toBe(true)
  })

  it('لا تكتب شيئًا حين لا يتغيّر شيء', () => {
    expect(planWrites(base, base)).toHaveLength(0)
  })

  it('تكتب مستندًا واحدًا عند أرشفة طالبة واحدة', () => {
    const target = base.students.find((s) => s.status === 'active')!
    const next = archiveStudent(base, target.id)
    const ops = planWrites(base, next)
    const students = ops.filter((op) => op.path === 'students')
    expect(students).toHaveLength(1)
    expect(students[0].id).toBe(target.id)
    // ومعها سجل العملية، ولا شيء غير ذلك
    expect(ops.filter((op) => op.path === 'auditLogs')).toHaveLength(1)
    expect(ops).toHaveLength(2)
  })

  it('لا تطلب حذف طالبة أبدًا — ولو اختفت من الحالة', () => {
    const next: SystemState = { ...base, students: base.students.slice(1) }
    const ops = planWrites(base, next)
    expect(ops.filter((op) => op.kind === 'delete')).toHaveLength(0)
  })

  it('لا تطلب حذف استجابة أبدًا — ولو اختفت من الحالة', () => {
    const next: SystemState = { ...base, responses: base.responses.slice(1) }
    const ops = planWrites(base, next)
    expect(ops.filter((op) => op.kind === 'delete')).toHaveLength(0)
  })

  it('تكتب إقرار المراجعة في مجموعته وحده', () => {
    const target = base.responses[0]
    const next = markReviewed(base, target.id, 'الإدارة')
    const ops = planWrites(base, next)
    expect(ops.filter((op) => op.path === 'reviewAcks')).toHaveLength(1)
    expect(ops.filter((op) => op.path === 'responses')).toHaveLength(0)
  })

  it('لا تضع الحقل id داخل المستند — المعرّف هو اسم المستند', () => {
    const ops = planWrites(null, base)
    const student = ops.find((op) => op.path === 'students')!
    expect(student.kind).toBe('set')
    expect(Object.keys(student.kind === 'set' ? student.data : {})).not.toContain('id')
  })

  it('لا تكتب قيمة undefined — Firestore يرفضها', () => {
    const ops = planWrites(null, base)
    const hasUndefined = (v: unknown): boolean => {
      if (Array.isArray(v)) return v.some(hasUndefined)
      if (v && typeof v === 'object') return Object.values(v).some((x) => x === undefined || hasUndefined(x))
      return false
    }
    expect(ops.some((op) => op.kind === 'set' && hasUndefined(op.data))).toBe(false)
  })
})

describe('اتفاق سكربت الرفع مع طبقة المتصفّح', () => {
  // يحتاج ملف بيانات المدرسة، وهو مستثنى من المستودع لأنه بيانات
  // شخصية. على نسخة بلا الملف يُتخطّى الاختبار بدل أن يفشل كذبًا.
  const it_ = hasSchoolData ? it : it.skip

  it_('يكتبان المستندات نفسها بالمعرّفات نفسها والمحتوى نفسه', async () => {
    const seed = await import('../../scripts/firestore/seed.mjs')
    const state = seed.readState() as SystemState
    const fromScript = seed.buildDocuments(state) as { path: string; id: string; data: unknown }[]
    const fromApp = planWrites(null, { ...base, categories: [], improvementActions: [], audit: [] })

    const key = (d: { path: string; id: string }) => `${d.path}/${d.id}`
    expect(new Set(fromScript.map(key))).toEqual(new Set(fromApp.map(key)))

    const scriptById = new Map(fromScript.map((d) => [key(d), d.data]))
    for (const op of fromApp) {
      if (op.kind !== 'set') continue
      expect(scriptById.get(key(op))).toEqual(op.data)
    }
  })
})
