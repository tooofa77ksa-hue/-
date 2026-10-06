/**
 * «التقويم الذاتي — من الورق إلى المنصّة» — ورقةٌ تُسلَّم للجنة.
 *
 * ورقةٌ واحدة عمودية تُطبع وتُوزَّع: بطاقتان لعامين، ورمزٌ واحد
 * يفتح الموقع نفسه حيًّا. فالمنصّة واحدة تحمل العامين كليهما، ولا
 * معنى لرمزين يفتحان البابَ ذاته.
 *
 * ولا تُسمَّى المجالات الأربعة بأسمائها هنا: أسماؤها في الموقع لا
 * عندي، وكتابةُ اسمٍ رسميّ على الظنّ في ورقةٍ تُرفع للتوجيه خطأٌ لا
 * يُحتمل. فتُعرض مرقَّمةً حتى تُثبتها المدرسة.
 *
 *   npx vite-node scripts/reports/self-eval.ts
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

const SITE = option('site')
  ?? 'https://readdy.ai/project/ccfdd1a6-911c-47e7-84c5-b2436ac6f7ed'
const out = resolve(ROOT, option('out') ?? '.report-out/التقويم-الذاتي-من-الورق-إلى-المنصة.pdf')

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')

const iso = (t: string) => `⁦${t}⁩`
const hijri = (y: string) => `${iso(y)}\u00A0هـ`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

interface Year { year: string; kind: string; tone: 'first' | 'live'; icon: string; lines: string[] }

/** العامان كلاهما إلكترونيّ: الورق كان قبلهما، والتحوّل بدأ في 1447. */
const YEARS: Year[] = [
  {
    year: '1447', kind: 'عامُ التحوّل', tone: 'first', icon: '🚀',
    lines: [
      'أوّلُ عامٍ يُنجَز فيه التقويم الذاتي إلكترونيًّا',
      'فانتهى معه طبعُ الاستمارات وملؤها بخطّ اليد',
      'والشواهد تُرفع في موضعها من المعيار نفسه',
    ],
  },
  {
    year: '1448', kind: 'على المنصّة نفسها', tone: 'live', icon: '💻',
    lines: [
      'يُبنى على المنصّة نفسها لا على ملفٍّ يُستأنف من الصفر',
      'فيُقارَن العامان في موضعٍ واحد ويُقرأ التحسّن',
      'والبند يُضاف ويُعدَّل ويُحذف ويُؤرشف بضغطة',
    ],
  },
]

/** ما تُتيحه المنصّة — الأفعال التي كان الورق يعجز عنها. */
const GAINS: [string, string, string][] = [
  ['➕', 'الإضافة',
    'يُضاف المعيار أو البند أو الصفّ في موضعه بضغطة، بلا إعادة بناء الجدول ولا طبعه.'],
  ['✏️', 'التعديل',
    'يُصحَّح النصّ في مكانه فيحلّ الصواب محلّ الخطأ، بلا شطبٍ ولا حاشيةٍ على الهامش.'],
  ['🗑️', 'الحذف',
    'يُرفع ما لم يعد لازمًا فتُغلق فجوتُه وحدها، فلا سطرٌ فارغ ولا ترقيمٌ مكسور.'],
  ['🧱', 'الإنشاء',
    'تُنشأ الصفوف والجداول الجديدة بيسر، وتأخذ ترقيمها وتنسيقها تلقائيًّا.'],
  ['🗄️', 'الأرشفة',
    'يُؤرشف ما انتهى عمله فيبقى شاهدًا يُرجع إليه، ولا يزدحم به العمل الجاري.'],
  ['📎', 'الشواهد',
    'يُرفع الشاهد في موضعه من المعيار نفسه، فلا يُبحث عنه في ملفٍّ ولا يُنسى.'],
]

const SIGNERS: [string, string][] = [
  ['وكيلة الشؤون التعليمية', 'عهود باهويني'],
  ['وكيلة شؤون الطالبات', 'ناهد الحربي'],
  ['مديرة المدرسة', 'جازية السميري'],
]

/** رمزٌ داكن لا ملوَّن: الماسح يقرأ فرق الإضاءة، والداكن يصمد عند الطباعة. */
const qr = await QRCode.toDataURL(SITE, {
  errorCorrectionLevel: 'M', margin: 2, width: 560,
  color: { dark: '#15445a', light: '#ffffff' },
})

