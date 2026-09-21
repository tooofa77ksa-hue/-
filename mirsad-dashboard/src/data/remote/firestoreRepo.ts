import {
  addDoc, collection, doc, getDoc, getDocs, writeBatch,
  type DocumentData, type Firestore,
} from 'firebase/firestore'

import { getDb } from '../../firebase/config'
import type { Answer, SystemState } from '../../domain/types'
import { DEFAULT_CATEGORIES } from '../categories'
import { diffById, keyed, keyedRecord } from './diff'
import {
  COLLECTIONS, NEVER_DELETE, SLICE_COLLECTION, SYSTEM_DOC,
  fromResponseDocs, toResponseDocs, toSystemDoc,
  type IdentifiedSlices, type ResponseDoc, type SystemDoc,
} from './schema'

/** حد Firestore لعمليات الدفعة الواحدة ٥٠٠؛ نبقى دونه بهامش. */
const BATCH_LIMIT = 450

/**
 * Firestore يرفض القيمة undefined. الحقول الاختيارية في نماذجنا
 * (مثل sourceFile) قد تكون غير معرَّفة، فتُحذف قبل الكتابة بدل أن
 * تُحوَّل إلى null وتُلوّث المقارنة لاحقًا.
 */
function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = clean(v)
    }
    return out as T
  }
  return value
}

function requireDb(): Firestore {
  const db = getDb()
  if (!db) throw new Error('قاعدة البيانات غير مضبوطة: راجعي متغيّرات VITE_MIRSAD_FIREBASE_*')
  return db
}

/** عملية كتابة واحدة مؤجّلة، تُنفَّذ ضمن دفعة. */
type Op =
  | { kind: 'set'; path: string; id: string; data: DocumentData }
  | { kind: 'delete'; path: string; id: string }

async function runOps(db: Firestore, ops: Op[]): Promise<number> {
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const op of ops.slice(i, i + BATCH_LIMIT)) {
      const ref = doc(db, op.path, op.id)
      if (op.kind === 'set') batch.set(ref, op.data)
      else batch.delete(ref)
    }
    await batch.commit()
  }
  return ops.length
}

async function readAll<T>(db: Firestore, path: string): Promise<{ id: string; value: T }[]> {
  const snapshot = await getDocs(collection(db, path))
  return snapshot.docs.map((d) => ({ id: d.id, value: d.data() as T }))
}

/** هل رُفعت البيانات إلى قاعدة البيانات أصلًا؟ */
export async function remoteHasData(): Promise<boolean> {
  const db = requireDb()
  const snapshot = await getDoc(doc(db, COLLECTIONS.meta, SYSTEM_DOC))
  return snapshot.exists()
}

/**
 * يقرأ الحالة الكاملة من قاعدة البيانات. للإدارة وحدها: قواعد الأمان
 * ترفض هذه القراءة لأي حساب لا يحمل صلاحية admin.
 */
export async function loadRemoteState(): Promise<SystemState | null> {
  const db = requireDb()

  const systemSnap = await getDoc(doc(db, COLLECTIONS.meta, SYSTEM_DOC))
  if (!systemSnap.exists()) return null
  const system = systemSnap.data() as SystemDoc

  const slices = Object.keys(SLICE_COLLECTION) as (keyof IdentifiedSlices)[]
  const [responseDocs, acks, ...sliceData] = await Promise.all([
    readAll<ResponseDoc>(db, COLLECTIONS.responses),
    readAll<SystemState['reviewAcks'][string]>(db, COLLECTIONS.reviewAcks),
    ...slices.map((key) => readAll<unknown>(db, SLICE_COLLECTION[key])),
  ])

  const loaded = {} as Record<keyof IdentifiedSlices, unknown[]>
  slices.forEach((key, i) => {
    loaded[key] = sliceData[i].map((e) => ({ id: e.id, ...(e.value as object) }))
  })

  const { responses, answers } = fromResponseDocs(
    responseDocs.map((e) => ({ id: e.id, doc: e.value })),
  )

  return {
    meta: system.meta,
    overallOptions: system.overallOptions ?? [],
    duplicateGroups: system.duplicateGroups ?? [],
    version: system.version,
    cycles: loaded.cycles as SystemState['cycles'],
    grades: loaded.grades as SystemState['grades'],
    classes: loaded.classes as SystemState['classes'],
    students: loaded.students as SystemState['students'],
    questions: loaded.questions as SystemState['questions'],
    options: loaded.options as SystemState['options'],
    suggestions: loaded.suggestions as SystemState['suggestions'],
    categories: (loaded.categories as SystemState['categories']).length > 0
      ? (loaded.categories as SystemState['categories'])
      : DEFAULT_CATEGORIES,
    improvementActions: loaded.improvementActions as SystemState['improvementActions'],
    audit: loaded.audit as SystemState['audit'],
    responses,
    answers,
    reviewAcks: Object.fromEntries(acks.map((a) => [a.id, a.value])),
  }
}

