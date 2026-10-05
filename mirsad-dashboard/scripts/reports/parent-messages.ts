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
const thanksOut = resolve(ROOT, option('thanks') ?? '.report-out/شكر-الفصول-المكتملة-1448.txt')

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

// ① رسالة التذكير: كل من لم يصل رأي أسرتها في رسالة واحدة.
// الأمّ لا تبحث عن رسالة فصلها بين اثنتي عشرة رسالة في المجموعة —
// تقرأ واحدةً فترى اسم ابنتها ورابط فصلها في سطرين متجاورين.
// والنبرة حازمة لا عاتبة: الباب يُغلق، والرأي لا يكتبه أحدٌ عن أحد.
const groups = pending.map((r) => `*${r.label}*
${link(r.room.id)}
${r.missing.map((s) => `• ${s.name}`).join('\n')}`).join('\n\n')

blocks.push(`⏰ *تذكير أخير — قياس اتجاه المتعلمين ١٤٤٨هـ*
الابتدائية الخامسة والستون بعد المائة

أولياء أمورنا الكرام،
وصلتنا آراء *${n(school.traced)}* أسرة من *${n(school.students)}* — ${p(school.rate)} 💙
ونشكر كل أسرة سجّلت رأيها.

🔴 *وبقيت ${families(school.students - school.traced)} فقط* لتكتمل مشاركةُ المدرسة.

ونرجو من حضراتكم المبادرةَ بتسجيل المشاركة اليوم — فالتعبئة لا تتجاوز
دقيقتين، من الجوال، بلا تسجيل دخول ولا بريد.

وهذه أسماء بناتكم ورابط فصل كلٍّ منهنّ:

${groups}

📲 اضغطوا رابط فصل ابنتكم الآن.

كل ملاحظة وصلتنا هذا العام قُرئت بنصّها، وصار لها إجراءٌ في المدرسة وشاهدٌ على تنفيذه.

نسعد بمشاركتكم جميعًا، وشكرًا لتعاونكم معنا 🌸`)

// ② رسالة لكل فصل بقيت فيه أسرة
for (const r of pending) {
  blocks.push(`🌸 *أولياء الأمور الكرام* — ${r.label}
الابتدائية الخامسة والستون بعد المائة

وصلتنا آراء *${n(r.cover.traced)}* من *${n(r.cover.students)}* من أسر الفصل، فشكرًا لكم 💙
وبقيت ${families(r.missing.length)}، ونرجو المبادرةَ بتسجيل المشاركة:

${r.missing.map((s, i) => `${n(i + 1)}. ${s.name}`).join('\n')}

📲 رابط فصل ابنتكم — من الجوال، ودقيقتان تكفيان:
${link(r.room.id)}

رأيكم يُقرأ بنصّه كما تكتبونه، وما ذُكر فيه رُدَّ عليه بإجراءٍ وشاهدٍ في المدرسة.
نسعد بمشاركتكم 🌟`)
}

/**
 * شكرُ الفصول التي اكتملت — رسالةٌ لكل فصل في مجموعته.
 *
 * الشكر الجماعي يُقرأ تعميمًا فلا يُفرح أحدًا. وأسرة الفصل الذي لم
 * تتخلّف فيه أسرة واحدة تستحقّ أن تُشكر باسم فصلها وبرقمه.
 *
 * والعبارات متعدّدة بعدد يفوق فصول المدرسة: لو جاءت متطابقة لعرفت
 * الأمّ أنها قالَبٌ أُرسل إلى الجميع، فذهب أثر الشكر.
 */
