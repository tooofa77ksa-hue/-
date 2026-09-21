/**
 * الرفع الأوّلي لبيانات القياس إلى Firestore.
 *
 * يُشغَّل من جهاز المدرسة مرة واحدة. ملف الأسماء لا يغادر الجهاز إلى
 * أي مكان غير قاعدة بيانات المدرسة نفسها، ولا يدخل المستودع ولا ملفات
 * المتصفّح.
 *
 *   # على المحاكي (تجربة بلا مفاتيح)
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8181 \
 *     node scripts/firestore/seed.mjs --project demo-qiyas
 *
 *   # على المشروع الحقيقي
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     node scripts/firestore/seed.mjs --project <معرّف المشروع>
 *
 * الخيارات:
 *   --dry-run   يعرض ما سيُكتب ولا يكتب شيئًا
 *   --force     يسمح بالكتابة فوق قاعدة بيانات غير فارغة
 *
 * ضمانات:
 * • لا يحذف مستندًا قط — يكتب ويُحدِّث فقط.
 * • يرفض الكتابة فوق قاعدة بيانات تحمل بيانات، ما لم يُطلب --force.
 * • يتحقق بعد الكتابة من الأعداد، ويفشل إن نقص مستند واحد.
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const option = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

/** يقرأ بيانات القياس من ملفي المصدر كما يقرأها التطبيق تمامًا. */
export function readState() {
  const definition = JSON.parse(readFileSync(join(root, 'src/data/survey-definition.json'), 'utf8'))
  let school
  try {
    school = JSON.parse(readFileSync(join(root, 'src/data/school-data.json'), 'utf8'))
  } catch {
    throw new Error(
      'لا يوجد src/data/school-data.json على هذا الجهاز.\n'
      + 'نفّذي npm run etl أولًا لتوليده من data/source/.',
    )
  }
  return { ...definition, ...school, improvementActions: [], audit: [], reviewAcks: {}, version: 2 }
}

/**
 * يحوّل الحالة إلى مستندات، بالتخطيط نفسه الذي تستخدمه طبقة المتصفّح:
 * مجموعة لكل كيان، والمعرّف اسم المستند، وإجابات الاستجابة داخلها.
 */
export function buildDocuments(state) {
  const docs = []
  const push = (path, id, data) => {
    const clean = {}
    for (const [k, v] of Object.entries(data)) if (v !== undefined && k !== 'id') clean[k] = v
    docs.push({ path, id, data: clean })
  }

  for (const [key, path] of Object.entries({
    cycles: 'cycles', grades: 'grades', classes: 'classes', students: 'students',
    questions: 'questions', options: 'options', suggestions: 'suggestions',
    categories: 'categories', improvementActions: 'improvementActions', audit: 'auditLogs',
  })) {
    for (const item of state[key] ?? []) push(path, item.id, item)
  }

  const answersByResponse = new Map()
  for (const a of state.answers ?? []) {
    const entry = { questionId: a.questionId, rawValue: a.rawValue, optionId: a.optionId, score: a.score }
    const bucket = answersByResponse.get(a.responseId)
    if (bucket) bucket.push(entry)
    else answersByResponse.set(a.responseId, [entry])
  }
  for (const r of state.responses ?? []) {
    push('responses', r.id, { ...r, answers: answersByResponse.get(r.id) ?? [] })
  }

  for (const [id, ack] of Object.entries(state.reviewAcks ?? {})) push('reviewAcks', id, ack)

  push('meta', 'system', {
    meta: state.meta,
    overallOptions: state.overallOptions ?? [],
    duplicateGroups: state.duplicateGroups ?? [],
    version: state.version,
  })

  return docs
}

function summarize(docs) {
  return docs.reduce((acc, d) => { acc[d.path] = (acc[d.path] ?? 0) + 1; return acc }, {})
}

// ───────────────────────── التشغيل ─────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectId = option('project') ?? process.env.GCLOUD_PROJECT
  if (!projectId) {
    console.error('✗ حدّدي المشروع: --project <معرّف المشروع>')
    process.exit(1)
  }

  const state = readState()
  const docs = buildDocuments(state)
  const counts = summarize(docs)

  console.log(`المشروع: ${projectId}`)
  console.log(`سيُكتب ${docs.length} مستندًا:`)
  for (const [path, n] of Object.entries(counts)) console.log(`   ${path}: ${n}`)

  if (flag('dry-run')) {
    console.log('\n(عرض فقط — لم يُكتب شيء)')
    process.exit(0)
  }

  const { cert, initializeApp } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')

  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS
  initializeApp({
    projectId,
    ...(keyFile && !process.env.FIRESTORE_EMULATOR_HOST
      ? { credential: cert(JSON.parse(readFileSync(keyFile, 'utf8'))) }
      : {}),
  })
  const db = getFirestore()

  // لا نكتب فوق بيانات حيّة بالخطأ
  const existing = await db.collection('responses').limit(1).get()
  if (!existing.empty && !flag('force')) {
    console.error('\n✗ قاعدة البيانات تحتوي استجابات بالفعل.')
    console.error('  الرفع فوقها قد يطمس عملًا إداريًا. أضيفي --force إن كنتِ متأكدة.')
    process.exit(1)
  }

  let written = 0
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch()
    for (const d of docs.slice(i, i + 400)) batch.set(db.collection(d.path).doc(d.id), d.data)
    await batch.commit()
    written += Math.min(400, docs.length - i)
    process.stdout.write(`\rكُتب ${written}/${docs.length}…`)
  }
  console.log('')

  // التحقق: نعدّ ما وصل فعلًا ولا نكتفي بأن الكتابة لم ترمِ خطأ
  let mismatch = false
  for (const [path, expected] of Object.entries(counts)) {
    const snap = await db.collection(path).count().get()
    const actual = snap.data().count
    const ok = actual >= expected
    if (!ok) mismatch = true
    console.log(`${ok ? '✓' : '✗'} ${path}: ${actual} (المتوقع ${expected})`)
  }

  if (mismatch) {
    console.error('\n✗ نقص في العدد بعد الكتابة — راجعي الأخطاء أعلاه قبل الاعتماد على البيانات.')
    process.exit(1)
  }
  console.log('\n✓ اكتمل الرفع وتحقّقت الأعداد.')
  process.exit(0)
}
