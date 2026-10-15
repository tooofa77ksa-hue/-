/**
 * «ماذا قال أولياء الأمور عنكنّ» — ورقةٌ تُرسل لمجموعة المنسوبات.
 *
 * بلا اسمِ معلّمةٍ واحدة. فالأهالي سمَّوا بعضهنّ ولم يُسمُّوا بعضًا،
 * ونشرُ الأسماء في مجموعةٍ يجعل من غابَ اسمُها تظنّ أنها لم تُشكر.
 * فما ورد فيه اسمٌ يُنقل هنا منزوعَ الاسم بنقاطٍ ظاهرة، ويُسلَّم
 * كاملًا لصاحبته على حدة.
 *
 *   npx vite-node scripts/reports/praise-board.ts
 */
import { globSync, readFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '../..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const out = resolve(ROOT, option('out') ?? '.report-out/ثناء-أولياء-الأمور-للمنسوبات.pdf')

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
/** أرقامٌ هنديةٌ كالتي في بقية الورقة، لا لاتينيةٌ تشذّ عنها. */
const ar = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])

interface Quote { icon: string; text: string; note?: string }
interface Part { icon: string; title: string; tone: 'a' | 'b' | 'c' | 'd'; quotes: Quote[] }

const PARTS: Part[] = [
  {
    icon: '🏫', title: 'عن المدرسة كلّها', tone: 'a',
    quotes: [
      { icon: '🌷', text: 'اشكر جميع منسوبي المدرسه من مديره واداريات ومعلمات على حرصهم واهتمامهم الدايم وحفظ الامانة التي بين ايديهن... درست لي بنتين وتخرجن، وكنت حريصه على ان تكمل في هذه المدرسه لمى عرفت عن منسوباتها بالاخلاق العاليه وايصال الماده التعليميه بكل حرص. فجزاكم الله خيراً، والى الامام، ونحن معكم يداً بيد لانجاح هذا الصرح التعليمي.' },
      { icon: '🤍', text: 'إلى إدارة مدرستنا الغالية ومعلمتنا الفاضلة، شكرًا من القلب لكل ما تقدمونه من عطاء واهتمام، ولكل أثر جميل تتركونه في نفوس بناتنا. وجودكم وحرصكم يصنعان فرقًا لا يُنسى، فلكم منا كل الحب والتقدير والامتنان.' },
      { icon: '💚', text: 'اقدم كل الشكر والتقدير للاداره والمعلمات الرائعين. نظام وحرص واهتمام بالطالبات. فخوره والله ان بناتي يدرسو في هذي المدرسه الجميله.' },
      { icon: '🩵', text: 'ثاني بنت لي فالمدرسة، وكل شخص يسألني عن المدرسة اثني عليها: ادارة ومعلمات متعاونات. اشكركم من قلبي على حرصكم واهتمامكم.' },
      { icon: '🌼', text: 'مدرسة رائعة بروعة طاقمها... الله يسعدكم سعادة الدنيا والاخرة.' },
      { icon: '✨', text: 'جميعكم صفوة مخلصة موفقة.' },
    ],
  },
  {
    icon: '📚', title: 'عن المعلّمات', tone: 'b',
    quotes: [
      { icon: '🌸', text: 'شكراً لأنكن لم تكنّ مجرد ملقنات للدروس، بل كنتنّ أمهات مربيات زرعتن الشغف وحب التعلم في قلب ابنتي. بارك الله في أيديكن وجهودكن.' },
      { icon: '💐', text: 'معلماتنا الفاضلات.. منارات العلم والتربية في الابتدائية ١٦٥. إلى كل معلمةٍ تعطي بلا حدود، وتزرع في قلب ابنتي أثرًا لا يمحوه الزمن. تعجز الكلمات عن شكركنّ جميعاً على عطائكنّ المستمر وصبركنّ الدائم. أنتنّ الشموع التي تضيء طريق المستقبل لابنتي، وحين يصلكنّ ثناؤنا فاعلمنَ أن تعبكنّ مقدّر ومحفوظ في قلوبنا قبل كلماتنا.' },
      { icon: '💗', text: 'شكرًا لأنكِ معلمة تُعلّم بحب، وتترك أثرًا يفوق حدود الكلمات. قد تمرّ الأيام وتُنسى بعض الكلمات، لكن المواقف الجميلة تبقى محفورة في الذاكرة.' },
      { icon: '🌻', text: 'شكراً لكل من تعبت لأجل أن تصل المعلومة لابنتي.' },
      { icon: '🕊️', text: 'أنتِ شمعة تضيء لنا طريق المستقبل، وأنتِ من تصنعين الأجيال وتغرسين فينا الأمل والطموح. شكرًا يا معلمتي، فأنتِ فخرٌ لنا، وأثركِ الجميل سيبقى في قلوبنا دائمًا.', note: 'كتبتها طالبة في الثاني الابتدائي بيدها' },
    ],
  },
  {
    icon: '🗂️', title: 'عن الإداريات والإشراف', tone: 'c',
    quotes: [
      { icon: '🌷', text: 'شكراً لكنَّ أيتها الإداريات الرائعات على جهودكن الدؤوبة وروحكن الإيجابية التي تضفي الراحة والطمأنينة على قلوب الأمهات والطالبات. أنتنّ شريك أساسي في كل نجاح تحققه ابنتي.' },
      { icon: '🌸', text: 'بصراحه كل مااشوفهنّ البسمه ماتفارقهنّ. روحهنّ الحلوة. الله يسعدهنّ وين مايكنّ. كل الشكر والتقدير على احتوائهنّ وحرصهنّ على الطالبات.' },
      { icon: '💙', text: 'كل الشكر والتقدير لجهودٍ كبيرة في إدارة المدرسة بحكمة واقتدار. وحرصٌ مستمر على توفير بيئة تعليمية محفزة وآمنة ينعكس بوضوح على سعادة ابنتي وتطورها المستمر.' },
    ],
  },
  {
    icon: '💌', title: 'كلمات قصيرة وصلت كما هي', tone: 'd',
    quotes: [
      { icon: '🌹', text: 'أحب اشكر كل المعلمات والاداريات. بارك الله فيكم وجزاكم الله خيرا.' },
      { icon: '💙', text: 'المدرسه رائعه، والمعلمات متعاونات، والاداره لامثيل لها. شكرا لكم.' },
      { icon: '🌷', text: 'مدرسه جميله بقياده اعظم واجمل مديره.' },
      { icon: '🤍', text: 'اشكر مديرة المدرسه والمعلمات الفضلات على كل شيء جميل قدمتموه لي بناتنا. شكرا لكم من كل قلبي.' },
      { icon: '🌼', text: 'لكم جزيل الشكر والتقدير والاحترام على كل شيء جميل قدمتموه.' },
      { icon: '✨', text: 'الله يسعدكم سعادة الدنيا والاخرة، شكرا على إخلاصكم.' },
      { icon: '💐', text: 'أتقدم إليكم بخالص الشكر والتقدير على كل ما قدمتموه.' },
    ],
  },
]

