/**
 * «من الورق إلى المنصّة» — ورقةٌ تُسلَّم للجنة الزائرة.
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
const out = resolve(ROOT, option('out') ?? '.report-out/من-الورق-إلى-المنصة-1448.pdf')

/** ملفّا العامين السابقين، كما شاركتهما المدرسة. */
const ARCHIVE = {
  y1446: option('y1446')
    ?? 'https://drive.google.com/file/d/14E4Tv7UHfnm_OJOAxuk9cds8ewQ1wB5n/view',
  y1447: option('y1447')
    ?? 'https://drive.google.com/file/d/1pGmMjv-Fze9KqwEsiFXpQyPmwVMOYqCg/view',
}
const PLATFORM = `https://${host}/#/admin`

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')

/** العازل الثنائي: «1446هـ» في سطرٍ عربي لا تنقلب هاؤه إلى طرفه. */
const iso = (t: string) => `⁦${t}⁩`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

interface Year {
  year: string
  kind: string
  tone: 'paper' | 'live'
  icon: string
  lines: string[]
  href: string
  cta: string
}

const YEARS: Year[] = [
  {
    year: '1446هـ', kind: 'ورقي', tone: 'paper', icon: '📄',
    lines: [
      'استبانةٌ تُطبع وتُوزَّع وتُجمع يدًا بيد',
      'إدخالٌ وحسابٌ باليد بعد الجمع',
      'رأيُ وليّ الأمر يصل متأخّرًا',
    ],
    href: ARCHIVE.y1446, cta: 'اضغط لفتح ملف العام',
  },
  {
    year: '1447هـ', kind: 'ورقي', tone: 'paper', icon: '📄',
    lines: [
      'المجهود نفسه يتكرّر من أوّله',
      'الوقت يطول بين الجمع والنتيجة',
      'الأثر لا يُقاس إلا بعد انقضاء وقته',
    ],
    href: ARCHIVE.y1447, cta: 'اضغط لفتح ملف العام',
  },
  {
    year: '1448هـ', kind: 'إلكتروني', tone: 'live', icon: '💻',
    lines: [
      'رابطٌ يبلغ كلَّ أسرةٍ في ثانية',
      'النتائج تُحسب لحظة وصول الرأي',
      'كلُّ ملاحظةٍ تصير إجراءً له شاهد',
    ],
    href: PLATFORM, cta: 'اضغط لفتح المنصّة',
  },
]

const GAINS: [string, string, string][] = [
  ['⚡', 'سرعةُ الوصول',
    'الرابط يبلغ كلَّ وليّ أمرٍ في ثوانٍ، بلا ورقٍ يُوزَّع ويُجمع ويُفقد بعضُه.'],
  ['🎯', 'دقّةٌ بلا إدخالٍ يدوي',
    'تُحسب النتيجة لحظة وصول الرأي، فلا خطأ نسخٍ ولا جمعٍ ولا تأخير.'],
  ['⏱️', 'سرعةُ قياس الأثر',
    'كان الأثر يُعرف بعد انقضاء وقته، وصار يُقرأ في يومه فيُعالَج في حينه.'],
  ['🗣️', 'استطلاعُ آراء المستفيدين في وقته',
    'رأيُ وليّ الأمر يصل وهو حيٌّ، فيُبنى عليه قرارٌ ينفع صاحبَه لا من بعده.'],
  ['✅', 'من الرأي إلى الإجراء',
    'كلُّ ملاحظةٍ تُربط بإجراءٍ له مسؤولةٌ وتاريخٌ وشاهدُ تنفيذٍ يُفتح بمسح الرمز.'],
  ['♻️', 'استدامةٌ للأعوام القادمة',
    'تُعاد الدورة على المنصّة نفسها، فتُقارَن الأعوام ويُقاس التحسّن لا يُدَّعى.'],
]

/** التواقيع بترتيب المدرسة: يمينًا ثم وسطًا ثم يسارًا. */
const SIGNERS: [string, string][] = [
  ['وكيلة الشؤون التعليمية', 'عهود باهويني'],
  ['وكيلة شؤون الطالبات', 'ناهد الحربي'],
  ['مديرة المدرسة', 'جازية السميري'],
]

const qr = await QRCode.toDataURL(PLATFORM, {
  errorCorrectionLevel: 'M', margin: 1, width: 460,
  color: { dark: '#15445a', light: '#ffffff' },
})

