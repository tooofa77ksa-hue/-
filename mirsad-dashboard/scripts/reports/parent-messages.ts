/**
 * رسائل أولياء الأمور — نصٌّ جاهز للّصق في مجموعات الواتساب.
 *
 * الرسالة التي تُرسل إلى الأسر لا تُكتب باليد في كل مرة: الأسماء
 * تتغيّر كل ساعة، ورسالةٌ تذكر اسم طالبةٍ وصل رأي أسرتها أمس تُسقط
 * ثقة المجموعة كلها في بقيّة الرسالة.
 *
 * ولا تُذكر فيها المعلمة ولا جهاز المدرسة: الرأي رأي وليّ الأمر،
 * يكتبه من جواله في دقيقتين، وإحالته إلى غيره تُؤخّره لا تُعجّله.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npx vite-node scripts/reports/parent-messages.ts -- --project <المشروع>
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { coverage, attendance } from '../../src/lib/attendance'
import { orderedClasses } from '../../src/lib/labels'
import type { Student, SurveyResponse, SystemState } from '../../src/domain/types'

const ROOT = resolve(import.meta.dirname, '../..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const from = option('from')
const projectId = option('project') ?? process.env.GCLOUD_PROJECT
const host = option('host') ?? 'qiyas-165-1448.web.app'
const out = resolve(ROOT, option('out') ?? '.report-out/رسائل-أولياء-الأمور-1448.txt')

async function snapshot() {
  if (from) return JSON.parse(readFileSync(resolve(from), 'utf8'))
  if (!projectId) {
    console.error('الاستعمال: npx vite-node scripts/reports/parent-messages.ts -- --project <المشروع>')
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
  const pull = async (n: string) => (await db.collection(n).get()).docs.map((d) => ({ id: d.id, ...d.data() }))
  const [grades, classes, students, responses] = await Promise.all(
    ['grades', 'classes', 'students', 'responses'].map(pull))
  return { grades, classes, students, responses }
}

const data = await snapshot()
const state = {
  grades: data.grades, classes: data.classes,
  students: data.students as Student[], responses: data.responses as SurveyResponse[],
} as unknown as SystemState
const { trace } = attendance(state)

const AR = 'ar-SA'
const n = (v: number) => new Intl.NumberFormat(AR).format(v)
const p = (v: number) => `${new Intl.NumberFormat(AR, { maximumFractionDigits: 1 }).format(v)}٪`
/**
 * «بقيت أسرتان» لا «بقيت ٢ أسرة»: الرسالة تُقرأ لا تُحسب.
 * والعدد يجمع تمييزه من ثلاثة إلى عشرة، ويفرده بعد العشرة.
 */
const counted = (k: number, one: string, two: string, few: string, many: string) =>
  k === 1 ? one : k === 2 ? two : `${n(k)} ${k <= 10 ? few : many}`
const families = (k: number) => counted(k, 'أسرة واحدة', 'أسرتان', 'أسر', 'أسرة')
const girls = (k: number) => counted(k, 'طالبة واحدة', 'طالبتان', 'طالبات', 'طالبة')

const school = coverage(state, {})
const rooms = orderedClasses(state.grades, state.classes).map(({ room, grade }) => ({
  room,
  // رقم الفصل بالأرقام الهندية كبقيّة أرقام الرسالة، لا «فصل 1»
  label: `${grade?.name ?? ''} / فصل ${/^\d+$/.test(String(room.name)) ? n(Number(room.name)) : room.name}`,
  cover: coverage(state, { classId: room.id }),
  missing: state.students
    .filter((s) => s.classId === room.id && s.status === 'active' && !trace.has(s.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'ar')),
}))

const pending = rooms.filter((r) => r.missing.length > 0)
const done = rooms.filter((r) => r.missing.length === 0)
const RULE = '─'.repeat(44)
const link = (id?: string) => `https://${host}/#/survey${id ? `/${id}` : ''}`

const blocks: string[] = []

// ① رسالة المجموعة العامة: الشكر أولًا، فالأسر التي شاركت هي الأكثر
blocks.push(`🌸 *قياس اتجاه المتعلمين ١٤٤٨هـ*
الابتدائية الخامسة والستون بعد المائة

أولياء أمورنا الكرام،
وصلتنا آراء *${n(school.traced)}* أسرة من *${n(school.students)}* — ${p(school.rate)} 💙
وهذا رقمٌ نفخر به، والشكر لكم أولًا.

ونرجو ممّن لم يسجّل رأيه بعد أن يفعل اليوم — ${girls(school.students - school.traced)} فقط تفصلنا عن الاكتمال.

📲 التعبئة من الجوال ولا تتجاوز دقيقتين:
${link()}

رأيكم يُقرأ بنصّه كما تكتبونه، وما ذُكر فيه رُدَّ عليه بإجراءٍ وشاهدٍ في المدرسة.
فمشاركتكم تصنع فرقًا تراه بناتكم 🌟`)

// ② رسالة لكل فصل بقيت فيه أسرة
for (const r of pending) {
  blocks.push(`🌸 *أولياء الأمور الكرام* — ${r.label}
الابتدائية الخامسة والستون بعد المائة

وصلتنا آراء *${n(r.cover.traced)}* من *${n(r.cover.students)}* من أسر الفصل، فشكرًا لكم 💙
وبقيت ${families(r.missing.length)}، ونتمنى ألّا يفوتكم تسجيل رأيكم:

${r.missing.map((s, i) => `${n(i + 1)}. ${s.name}`).join('\n')}

📲 رابط فصل ابنتكم — من الجوال، ودقيقتان تكفيان:
${link(r.room.id)}

رأيكم يُقرأ بنصّه كما تكتبونه، وما ذُكر فيه رُدَّ عليه بإجراءٍ وشاهدٍ في المدرسة.
نسعد بمشاركتكم 🌟`)
}

// ③ شكرٌ للفصول التي اكتملت: المشاركة تُشكر حين تتمّ لا حين تُطلب فقط
if (done.length > 0) {
  blocks.push(`🎉 *فصولٌ اكتملت مشاركتها بالكامل*
الابتدائية الخامسة والستون بعد المائة

شكرًا لأولياء أمور هذه الفصول — لم تبقَ فيها أسرة واحدة لم يصل رأيها:

${done.map((r) => `✅ ${r.label} — ${n(r.cover.students)} من ${n(r.cover.students)}`).join('\n')}

رأيُكم وصل، وسيُقرأ، وسيُردّ عليه. بارك الله فيكم 💙`)
}

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, blocks.join(`\n\n${RULE}\n\n`) + '\n', 'utf8')

console.log(`✓ ${out}`)
console.log(`  ${n(school.traced)} من ${n(school.students)} · ${p(school.rate)}`)
console.log(`  ${n(pending.length)} فصلًا بقيت فيه أسر · ${n(done.length)} فصلًا مكتملًا`)