/** ما تغيّر بين حالتين، مترجَمًا إلى عمليات كتابة. */
export function planWrites(prev: SystemState | null, next: SystemState): Op[] {
  const ops: Op[] = []
  const empty = { ...next, ...blankSlices() }
  const base = prev ?? empty

  for (const key of Object.keys(SLICE_COLLECTION) as (keyof IdentifiedSlices)[]) {
    const path = SLICE_COLLECTION[key]
    const change = diffById(
      keyed(base[key] as { id: string }[]),
      keyed(next[key] as { id: string }[]),
    )
    for (const { id, value } of change.upserts) {
      const data = { ...(value as Record<string, unknown>) }
      // المعرّف هو اسم المستند، فلا يُكرَّر داخله
      delete data.id
      ops.push({ kind: 'set', path, id, data: clean(data) })
    }
    // الحذف مسموح فقط حيث لا تمنعه القواعد (خطة التحسين والفئات).
    if (!NEVER_DELETE.has(path)) {
      for (const id of change.removedIds) ops.push({ kind: 'delete', path, id })
    }
  }

  // الاستجابات وإجاباتها: وحدة واحدة
  const prevDocs = toResponseDocs(base.responses, base.answers)
  const nextDocs = toResponseDocs(next.responses, next.answers)
  const responseChange = diffById(
    prevDocs.map((e) => ({ id: e.id, value: e.doc })),
    nextDocs.map((e) => ({ id: e.id, value: e.doc })),
  )
  for (const { id, value } of responseChange.upserts) {
    ops.push({ kind: 'set', path: COLLECTIONS.responses, id, data: clean(value as DocumentData) })
  }

  // إقرارات المراجعة: طبقة إدارية، تُضاف وتُزال بحرّية
  const ackChange = diffById(keyedRecord(base.reviewAcks), keyedRecord(next.reviewAcks))
  for (const { id, value } of ackChange.upserts) {
    ops.push({ kind: 'set', path: COLLECTIONS.reviewAcks, id, data: clean(value as DocumentData) })
  }
  for (const id of ackChange.removedIds) {
    ops.push({ kind: 'delete', path: COLLECTIONS.reviewAcks, id })
  }

  // الإعدادات العامة
  const prevSystem = prev ? toSystemDoc(prev) : null
  const nextSystem = toSystemDoc(next)
  if (!prevSystem || JSON.stringify(prevSystem) !== JSON.stringify(nextSystem)) {
    ops.push({
      kind: 'set', path: COLLECTIONS.meta, id: SYSTEM_DOC, data: clean(nextSystem as unknown as DocumentData),
    })
  }

  return ops
}

function blankSlices() {
  const out = {} as Record<keyof IdentifiedSlices | 'responses' | 'answers' | 'reviewAcks', unknown>
  for (const key of Object.keys(SLICE_COLLECTION) as (keyof IdentifiedSlices)[]) out[key] = []
  out.responses = []
  out.answers = []
  out.reviewAcks = {}
  return out as unknown as Partial<SystemState>
}