const card = (y: Year) => `
<div class="yr yr--${y.tone}">
  <div class="yr__top">
    <span class="yr__icon">${y.icon}</span>
    <b class="yr__year">${hijri(y.year)}</b>
    <span class="yr__kind">${esc(y.kind)}</span>
  </div>
  <ul>${y.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
</div>`

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --green:#07a869; --teal:#0da9a6; --navy:#15445a; --sand:#c1b489;
        --muted:#4a6b78; --border:#d6e4e5; --soft:#f4f8f8; }
@page { size:A4 portrait; margin:0; }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Baloo',sans-serif; color:var(--navy); }
.sheet { height:297mm; padding:7mm 12mm 6mm; display:flex; flex-direction:column; }

.head { text-align:center; border-bottom:2px solid var(--navy); padding-bottom:7px; }
.head img { height:38px; }
.head .org { font-size:10.5px; color:var(--muted); margin-top:6px; }
.head .school { font-size:13.5px; font-weight:800; margin-top:3px; }
h1 { font-size:22.5px; font-weight:800; margin-top:7px; line-height:1.3; text-align:center; }
h1 small { display:block; font-size:13px; font-weight:700; color:var(--green); margin-top:4px; }
.lede { text-align:center; font-size:10.8px; line-height:1.72; color:var(--muted); margin:6px 4mm 0; }

.years { display:grid; grid-template-columns:repeat(2,1fr); gap:9px; margin-top:8px; }
.yr { display:flex; flex-direction:column; border:1.6px solid var(--border);
      border-radius:15px; padding:8px 11px 7px; }
