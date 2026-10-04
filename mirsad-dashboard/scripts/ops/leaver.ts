/**
 * طالبة نُقلت من المدرسة: إخراجها من الكشوف والأرقام.
 *
 * الكشوف تُبنى من ملفات الإدارة مرة واحدة، والنقل يحدث بعدها. فلو
 * بقيت المنقولة في الكشف نقصت نسبة المشاركة بطالبةٍ لم تَعُد في
 * المدرسة أصلًا — ويُسأل عنها القياس وليس لها جواب.
 *
 * والأرشفة لا الحذف: studentsInScope تستثني غير النشطة، فتخرج من
 * العدد والنسبة وكشف من لم تشارك في اللحظة نفسها، ويبقى أثرها في
 * قاعدة البيانات إن سُئلت الإدارة يومًا عن سبب نزول العدد.
 *
 * ولا يُؤرشَف باسمٍ مكتوب على عَجَل: الأسماء في المدرسة تتشابه
 * («حور هاني الحربي» و«حور مشعل الحربي»)، فالسكربت يعرض المرشّحات
 * ولا يكتب شيئًا حتى يُعطى رقم الطالبة في الكشف صراحةً.
 *
 *   # عرض المرشّحات فقط (لا يكتب شيئًا)
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npx vite-node scripts/ops/leaver.ts -- --project <المشروع> --name "الاسم"
 *
 *   # التنفيذ بعد التأكّد من الصف والرقم
 *   … --name "الاسم" --grade 1 --roster 23 --apply
 *
 * وإن كانت المنقولة قد شاركت، تُحذف استجابتها بـ --with-response
 * كما فُعل بمزنة وجوري، وإلا بقي صوتٌ لطالبةٍ خارج المدرسة.
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { attendance, nameFit } from '../../src/lib/attendance'
import type { Student, SurveyResponse, SystemState } from '../../src/domain/types'

const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const projectId = option('project') ?? process.env.GCLOUD_PROJECT
const typed = option('name')
const grade = option('grade')
const roster = option('roster')
const apply = args.includes('--apply')
const withResponse = args.includes('--with-response')
const backupPath = option('backup') ?? `leaver-backup-${Date.now()}.json`

if (!projectId || !typed) {
  console.error('الاستعمال: npx vite-node scripts/ops/leaver.ts -- --project <المشروع> --name "الاسم"')
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

/** السحب كاملًا: النسخة الاحتياطية والمطابقة يحتاجان الحالة نفسها. */
const COLLECTIONS = [
  'grades', 'classes', 'students', 'responses', 'answers',
  'suggestions', 'duplicateGroups', 'improvementActions', 'auditLog',
]
const snapshot: Record<string, Array<Record<string, unknown>>> = {}
for (const name of COLLECTIONS) {
  const snap = await db.collection(name).get()
  snapshot[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

const students = snapshot.students as unknown as Student[]
const responses = snapshot.responses as unknown as SurveyResponse[]
const gradeName = new Map(snapshot.grades.map((g) => [g.id as string, g.name as string]))
const className = new Map(snapshot.classes.map((c) => [c.id as string, c.name as string]))
const state = { students, responses } as unknown as SystemState
const { trace } = attendance(state)

const active = students.filter((s) => s.status === 'active')
const gradeId = grade ? `g${grade}` : null

const ranked = active
  .filter((s) => (gradeId ? s.gradeId === gradeId : true))
  .map((s) => ({ student: s, fit: nameFit(s.name, typed) }))
  .filter((c) => c.fit > 0)
  .sort((a, b) => b.fit - a.fit)
  .slice(0, 6)

const place = (s: Student) => `${gradeName.get(s.gradeId) ?? s.gradeId} / ${className.get(s.classId) ?? s.classId}`
const mark = (s: Student) => {
  const kind = trace.get(s.id)
  if (kind === 'confirmed') return 'شاركت (استجابة مؤكَّدة)'
  if (kind === 'candidate') return 'شاركت (مرشَّحة في المراجعة)'
  if (kind === 'name') return 'شاركت (مطابقة بالاسم)'
  return 'لم تشارك'
}

console.log(`الكشف الحالي: ${active.length} طالبة نشطة · ${trace.size} لها أثر`)
console.log(`الاسم المطلوب: «${typed}»${gradeId ? ` — داخل ${gradeName.get(gradeId) ?? gradeId}` : ''}`)
console.log('')

if (ranked.length === 0) {
  console.error('✗ لا مرشَّحة تقترب من هذا الاسم. راجعي كتابة الاسم أو الصف.')
  process.exit(1)
}

for (const { student, fit } of ranked) {
  console.log(`  رقم ${String(student.rosterNo ?? '—').padStart(3)} · ${student.name}`)
  console.log(`          ${place(student)} · ${mark(student)} · قرب ${fit.toFixed(2)}`)
}
console.log('')

if (!apply) {
  console.log('عرضٌ فقط — لم يُكتب شيء. للتنفيذ أضيفي: --grade <الصف> --roster <رقم الكشف> --apply')
  process.exit(0)
}

if (!gradeId || !roster) {
  console.error('✗ التنفيذ يلزمه --grade و--roster صراحةً، كي لا تُؤرشَف طالبة بغير اسمها.')
  process.exit(1)
}

const target = active.find((s) => s.gradeId === gradeId && String(s.rosterNo) === String(roster))
if (!target) {
  console.error(`✗ لا طالبة نشطة برقم ${roster} في ${gradeName.get(gradeId) ?? gradeId}.`)
  process.exit(1)
}
if (!ranked.some((c) => c.student.id === target.id)) {
  console.error(`✗ «${target.name}» ليست من مرشَّحات الاسم المكتوب. راجعي الرقم.`)
  process.exit(1)
}

writeFileSync(backupPath, JSON.stringify(snapshot))
console.log(`نسخة احتياطية كاملة: ${backupPath}`)

const owned = responses.filter((r) => r.studentId === target.id)
const archivedAt = new Date().toISOString()
const batch = db.batch()
batch.update(db.collection('students').doc(target.id), { status: 'archived', archivedAt })

if (withResponse) {
  for (const r of owned) {
    for (const a of snapshot.answers.filter((x) => (x as { responseId?: string }).responseId === r.id)) {
      batch.delete(db.collection('answers').doc(a.id as string))
    }
    for (const s of snapshot.suggestions.filter((x) => (x as { responseId?: string }).responseId === r.id)) {
      batch.delete(db.collection('suggestions').doc(s.id as string))
    }
    batch.delete(db.collection('responses').doc(r.id))
  }
}

batch.set(db.collection('auditLog').doc(), {
  at: archivedAt,
  kind: 'student-archived',
  studentId: target.id,
  gradeId: target.gradeId,
  classId: target.classId,
  rosterNo: target.rosterNo,
  reason: 'الطالبة نُقلت من المدرسة — أُخرجت من الكشف بقرار الإدارة',
  removedResponses: withResponse ? owned.map((r) => r.id) : [],
})

await batch.commit()

console.log(`✓ أُرشفت: ${target.name} — ${place(target)} · رقم ${target.rosterNo}`)
if (owned.length > 0) {
  console.log(withResponse
    ? `✓ حُذفت استجابتها (${owned.length}) وإجاباتها`
    : `! لها ${owned.length} استجابة مؤكَّدة بقيت كما هي — لحذفها أعيدي مع --with-response`)
}
console.log(`الكشف بعد الأرشفة: ${active.length - 1} طالبة`)