const card = (y: Year) => `
<a class="yr yr--${y.tone}" href="${y.href}">
  <div class="yr__top">
    <span class="yr__icon">${y.icon}</span>
    <b class="yr__year">${iso(y.year)}</b>
    <span class="yr__kind">${esc(y.kind)}</span>
  </div>
  <ul>${y.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
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
.sheet { height:297mm; padding:12mm 14mm 9mm; display:flex; flex-direction:column; }

.head { text-align:center; border-bottom:2px solid var(--navy); padding-bottom:10px; }
.head img { height:48px; }
.head .org { font-size:11px; color:var(--muted); margin-top:9px; }
.head .school { font-size:14px; font-weight:800; margin-top:3px; }
h1 { font-size:30px; font-weight:800; margin-top:12px; line-height:1.3; text-align:center; }
h1 small { display:block; font-size:15px; font-weight:700; color:var(--green); margin-top:6px; }
.lede { text-align:center; font-size:12.2px; line-height:1.85; color:var(--muted);
        margin:10px 8mm 0; }

.years { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
.yr { display:flex; flex-direction:column; text-decoration:none; color:inherit;
      border:1.6px solid var(--border); border-radius:16px; padding:11px 12px 10px; }
.yr--paper { background:var(--soft); }
.yr--live { border-color:var(--green); border-width:2.2px;
            background:linear-gradient(170deg,#f1fbf6,#f6fbfb); }
.yr__top { text-align:center; border-bottom:1px dotted var(--border); padding-bottom:9px; }
.yr__icon { font-size:20px; }
.yr__year { display:block; font-size:23px; font-weight:800; margin-top:3px; direction:ltr; }
.yr__kind { display:inline-block; margin-top:6px; padding:3px 13px; border-radius:999px;
            font-size:11px; font-weight:700; color:#fff; background:var(--muted); }
.yr--live .yr__kind { background:var(--green); }
.yr ul { list-style:none; margin:10px 0 0; flex:1; }
.yr li { font-size:11px; line-height:1.7; color:#33606f; margin-bottom:7px;
         padding-right:13px; position:relative; }
.yr li::before { content:'•'; position:absolute; right:0; color:var(--sand); font-weight:800; }
.yr--live li::before { color:var(--green); }
.yr__cta { display:block; text-align:center; margin-top:10px; padding:7px 0; border-radius:10px;
           font-size:11.5px; font-weight:800; color:#fff; background:var(--navy); }
.yr--live .yr__cta { background:linear-gradient(90deg,var(--green),var(--teal)); }

h2 { font-size:16px; font-weight:800; margin:13px 0 8px; padding-right:10px;
     border-right:4px solid var(--green); }
.gains { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
.gain { display:grid; grid-template-columns:22px 1fr; gap:8px;
        border:1.3px solid var(--border); border-radius:12px; padding:8px 11px; }
.gain .ico { font-size:15px; text-align:center; }
.gain b { display:block; font-size:12.5px; margin-bottom:2px; }
.gain span { font-size:10.4px; line-height:1.7; color:var(--muted); }

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
         margin-top:auto; padding-top:13px; }
.signs .role { font-size:10.5px; color:var(--muted); }
.signs .who { font-size:14px; font-weight:800; margin-top:4px;
              border-bottom:1.2px dotted var(--muted); padding-bottom:9px; }
.by { text-align:center; font-size:11px; color:var(--muted); margin-top:9px; }
.by b { color:var(--navy); font-size:13px; }
</style></head><body>
<div class="sheet">

  <header class="head">
    <img src="${asset('public/brand/moe-logo.png', 'image/png')}" alt="وزارة التعليم">
    <div class="org">الإدارة العامة للتعليم بمحافظة جدة</div>
    <div class="school">الابتدائية الخامسة والستون بعد المائة</div>
  </header>

  <h1>من الورق إلى المنصّة
    <small>تطوُّر قياس اتجاه المتعلمين — ${iso('1446')} · ${iso('1447')} · ${iso('1448هـ')}</small>
  </h1>

  <p class="lede">عامان أُجري فيهما القياس على الورق، وعامٌ أُجري على منصّةٍ إلكترونية.
  وهذه الورقة تُظهر الفرق، ومعها روابطُ الأعوام الثلاثة تُفتح بالضغط أو بمسح الرمز.</p>

  <div class="years">${YEARS.map(card).join('')}</div>

  <h2>ماذا حلَّ لنا هذا التحوّل</h2>
  <div class="gains">${GAINS.map(([i, t, b]) => `
    <div class="gain"><span class="ico">${i}</span>
      <span><b>${esc(t)}</b><span>${esc(b)}</span></span></div>`).join('')}
  </div>

  <a class="qrbox" href="${PLATFORM}">
    <img src="${qr}" alt="باركود منصّة القياس">
    <div>
      <h3>منصّة قياس اتجاه المتعلمين ${iso('1448هـ')}</h3>
      <p>امسحوا الرمز بكاميرا الجوّال، أو اضغطوا هذه البطاقة داخل الملف —
      تُفتح المنصّة بنتائجها وبنود تحسينها وشواهد تنفيذها.</p>
      <span class="url">${host}</span>
    </div>
  </a>

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
