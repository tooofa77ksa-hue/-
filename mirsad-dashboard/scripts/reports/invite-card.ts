/**
 * «دعوة استقبال الأسبوع» — صورةٌ تُرسل مع الرسالة لأولياء الأمور.
 *
 * بطاقةٌ عموديةٌ بالألوان الدافئة تُرسل في تليجرام أو واتساب: كلماتٌ قليلة
 * وملصقاتٌ كثيرة، لأنّ من يقرؤها تعب من الرسائل الطويلة. وفيها موعدان:
 * الأحد لأولياء الأمور، والخميس للمنسوبات.
 *
 * وصورةُ المدرسة تُقرأ من `.report-out/school-photo.jpg` ولا تُكتب في الكود:
 * فالمجلّد غيرُ مرفوع، وقد تظهر في الصور وجوهُ طالبات. فإن غابت الصورة
 * خرجت البطاقة بلا صورة، لا بصورةٍ من غير المدرسة.
 *
 * والملصقات رموزٌ تعبيريّة تُرسم بخطّ الإيموجي نفسه فتظهر كما هي على كلّ
 * جهاز، لا صورًا مولَّدةً. وتوليدُ الصور بالذكاء الاصطناعي ينتظر تسجيلَ
 * الدخول إلى Codex، وهو غيرُ متاحٍ في هذه الجلسة.
 *
 *   npx vite-node scripts/reports/invite-card.ts
 */
