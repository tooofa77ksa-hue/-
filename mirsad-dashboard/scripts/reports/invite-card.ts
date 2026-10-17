/**
 * «دعوة استقبال الأسبوع» — صورةٌ تُرسل مع الرسالة لأولياء الأمور.
 *
 * بطاقةٌ عموديةٌ بالألوان الدافئة تُرسل في تليجرام أو واتساب: كلماتٌ قليلة
 * وملصقاتٌ كثيرة، لأنّ من يقرؤها تعب من الرسائل الطويلة. وفيها موعدان:
 * الأحد لأولياء الأمور، والخميس للمنسوبات.
 *
 * وصورةُ المدرسة تُقرأ من `.report-out/school-photo.png` ولا تُكتب في الكود:
 * المجلّد غيرُ مرفوع. فإن غابت رُسمت مكانها مدرسةٌ كرتونيّةٌ بالكود، لا
 * صورةٌ من غير المدرسة — وقد وُضعت مرّةً صورةُ كرسيٍّ في ساحةٍ على أنها
 * المدرسة، فصار الاحتياطُ رسمًا صريحًا لا صورةً مشابهة.
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
const photoPath = resolve(ROOT, option('photo') ?? '.report-out/school-photo.png')

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(path).toString('base64')}`
const font = (file: string) => asset(resolve(ROOT, `public/fonts/${file}`), 'font/woff2')
const photo = existsSync(photoPath) ? asset(photoPath, 'image/png') : null

const SCHOOL = `
<svg viewBox="0 0 780 260" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" direction="rtl">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#bfe9ff"/><stop offset="1" stop-color="#fff3d6"/>
    </linearGradient>
  </defs>
  <rect width="780" height="260" fill="url(#sky)"/>
  <!-- شمس وغيوم -->
  <circle cx="90" cy="62" r="36" fill="#ffd54a"/>
  <g fill="#ffd54a"><rect x="86" y="8" width="8" height="16" rx="4"/><rect x="86" y="100" width="8" height="16" rx="4"/>
    <rect x="34" y="58" width="16" height="8" rx="4"/><rect x="130" y="58" width="16" height="8" rx="4"/></g>
  <g fill="#fff"><ellipse cx="610" cy="56" rx="54" ry="22"/><ellipse cx="650" cy="46" rx="34" ry="20"/><ellipse cx="578" cy="60" rx="30" ry="16"/></g>
  <g fill="#fff"><ellipse cx="330" cy="40" rx="42" ry="16"/><ellipse cx="360" cy="32" rx="26" ry="14"/></g>
  <!-- تلال -->
  <ellipse cx="160" cy="262" rx="260" ry="62" fill="#9be3b0"/>
  <ellipse cx="640" cy="266" rx="300" ry="66" fill="#7fd6a0"/>
  <!-- المبنى -->
  <rect x="190" y="104" width="400" height="136" rx="16" fill="#ffd9e6" stroke="#fff" stroke-width="6"/>
  <polygon points="170,108 390,36 610,108" fill="#ec6f9a" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>
  <rect x="240" y="124" width="300" height="38" rx="19" fill="#fff"/>
  <text x="390" y="152" text-anchor="middle" font-family="Baloo" font-weight="800" font-size="27" fill="#15445a">الابتدائية الخامسة والستون</text>
  <!-- نوافذ -->
  <g fill="#bfe9ff" stroke="#fff" stroke-width="5">
    <rect x="214" y="176" width="58" height="48" rx="12"/><rect x="288" y="176" width="58" height="48" rx="12"/>
    <rect x="434" y="176" width="58" height="48" rx="12"/><rect x="508" y="176" width="58" height="48" rx="12"/>
  </g>
  <g stroke="#fff" stroke-width="4"><line x1="243" y1="176" x2="243" y2="224"/><line x1="317" y1="176" x2="317" y2="224"/>
    <line x1="463" y1="176" x2="463" y2="224"/><line x1="537" y1="176" x2="537" y2="224"/></g>
  <!-- الباب -->
  <path d="M358 240 v-52 a32 32 0 0 1 64 0 v52 z" fill="#8a6fb0" stroke="#fff" stroke-width="5"/>
  <circle cx="410" cy="216" r="4" fill="#ffd54a"/>
  <!-- علم -->
  <rect x="386" y="6" width="5" height="34" fill="#15445a"/>
  <polygon points="391,8 430,18 391,30" fill="#07a869"/>
  <!-- شجرتان وأزهار -->
  <rect x="98" y="168" width="12" height="62" rx="5" fill="#a9744f"/><circle cx="104" cy="148" r="44" fill="#53c585"/><circle cx="78" cy="170" r="26" fill="#6ed39a"/>
  <rect x="672" y="176" width="12" height="56" rx="5" fill="#a9744f"/><circle cx="678" cy="156" r="40" fill="#53c585"/><circle cx="702" cy="176" r="24" fill="#6ed39a"/>
  <g>
    <circle cx="170" cy="238" r="9" fill="#ff8fb3"/><circle cx="170" cy="238" r="3.5" fill="#ffd54a"/>
    <circle cx="210" cy="248" r="8" fill="#ffd54a"/><circle cx="210" cy="248" r="3" fill="#fff"/>
    <circle cx="600" cy="244" r="9" fill="#ff8fb3"/><circle cx="600" cy="244" r="3.5" fill="#ffd54a"/>
    <circle cx="636" cy="250" r="8" fill="#fff"/><circle cx="636" cy="250" r="3" fill="#ffd54a"/>
  </g>
</svg>`

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --navy:#15445a; --green:#07a869; --teal:#0da9a6; --rose:#ec6f9a; --sun:#ffb938; --violet:#8a6fb0; }
* { box-sizing:border-box; margin:0; padding:0; }
body { width:1080px; height:1780px; font-family:'Baloo',sans-serif; color:var(--navy);
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

.pic { position:absolute; top:470px; right:110px; left:110px; height:440px; border-radius:46px;
       border:12px solid #fff; box-shadow:0 18px 40px rgba(21,68,90,.25); overflow:hidden;
       background:linear-gradient(135deg,#bfe9ef,#ffd9e6); transform:rotate(-1.4deg); }
.pic svg { display:block; }
.pic img { width:100%; height:100%; object-fit:cover; object-position:center 42%; display:block;
           filter:saturate(1.12) brightness(1.05) contrast(1.04); }

.card { position:absolute; right:70px; left:70px; border-radius:46px; padding:26px 34px;
        text-align:center; border:6px solid #fff; box-shadow:0 14px 30px rgba(21,68,90,.16); }
.card .day { display:inline-block; font-size:36px; font-weight:800; color:#fff;
             border-radius:999px; padding:4px 34px; margin-bottom:8px; }
.card p { font-size:46px; font-weight:800; line-height:1.4; }
.card em { display:block; font-style:normal; font-size:32px; font-weight:700; margin-top:4px; opacity:.85; }
.c1 { top:965px; background:linear-gradient(160deg,#e6fbf1,#fffdf2); }
.c1 .day { background:var(--green); }
.c2 { top:1250px; background:linear-gradient(160deg,#fff0f6,#fffaf0); }
.c2 .day { background:var(--rose); }

.foot { position:absolute; bottom:26px; right:0; left:0; text-align:center; }
.foot b { display:block; font-size:44px; font-weight:800; color:var(--green); }
.foot .sign { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin:12px 190px 0; }
.foot .sign div { border-top:3px dotted var(--navy); padding-top:8px; }
.foot .sign i { display:block; font-style:normal; font-size:26px; font-weight:700; color:#4a6b78; }
.foot .sign u { display:block; text-decoration:none; font-size:38px; font-weight:800; margin-top:2px; }
</style></head><body>
<div class="dots"></div>

<div class="logo">
  <img src="${asset(resolve(ROOT, 'public/brand/moe-logo.png'), 'image/png')}" alt="وزارة التعليم">
  <b>الابتدائية الخامسة والستون بعد المائة</b>
</div>

<h1>🌟 استقبال الأسبوع 🌟<small>دعوةٌ لأولياء أمورنا الغاليين</small></h1>

<div class="pic">${photo ? `<img src="${photo}" alt="">` : SCHOOL}</div>

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

<div class="foot">
  <b>💙 شكرًا لأنكم معنا 💙</b>
  <div class="sign">
    <div><i>وكيلة شؤون الطالبات</i><u>ناهد الحربي</u></div>
    <div><i>مديرة المدرسة</i><u>جازية السميري</u></div>
  </div>
</div>

<!-- الملصقات: رسميّةٌ هادئة — كتبٌ وقبّعة تخرّج وورود ونجوم، لا حيواناتٌ ولا ألعاب -->
<span class="st" style="top:40px;right:36px;font-size:116px;transform:rotate(-10deg)">🌟</span>
<span class="st" style="top:44px;left:36px;font-size:110px;transform:rotate(8deg)">🎓</span>
<span class="st" style="top:350px;right:26px;font-size:120px;transform:rotate(-8deg)">✨</span>
<span class="st" style="top:350px;left:30px;font-size:120px;transform:rotate(10deg)">📖</span>
<span class="st" style="top:440px;left:36px;font-size:112px;transform:rotate(-12deg)">📚</span>
<span class="st" style="top:450px;right:34px;font-size:112px;transform:rotate(12deg)">✏️</span>
<span class="st" style="top:830px;left:24px;font-size:100px;transform:rotate(-10deg)">🌹</span>
<span class="st" style="top:830px;right:30px;font-size:104px;transform:rotate(9deg)">🌷</span>
<span class="st" style="top:1040px;left:30px;font-size:96px;transform:rotate(-10deg)">💙</span>
<span class="st" style="top:1030px;right:30px;font-size:100px;transform:rotate(10deg)">🏫</span>
<span class="st" style="top:1625px;left:36px;font-size:100px;transform:rotate(-8deg)">💐</span>
<span class="st" style="top:1625px;right:38px;font-size:100px;transform:rotate(8deg)">🤍</span>
</body></html>`

mkdirSync(dirname(out), { recursive: true })
const executablePath = process.env.CHROMIUM_PATH
  ?? globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome').sort().at(-1)
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage({ viewport: { width: 1080, height: 1780 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: out })
await browser.close()

console.log(`✓ ${out}${photo ? '' : ' (مدرسة مرسومة — لا صورة)'}`)