.yr--first { border-color:var(--teal); border-width:2px;
             background:linear-gradient(170deg,#f0fafa,#f6fbfb); }
.yr--live { border-color:var(--green); border-width:2.2px;
            background:linear-gradient(170deg,#f1fbf6,#f6fbfb); }
.yr__top { text-align:center; border-bottom:1px dotted var(--border); padding-bottom:8px; }
.yr__icon { font-size:19px; }
.yr__year { display:block; font-size:20px; font-weight:800; margin-top:2px; }
.yr__kind { display:inline-block; margin-top:5px; padding:3px 13px; border-radius:999px;
            font-size:11px; font-weight:700; color:#fff; background:var(--muted); }
.yr--live .yr__kind { background:var(--green); }
.yr ul { list-style:none; margin:9px 0 0; flex:1; }
.yr li { font-size:10.2px; line-height:1.58; color:#33606f; margin-bottom:5px;
         padding-right:13px; position:relative; }
.yr li::before { content:'•'; position:absolute; right:0; color:var(--sand); font-weight:800; }
.yr--live li::before { color:var(--green); }
.yr--first li::before { color:var(--teal); }
.yr--first .yr__kind { background:var(--teal); }

h2 { font-size:13.5px; font-weight:800; margin:8px 0 6px; padding-right:10px;
     border-right:4px solid var(--green); }
.gains { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.gain { display:grid; grid-template-columns:18px 1fr; gap:5px;
        border:1.3px solid var(--border); border-radius:10px; padding:6px 9px; }
.gain .ico { font-size:15px; text-align:center; }
.gain b { display:block; font-size:12px; margin-bottom:2px; }
.gain span { font-size:9.6px; line-height:1.6; color:var(--muted); }

.fields { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.fld { border:1.4px solid var(--border); border-radius:11px; padding:7px 7px; text-align:center;
       background:var(--soft); }
.fld b { display:block; font-size:12px; font-weight:800; }
.fld span { display:block; font-size:9.8px; line-height:1.6; color:var(--muted); margin-top:3px; }
.fields__note { font-size:9.9px; line-height:1.65; color:var(--muted); margin-top:6px;
                text-align:center; }

.qrbox { display:grid; grid-template-columns:auto 1fr; gap:13px; align-items:center;
         border:2px solid var(--green); border-radius:15px; padding:10px 13px; margin-top:9px;
         background:linear-gradient(170deg,#f2fbf7,#f6fbfb); color:inherit; text-decoration:none; }
.qrbox img { width:29mm; height:29mm; background:#fff; border-radius:9px; padding:4px;
             border:1px solid var(--border); }
.qrbox h3 { font-size:16px; font-weight:800; margin-bottom:4px; }
.qrbox p { font-size:10.4px; line-height:1.7; color:#34606f; }
.qrbox .url { display:inline-block; margin-top:7px; direction:ltr; font-size:10.5px;
              font-weight:800; color:#fff; background:var(--navy); border-radius:999px;
              padding:4px 14px; }

.init { border:1.6px solid var(--green); border-radius:15px; padding:10px 14px; margin-top:9px;
        background:linear-gradient(170deg,#f2fbf7,#f6fbfb); }
.init h3 { font-size:15px; font-weight:800; margin-bottom:5px; }
.init h3 span { margin-left:6px; }
.init p { font-size:10.2px; line-height:1.7; color:#2d5c54; }

.signs { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; text-align:center;
         margin-top:auto; padding-top:10px; }
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

  <h1>التقويم الذاتي — من الورق إلى المنصّة
    <small>شاهدٌ من شواهد المدرسة — ${iso('1447')} · ${hijri('1448')}</small>
  </h1>

  <p class="lede">كان التقويم الذاتي يُنجَز ورقًا يُطبع ويُملأ باليد ويُعاد طبعُه كلّما
  تغيّر سطر. فمنذ عام ${hijri('1447')} صار يُنجَز على منصّةٍ إلكترونية تُفتح في
  المتصفّح من أيّ جهاز — وعليها العامان ${iso('1447')} و${hijri('1448')} بمجالاتهما
  ومعاييرهما وشواهدهما.</p>

  <div class="years">${YEARS.map(card).join('')}</div>

  <h2>ما الذي صار ميسورًا</h2>
  <div class="gains">${GAINS.map(([i, t, b]) => `
    <div class="gain"><span class="ico">${i}</span>
      <span><b>${esc(t)}</b><span>${esc(b)}</span></span></div>`).join('')}
  </div>

  <h2>المجالات الأربعة</h2>
  <div class="fields">${['الأول', 'الثاني', 'الثالث', 'الرابع'].map((n) => `
    <div class="fld"><b>المجال ${esc(n)}</b><span>معاييرُه وشواهدُه</span></div>`).join('')}
  </div>
  <p class="fields__note">لكلّ مجالٍ معاييرُه، ولكلّ معيارٍ شواهدُه ودرجةُ تحقّقه —
  تُضاف وتُعدَّل وتُؤرشف في موضعها، ويُرجع إليها في أيّ وقت.</p>

  <a class="qrbox" href="${SITE}">
    <img src="${qr}" alt="باركود منصّة التقويم الذاتي">
    <div>
      <h3>منصّة التقويم الذاتي</h3>
      <p>امسحوا الرمز بكاميرا الجوّال إن كانت الورقة مطبوعة، أو اضغطوا البطاقة
      إن قرأتموها على الشاشة — فتُفتح المنصّة نفسها حيّةً بعامَيها.</p>
      <span class="url">${esc(SITE)}</span>
    </div>
  </a>

  <section class="init">
    <h3><span>✨</span>مبادرةٌ لرفع جودة العمل في المدرسة</h3>
    <p>أُنشئت هذه المنصّة بمبادرةٍ من المساعد الإداري بالمدرسة، بالاستعانة بالذكاء
    الاصطناعي ضمن الاستخدام الآمن والمسؤول الذي تدعو إليه وزارة التعليم — لا استغناءً
    عن الجهد البشري، بل تفريغًا له لما هو أولى به: قراءةُ الواقع وتحسينُه، بدل
    الوقت الذي كان يُنفق في الترتيب وإعادة الطباعة.</p>
  </section>

  <div class="signs">${SIGNERS.map(([role, who]) => `
    <div><div class="role">${esc(role)}</div><div class="who">${esc(who)}</div></div>`).join('')}
  </div>

  <p class="by">إعداد — المساعد الإداري: <b>عواطف الجهني</b></p>
</div>
</body></html>`

mkdirSync(dirname(out), { recursive: true })
const executablePath = process.env.CHROMIUM_PATH
  ?? globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome').sort().at(-1)
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle' })
await page.pdf({ path: out, format: 'A4', printBackground: true })
await browser.close()

console.log(`✓ ${out}`)
