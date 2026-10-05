/**
 * ورقة تعريف المنصّة — صفحة A4 واحدة تُسلَّم للجنة الزائرة.
 *
 * اللجنة لا تفتح بريدًا ولا تُنشئ حسابًا: تقرأ ورقةً وتمسح باركودًا.
 * فالورقة هي واجهة المنصّة عند من لا يدخلها، ولذلك بُنيت لتُقرأ على
 * الورق وعلى الشاشة معًا: الباركود للمطبوع، و<a> حول كل بطاقة كي
 * يُفتح الرابط بالضغط داخل ملف الـPDF نفسه.
 *
 * وأرقامها تُسحب من قاعدة البيانات لا تُكتب باليد: العدد يتغيّر كلما
 * وصلت استجابة أو نُقلت طالبة، وورقةٌ تحمل رقمًا قديمًا أمام لجنةٍ
 * تفتح اللوحة بجوالها أسوأ من ألّا تحمل رقمًا.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npx vite-node scripts/reports/intro-sheet.ts -- --project <المشروع>
 *
 *   # من نسخة محفوظة بدل الشبكة
 *   … --from snapshot.json --out .report-out/تعريف-المنصّة-1448.pdf
 */
import { globSync, readFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import QRCode from 'qrcode'
import { chromium } from 'playwright'

import { attendance } from '../../src/lib/attendance'
import type { Student, SurveyResponse } from '../../src/domain/types'

const ROOT = resolve(import.meta.dirname, '../..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const from = option('from')
const projectId = option('project') ?? process.env.GCLOUD_PROJECT
const out = resolve(ROOT, option('out') ?? '.report-out/تعريف-المنصّة-1448.pdf')
const host = option('host') ?? 'qiyas-165-1448.web.app'
/** تكبير/تصغير الورقة كتلةً واحدة: الصفحة واحدة ولو زادت الأرقام خانة. */
const zoom = Number(option('zoom') ?? 0.94)

interface Snapshot {
  students: Student[]
  responses: SurveyResponse[]
  improvementActions: { status: string; evidence: unknown[] }[]
}

async function snapshot(): Promise<Snapshot> {
  if (from) return JSON.parse(readFileSync(resolve(from), 'utf8')) as Snapshot
  if (!projectId) {
    console.error('الاستعمال: npx vite-node scripts/reports/intro-sheet.ts -- --project <المشروع>')
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
    (await db.collection(name).get()).docs.map((d) => ({ id: d.id, ...d.data() }))
  return {
    students: (await pull('students')) as unknown as Student[],
    responses: (await pull('responses')) as unknown as SurveyResponse[],
    improvementActions: (await pull('improvementActions')) as unknown as Snapshot['improvementActions'],
  }
}

const data = await snapshot()
const active = data.students.filter((s) => s.status === 'active')
const { trace } = attendance({ students: data.students, responses: data.responses } as never)
const joined = active.filter((s) => trace.has(s.id)).length
const share = active.length ? (joined / active.length) * 100 : 0
const proofs = data.improvementActions.reduce((n, a) => n + (a.evidence?.length ?? 0), 0)

/** أرقام هندية على الورقة المطبوعة، كما تُكتب الخطابات الرسمية. */
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
const p = (v: number) => iso(`${new Intl.NumberFormat(AR, { maximumFractionDigits: 1 }).format(v)}%`)

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')

const LINKS = [
  { label: 'لوحة الإدارة', path: '#/admin', note: 'النتائج والاستجابات وبنود التحسين وشواهدها', tone: 'navy' },
  { label: 'رابط القياس', path: '#/survey', note: 'الرابط العام الذي يصل أولياء الأمور', tone: 'green' },
  { label: 'روابط الفصول', path: '#/admin/links', note: 'رابطٌ وباركودٌ خاص لكل فصل من فصول المدرسة', tone: 'teal' },
]
const QR_COLOR: Record<string, string> = { navy: '#15445a', green: '#07a869', teal: '#218caa' }

const cards = await Promise.all(LINKS.map(async (l) => {
  const url = `https://${host}/${l.path}`
  const qr = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 420,
    color: { dark: QR_COLOR[l.tone], light: '#ffffff' },
  })
  return `
      <a class="card card--${l.tone}" href="${url}">
        <span class="card__label">${l.label}</span>
        <img class="card__qr" src="${qr}" alt="باركود ${l.label}">
        <span class="card__url">${host}/${l.path}</span>
        <span class="card__note">${l.note}</span>
      </a>`
}))

const WHY = [
  ['🔗', 'وصولٌ أوسع', 'الرابط يصل إلى كل وليّ أمر في ثوانٍ، فترتفع المشاركة بلا ورقٍ يُوزَّع ويُجمع.'],
  ['🎯', 'دقّةٌ بلا إدخال يدوي', 'النتائج تُحسب لحظة وصول الاستجابة، فلا خطأ نسخٍ ولا جمعٍ ولا تأخير.'],
  ['🗣️', 'شفافيةٌ كاملة', 'نصوص الطالبات وأولياء الأمور معروضة كما كُتبت حرفيًا، بلا تحرير.'],
  ['✅', 'من الرأي إلى الإجراء', 'كل ملاحظة تُربط بإجراء له مسؤولة وتاريخ وشاهد يُفتح بمسح الباركود.'],
  ['♻️', 'استدامةٌ للأعوام القادمة', 'تُعاد الدورة في كل عام على المنصّة نفسها، فتُقارَن النتائج ويُقاس الأثر.'],
]

const SAFETY = [
  'بيانات الطالبات محفوظة في قاعدة بيانات المدرسة وحدها، لا تخرج منها ولا تُشارَك مع أي جهة.',
  'الدخول إلى اللوحة بحسابٍ موثّق وكلمة مرور؛ والخادم — لا الواجهة — هو من يرفض غير المصرَّح له.',
  'لا حذف نهائي لطالبة ولا لاستجابة؛ وكل إجراء إداري مسجَّل في سجلّ تدقيق بتاريخه وصاحبه.',
  'بُنيت بالاستعانة بالذكاء الاصطناعي ضمن الاستخدام الآمن والمسؤول الذي تدعو إليه وزارة التعليم.',
]

const FIGURES: [string, string][] = [
  [n(active.length), 'طالبة'],
  [n(joined), 'شاركت'],
  [p(share), 'نسبة المشاركة'],
  [n(data.improvementActions.length), 'بند تحسين'],
  [n(proofs), 'شاهد تنفيذ'],
]

const SIGNATURES: [string, string][] = [
  ['وكيلة الشؤون التعليمية', 'عهود بهويني'],
  ['مديرة المدرسة', 'جازية السميري'],
  ['الوكيلة الطالبية', 'ناهدة الحربي'],
]

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family: 'Baloo'; src: url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight: 400 800; }
@font-face { font-family: 'SKY'; src: url('${font('HelveticaNeueW23SKY-Regular.woff2')}') format('woff2'); font-weight: 400; }
@font-face { font-family: 'SKY'; src: url('${font('HelveticaNeueW23SKY-Bold.woff2')}') format('woff2'); font-weight: 700; }
:root {
  --green: #07a869; --cyan: #218caa; --navy: #15445a; --teal: #0da9a6;
  --text: #15445a; --muted: #4a6b78; --border: #d6e4e5; --sand: #c1b489;
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Baloo', 'SKY', sans-serif; color: var(--text); background: #fff; }
.fit { zoom: ${zoom}; padding: 26px 30px 18px; }

.head { text-align: center; border-bottom: 2px solid var(--navy); padding-bottom: 9px; }
.head img { height: 46px; }
.head h1 { margin: 7px 0 3px; font-size: 27px; font-weight: 800; color: var(--navy); }
.head .sub { font-size: 14px; font-weight: 700; color: var(--green); }
.head .org { font-size: 10.5px; color: var(--muted); margin-top: 5px; }

h2 { font-size: 14px; font-weight: 800; color: var(--navy); margin: 14px 0 6px;
     padding-right: 10px; border-right: 4px solid var(--green); }

.aim { background: var(--navy); color: #fff; border-radius: 14px; padding: 13px 16px; margin-top: 10px; }
.aim h3 { margin: 0 0 5px; font-size: 13px; font-weight: 800; color: #8fe3c4; }
.aim p { margin: 0; font-size: 11.2px; line-height: 1.75; }

.hint { font-size: 9.6px; color: var(--muted); margin: 0 0 7px; }
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 11px; }
.card { display: block; text-align: center; text-decoration: none; color: inherit;
        border: 1.6px solid var(--border); border-radius: 13px; padding: 10px 8px 9px; }
.card--navy { border-color: #9fc0cc; } .card--green { border-color: #8ddcb8; } .card--teal { border-color: #93cfdd; }
.card__label { display: block; width: fit-content; margin: 0 auto 7px; padding: 3px 13px;
               border-radius: 999px; font-size: 10.5px; font-weight: 700; color: #fff; }
.card--navy .card__label { background: var(--navy); }
.card--green .card__label { background: var(--green); }
.card--teal .card__label { background: var(--cyan); }
.card__qr { display: block; width: 104px; height: 104px; margin: 0 auto 6px; }
.card__url { display: block; font-family: 'SKY', monospace; direction: ltr; font-size: 8.2px;
             font-weight: 700; color: var(--cyan); }
.card--navy .card__url { color: var(--navy); } .card--green .card__url { color: var(--green); }
.card__note { display: block; font-size: 9px; color: var(--muted); margin-top: 4px; }

.why { list-style: none; margin: 0; padding: 0; }
.why li { display: grid; grid-template-columns: 20px 1fr; gap: 8px; margin-bottom: 6px; }
.why b { display: block; font-size: 11.4px; }
.why span { font-size: 10.2px; color: var(--muted); line-height: 1.55; }
.why .ico { font-size: 13px; text-align: center; }

.safe { background: #f4f8f8; border-right: 4px solid var(--sand); border-radius: 10px;
        padding: 9px 13px; margin: 0; list-style: none; }
.safe li { font-size: 10.2px; line-height: 1.7; }
.safe li::marker { content: ''; }
.safe li::before { content: '🔒'; margin-left: 6px; }

.figs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 9px; margin-top: 14px; }
.fig { border: 1.4px solid var(--border); border-radius: 11px; padding: 8px 4px; text-align: center; }
.fig b { display: block; font-size: 19px; font-weight: 800; color: var(--green); }
.fig span { font-size: 9.4px; color: var(--muted); }

.signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 16px; text-align: center; }
.signs .role { font-size: 9.8px; color: var(--muted); }
.signs .who { font-size: 13px; font-weight: 800; margin-top: 3px;
              border-bottom: 1.2px dotted var(--muted); padding-bottom: 7px; }

.by { text-align: center; font-size: 10px; color: var(--muted); margin-top: 9px; }
.by b { color: var(--navy); }
.foot { display: flex; justify-content: space-between; border-top: 1.6px solid var(--navy);
        margin-top: 12px; padding-top: 6px; font-size: 9.6px; font-weight: 700; color: var(--navy); }
</style></head><body><div class="fit">

<header class="head">
  <img src="${asset('public/brand/moe-logo.png', 'image/png')}" alt="وزارة التعليم">
  <h1>منصّة قياس اتجاه المتعلمين</h1>
  <div class="sub">منصّة إلكترونية آمنة · العام الدراسي 1448هـ</div>
  <div class="org">الإدارة العامة للتعليم بمحافظة جدة — الابتدائية الخامسة والستون بعد المائة</div>
</header>

<section class="aim">
  <h3>الهدف من المنصّة</h3>
  <p>تحويلُ قياس اتجاه المتعلمين من استبانةٍ ورقية تُجمع وتُحفظ، إلى منصّةٍ إلكترونية تقرأ آراء
  الطالبات وأولياء أمورهن وتُحوّلها إلى قرارات تحسينٍ موثّقة بشواهد. فلا يبقى الرأي رقمًا في جدول،
  بل يصير إجراءً له مسؤولةٌ وتاريخٌ وشاهدٌ يُفتح بمسح الباركود — ويبقى أثرُه مُتابَعًا من عامٍ إلى عام.</p>
</section>

<h2>روابط المنصّة</h2>
<p class="hint">على الشاشة: اضغط على أي بطاقة ليفتح رابطها · وعلى الورق: امسح الباركود بالجوال</p>
<div class="cards">${cards.join('')}</div>

<h2>لماذا إلكترونية؟</h2>
<ul class="why">${WHY.map(([i, t, d]) => `
  <li><span class="ico">${i}</span><span><b>${t}</b>${d}</span></li>`).join('')}</ul>

<h2>أمن البيانات والاستخدام المسؤول للتقنية</h2>
<ul class="safe">${SAFETY.map((s) => `<li>${s}</li>`).join('')}</ul>

<div class="figs">${FIGURES.map(([v, l]) => `<div class="fig"><b>${v}</b><span>${l}</span></div>`).join('')}</div>

<div class="signs">${SIGNATURES.map(([role, who]) => `
  <div><div class="role">${role}</div><div class="who">${who}</div></div>`).join('')}</div>

<p class="by">إعداد: المساعد الإداري — <b>عواطف الجهني</b></p>
<footer class="foot">
  <span>إدارة التعليم بمحافظة جدة</span>
  <span>الابتدائية الخامسة والستون بعد المائة</span>
</footer>
</div></body></html>`

mkdirSync(dirname(out), { recursive: true })
/** متصفّح الحاوية مثبَّت بنسخةٍ غير التي تنتظرها playwright، فيُمرَّر مساره. */
const executablePath = process.env.CHROMIUM_PATH
  ?? globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome').sort().at(-1)
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle' })
await page.pdf({ path: out, format: 'A4', printBackground: true })
await browser.close()

console.log(`✓ ${out}`)
console.log(`  ${n(active.length)} طالبة · ${n(joined)} شاركت · ${p(share)} · ${n(data.improvementActions.length)} بند · ${n(proofs)} شاهد`)