/** يكتب الفرق بين حالتين. يُعيد عدد المستندات المكتوبة. */
export async function persistRemote(prev: SystemState | null, next: SystemState): Promise<number> {
  const ops = planWrites(prev, next)
  if (ops.length === 0) return 0
  return runOps(requireDb(), ops)
}

/**
 * إرسال استجابة من القياس العام.
 *
 * تكتب الاسم كما كتبته الطالبة ولا تربطه بطالبة بعينها: المطابقة
 * قرار إداري صريح في شاشة المطابقة، لا استنتاج آلي. قواعد الأمان
 * ترفض أي استجابة تحاول ربط نفسها أو ادّعاء مطابقة.
 */
export async function submitPublicResponse(input: {
  cycleId: string
  rawName: string
  declaredGradeId: string | null
  classId: string | null
  answers: Omit<Answer, 'responseId'>[]
  clientToken: string
}): Promise<string> {
  const db = requireDb()
  const payload = {
    cycleId: input.cycleId,
    rawName: input.rawName.trim(),
    declaredGradeId: input.declaredGradeId,
    classId: input.classId,
    matchStatus: 'NEW' as const,
    studentId: null,
    candidateStudentIds: [] as string[],
    duplicateFlag: false,
    source: 'web' as const,
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    answers: clean(input.answers),
    clientToken: input.clientToken,
  }
  const ref = await addDoc(collection(db, COLLECTIONS.responses), payload)
  return ref.id
}

/**
 * ما يحتاجه القياس العام ليعرض نفسه — ولا شيء غيره.
 *
 * لا يقرأ مجموعة الطالبات إطلاقًا: قواعد الأمان ترفض ذلك، والواجهة
 * لا تطلبه أصلًا. الطالبة تكتب اسمها، والمطابقة قرار إداري لاحق.
 */
export interface PublicContext {
  cycle: { id: string; name: string; questionIds: string[] }
  grades: { id: string; no: number; name: string }[]
  classes: { id: string; gradeId: string; name: string }[]
  questions: SystemState['questions']
  options: SystemState['options']
  overallOptions: string[]
  scale: { min: number; max: number }
  school: string
}

export async function loadPublicContext(): Promise<PublicContext | null> {
  const db = requireDb()

  const [systemSnap, cycles, grades, classes, questions, options] = await Promise.all([
    getDoc(doc(db, COLLECTIONS.meta, SYSTEM_DOC)),
    readAll<{ status: string; name: string; questionIds: string[] }>(db, COLLECTIONS.cycles),
    readAll<{ no: number; name: string }>(db, COLLECTIONS.grades),
    readAll<{ gradeId: string; name: string }>(db, COLLECTIONS.classes),
    readAll<SystemState['questions'][number]>(db, COLLECTIONS.questions),
    readAll<SystemState['options'][number]>(db, COLLECTIONS.options),
  ])

  if (!systemSnap.exists()) return null
  const system = systemSnap.data() as SystemDoc

  const open = cycles.find((c) => c.value.status === 'open')
  if (!open) return null

  return {
    cycle: { id: open.id, name: open.value.name, questionIds: open.value.questionIds ?? [] },
    grades: grades.map((g) => ({ id: g.id, no: g.value.no, name: g.value.name }))
      .sort((a, b) => a.no - b.no),
    classes: classes.map((c) => ({ id: c.id, gradeId: c.value.gradeId, name: c.value.name })),
    questions: questions.map((q) => ({ ...q.value, id: q.id })).sort((a, b) => a.order - b.order),
    options: options.map((o) => ({ ...o.value, id: o.id })).sort((a, b) => b.score - a.score),
    overallOptions: system.overallOptions ?? [],
    scale: system.meta?.scale ?? { min: 1, max: 3 },
    school: system.meta?.school ?? '',
  }
}