import { existsSync, globSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '../..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const out = resolve(ROOT, option('out') ?? '.report-out/دعوة-استقبال-الأسبوع.png')
const photoPath = resolve(ROOT, option('photo') ?? '.report-out/school-photo.jpg')

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(path).toString('base64')}`
const font = (file: string) => asset(resolve(ROOT, `public/fonts/${file}`), 'font/woff2')
const photo = existsSync(photoPath) ? asset(photoPath, 'image/jpeg') : null

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --navy:#15445a; --green:#07a869; --teal:#0da9a6; --rose:#ec6f9a; --sun:#ffb938; --violet:#8a6fb0; }
* { box-sizing:border-box; margin:0; padding:0; }
body { width:1080px; height:1500px; font-family:'Baloo',sans-serif; color:var(--navy);
       background:linear-gradient(175deg,#fff4f8 0%,#fff9ec 38%,#eefaf6 100%); position:relative; overflow:hidden; }

/* ملصق: رمزٌ كبير بحدٍّ أبيض وظلٍّ ناعم، كما تُلصق الملصقات على صورة */
.st { position:absolute; line-height:1; filter:
      drop-shadow(0 0 0 #fff) drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff)
      drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 8px 10px rgba(21,68,90,.22)); }

.dots { position:absolute; inset:0; background-image:radial-gradient(#ffd6e4 3px, transparent 3.5px);
        background-size:54px 54px; opacity:.55; }

.logo { position:absolute; top:44px; right:0; left:0; text-align:center; }
.logo img { height:74px; }
.logo b { display:block; font-size:30px; font-weight:800; margin-top:10px; }

h1 { position:absolute; top:206px; right:70px; left:70px; text-align:center;
     font-size:92px; font-weight:800; line-height:1.15; color:var(--rose);
     text-shadow:0 4px 0 #fff, 0 10px 18px rgba(236,111,154,.28); }
h1 small { display:block; font-size:40px; font-weight:700; color:var(--navy); margin-top:6px;
           text-shadow:none; }

.pic { position:absolute; top:480px; right:150px; left:150px; height:250px; border-radius:46px;
       border:12px solid #fff; box-shadow:0 18px 40px rgba(21,68,90,.25); overflow:hidden;
       background:linear-gradient(135deg,#bfe9ef,#ffd9e6); transform:rotate(-1.4deg); }
.pic img { width:100%; height:100%; object-fit:cover; object-position:center 55%; display:block; }

.card { position:absolute; right:70px; left:70px; border-radius:46px; padding:26px 34px;
        text-align:center; border:6px solid #fff; box-shadow:0 14px 30px rgba(21,68,90,.16); }
.card .day { display:inline-block; font-size:36px; font-weight:800; color:#fff;
             border-radius:999px; padding:4px 34px; margin-bottom:8px; }
.card p { font-size:46px; font-weight:800; line-height:1.4; }
.card em { display:block; font-style:normal; font-size:32px; font-weight:700; margin-top:4px; opacity:.85; }
.c1 { top:775px; background:linear-gradient(160deg,#e6fbf1,#fffdf2); }
.c1 .day { background:var(--green); }
.c2 { top:1060px; background:linear-gradient(160deg,#fff0f6,#fffaf0); }
.c2 .day { background:var(--rose); }

.foot { position:absolute; bottom:38px; right:0; left:0; text-align:center; }
.foot b { display:block; font-size:44px; font-weight:800; color:var(--green); }
.foot span { font-size:30px; font-weight:700; }
</style></head><body>
<div class="dots"></div>

<div class="logo">
  <img src="${asset(resolve(ROOT, 'public/brand/moe-logo.png'), 'image/png')}" alt="وزارة التعليم">
  <b>الابتدائية الخامسة والستون بعد المائة</b>
</div>

<h1>🌞 استقبال الأسبوع 🌞<small>دعوةٌ لأولياء أمورنا الغاليين</small></h1>

<div class="pic">${photo ? `<img src="${photo}" alt="">` : ''}</div>

<div class="card c1">
  <span class="day">☀️ كلَّ أحد</span>
  <p>نستقبل أسبوعًا جديدًا معكم</p>
  <em>ونرسل لكم أجمل ما وصلنا من كلماتكم 💌</em>
</div>

<div class="card c2">
  <span class="day">🌸 وكلَّ خميس ونيس</span>
  <p>نوصل كلامكم الطيّب للمعلمات والإداريات</p>
  <em>ليكون جهد أسبوعهنّ كله مشكورًا 🤍</em>
</div>

<div class="foot"><b>💙 شكرًا لأنكم معنا 💙</b><span>إدارة المدرسة</span></div>

<!-- الملصقات -->
<span class="st" style="top:40px;right:36px;font-size:120px;transform:rotate(-12deg)">🌟</span>
<span class="st" style="top:46px;left:36px;font-size:112px;transform:rotate(10deg)">🎈</span>
<span class="st" style="top:350px;right:22px;font-size:130px;transform:rotate(-8deg)">🌈</span>
<span class="st" style="top:360px;left:26px;font-size:120px;transform:rotate(12deg)">🎀</span>
<span class="st" style="top:470px;left:50px;font-size:120px;transform:rotate(-14deg)">📚</span>
<span class="st" style="top:490px;right:50px;font-size:116px;transform:rotate(14deg)">✏️</span>
<span class="st" style="top:690px;left:24px;font-size:96px;transform:rotate(-10deg)">🦋</span>
<span class="st" style="top:690px;right:30px;font-size:100px;transform:rotate(9deg)">🌷</span>
<span class="st" style="top:985px;left:36px;font-size:90px;transform:rotate(-10deg)">💖</span>
<span class="st" style="top:975px;right:36px;font-size:92px;transform:rotate(10deg)">🧸</span>
<span class="st" style="top:1330px;left:40px;font-size:96px;transform:rotate(-8deg)">🌼</span>
<span class="st" style="top:1332px;right:44px;font-size:96px;transform:rotate(8deg)">🐝</span>
</body></html>`

mkdirSync(dirname(out), { recursive: true })
const executablePath = process.env.CHROMIUM_PATH
  ?? globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome').sort().at(-1)
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage({ viewport: { width: 1080, height: 1500 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: out })
await browser.close()

console.log(`✓ ${out}${photo ? '' : ' (بلا صورة مدرسة)'}`)