const THANKS: ((label: string, k: string) => string)[] = [
  (label, k) => `🎉 *${label} — اكتملت المشاركة ١٠٠٪*
الابتدائية الخامسة والستون بعد المائة

أولياء أمورنا الكرام،
*${k} من ${k}* — لم تتخلّف أسرة واحدة في فصلكم عن تسجيل رأيها 💙

واهتمامكم هذا هو ما يغيّر المدرسة فعلًا: كل ملاحظة وصلتنا هذا العام
قُرئت بنصّها، وصار لها إجراءٌ نُفِّذ في المدرسة وشاهدٌ عليه.

شكرًا لكم — أسرٌ كهذه تصنع مدرسةً تسمع بناتها 🌸`,

  (label, k) => `🌟 *${label} — فصلٌ اكتمل بالكامل*
الابتدائية الخامسة والستون بعد المائة

*${k} من ${k}* · ١٠٠٪

أولياء أمورنا الكرام، وصلتنا آراؤكم جميعًا بلا استثناء — وهذا رقمٌ
لا يتحقّق إلا حين يكون بين البيت والمدرسة ثقةٌ حقيقية.

وقد عملت المدرسة على ما ذُكر في آراء هذا العام، ووثّقت تنفيذه.
شكرًا لحرصكم، بارك الله فيكم وفي بناتكم 💙`,

  (label, k) => `💙 *${label} — شكرًا لكم*
الابتدائية الخامسة والستون بعد المائة

اكتمل فصلكم: *${k} من ${k}* — ١٠٠٪

ما أرسلتموه ليس استبانةً تُحفظ في ملف: كل ملاحظة تُقرأ كما كتبتموها
حرفًا بحرف، ثم تصير إجراءً له مسؤولةٌ وتاريخٌ وشاهدُ تنفيذ.

دقيقتان من وقتكم صارت تغييرًا في مدرسة بناتكم 🌸
شكرًا لكم جميعًا`,

  (label, k) => `🏅 *${label} — المشاركة كاملة*
الابتدائية الخامسة والستون بعد المائة

*${k} من ${k}* · لم يتخلّف أحد 💙

نشكركم باسم المدرسة كلها: استجابتكم السريعة وفّرت علينا التذكير،
وأعطت بناتكم صوتًا كاملًا في قياس هذا العام.

واهتمامكم هو ما جعل ملاحظات العام الماضي إجراءاتٍ قائمةً اليوم 🌟`,

  (label, k) => `🌸 *${label} — اكتملت الصورة*
الابتدائية الخامسة والستون بعد المائة

*${k} من ${k}* — مئةٌ في المئة

حين يصل رأي كل أسرة في الفصل، لا تبقى طالبةٌ واحدة بلا صوت.
وهذا ما فعلتموه أنتم.

ورأيُكم ليس رقمًا يُحصى: هو ما تُبنى عليه قرارات المدرسة في مرافقها
وأنشطتها. شكرًا لثقتكم وحرصكم 💙`,

  (label, k) => `✨ *${label} — فصلٌ لم تتخلّف فيه أسرة*
الابتدائية الخامسة والستون بعد المائة

*${k} من ${k}* · ١٠٠٪

شكرًا لكم على اهتمامكم — فالمدرسة لا تعرف ما يحتاج التغيير إلا منكم.
وما ذُكر في آراء هذا العام رُبط بإجراء، وأُرفق به شاهدُ تنفيذه.

مدرسةٌ تسمع، وأسرٌ تتكلّم — وبناتكم هنّ المستفيدات 🌟`,

  (label, k) => `🎊 *${label} — شكرًا لكم جميعًا*
الابتدائية الخامسة والستون بعد المائة

اكتمل فصلكم على *${k} من ${k}*

لم نحتَج أن نُذكّركم مرتين، ولم تتأخّر أسرةٌ واحدة. هذا حرصٌ نعتزّ به،
ونعدّه شهادةً في حقّ أسر هذا الفصل.

ورأيُكم لم يذهب إلى ملف: ذهب إلى عملٍ قائمٍ في المدرسة 💙`,

  (label, k) => `💐 *${label} — المشاركة ١٠٠٪*
الابتدائية الخامسة والستون بعد المائة

*${k} من ${k}*

كل أسرة في الفصل سجّلت رأيها. ونحن نعلم أن الوقت ضيّق، وأن دقيقتين
تُقتطعان من يومٍ مزدحم — فشكرًا لأنكم اقتطعتموهما من أجل بناتكم.

واهتمامكم هذا هو ما يجعل المدرسة تتحسّن عامًا بعد عام 🌸`,
]

if (done.length > 0) {
  const thanks = done.map((r, i) =>
    THANKS[i % THANKS.length](r.label, n(r.cover.students)))
  mkdirSync(dirname(thanksOut), { recursive: true })
  writeFileSync(thanksOut, thanks.join(`\n\n${RULE}\n\n`) + '\n', 'utf8')
}

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, blocks.join(`\n\n${RULE}\n\n`) + '\n', 'utf8')

console.log(`✓ ${out}`)
console.log(`  ${n(school.traced)} من ${n(school.students)} · ${p(school.rate)}`)
console.log(`  ${n(pending.length)} فصلًا بقيت فيه أسر · ${n(done.length)} فصلًا مكتملًا`)
if (done.length > 0) console.log(`✓ ${thanksOut}`)
