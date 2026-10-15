/**
 * «من ذُكرت باسمها» — بطاقاتٌ صغيرةٌ بالقلوب.
 *
 * ورقةٌ للإدارة وحدها، تُسلَّم كلُّ بطاقةٍ لصاحبتها على حدة: الأهالي
 * سمَّوا بعضَ المنسوبات ولم يُسمُّوا بعضًا، ونشرُ الأسماء في مجموعةٍ
 * يجعل من غابَ اسمُها تظنّ أنها لم تُشكر. فالجماعيُّ بلا أسماء في
 * ورقته، وهذه بطاقاتٌ فرديّة.
 *
 * وتُبنى من ملفّ بياناتٍ لا من نصٍّ مكتوبٍ هنا: هذا الملفّ يُرفع إلى
 * مستودعٍ عامّ، وأسماءُ المنسوبات وكلماتُ الأهالي لا تُرفع.
 *
 *   npx vite-node scripts/reports/named-thanks.ts -- --from .report-out/named-thanks.json
 *
 * وشكلُ الملفّ:
 *   [{ "role": "معلّمة", "name": "…", "crown": "وسامٌ اختياري",
 *      "quotes": [{ "text": "…", "where": "الرابع الابتدائي / 1", "when": "15 أكتوبر" }] }]
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

const from = resolve(ROOT, option('from') ?? '.report-out/named-thanks.json')
const out = resolve(ROOT, option('out') ?? '.report-out/من-ذُكرت-باسمها.pdf')

interface Quote { text: string; where?: string; when?: string }
interface Card { role?: string; name: string; crown?: string; quotes: Quote[] }

if (!existsSync(from)) {
  // قالبٌ فارغ يُملأ، خيرٌ من رسالة خطأ تترك صاحبها لا يدري ما يصنع
  mkdirSync(dirname(from), { recursive: true })
  writeFileSync(from, JSON.stringify([
    { role: 'معلّمة', name: 'الاسم', quotes: [
      { text: 'نصُّ ما قاله وليّ الأمر', where: 'الرابع الابتدائي / 1', when: '15 أكتوبر' },
    ] },
  ], null, 2), 'utf8')
  console.error(`أُنشئ قالبٌ فارغ: ${from}\nاملئيه ثم أعيدي التشغيل.`)
  process.exit(1)
}

const cards: Card[] = JSON.parse(readFileSync(from, 'utf8'))
if (cards.length === 0) {
  console.error('الملفّ فارغ: لا بطاقةَ تُطبع.')
  process.exit(1)
}

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const ar = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])

/** قلوبٌ متناوبة: الورقة تُقرأ أدفأ حين لا تتكرّر علامةٌ واحدة. */
const HEARTS = ['💙', '🤍', '💚', '🩵', '💗', '🌸', '💛', '🤎', '💜', '🧡', '❤️']

const total = cards.reduce((n, c) => n + c.quotes.length, 0)

const card = (c: Card, i: number) => `
<article class="c">
  <div class="c__top">
    <span class="c__h">${HEARTS[i % HEARTS.length]}</span>
    <div class="c__id">
      <b>${esc(c.name)}</b>
      ${c.role ? `<span>${esc(c.role)}</span>` : ''}
    </div>
    <span class="c__n">${ar(c.quotes.length)}</span>
  </div>
  ${c.crown ? `<div class="c__crown">👑 ${esc(c.crown)}</div>` : ''}
  <ul>${c.quotes.map((q) => `
    <li>
      <p>«${esc(q.text)}»</p>
      ${q.where || q.when ? `<em>${[q.where, q.when].filter(Boolean).map(esc).join(' · ')}</em>` : ''}
    </li>`).join('')}
  </ul>
</article>`

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --green:#07a869; --teal:#0da9a6; --navy:#15445a; --rose:#d4718a;
        --muted:#4a6b78; --border:#d6e4e5; --soft:#f4f8f8; }
@page { size:A4 portrait; margin:0; }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Baloo',sans-serif; color:var(--navy); }
.sheet { padding:9mm 11mm 8mm; }

