/**
 * «آراء وانطباعات أولياء الأمور» — كرّاسةٌ تُرفع للإدارة.
 *
 * تُبنى من ملفّ بيانات يُملأ من صفحة إقرارات الاطّلاع، لا من تخمين:
 * ورقةٌ تحمل أسماء أسرٍ وكلماتها لا يصحّ أن يُكتب فيها حرفٌ لم يقله
 * صاحبُه.
 *
 *   npx vite-node scripts/reports/acks-book.ts -- --from .report-out/acks-input.json
 *
 * وشكلُ الملفّ:
 *   [{ "name": "أسرة الطالبة ...", "grade": "الرابع الابتدائي",
 *      "class": "فصل 2", "word": "...", "date": "1448/04/24" }]
 */
import { readFileSync, writeFileSync, existsSync, globSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '../..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const from = resolve(ROOT, option('from') ?? '.report-out/acks-input.json')
const out = resolve(ROOT, option('out') ?? '.report-out/آراء-وانطباعات-أولياء-الأمور.pdf')

interface Voice { name?: string; grade?: string; class?: string; word: string; date?: string }

if (!existsSync(from)) {
  // قالبٌ فارغ يُملأ، خيرٌ من رسالة خطأ تترك صاحبها لا يدري ما يصنع
  mkdirSync(dirname(from), { recursive: true })
  writeFileSync(from, JSON.stringify([
    { name: 'أسرة الطالبة …', grade: 'الرابع الابتدائي', class: 'فصل 1',
      word: 'نصُّ الكلمة كما كتبها وليّ الأمر', date: '1448/04/24' },
  ], null, 2), 'utf8')
  console.error(`أُنشئ قالبٌ فارغ: ${from}\nاملئيه ثم أعيدي التشغيل.`)
  process.exit(1)
}

const voices: Voice[] = JSON.parse(readFileSync(from, 'utf8'))
if (voices.length === 0) {
  console.error('الملفّ فارغ: لا كلمةَ تُطبع.')
  process.exit(1)
}

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const iso = (t: string) => `⁦${t}⁩`

/** قلوبٌ متناوبة: الصفحة تُقرأ أدفأ حين لا تتكرّر علامةٌ واحدة. */
const HEARTS = ['💙', '🤍', '💚', '🩵', '🌸', '✨']

const SIGNERS: [string, string][] = [
  ['وكيلة الشؤون التعليمية', 'عهود باهويني'],
  ['وكيلة شؤون الطالبات', 'ناهد الحربي'],
  ['مديرة المدرسة', 'جازية السميري'],
]

const rows = voices.map((v, i) => {
  const who = v.name?.trim() || 'أسرةٌ كريمة'
  const where = [v.grade, v.class].filter(Boolean).join(' / ') || '—'
  return `<tr>
    <td class="n">${iso(String(i + 1))}</td>
    <td class="who"><span class="h">${HEARTS[i % HEARTS.length]}</span>${esc(who)}</td>
    <td class="cls">${esc(where)}</td>
    <td class="word">${esc(v.word.trim())}</td>
    <td class="when">${v.date ? iso(esc(v.date)) : '—'}</td>
  </tr>`
}).join('')

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --green:#07a869; --teal:#0da9a6; --navy:#15445a; --muted:#4a6b78;
        --border:#d6e4e5; --soft:#f4f8f8; --rose:#e4567a; }
@page { size:A4 portrait; margin:12mm 11mm; }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Baloo',sans-serif; color:var(--navy); }

.head { text-align:center; border-bottom:2px solid var(--navy); padding-bottom:9px; }
.head img { height:42px; }
.head .org { font-size:10.5px; color:var(--muted); margin-top:7px; }
.head .school { font-size:13px; font-weight:800; margin-top:3px; }
h1 { font-size:24px; font-weight:800; margin-top:10px; text-align:center; line-height:1.35; }
h1 small { display:block; font-size:13px; font-weight:700; color:var(--green); margin-top:5px; }

.thanks { border:1.8px solid #f0c3cf; border-radius:16px; padding:12px 16px; margin-top:11px;
          background:linear-gradient(170deg,#fdf5f7,#f8fbfb); text-align:center; }
.thanks b { display:block; font-size:15px; font-weight:800; margin-bottom:5px; }
.thanks p { font-size:11.4px; line-height:1.95; color:#5a4149; }

table { width:100%; border-collapse:collapse; margin-top:12px; }
thead th { background:var(--navy); color:#fff; font-size:11.5px; font-weight:800;
           padding:8px 9px; text-align:right; }
thead th:first-child { border-radius:0 10px 0 0; }
thead th:last-child { border-radius:10px 0 0 0; }
tbody tr { break-inside:avoid; }
tbody tr:nth-child(even) { background:var(--soft); }
td { border-bottom:1px solid var(--border); padding:8px 9px; font-size:10.6px;
     line-height:1.75; vertical-align:top; }
td.n { width:9mm; text-align:center; color:var(--muted); font-weight:800; }
td.who { width:48mm; font-weight:800; }
td.who .h { margin-left:5px; }
td.cls { width:32mm; color:var(--muted); font-size:10px; }
td.word { color:#2d5c54; }
td.when { width:20mm; color:var(--muted); font-size:9.6px; text-align:center; }

.close { border:2px solid var(--green); border-radius:18px; padding:15px 18px; margin-top:16px;
         background:linear-gradient(170deg,#f1fbf6,#fdf5f7); text-align:center;
         break-inside:avoid; }
.close .big { font-size:21px; font-weight:800; }
.close p { font-size:11.6px; line-height:1.9; color:#2d5c54; margin-top:6px; }

.signs { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; text-align:center;
         margin-top:20px; break-inside:avoid; }
.signs .role { font-size:10.5px; color:var(--muted); }
.signs .who { font-size:13.5px; font-weight:800; margin-top:4px;
              border-bottom:1.2px dotted var(--muted); padding-bottom:7px; }
.by { text-align:center; font-size:10.5px; color:var(--muted); margin-top:8px; }
.by b { color:var(--navy); font-size:13px; }
</style></head><body>

<header class="head">
  <img src="${asset('public/brand/moe-logo.png', 'image/png')}" alt="وزارة التعليم">
  <div class="school">الابتدائية الخامسة والستون بعد المائة</div>
</header>

<h1>كلماتٌ من أولياء الأمور إلى منسوبات مدرستنا
  <small>قياس اتجاه المتعلمين ${iso('1448')}&nbsp;هـ</small>
</h1>

<section class="thanks">
  <b>💐 إلى كلِّ واحدةٍ منكنّ 💐</b>
  <p>إلى إدارة المدرسة، وإلى كلِّ معلّمةٍ وإداريةٍ وعاملةٍ في هذا البيت:
  <br>هذا ما قاله عنكنّ أولياء الأمور بأيديهم، نقلناه كما وردَ لم نغيّر فيه حرفًا.
  <br>وما بلغَنا منهم لم يكن لواحدةٍ دون أخرى — كان لكنَّ جميعًا. 💙🤍</p>
</section>

<table>
  <thead><tr>
    <th>م</th><th>الأسرة</th><th>الصف / الفصل</th><th>الكلمة</th><th>التاريخ</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>

<section class="close">
  <div class="big">🌸 خميسكم ونيس 🌸</div>
  <p>هذا الثناءُ ثمرةُ جهدٍ لم يَرَه أحدٌ إلا الله ثم أنتنّ — وقد رآه الأهالي فشكروه.
  <br>شكرًا لكلِّ واحدةٍ منكنّ، بلا استثناءٍ ولا تفضيل، فما قامت المدرسة إلا بكنّ جميعًا.
  <br>بارك الله في جهودكنّ، وجعلها في موازين حسناتكنّ. 💐🤍💙</p>
</section>

<div class="signs">${SIGNERS.map(([role, who]) => `
  <div><div class="role">${esc(role)}</div><div class="who">${esc(who)}</div></div>`).join('')}
</div>

<p class="by">إعداد — المساعد الإداري: <b>عواطف الجهني</b></p>
</body></html>`

mkdirSync(dirname(out), { recursive: true })
const executablePath = process.env.CHROMIUM_PATH
  ?? globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome').sort().at(-1)
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle' })
await page.pdf({ path: out, format: 'A4', printBackground: true })
await browser.close()

console.log(`✓ ${out}  —  ${voices.length} كلمة`)