const total = PARTS.reduce((n, p) => n + p.quotes.length, 0)

const quote = (q: Quote) => `
<li>
  <span class="q__i">${q.icon}</span>
  <span class="q__t">«${esc(q.text)}»${q.note ? `<em>— ${esc(q.note)}</em>` : ''}</span>
</li>`

const part = (p: Part) => `
<article class="c c--${p.tone}">
  <div class="c__top">
    <span class="c__h">${p.icon}</span>
    <div class="c__id"><b>${esc(p.title)}</b></div>
    <span class="c__n">${ar(p.quotes.length)}</span>
  </div>
  <ul>${p.quotes.map(quote).join('')}</ul>
</article>`

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --green:#07a869; --teal:#0da9a6; --navy:#15445a; --rose:#d4718a;
        --violet:#8a6fb0; --muted:#4a6b78; --border:#d6e4e5; --soft:#f4f8f8; }
@page { size:A4 portrait; margin:0; }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Baloo',sans-serif; color:var(--navy); }
.sheet { padding:9mm 11mm 8mm; }

.head { text-align:center; border-bottom:2px solid var(--navy); padding-bottom:7px; }
.head img { height:34px; }
.head .school { font-size:12.5px; font-weight:800; margin-top:5px; }

h1 { text-align:center; font-size:21px; font-weight:800; margin-top:9px; line-height:1.35; }
h1 small { display:block; font-size:11.5px; font-weight:700; color:var(--rose); margin-top:4px; }

.grid { margin-top:9px; column-count:2; column-gap:9px; }
.c { break-inside:avoid; margin-bottom:9px; border:1.6px solid var(--border);
     border-radius:14px; padding:8px 11px 9px; background:#fff; }
.c--a { border-color:#bfe7d6; }
.c--b { border-color:#bfe5e7; }
.c--c { border-color:#dcd1ea; }
.c--d { border-color:#f0d3dc; }
.c__top { display:flex; align-items:center; gap:8px; padding-bottom:6px;
          border-bottom:1.3px dotted var(--border); }
.c__h { font-size:16px; }
.c__id b { display:block; font-size:13.5px; font-weight:800; line-height:1.3; }
.c__n { margin-right:auto; font-size:9.6px; font-weight:800; color:#fff;
        background:var(--teal); border-radius:999px; padding:2px 9px; }
.c--a .c__n { background:var(--green); }
.c--c .c__n { background:var(--violet); }
.c--d .c__n { background:var(--rose); }
.c ul { list-style:none; margin-top:7px; display:grid; gap:6px; }
.c li { display:grid; grid-template-columns:15px 1fr; gap:7px; align-items:start;
        background:var(--soft); border-right:3px solid var(--teal);
        border-radius:0 9px 9px 0; padding:6px 9px; }
.c--a li { border-right-color:var(--green); }
.c--c li { border-right-color:var(--violet); }
.c--d li { border-right-color:var(--rose); }
.q__i { font-size:10.5px; line-height:1.8; text-align:center; }
.q__t { font-size:9.9px; line-height:1.8; }
.q__t em { display:block; font-style:normal; font-size:8.8px; color:var(--muted); margin-top:3px; }

.hearts { text-align:center; font-size:15px; margin-top:10px; letter-spacing:3px; }
.khamis { margin-top:8px; text-align:center; font-size:19px; font-weight:800; color:var(--green); }
</style></head><body>

<div class="sheet">
  <header class="head">
    <img src="${asset('public/brand/moe-logo.png', 'image/png')}" alt="وزارة التعليم">
    <div class="school">الابتدائية الخامسة والستون بعد المائة</div>
  </header>

  <h1>🌸 ماذا قال أولياء الأمور عنكنّ 🌸
    <small>من استطلاع «قياس اتجاه المتعلمين» — ${ar(total)} كلمة</small>
  </h1>

  <div class="grid">${PARTS.map(part).join('')}</div>

  <div class="hearts">💙 🤍 💚 🩵 💗 🌸 💛 💜 🧡 ❤️</div>
  <div class="khamis">🌸 خميسكم ونيس 🌸</div>
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
