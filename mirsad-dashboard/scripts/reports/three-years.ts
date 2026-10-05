/**
 * «من النماذج إلى المنصّة» — ورقةٌ تُسلَّم للجنة الزائرة.
 *
 * اللجنة لا تقرأ تقريرًا، تقرأ صفحةً وتضغط رابطًا. فالورقة هنا موجزةٌ
 * عمدًا: ثلاث بطاقاتٍ لثلاثة أعوام، وستُّ جملٍ لِما تغيّر، وتوقيعات.
 * وما زاد على ذلك يُقرأ دفاعًا لا بيانًا.
 *
 * وبطاقةُ كل عامٍ رابطٌ يُفتح: عاما 1446 و1447 ملفّاهما المحفوظان،
 * و1448 المنصّةُ نفسها حيّةً. فتضغط اللجنة على العام فتراه بعينها،
 * ولا تقرأ عنه وصفًا.
 *
 * ولا رقم مشاركةٍ فيها ولا نسبة: الدورة مفتوحة، ورقمُ اليوم يكذّبه
 * غدٌ قريب — والمقصود بيانُ طبيعة العمل لا مقداره.
 *
 *   npx vite-node scripts/reports/three-years.ts
 */
import { globSync, readFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import QRCode from 'qrcode'
import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '../..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const host = option('host') ?? 'qiyas-165-1448.web.app'
const out = resolve(ROOT, option('out') ?? '.report-out/من-النماذج-إلى-المنصة-1448.pdf')

/** ملفّا العامين السابقين، كما شاركتهما المدرسة. */
const ARCHIVE = {
  y1446: option('y1446')
    ?? 'https://drive.google.com/file/d/14E4Tv7UHfnm_OJOAxuk9cds8ewQ1wB5n/view',
  y1447: option('y1447')
    ?? 'https://drive.google.com/file/d/1pGmMjv-Fze9KqwEsiFXpQyPmwVMOYqCg/view',
}
const PLATFORM = `https://${host}/#/admin`

/**
 * ما أرسلته المدرسة إلى أولياء الأمور، بترتيب ما جرى:
 * سألناهم، ثم عملنا برأيهم، ثم نشرنا كلماتهم.
 *
 * وهي الصفحات التي تُفتح من الورقة المطبوعة، فلا بدَّ لكلٍّ من
 * باركودٍ: الرابط المكتوب لا يُنسخ من ورق.
 */
const FOR_PARENTS: { icon: string; title: string; note: string; path: string }[] = [
  { icon: '📨', title: 'الاستبيان الذي أرسلناه إليكم', path: '#/survey',
    note: 'الرابط نفسه الذي وصل كلَّ أسرة، فأخذنا منه رأيها' },
  { icon: '🛠️', title: 'ماذا عملنا برأيكم؟', path: '#/amal',
    note: 'كلُّ ملاحظةٍ وصلتنا، وما عملته المدرسة ردًّا عليها، وصورتُه' },
  { icon: '💙', title: 'كلماتٌ طيّبة وصلَتْنا منكم', path: '#/shukr',
    note: 'ما أثنى به أولياء الأمور على المدرسة، بنصّه كما كُتب' },
]

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')

/** العازل الثنائي: «1446هـ» في سطرٍ عربي لا تنقلب هاؤه إلى طرفه. */
const iso = (t: string) => `⁦${t}⁩`
/**
 * «1448هـ»: يُعزل الرقم وحده وتُترك الهاء للسطر.
 *
 * ولو عُزلت العبارة كلُّها باتجاهٍ لاتيني لانتقلت هاؤها إلى يسار
 * الرقم، والسطر عربيٌّ من اليمين إلى اليسار — فتُقرأ مقلوبة.
 */
const hijri = (y: string) => `${iso(y)}\u00A0هـ`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

interface Year {
  /** رقم العام وحده، بلا «هـ»: تُضاف عند العرض خارج العازل. */
  year: string
  kind: string
  tone: 'form' | 'live'
  icon: string
  lines: string[]
  href: string
  cta: string
}

const YEARS: Year[] = [
  {
    year: '1446', kind: 'نماذج إلكترونية', tone: 'form', icon: '📝',
    lines: [
      'النموذج يصل إلى أولياء الأمور ويجمع ردودهم',
      'ثم تُفرَّغ الردود في جدولٍ وتُحسب يدويًا',
      'ولا يُربط الردُّ بالطالبة في الكشف الرسمي',
    ],
    href: ARCHIVE.y1446, cta: 'اضغط لفتح ملف العام',
  },
  {
    year: '1447', kind: 'نماذج إلكترونية', tone: 'form', icon: '📝',
    lines: [
      'العمل نفسه يُعاد بناؤه من أوّله كلَّ عام',
      'والرسوم والنِّسَب تُصنع بعد التصدير يدويًا',
      'والرأي يُقرأ ثم يقف، بلا إجراءٍ يتبعه',
    ],
    href: ARCHIVE.y1447, cta: 'اضغط لفتح ملف العام',
  },
  {
    year: '1448', kind: 'منصّة متكاملة', tone: 'live', icon: '💻',
    lines: [
      'رابطٌ خاصٌّ بكل فصل يصل أسرَه مباشرةً',
      'والنتائج تُحسب لحظة وصول الرأي بلا تفريغ',
      'وكلُّ ملاحظةٍ تصير إجراءً له شاهدُ تنفيذ',
    ],
    href: PLATFORM, cta: 'اضغط لفتح المنصّة',
  },
]

const GAINS: [string, string, string][] = [
  ['🔗', 'ربطٌ بالكشف الرسمي',
    'كان الردُّ يصل باسمٍ مكتوب فيُطابَق يدويًا، وصار يُرشَّح في الشاشة ويُؤكَّد بضغطة.'],
  ['🎯', 'نتائجُ بلا تفريغٍ يدوي',
    'كانت الردود تُصدَّر إلى جدولٍ ثم تُحسب وتُرسم، وصارت تُحسب لحظة وصول الرأي.'],
  ['⏱️', 'سرعةُ قياس الأثر',
    'كان الأثر يُعرف بعد انقضاء وقته، وصار يُقرأ في يومه فيُعالَج في حينه.'],
  ['🗣️', 'استطلاعُ آراء المستفيدين في وقته',
    'رأيُ وليّ الأمر يصل وهو حيٌّ، فيُبنى عليه قرارٌ ينفع صاحبَه لا من بعده.'],
  ['✅', 'من الرأي إلى الإجراء',
    'النموذج يجمع الرأي ثم يقف، والمنصّة تربطه بإجراءٍ له مسؤولةٌ وتاريخٌ وشاهدُ تنفيذ.'],
  ['♻️', 'استدامةٌ للأعوام القادمة',
    'لا يُعاد البناء كلَّ عام: تُعاد الدورة على المنصّة نفسها فتُقارَن الأعوام ويُقاس التحسّن.'],
]

/** التواقيع بترتيب المدرسة: يمينًا ثم وسطًا ثم يسارًا. */
const SIGNERS: [string, string][] = [
  ['وكيلة الشؤون التعليمية', 'عهود باهويني'],
  ['وكيلة شؤون الطالبات', 'ناهد الحربي'],
  ['مديرة المدرسة', 'جازية السميري'],
]

/**
 * باركودٌ لكل عام، لا للمنصّة وحدها.
 *
 * الورقة تُطبع وتُوزَّع على اللجنة، والمطبوع لا يُضغط. فمن أراد ملفّ
 * 1446 أو 1447 يمسح رمزه بجوّاله ويفتحه في ثانية، ومن قرأها على
 * الشاشة ضغط البطاقة نفسها.
 *
 * وتصحيحُ الخطأ «M» لا «L»: الرمز يُطبع صغيرًا وقد يُصوَّر بجوّالٍ
 * مائل، فيحتمل شيئًا من التلف ويبقى مقروءًا.
 */
const qrFor = (url: string, dark: string) => QRCode.toDataURL(url, {
  errorCorrectionLevel: 'M', margin: 2, width: 560,
  color: { dark, light: '#ffffff' },
})

const parentCodes = new Map(await Promise.all(FOR_PARENTS.map(async (f) =>
  [f.path, await qrFor(`https://${host}/${f.path}`, '#07734c')] as const)))

const codes = new Map(await Promise.all(YEARS.map(async (y) =>
  // كل الرموز بلون الهوية الداكن لا بالأخضر: الماسح يقرأ فرق إضاءةٍ
  // لا لونًا، والأخضر على الأبيض يسقط عند الطباعة بدقّةٍ منخفضة —
  // جُرِّب فلم يُقرأ عند 150 نقطة، وقُرئ الداكن عندها وعند ما دونها
  [y.year, await qrFor(y.href, '#15445a')] as const)))

const card = (y: Year) => `
<a class="yr yr--${y.tone}" href="${y.href}">
  <div class="yr__top">
    <span class="yr__icon">${y.icon}</span>
    <b class="yr__year">${hijri(y.year)}</b>
    <span class="yr__kind">${esc(y.kind)}</span>
  </div>
  <ul>${y.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
  <img class="yr__qr" src="${codes.get(y.year)}" alt="باركود ${y.year}">
  <span class="yr__cta">${esc(y.cta)} ↗</span>
</a>`

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --green:#07a869; --teal:#0da9a6; --navy:#15445a; --cyan:#218caa; --sand:#c1b489;
        --muted:#4a6b78; --border:#d6e4e5; --soft:#f4f8f8; }
@page { size:A4; margin:0; }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Baloo',sans-serif; color:var(--navy); }
.sheet { height:297mm; padding:10mm 13mm 8mm; display:flex; flex-direction:column; }
.sheet--two { break-before:page; }
.head--slim { border-bottom:2px solid var(--navy); padding-bottom:8px; }
.head--slim .school { font-size:12.5px; font-weight:800; }
.lede--tight { margin:7px 2mm 0; }

.head { text-align:center; border-bottom:2px solid var(--navy); padding-bottom:10px; }
.head img { height:48px; }
.head .org { font-size:11px; color:var(--muted); margin-top:9px; }
.head .school { font-size:14px; font-weight:800; margin-top:3px; }
h1 { font-size:27px; font-weight:800; margin-top:10px; line-height:1.3; text-align:center; }
h1 small { display:block; font-size:15px; font-weight:700; color:var(--green); margin-top:6px; }
.lede { text-align:center; font-size:11.6px; line-height:1.8; color:var(--muted);
        margin:8px 6mm 0; }

.years { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
.yr { display:flex; flex-direction:column; text-decoration:none; color:inherit;
      border:1.6px solid var(--border); border-radius:16px; padding:11px 12px 10px; }
.yr--form { background:var(--soft); }
.yr--live { border-color:var(--green); border-width:2.2px;
            background:linear-gradient(170deg,#f1fbf6,#f6fbfb); }
.yr__top { text-align:center; border-bottom:1px dotted var(--border); padding-bottom:9px; }
.yr__icon { font-size:20px; }
.yr__year { display:block; font-size:23px; font-weight:800; margin-top:3px; }
.yr__kind { display:inline-block; margin-top:6px; padding:3px 13px; border-radius:999px;
            font-size:11px; font-weight:700; color:#fff; background:var(--muted); }
.yr--live .yr__kind { background:var(--green); }
.yr ul { list-style:none; margin:10px 0 0; flex:1; }
.yr li { font-size:10.5px; line-height:1.65; color:#33606f; margin-bottom:7px;
         padding-right:13px; position:relative; }
.yr li::before { content:'•'; position:absolute; right:0; color:var(--sand); font-weight:800; }
.yr--live li::before { color:var(--green); }
.yr__qr { display:block; width:27mm; height:27mm; margin:9px auto 8px;
          border:1px solid var(--border); border-radius:8px; padding:3px; background:#fff; }
.yr__cta { display:block; text-align:center; margin-top:10px; padding:7px 0; border-radius:10px;
           font-size:11.5px; font-weight:800; color:#fff; background:var(--navy); }
.yr--live .yr__cta { background:linear-gradient(90deg,var(--green),var(--teal)); }

h2 { font-size:15px; font-weight:800; margin:11px 0 7px; padding-right:10px;
     border-right:4px solid var(--green); }
.gains { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.gain { display:grid; grid-template-columns:19px 1fr; gap:6px;
        border:1.3px solid var(--border); border-radius:11px; padding:7px 10px; }
.gain .ico { font-size:15px; text-align:center; }
.gain b { display:block; font-size:12px; margin-bottom:2px; line-height:1.35; }
.gain span { font-size:10.2px; line-height:1.7; color:var(--muted); }

.parents { display:grid; gap:8px; }
.parents { margin-top:11px; gap:11px; }
.pc { display:grid; grid-template-columns:30mm 1fr; gap:15px; align-items:center;
      text-decoration:none; color:inherit; border:1.8px solid #bfe0d2; border-radius:16px;
      padding:13px 16px; background:linear-gradient(170deg,#f4fbf8,#f8fbfb); }
.pc img { width:30mm; height:30mm; background:#fff; border-radius:9px; padding:3px; }
.pc b { display:block; font-size:16px; font-weight:800; }
.pc .ico { margin-left:6px; }
.pc > div > span { display:block; font-size:12px; color:var(--muted); line-height:1.7;
                   margin-top:4px; }
.pc__url { direction:ltr; font-weight:800; color:var(--green) !important; font-size:11.5px !important;
           margin-top:5px !important; }
.init { border:1.8px solid var(--green); border-radius:16px; padding:14px 18px; margin-top:16px;
         background:linear-gradient(170deg,#f2fbf7,#f6fbfb); }
.init h3 { font-size:16px; font-weight:800; margin-bottom:6px; }
.init h3 span { margin-left:6px; }
.init p { font-size:12px; line-height:1.95; color:#2d5c54; }
.init__how { margin-top:6px; padding-top:6px; border-top:1px dotted #bfe0d2;
             color:var(--muted); }
.init__how b { color:var(--navy); }
.hint { text-align:center; font-size:10.8px; line-height:1.75; color:var(--muted);
         background:var(--soft); border-radius:11px; padding:7px 13px; margin-top:9px; }
.hint b { color:var(--navy); }
.qrbox { display:grid; grid-template-columns:auto 1fr; gap:14px; align-items:center;
         border:2px solid var(--green); border-radius:15px; padding:11px 14px; margin-top:11px;
         background:var(--soft); color:inherit; text-decoration:none; }
.qrbox img { width:24mm; height:24mm; background:#fff; border-radius:9px; padding:4px; }
.qrbox h3 { font-size:16px; font-weight:800; margin-bottom:4px; }
.qrbox p { font-size:11.2px; line-height:1.8; color:#34606f; }
.qrbox .url { display:inline-block; margin-top:6px; direction:ltr; font-size:11.5px;
              font-weight:800; color:#fff; background:var(--navy); border-radius:999px;
              padding:4px 14px; }

.signs { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; text-align:center;
         margin-top:auto; padding-top:11px; }
.signs .role { font-size:10.5px; color:var(--muted); }
.signs .who { font-size:13.5px; font-weight:800; margin-top:4px;
              border-bottom:1.2px dotted var(--muted); padding-bottom:7px; }
.by { text-align:center; font-size:10.5px; color:var(--muted); margin-top:7px; }
.by b { color:var(--navy); font-size:13px; }
</style></head><body>
<div class="sheet">

  <header class="head">
    <img src="${asset('public/brand/moe-logo.png', 'image/png')}" alt="وزارة التعليم">
    <div class="org">الإدارة العامة للتعليم بمحافظة جدة</div>
    <div class="school">الابتدائية الخامسة والستون بعد المائة</div>
  </header>

  <h1>من النماذج إلى المنصّة
    <small>تطوُّر قياس اتجاه المتعلمين — ${iso('1446')} · ${iso('1447')} · ${hijri('1448')}</small>
  </h1>

  <p class="lede">عامان أُجري فيهما القياس على نماذج إلكترونية تجمع الردود وتقف عندها،
  وعامٌ أُجري على منصّةٍ تقرأ الرأي وتُحوّله إلى عمل. وهذه الورقة تُظهر الفرق،
  ومعها روابطُ الأعوام الثلاثة تُفتح بالضغط أو بمسح الرمز.</p>

  <div class="years">${YEARS.map(card).join('')}</div>

  <h2>ماذا حلَّ لنا هذا التحوّل</h2>
  <div class="gains">${GAINS.map(([i, t, b]) => `
    <div class="gain"><span class="ico">${i}</span>
      <span><b>${esc(t)}</b><span>${esc(b)}</span></span></div>`).join('')}
  </div>

</div>

<div class="sheet sheet--two">
  <header class="head head--slim">
    <div class="school">الابتدائية الخامسة والستون بعد المائة — قياس اتجاه المتعلمين ${hijri('1448')}</div>
  </header>

  <h2>وهذا ما أرسلناه إلى أولياء الأمور</h2>
  <p class="lede lede--tight">ثلاث صفحاتٍ تُفتح من الجوّال: سألناهم، ثم عملنا برأيهم،
  ثم نشرنا كلماتهم. امسحوا الرمز إن كانت الورقة مطبوعة، أو اضغطوا البطاقة على الشاشة.</p>
  <div class="parents">${FOR_PARENTS.map((f) => `
    <a class="pc" href="https://${host}/${f.path}">
      <img src="${parentCodes.get(f.path)}" alt="باركود ${esc(f.title)}">
      <div>
        <b><span class="ico">${f.icon}</span>${esc(f.title)}</b>
        <span>${esc(f.note)}</span>
        <span class="pc__url">${host}/${f.path}</span>
      </div>
    </a>`).join('')}
  </div>

  <section class="init">
    <h3><span>✨</span>مبادرةٌ لرفع جودة العمل في المدرسة</h3>
    <p>أُنشئت هذه المنصّة بمبادرةٍ من المساعد الإداري بالمدرسة، بالاستعانة بالذكاء
    الاصطناعي ضمن الاستخدام الآمن والمسؤول الذي تدعو إليه وزارة التعليم. فصار ما
    يُكتب نصًّا ينعكس على المنصّة في حينه: يُصاغ السؤال، ويُرسل الرابط إلى أولياء
    الأمور مربوطًا بفصل ابنتهم، وتُقرأ النتيجة لحظة وصولها — بلا تفريغٍ يدويّ،
    ولا جدولٍ يُعاد بناؤه كلَّ عام.</p>
    <p class="init__how">وكلُّ بطاقةٍ أعلاه تُفتح بطريقتين: <b>امسحوا رمزها</b> بكاميرا
    الجوّال إن كانت الورقة مطبوعة، أو <b>اضغطوا البطاقة</b> إن قرأتموها على الشاشة.</p>
  </section>


  <div class="signs">${SIGNERS.map(([role, who]) => `
    <div><div class="role">${esc(role)}</div><div class="who">${esc(who)}</div></div>`).join('')}
  </div>

  <p class="by">إعداد — المساعد الإداري: <b>عواطف الجهني</b></p>
</div>
</body></html>`

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