.head { text-align:center; border-bottom:2px solid var(--navy); padding-bottom:7px; }
.head img { height:34px; }
.head .school { font-size:12.5px; font-weight:800; margin-top:5px; }

h1 { text-align:center; font-size:21px; font-weight:800; margin-top:9px; line-height:1.35; }
h1 small { display:block; font-size:11.5px; font-weight:700; color:var(--rose); margin-top:4px; }

.only { margin-top:8px; border:1.8px solid var(--rose); border-radius:13px; padding:8px 13px;
        background:#fdf6f8; text-align:center; font-size:10.4px; line-height:1.75; color:#7a4a57; }
.only b { color:var(--navy); font-weight:800; }

.grid { margin-top:9px; column-count:2; column-gap:9px; }
.c { break-inside:avoid; margin-bottom:9px; border:1.6px solid var(--border);
     border-radius:14px; padding:8px 11px 9px; background:#fff; }
.c__top { display:flex; align-items:center; gap:8px; padding-bottom:6px;
          border-bottom:1.3px dotted var(--border); }
.c__h { font-size:16px; }
.c__id b { display:block; font-size:13.5px; font-weight:800; line-height:1.3; }
.c__id span { display:block; font-size:9.2px; color:var(--muted); margin-top:1px; }
.c__n { margin-right:auto; font-size:9.6px; font-weight:800; color:#fff;
        background:var(--teal); border-radius:999px; padding:2px 9px; }
.c__crown { margin-top:6px; font-size:9.6px; font-weight:800; color:#8a6410;
            background:#fff6e0; border:1px solid #f0dfb4; border-radius:999px;
            padding:3px 10px; display:inline-block; }
.c ul { list-style:none; margin-top:7px; display:grid; gap:6px; }
.c li { background:var(--soft); border-right:3px solid var(--teal);
        border-radius:0 9px 9px 0; padding:6px 9px; }
.c li p { font-size:9.9px; line-height:1.8; }
.c li em { display:block; font-style:normal; font-size:8.8px; color:var(--muted); margin-top:3px; }

.foot { margin-top:4px; border:2px solid var(--green); border-radius:14px; padding:9px 13px;
        background:linear-gradient(170deg,#f2fbf7,#f6fbfb); text-align:center; }
.foot b { display:block; font-size:12.5px; margin-bottom:4px; }
.foot p { font-size:10.2px; line-height:1.75; color:#2d5c54; }
.hearts { text-align:center; font-size:15px; margin-top:8px; letter-spacing:3px; }
</style></head><body>

<div class="sheet">
  <header class="head">
    <img src="${asset('public/brand/moe-logo.png', 'image/png')}" alt="وزارة التعليم">
    <div class="school">الابتدائية الخامسة والستون بعد المائة</div>
  </header>

  <h1>💗 من ذُكرت باسمها 💗
    <small>كما كتبها أولياء الأمور — ${ar(cards.length)} بطاقة، و${ar(total)} كلمة</small>
  </h1>

  <div class="only">
    هذه الورقة <b>للإدارة وحدها</b>، وتُسلَّم كلُّ بطاقةٍ لصاحبتها على حدة.<br>
    فالأهالي سمَّوا بعضَهنّ ولم يُسمُّوا بعضًا، ونشرُ الأسماء في المجموعة يجعل
    مَن غابَ اسمُها تظنّ أنها لم تُشكر — والثناءُ العامّ له ورقتُه بلا أسماء.
  </div>

  <div class="grid">${cards.map(card).join('')}</div>

  <section class="foot">
    <b>🤍 ومن لم يُذكر اسمُها — لم يغب عنها الثناء 🤍</b>
    <p>أكثرُ ما وصلنا من الأهالي جاء للمدرسة كلِّها: «المعلمات»، «الإداريات»،
    «كلّ من في المدرسة». فغيابُ الاسم غيابُ صُدفةٍ لا غيابُ تقدير.</p>
  </section>

  <div class="hearts">💙 🤍 💚 🩵 💗 🌸 💛 💜 🧡 ❤️</div>
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

console.log(`✓ ${out} — ${cards.length} بطاقة`)
