/**
 * نشر لوحة العرض — لقطةٌ بلا اسمٍ واحد.
 *
 * اللوحة تُعرض على شاشةٍ في المدرسة وعلى جوّال من يمرّ بها، ومطالبةُ
 * من يعرضها بكلمة المرور في كل مرة تُعطّل الغرض منها.
 *
 * وهي لا تقرأ قاعدة البيانات مباشرةً: قواعد الأمان تمنع قراءة أسماء
 * الطالبات لمن لا يحمل صلاحية الإدارة، وتمنعها بحقّ. فتُنشر لقطةٌ
 * مجرّدة من كل ما يدلّ على طالبة:
 *
 *   • الطالبة تصير معرّفًا وفصلًا وحالةً — بلا اسم ولا رقم كشف.
 *   • الاستجابة تصير إجاباتها وصفَّها — بلا الاسم الذي كتبته الأسرة.
 *   • الرأي يبقى بنصّه لأن اللوحة تعرضه، ويُقطع عن صاحبته.
 *
 * فما تحسبه اللوحة من مؤشّرات وأعدادٍ وبنودٍ يبقى كما هو، ولا يخرج
 * إلى الشبكة اسمٌ واحد.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npx vite-node scripts/reports/publish-show.ts -- --project <المشروع>
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { nameFit } from '../../src/lib/attendance'
import { derivedVoices } from '../../src/domain/voices'
import type {
  Answer, Student, Suggestion, SurveyResponse, SystemState,
} from '../../src/domain/types'

const ROOT = resolve(import.meta.dirname, '../..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const from = option('from')
const projectId = option('project') ?? process.env.GCLOUD_PROJECT
const out = resolve(ROOT, option('out') ?? 'public/data/show.json')

type ResponseDoc = SurveyResponse & { answers?: Omit<Answer, 'responseId'>[] }

async function snapshot(): Promise<Record<string, unknown[]>> {
  if (from) return JSON.parse(readFileSync(resolve(from), 'utf8'))
  if (!projectId) {
    console.error('الاستعمال: npx vite-node scripts/reports/publish-show.ts -- --project <المشروع>')
    process.exit(1)
  }
  const { cert, initializeApp } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS
  initializeApp({
    projectId,
    ...(keyFile ? { credential: cert(JSON.parse(readFileSync(keyFile, 'utf8'))) } : {}),
  })
  const db = getFirestore()
  const pull = async (name: string) =>
    (await db.collection(name).get()).docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  const names = ['grades', 'classes', 'students', 'responses', 'questions',
    'options', 'suggestions', 'categories', 'improvementActions', 'meta']
  const slices = await Promise.all(names.map(pull))
  return Object.fromEntries(names.map((n, i) => [n, slices[i]]))
}

const d = await snapshot() as unknown as {
  grades: SystemState['grades']
  classes: SystemState['classes']
  students: Student[]
  responses: ResponseDoc[]
  questions: SystemState['questions']
  options: SystemState['options']
  suggestions: Suggestion[]
  categories: SystemState['categories']
  improvementActions: SystemState['improvementActions']
  meta: { meta: SystemState['meta'] }[]
}

const responses: SurveyResponse[] = d.responses.map(({ answers: _drop, ...rest }) => rest)
const answers: Answer[] = d.responses.flatMap((r) =>
  (r.answers ?? []).map((a) => ({ responseId: r.id, ...a })))
const voices = [...d.suggestions, ...derivedVoices(responses, answers, d.suggestions, d.students)]

/** الطالبة: ما تحتاجه اللوحة للعدّ، لا ما يدلّ عليها. */
const students = d.students.map((s) => ({
  id: s.id, gradeId: s.gradeId, classId: s.classId, status: s.status,
  name: '', rosterNo: null,
}))

/**
 * الاستجابة: إجاباتها وصفُّها — والاسمُ الذي كتبته الأسرة يسقط.
 *
 * ونسبتُها إلى طالبتها تُثبَّت قبل أن يسقط الاسم. فاللوحة تنسب
 * الاستجابة بأحد ثلاثة: ربطٌ أكّدته الإدارة، أو ترشيحٌ في المراجعة،
 * أو أقربُ اسمٍ في الكشف. والثالث يحتاج الاسم ليُحسب، فإن حُذف الاسم
 * ثم حُسب على الشاشة سقطت عشراتُ الطالبات من العدّ، وعُرض على الشاشة
 * رقمٌ أقلُّ ممّا في لوحة الإدارة — ولوحتان بعددين تُسقطان الثقة في
 * كليهما.
 *
 * فيُحسب الأثر هنا مرةً واحدة بالأسماء، ويُثبَّت معرّفًا، ثم تُحذف
 * الأسماء. والمعرّف لا يدلُّ على أحد: الطالبة في اللقطة بلا اسم.
 */
const traced = new Map<string, string>()
const active = d.students.filter((x) => x.status === 'active')
const claimed = new Set<string>()
for (const r of responses) if (r.studentId) claimed.add(r.studentId)
for (const r of responses) {
  if (r.studentId) continue
  const candidate = (r.candidateStudentIds ?? []).find((id) => !claimed.has(id))
  if (candidate) { traced.set(r.id, candidate); claimed.add(candidate); continue }
  const raw = (r.rawName ?? '').trim()
  if (!raw) continue
  let best: { id: string; fit: number } | null = null
  for (const st of active) {
    const fit = nameFit(st.name, raw)
    if (fit > 0 && (!best || fit > best.fit)) best = { id: st.id, fit }
  }
  if (best && !claimed.has(best.id)) { traced.set(r.id, best.id); claimed.add(best.id) }
}

const stripped = responses.map((r) => ({
  ...r,
  rawName: '',
  studentId: r.studentId ?? traced.get(r.id) ?? null,
}))

/** الرأي: نصُّه يبقى لأن اللوحة تعرضه، ونسبتُه تسقط. */
const anonymous = voices.map((v) => ({ ...v, studentId: null }))

const show = {
  meta: d.meta[0].meta,
  cycles: [],
  grades: d.grades,
  classes: d.classes,
  students,
  questions: d.questions,
  options: d.options,
  overallOptions: (d.meta[0] as unknown as { overallOptions?: string[] }).overallOptions ?? [],
  responses: stripped,
  answers,
  suggestions: anonymous,
  duplicateGroups: [],
  categories: d.categories,
  improvementActions: d.improvementActions,
  audit: [],
  reviewAcks: {},
  version: 2,
}

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(show), 'utf8')

const size = (readFileSync(out).length / 1024).toFixed(0)
console.log(`✓ ${out} — ${size}KB`)
console.log(`  ${students.length} طالبة بلا اسم · ${stripped.length} استجابة بلا اسم`
  + ` · ${anonymous.length} رأيًا بلا نسبة`)
console.log(`  ${claimed.size} طالبة سُمع صوتها — ثُبّتت نسبتُها قبل حذف الأسماء`)
