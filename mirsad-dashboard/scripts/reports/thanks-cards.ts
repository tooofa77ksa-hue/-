/**
 * بطاقات شكرٍ للفصول التي اكتملت مشاركتها.
 *
 * الرسالة النصّية تُقرأ وتُمرَّر، والبطاقة تُحفظ وتُعاد. وفصلٌ لم
 * تتخلّف فيه أسرةٌ واحدة يستحقّ أن يُشكر بشيءٍ يُرى لا بسطرٍ في
 * مجموعة. فلكل فصلٍ بطاقته باسمه وعدده وعبارةٍ لا تتكرّر مع غيره
 * — والتكرار هو ما يُسقط قيمة الشكر حين تُقارن المجموعاتُ رسائلها.
 *
 * وتُبنى من البيانات الحيّة لا باليد: فصلٌ يُشكر على الاكتمال وقد
 * نُقلت إليه طالبةٌ جديدة لم تشارك، شكرٌ يُكذّبه كشفُ المعلمة.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npx vite-node scripts/reports/thanks-cards.ts -- --project <المشروع>
 */
import { globSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { chromium } from 'playwright'

import { coverage, attendance } from '../../src/lib/attendance'
import { orderedClasses } from '../../src/lib/labels'
import type { ClassRoom, Grade, Student, SurveyResponse, SystemState } from '../../src/domain/types'

const ROOT = resolve(import.meta.dirname, '../..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const from = option('from')
const projectId = option('project') ?? process.env.GCLOUD_PROJECT
const host = option('host') ?? 'qiyas-165-1448.web.app'
const dir = resolve(ROOT, option('out') ?? '.report-out/بطاقات-الشكر')
const txtOut = resolve(ROOT, option('txt') ?? '.report-out/الفصول-المتبقية-وروابطها-1448.txt')

interface Snapshot {
  grades: Grade[]
  classes: ClassRoom[]
  students: Student[]
  responses: SurveyResponse[]
}

async function snapshot(): Promise<Snapshot> {
  if (from) return JSON.parse(readFileSync(resolve(from), 'utf8')) as Snapshot
  if (!projectId) {
    console.error('الاستعمال: npx vite-node scripts/reports/thanks-cards.ts -- --project <المشروع>')
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
  const names: (keyof Snapshot)[] = ['grades', 'classes', 'students', 'responses']
  const slices = await Promise.all(names.map(pull))
  return Object.fromEntries(names.map((name, i) => [name, slices[i]])) as unknown as Snapshot
}

const d = await snapshot()
const state = {
  grades: d.grades, classes: d.classes, students: d.students,
  responses: d.responses.map(({ ...r }) => r),
} as unknown as SystemState
const { trace } = attendance(state)

/** أرقام لاتينية (0 1 2 3) في كل المطبوعات، كما في الشاشات — بطلب المدرسة. */
const AR = 'ar-SA-u-nu-latn'
/**
 * الأرقام اللاتينية داخل سطرٍ عربي تُعزل بـU+2066/U+2069.
 *
 * العلامات المحايدة حول الرقم (% و− و/) لا تنتمي إليه، فتأخذ اتجاه
 * الجملة وتقفز إلى طرفها الخطأ: «%96.3» بدل «96.3%». والعازلان لا
 * يُرسمان، ويعملان في HTML وفي النص المستخرج من PDF سواء.
 */
const iso = (t: string) => `\u2066${t}\u2069`
const n = (v: number) => iso(new Intl.NumberFormat(AR).format(v))
const p1 = (v: number) => iso(`${new Intl.NumberFormat(AR, { maximumFractionDigits: 1 }).format(v)}%`)
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const rooms = orderedClasses(d.grades, d.classes).map(({ room, grade }) => ({
  room,
  label: `${grade?.name ?? ''} / فصل ${/^\d+$/.test(String(room.name)) ? n(Number(room.name)) : room.name}`,
  cover: coverage(state, { classId: room.id }),
  missing: d.students.filter((s) => s.classId === room.id && s.status === 'active' && !trace.has(s.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'ar')),
}))
const done = rooms.filter((r) => r.missing.length === 0 && r.cover.students > 0)
const left = rooms.filter((r) => r.missing.length > 0)
const school = coverage(state, {})

/**
 * عباراتُ شكرٍ لا تتكرّر: المجموعات تتقارن، وبطاقتان بنصٍّ واحد
 * تُقرآن نموذجًا مطبوعًا لا شكرًا لفصلٍ بعينه.
 */
const WORDS: { crown: string; line: string; body: string }[] = [
  {
    crown: 'مشاركةٌ كاملة',
    line: 'لم تتخلّف أسرةٌ واحدة',
    body: 'تتقدّم إدارة المدرسة بخالص الشكر والتقدير لأولياء أمور طالبات هذا الفصل '
      + 'على استجابتهم الكريمة وتسجيل آرائهم كاملةً دون استثناء. '
      + 'وما أبدوه من اهتمامٍ هو ما يجعل القياس أداةَ تطويرٍ لا ورقةً تُحفظ.',
  },
  {
    crown: 'فصلٌ اكتمل',
    line: 'آراؤكم وصلت جميعًا',
    body: 'يسرّ إدارة المدرسة أن تسجّل شكرها وتقديرها لأسر طالبات هذا الفصل، '
      + 'الذين لم يتأخّر منهم أحد عن إبداء رأيه. '
      + 'وهذه الثقة المتبادلة بين البيت والمدرسة هي أثمن ما يُبنى عليه العمل التربوي.',
  },
  {
    crown: 'مئةٌ في المئة',
    line: 'كل طالبةٍ وصل صوت أسرتها',
    body: 'تشكر إدارة المدرسة أولياء الأمور الكرام على حرصهم واستجابتهم، '
      + 'فقد وصلت آراؤهم كاملةً وقُرئت بنصّها، وصار لكل ملاحظةٍ إجراءٌ موثَّقٌ بشاهده. '
      + 'فلكم منّا جزيل الشكر، وللطالبات دوام التوفيق.',
  },
  {
    crown: 'استجابةٌ تامّة',
    line: 'شكرًا لحرصكم',
    body: 'تتوجّه إدارة المدرسة بوافر الشكر والامتنان لأولياء أمور هذا الفصل '
      + 'على سرعة استجابتهم وتعاونهم المثمر. '
      + 'وقد أسهمت آراؤهم إسهامًا مباشرًا في تحسين بيئة بناتنا التعليمية.',
  },
  {
    crown: 'اكتملت الصورة',
    line: 'لا طالبةَ بلا صوت',
    body: 'حين يصل رأي كل أسرةٍ في الفصل، لا تبقى طالبةٌ واحدة بلا صوت — وهذا ما تحقّق هنا. '
      + 'فالشكر موصولٌ لأولياء الأمور الكرام على وعيهم وتجاوبهم، '
      + 'سائلين الله أن يبارك في جهودهم وفي بناتهم.',
  },
  {
    crown: 'شكرًا وتقديرًا',
    line: 'فصلٌ يُحتذى به',
    body: 'تعتزّ إدارة المدرسة بأسر طالبات هذا الفصل، الذين ضربوا مثالًا في الشراكة التربوية '
      + 'باستكمال مشاركتهم جميعًا. '
      + 'ولهم من المدرسة خالص الشكر والتقدير، ولبناتهم دوام التميّز والتفوّق.',
  },
  {
    crown: 'تمامُ المشاركة',
    line: 'رأيكم بلغ موضعه',
    body: 'تشكر إدارة المدرسة أولياء الأمور الأفاضل على ما أبدوه من اهتمامٍ وتعاون، '
      + 'فقد اكتملت مشاركة الفصل كاملةً. '
      + 'وكل ملاحظةٍ وصلت قد قُرئت وسُجّلت وصار لها إجراءٌ يُتابَع تنفيذه.',
  },
  {
    crown: 'جزاكم الله خيرًا',
    line: 'مشاركةٌ لم ينقصها أحد',
    body: 'تسجّل إدارة المدرسة شكرها الجزيل لأولياء أمور طالبات هذا الفصل '
      + 'على استجابتهم الكاملة وثقتهم الغالية. '
      + 'فبمثل هذا التعاون تنهض المدرسة برسالتها، ويجد كل رأيٍ طريقه إلى التنفيذ.',
  },
]

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const FONT = asset('public/fonts/BalooBhaijaan2-Variable.woff2', 'font/woff2')
/** الشعار الفاتح: البطاقة داكنة، والشعار الداكن يختفي عليها. */
const LOGO = asset('public/brand/moe-logo-light.png', 'image/png')

const SHELL = (body: string, extra = '') => `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${FONT}') format('woff2'); font-weight:400 800; }
:root { --green:#07a869; --teal:#0da9a6; --navy:#15445a; --sand:#c1b489; --cyan:#218caa; }
* { box-sizing:border-box; margin:0; padding:0; }
body { width:1080px; height:1350px; font-family:'Baloo',sans-serif; color:#fff;
       background:
         radial-gradient(900px 620px at 18% -8%, rgba(13,169,166,.55), transparent 62%),
         radial-gradient(760px 560px at 100% 104%, rgba(7,168,105,.45), transparent 60%),
         linear-gradient(160deg, #10384a 0%, #15445a 48%, #0d3043 100%);
       background-color:#123c50; position:relative; overflow:hidden; }
.glow { position:absolute; border-radius:50%; filter:blur(2px); opacity:.16; }
.g1 { width:360px; height:360px; border:2px solid #7fe6cf; top:-130px; left:-110px; }
.g2 { width:520px; height:520px; border:2px solid #9fe8c6; bottom:-220px; right:-170px; }
.g3 { width:200px; height:200px; border:2px solid #c1b489; top:250px; right:-70px; }
.card { position:absolute; inset:46px; border-radius:40px; padding:54px 58px 44px;
        background:rgba(255,255,255,.055); border:1.5px solid rgba(255,255,255,.18);
        backdrop-filter:blur(2px); display:flex; flex-direction:column; }
.rule { height:3px; width:96px; margin:0 auto; border-radius:3px;
        background:linear-gradient(90deg, var(--green), var(--teal)); }
${extra}
</style></head><body>
<div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div>
${body}
</body></html>`

const CARD_CSS = `
.top { text-align:center; }
.top img { height:92px; opacity:.97; }
.org { font-size:19px; color:#b9d6dd; margin-top:14px; letter-spacing:.2px; }
.school { font-size:25px; font-weight:800; color:#fff; margin-top:5px; }
.crown { margin:38px auto 0; width:fit-content; padding:11px 34px; border-radius:999px;
         font-size:27px; font-weight:800; color:#06352a;
         background:linear-gradient(90deg,#8fe3c4,#5fd6b0); box-shadow:0 10px 30px rgba(0,0,0,.2); }
.room { text-align:center; font-size:62px; font-weight:800; margin-top:30px; line-height:1.18;
        text-shadow:0 6px 26px rgba(0,0,0,.28); }
.line { text-align:center; font-size:30px; color:#9fe8c6; font-weight:700; margin:10px 0 26px; }
.ring { margin:0 auto; width:250px; height:250px; border-radius:50%; display:grid; place-content:center;
        background:conic-gradient(var(--green) 0 100%, rgba(255,255,255,.1) 0);
        position:relative; }
.ring::after { content:''; position:absolute; inset:17px; border-radius:50%;
               background:linear-gradient(160deg,#143f54,#102f41); }
.ring div { position:relative; z-index:1; text-align:center; }
.ring b { display:block; font-size:58px; font-weight:800; line-height:1; white-space:nowrap;
          direction:ltr; }
.ring i { font-style:normal; font-size:32px; color:#8fe3c4; margin:0 6px; }
.ring span { display:block; font-size:20px; color:#b9d6dd; margin-top:11px; }
.body { font-size:27px; line-height:2.05; text-align:center; color:#eaf5f6;
        margin:34px 10px 0; flex:1; }
.sign { display:grid; grid-template-columns:1fr 1fr; gap:34px; text-align:center;
        border-top:1.5px solid rgba(255,255,255,.17); padding-top:20px; }
.role { font-size:18px; color:#9fbdc7; }
.who { font-size:26px; font-weight:800; margin-top:4px; }
.foot { text-align:center; font-size:19px; color:#9fbdc7; margin-top:16px; }`

const card = (label: string, k: number, w: typeof WORDS[number]) => SHELL(`
<div class="card">
  <div class="top">
    <img src="${LOGO}" alt="وزارة التعليم">
    <div class="org">الإدارة العامة للتعليم بمحافظة جدة</div>
    <div class="school">الابتدائية الخامسة والستون بعد المائة</div>
  </div>
  <div class="crown">${esc(w.crown)}</div>
  <div class="room">${esc(label)}</div>
  <div class="line">${esc(w.line)}</div>
  <div class="ring"><div><b>${n(k)}<i>/</i>${n(k)}</b>
    <span>مئةٌ في المئة</span></div></div>
  <p class="body">${esc(w.body)}</p>
  <div class="sign">
    <div><div class="role">مديرة المدرسة</div><div class="who">جازية السميري</div></div>
    <div><div class="role">إعداد — المساعد الإداري</div><div class="who">عواطف الجهني</div></div>
  </div>
  <div class="foot">قياس اتجاه المتعلمين 1448هـ</div>
</div>`, CARD_CSS)

const HONOUR_CSS = `
.top { text-align:center; }
.top img { height:86px; }
.org { font-size:18px; color:#b9d6dd; margin-top:12px; }
.school { font-size:24px; font-weight:800; margin-top:4px; }
.title { text-align:center; font-size:58px; font-weight:800; margin:30px 0 6px;
         text-shadow:0 6px 26px rgba(0,0,0,.28); }
.kicker { text-align:center; font-size:26px; color:#9fe8c6; font-weight:700; margin-bottom:22px; }
.list { display:grid; grid-template-columns:1fr 1fr; gap:15px; margin:4px 0 24px; }
.item { border:1.5px solid rgba(255,255,255,.2); border-radius:20px; padding:16px 14px;
        background:rgba(255,255,255,.06); display:flex; flex-direction:column;
        align-items:center; gap:7px; }
.item b { font-size:25px; font-weight:800; line-height:1.25; text-align:center; }
.item span { font-size:20px; color:#9fe8c6; font-weight:700; direction:ltr;
             background:rgba(143,227,196,.14); border-radius:999px; padding:3px 15px; }
.body { font-size:25px; line-height:2.05; text-align:center; color:#eaf5f6;
        margin:10px 6px 0; flex:1; }
.body b { color:#9fe8c6; font-size:29px; }
.sign { display:grid; grid-template-columns:1fr 1fr; gap:34px; text-align:center;
        border-top:1.5px solid rgba(255,255,255,.17); padding-top:18px; }
.role { font-size:18px; color:#9fbdc7; }
.who { font-size:25px; font-weight:800; margin-top:4px; }
.foot { text-align:center; font-size:19px; color:#9fbdc7; margin-top:14px; }`

const honour = SHELL(`
<div class="card">
  <div class="top">
    <img src="${LOGO}" alt="وزارة التعليم">
    <div class="org">الإدارة العامة للتعليم بمحافظة جدة</div>
    <div class="school">الابتدائية الخامسة والستون بعد المائة</div>
  </div>
  <div class="title">لوحة شرف المشاركة</div>
  <div class="kicker">فصولٌ اكتملت مشاركة أسرها 100٪</div>
  <div class="rule"></div>
  <div class="list">${done.map((r) => `
    <div class="item"><b>${esc(r.label)}</b><span>${n(r.cover.students)} / ${n(r.cover.students)}</span></div>`).join('')}
  </div>
  <p class="body">تتقدّم إدارة المدرسة بخالص الشكر والتقدير لأولياء أمور طالبات هذه الفصول،
  الذين سجّلوا آراءهم كاملةً دون أن يتخلّف منهم أحد.<br>
  وقد بلغت مشاركة المدرسة <b>${p1(school.rate)}</b>
  (<bdi>${n(school.traced)}</bdi> من <bdi>${n(school.students)}</bdi>)،
  وكل رأيٍ وصل قُرئ بنصّه وصار له إجراءٌ موثَّقٌ بشاهده.</p>
  <div class="sign">
    <div><div class="role">مديرة المدرسة</div><div class="who">جازية السميري</div></div>
    <div><div class="role">إعداد — المساعد الإداري</div><div class="who">عواطف الجهني</div></div>
  </div>
  <div class="foot">قياس اتجاه المتعلمين 1448هـ</div>
</div>`, HONOUR_CSS)

/** اسم ملفٍ آمن: لا مسافات ولا شرطات مائلة تُفسد المسار. */
const slug = (label: string) => label.replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-')

mkdirSync(dir, { recursive: true })
const executablePath = process.env.CHROMIUM_PATH
  ?? globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome').sort().at(-1)
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })

for (const [i, r] of done.entries()) {
  await page.setContent(card(r.label, r.cover.students, WORDS[i % WORDS.length]), { waitUntil: 'networkidle' })
  await page.screenshot({ path: resolve(dir, `${slug(r.label)}.png`) })
}
await page.setContent(honour, { waitUntil: 'networkidle' })
await page.screenshot({ path: resolve(dir, 'لوحة-شرف-المشاركة.png') })
await browser.close()

// نصُّ الفصول المتبقية: الرابط تحت اسم فصله مباشرةً، كي يُنسخ سطران لا سطر
const RULE = '─'.repeat(44)
writeFileSync(txtOut, [
  `الفصول المتبقية — ${n(left.length)} فصول · ${n(school.students - school.traced)} أسرة`,
  `قياس اتجاه المتعلمين 1448هـ`,
  '',
  ...left.map((r) => [
    RULE,
    `${r.label} — بقي ${n(r.missing.length)} من ${n(r.cover.students)} · ${p1(r.cover.rate)}`,
    `https://${host}/#/survey/${r.room.id}`,
    ...r.missing.map((s) => `• ${s.name}`),
    '',
  ].join('\n')),
].join('\n'), 'utf8')

console.log(`✓ ${dir} — ${n(done.length)} بطاقة فصل + لوحة شرف`)
console.log(`✓ ${txtOut}`)
for (const r of left) console.log(`  باقٍ: ${r.label} — ${n(r.missing.length)} · https://${host}/#/survey/${r.room.id}`)
