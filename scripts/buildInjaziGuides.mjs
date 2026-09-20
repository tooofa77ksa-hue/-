/*
  مولّد دليلَي «إنجازي يحكي» — PDF احترافي بالهوية والخطوط الأصلية.
  ==================================================================
  • الخطوط: Baloo Bhaijaan 2 (العناوين) و Readex Pro (المتن) — نفس خطّي
    المنصة، مضمّنة داخل الملف حتى يُطبع الدليل على أي جهاز بلا إنترنت.
  • الألوان: مشتقّة من src/injazi/styles/tokens.css حرفيًا.
  • اللقطات: صور حقيقية من المنصة نفسها بأسماء الطالبات والمعلمات كما هي.
  • لا يظهر في أي صفحة رمز دخول ولا مفتاح ولا رابط حقيقي لمعلمة أو طالبة.
*/
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright";

const SHOTS = "/tmp/guide/shots";
const OUT = "/tmp/guide";

// ---------------- الخطوط ----------------
const faces = JSON.parse(readFileSync("/tmp/guide/fonts/fonts.json", "utf8"));
const fontCss = faces
  .map(
    (f) => `@font-face{font-family:"${f.family}";font-style:normal;font-weight:${f.weight};
font-display:block;src:url(data:font/woff2;base64,${f.b64}) format("woff2");
unicode-range:${f.range};}`,
  )
  .join("\n");

// ---------------- اللقطات ----------------
/*
  تُصغَّر اللقطات وتُعاد ضغطها قبل التضمين. الأصل PNG بحجم ×2 يُنتج
  ملفًا يقارب 16 ميغابايت — ثقيلًا على الإرسال في الواتساب أو البريد.
  العرض المستهدف هنا يفوق ما تحتاجه الطباعة (≈٢٥٠ نقطة/بوصة عند مقاس
  العرض في الصفحة)، فلا تُرى الفروق بالعين ويهبط الحجم إلى الثلث.
*/
const encoder = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const encPage = await (await encoder.newContext()).newPage();
const cache = new Map();

async function prepare(name, maxWidth) {
  const p = `${SHOTS}/${name}.png`;
  if (!existsSync(p)) throw new Error(`لقطة مفقودة: ${name}`);
  const raw = `data:image/png;base64,${readFileSync(p).toString("base64")}`;
  const out = await encPage.evaluate(
    ([src, w]) =>
      new Promise((resolve) => {
        const im = new Image();
        im.onload = () => {
          const scale = Math.min(1, w / im.width);
          const c = document.createElement("canvas");
          c.width = Math.round(im.width * scale);
          c.height = Math.round(im.height * scale);
          const ctx = c.getContext("2d");
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(im, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.92));
        };
        im.src = src;
      }),
    [raw, maxWidth],
  );
  cache.set(name, out);
  return out;
}

const img = (name) => {
  const v = cache.get(name);
  if (!v) throw new Error(`لقطة لم تُهيّأ: ${name}`);
  return v;
};

// الجوّال يُعرض بعرض ≈٥٢مم، والمكتب بعرض ≈١٧٤مم
for (let i = 1; i <= 20; i++) {
  const n = String(i).padStart(2, "0");
  const match = ["s01-home","s02-portfolio-top","s03-personalize","s04-about-empty",
    "s05-about-filled","s06-about-added","s07-hobby-typing","s08-hobby-added",
    "s09-project-empty","s10-project-filled","s11-project-link","s12-project-qr",
    "s13-project-savebar","s14-project-saving","s15-project-saved","s16-project-card",
    "s17-project-edit","s18-certificate","s19-portfolio-bottom","s20-evaluation-arrived"]
    .find((x) => x.startsWith(`s${n}-`));
  if (match) await prepare(match, 760);
}
for (const t of ["t01-link-opening","t02-link-failed","t03-portal","t04-filters",
  "t05-project-card","t06-eval-open","t07-eval-stars","t08-eval-comment",
  "t09-eval-bottom","t10-eval-saved","t11-eval-persisted","t12-student-view"]) {
  await prepare(t, 1750);
}
await encoder.close();

// ================= الهوية =================
const CSS = `
${fontCss}

:root{
  --paper:#ffffff;
  --night:#0b0824;
  --night-deep:#06041a;
  --ink:#1b1436;
  --ink-soft:#4a3f70;
  --ink-muted:#6f648f;
  --line:#e6e1f5;
  --lilac:#c3adff;      --lilac-deep:#8e6dfb;
  --sky:#7fdcff;        --sky-deep:#34aee4;
  --mint:#7ef0cd;       --mint-deep:#34c9a0;
  --rose:#ff9fc4;       --rose-deep:#e0578f;
  --apricot:#ffbd82;    --apricot-deep:#e8863f;
  --lemon:#ffdc8d;      --lemon-deep:#e9b53a;
  --gold:#ffc96b;       --gold-deep:#e09a26;
  --danger:#e0574f;
  --display:"Baloo Bhaijaan 2","Readex Pro",system-ui,sans-serif;
  --body:"Readex Pro","Tajawal",system-ui,sans-serif;
}

*{box-sizing:border-box;margin:0;padding:0;}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body{font-family:var(--body);color:var(--ink);background:var(--paper);
  direction:rtl;font-size:10.5pt;line-height:1.85;font-weight:300;}

@page{size:A4;margin:0;}

/* ٢٩٦مم لا ٢٩٧: الارتفاع المطابق تمامًا لمقاس الورقة يتجاوزها بكسرٍ
   من البكسل عند التصيير فتُطبع ورقة بيضاء زائدة بعده. */
.page{width:210mm;min-height:294mm;padding:19mm 18mm 21mm;position:relative;
  page-break-after:always;background:var(--paper);display:flow-root;}
.page:last-child{page-break-after:auto;}

/* ---------- الغلاف ---------- */
.cover{background:
    radial-gradient(1100px 620px at 78% 8%, rgba(142,109,251,.5), transparent 62%),
    radial-gradient(900px 560px at 14% 88%, rgba(52,174,228,.42), transparent 60%),
    linear-gradient(168deg,var(--night) 0%,var(--night-deep) 100%);
  color:#f4f1ff;padding:0;overflow:hidden;}
/* العنصر البديل (SVG) لا يتمدّد بـ inset وحده: بلا width/height صريحين
   يأخذ مقاسه الذاتي 300×150 فتتكدّس النجوم في ركن واحد. */
.cover__stars{position:absolute;inset:0;width:100%;height:100%;opacity:.85;}
.cover__inner{position:relative;height:294mm;display:flex;flex-direction:column;
  justify-content:center;padding:0 22mm;}
.cover__badge{display:inline-flex;align-items:center;gap:9px;align-self:flex-start;
  background:rgba(255,255,255,.09);border:1px solid rgba(180,168,255,.32);
  border-radius:999px;padding:7px 17px;font-size:9.5pt;color:#dfd8ff;font-weight:400;}
.cover__star{width:17px;height:17px;}
.cover__kicker{font-family:var(--display);font-weight:600;font-size:14pt;
  color:var(--gold);margin-top:34px;letter-spacing:.2px;}
.cover__title{font-family:var(--display);font-weight:800;font-size:40pt;line-height:1.24;
  margin-top:8px;
  background:linear-gradient(105deg,#ffffff 8%,var(--sky) 46%,var(--lilac) 88%);
  -webkit-background-clip:text;background-clip:text;color:transparent;}
.cover__rule{width:82mm;height:5px;border-radius:999px;margin:24px 0 20px;
  background:linear-gradient(90deg,var(--gold),var(--rose) 52%,var(--sky));}
.cover__lede{font-size:12pt;line-height:1.95;color:#cfc7f0;max-width:132mm;font-weight:300;}
.cover__foot{position:absolute;bottom:20mm;right:22mm;left:22mm;
  display:flex;justify-content:space-between;align-items:flex-end;gap:16px;
  border-top:1px solid rgba(180,168,255,.22);padding-top:15px;
  font-size:9.5pt;color:#a79ccd;}
.cover__school{font-family:var(--display);font-weight:600;font-size:11.5pt;color:#efeaff;}

/* ---------- ترويسة الصفحة ---------- */
.head{display:flex;justify-content:space-between;align-items:center;
  border-bottom:2px solid var(--line);padding-bottom:9px;margin-bottom:17px;}
.head__brand{font-family:var(--display);font-weight:700;font-size:11pt;color:var(--lilac-deep);}
.head__section{font-size:9pt;color:var(--ink-muted);}

/* ---------- العناوين ---------- */
h2{font-family:var(--display);font-weight:800;font-size:21pt;color:var(--ink);
  line-height:1.4;margin-bottom:6px;}
h2 .num{display:inline-flex;align-items:center;justify-content:center;
  width:34px;height:34px;border-radius:12px;font-size:14pt;margin-left:11px;
  background:linear-gradient(150deg,var(--lilac),var(--sky));color:#12102c;
  vertical-align:-5px;box-shadow:0 5px 14px -6px rgba(142,109,251,.75);}
h3{font-family:var(--display);font-weight:700;font-size:13.5pt;color:var(--ink);
  margin:19px 0 8px;}
.sub{color:var(--ink-muted);font-size:10pt;margin-bottom:16px;}
p{margin-bottom:10px;}
strong{font-weight:600;color:var(--ink);}
.k{font-family:var(--display);font-weight:600;color:var(--lilac-deep);
  background:#f4f0ff;border-radius:7px;padding:1px 7px;white-space:nowrap;}

/* ---------- الخطوات ---------- */
.steps{counter-reset:st;margin:6px 0 4px;}
.step{position:relative;padding-right:40px;margin-bottom:11px;}
.step::before{counter-increment:st;content:counter(st);
  position:absolute;right:0;top:1px;width:27px;height:27px;border-radius:9px;
  background:var(--night);color:var(--gold);font-family:var(--display);font-weight:700;
  font-size:11pt;display:flex;align-items:center;justify-content:center;}
.step b{font-weight:600;}

/* ---------- الصور ---------- */
figure{margin:12px 0;break-inside:avoid;}
/* المقاسات محسوبة على ارتفاع A4: لقطة الجوّال نسبتها ٠٫٤٦ فارتفاعها
   ضعفا عرضها تقريبًا، ولقطة المكتب ١٫٤٩. تجاوز هذه الحدود يجعل
   الصفحة أطول من الورقة فينكسر المحتوى على ورقتين. */
.shot{display:block;width:120mm;max-width:100%;margin:0 auto;border-radius:14px;
  border:1px solid var(--line);box-shadow:0 10px 26px -14px rgba(27,20,54,.5);}
.shot--phone{width:46mm;margin:0 auto;border-radius:17px;}
figcaption{font-size:8.6pt;color:var(--ink-muted);text-align:center;margin-top:6px;
  line-height:1.65;}
.gallery{display:flex;gap:7mm;justify-content:center;align-items:flex-start;
  break-inside:avoid;margin:12px 0;}
/* الحدّ الأقصى لعرض اللقطة داخل الصفّ ضروريّ: بلا سقف يأخذ عنصران
   نصف عرض الصفحة لكلٍّ منهما فيبلغ ارتفاع اللقطة ١٨٠مم وحدها. */
.gallery figure{margin:0;flex:0 1 52mm;}
.gallery .shot--phone{width:100%;max-width:52mm;}
.gallery--three figure{flex:0 1 48mm;}
.gallery--three .shot--phone{max-width:48mm;}

/* ---------- الصناديق ---------- */
.box{border-radius:15px;padding:11px 15px;margin:12px 0;
  border-right:5px solid;break-inside:avoid;font-size:10pt;}
.box__t{font-family:var(--display);font-weight:700;font-size:11pt;margin-bottom:3px;
  display:flex;align-items:center;gap:7px;}
.box--tip{background:#f0fbf6;border-color:var(--mint-deep);} .box--tip .box__t{color:#177a5d;}
.box--warn{background:#fff7ec;border-color:var(--apricot-deep);} .box--warn .box__t{color:#a8541b;}
.box--safe{background:#f3f2ff;border-color:var(--lilac-deep);} .box--safe .box__t{color:#5b3fd0;}
.box--stop{background:#fdf1f0;border-color:var(--danger);} .box--stop .box__t{color:#b2362e;}
.box p:last-child{margin-bottom:0;}
.box ul{margin:4px 5px 0 0;padding-right:17px;}
.box li{margin-bottom:3px;}

/* ---------- الجداول ---------- */
table{width:100%;border-collapse:collapse;margin:11px 0;font-size:9.4pt;break-inside:avoid;}
th{background:var(--night);color:#efeaff;font-family:var(--display);font-weight:600;
  padding:7px 10px;text-align:right;font-size:10pt;}
th:first-child{border-radius:0 11px 0 0;} th:last-child{border-radius:11px 0 0 0;}
td{padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top;}
tr:nth-child(even) td{background:#faf9ff;}

/* ---------- بطاقات ---------- */
.cards{display:flex;gap:9px;margin:12px 0;break-inside:avoid;}
.card{flex:1;border:1px solid var(--line);border-radius:14px;padding:12px 13px;
  background:#fdfcff;}
.card__t{font-family:var(--display);font-weight:700;font-size:10.5pt;margin-bottom:4px;}
.card p{font-size:9.3pt;color:var(--ink-soft);margin:0;line-height:1.72;}
.card--lilac{border-top:4px solid var(--lilac-deep);} .card--lilac .card__t{color:var(--lilac-deep);}
.card--sky{border-top:4px solid var(--sky-deep);} .card--sky .card__t{color:var(--sky-deep);}
.card--mint{border-top:4px solid var(--mint-deep);} .card--mint .card__t{color:var(--mint-deep);}
.card--gold{border-top:4px solid var(--gold-deep);} .card--gold .card__t{color:var(--gold-deep);}
.card--rose{border-top:4px solid var(--rose-deep);} .card--rose .card__t{color:var(--rose-deep);}

/* ---------- الفهرس ---------- */
.toc{margin-top:8px;}
.toc__row{display:flex;align-items:baseline;gap:9px;padding:8px 0;
  border-bottom:1px dashed var(--line);}
.toc__n{font-family:var(--display);font-weight:700;color:var(--lilac-deep);
  min-width:28px;font-size:11pt;}
.toc__t{font-family:var(--display);font-weight:600;font-size:11pt;}
.toc__d{color:var(--ink-muted);font-size:9.2pt;flex:1;}

/* ---------- الأسئلة ---------- */
.qa{border-right:3px solid var(--lilac);padding-right:13px;margin-bottom:13px;
  break-inside:avoid;}
.qa__q{font-family:var(--display);font-weight:700;font-size:11pt;color:var(--ink);
  margin-bottom:3px;}
.qa__a{font-size:9.8pt;color:var(--ink-soft);}

/* ---------- الذيل ---------- */
.foot{position:absolute;bottom:10mm;right:18mm;left:18mm;
  display:flex;justify-content:space-between;font-size:8.3pt;color:var(--ink-muted);
  border-top:1px solid var(--line);padding-top:7px;}

/* ---------- النهاية ---------- */
.end{background:linear-gradient(168deg,var(--night),var(--night-deep));color:#f4f1ff;}
.end h2{color:#ffffff;}
.end .sub{color:#b3a9db;}
.end .box{background:rgba(255,255,255,.07);border-color:var(--gold);}
.end .box__t{color:var(--gold);}
.end .box p,.end .box li{color:#ded7fb;}
.end strong{color:#ffe6a8;}
.end .k{background:rgba(255,255,255,.12);color:#cfe9ff;}
.end .foot{color:#8c81b8;border-color:rgba(180,168,255,.2);}
.end p{color:#ded7fb;}
`;

// نجوم الغلاف — توليد ثابت لا عشوائي حتى يخرج الملف نفسه في كل مرّة
function stars(seed, n) {
  let s = seed >>> 0, out = "";
  /* mulberry32 — توزيع متساوٍ فعلًا؛ المولّد الخطّي البسيط كان يُكدّس
     النجوم في ركن واحد لأن بتّاته الدنيا متلاصقة. */
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < n; i++) {
    const x = (rnd() * 100).toFixed(2), y = (rnd() * 100).toFixed(2);
    const r = (rnd() * 1.5 + 0.35).toFixed(2), o = (rnd() * 0.75 + 0.2).toFixed(2);
    out += `<circle cx="${x}%" cy="${y}%" r="${r}" fill="#fff" opacity="${o}"/>`;
  }
  return `<svg class="cover__stars" preserveAspectRatio="none">${out}</svg>`;
}

const STAR_ICON = `<svg class="cover__star" viewBox="0 0 24 24" fill="#ffc96b"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z"/></svg>`;

const head = (section) =>
  `<div class="head"><span class="head__brand">★ إنجازي يحكي</span><span class="head__section">${section}</span></div>`;
const foot = (label, n) =>
  `<div class="foot"><span>${label}</span><span>${n}</span></div>`;

function doc(title, body) {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>${title}</title><style>${CSS}</style></head><body>${body}</body></html>`;
}

const phone = (name, cap) =>
  `<figure><img class="shot shot--phone" src="${img(name)}" alt=""><figcaption>${cap}</figcaption></figure>`;
const wide = (name, cap) =>
  `<figure><img class="shot" src="${img(name)}" alt=""><figcaption>${cap}</figcaption></figure>`;
const row = (items) =>
  `<div class="gallery${items.length > 2 ? " gallery--three" : ""}">${items
    .map((i) => `<figure><img class="shot shot--phone" src="${img(i[0])}" alt=""><figcaption>${i[1]}</figcaption></figure>`)
    .join("")}</div>`;

const SCHOOL = "الابتدائية الخامسة والستون بعد المائة";
const SITE = "mauve-pi-99.vercel.app";

/* ==================================================================
   الدليل الأول — الطالبة وولي الأمر
   ================================================================== */
const P = [];
let pn = 0;
const page = (cls, section, inner, label) => {
  pn++;
  P.push(`<div class="page ${cls}">${section ? head(section) : ""}${inner}${
    label === null ? "" : foot(label, pn)
  }</div>`);
};

// --- الغلاف
P.push(`<div class="page cover">${stars(7, 190)}<div class="cover__inner">
  <span class="cover__badge">${STAR_ICON} منصّة ملف الإنجاز الرقمي</span>
  <div class="cover__kicker">دليل الاستخدام</div>
  <h1 class="cover__title">للطالبة<br>ولولي الأمر</h1>
  <div class="cover__rule"></div>
  <p class="cover__lede">كل ما تحتاجينه لتبدئي ملفّك الرقمي: كيف تفتحينه، وكيف
  تكتبين عن نفسك، وكيف تضيفين مشاريعك وشهاداتك، وكيف تقرئين تقييم معلمتك —
  بالصور خطوةً خطوة.</p>
  <div class="cover__foot">
    <div><div class="cover__school">${SCHOOL}</div>
      <div>الصف الرابع / 2 · العام الدراسي ١٤٤٨هـ</div></div>
    <div>${SITE}</div>
  </div></div></div>`);
pn = 1;

// --- الفهرس والتعريف
page("", "ما هذه المنصّة؟", `
<h2>ملفّك… يحكي عنك</h2>
<p class="sub">«إنجازي يحكي» مكانٌ واحد تجمعين فيه كل ما أنجزتِه هذا العام.</p>

<p>بدل أن تتفرّق أعمالك بين دفاتر وأوراق وصور في الجوّال، صار لكِ صفحةٌ واحدة
على الإنترنت تحمل اسمك: تضعين فيها مشاريعك وأوراق عملك وشهاداتك، وتكتبين عن
نفسك وهواياتك، وتقرئين فيها ما كتبته لكِ معلمتك من نجوم وتعليق.</p>

<div class="cards">
  <div class="card card--lilac"><div class="card__t">أنتِ تكتبين</div>
    <p>مشاريعك، إنجازاتك، شهاداتك، وكل ما تحبّين أن يعرفه الناس عنك.</p></div>
  <div class="card card--sky"><div class="card__t">معلمتك تقرأ</div>
    <p>تفتح مشروعك، تضع لكِ نجومًا وشارة تميّز، وتكتب لكِ تعليقًا.</p></div>
  <div class="card card--gold"><div class="card__t">أهلك يرون</div>
    <p>يفتح والداك الرابط نفسه فيرون ملفّك كاملًا في أي وقت.</p></div>
</div>

<h3>ماذا ستتعلّمين في هذا الدليل</h3>
<div class="toc">
  <div class="toc__row"><span class="toc__n">١</span><span class="toc__t">أفتح ملفّي</span><span class="toc__d">الرابط الخاص بك وكيف تحفظينه</span></div>
  <div class="toc__row"><span class="toc__n">٢</span><span class="toc__t">أخصّص ملفّي</span><span class="toc__d">اللون والأيقونة والصورة</span></div>
  <div class="toc__row"><span class="toc__n">٣</span><span class="toc__t">أكتب عنّي</span><span class="toc__d">نبذة، طموحي، مهاراتي</span></div>
  <div class="toc__row"><span class="toc__n">٤</span><span class="toc__t">أضيف هواياتي</span><span class="toc__d">ما تحبّين فعله</span></div>
  <div class="toc__row"><span class="toc__n">٥</span><span class="toc__t">أضيف مشروعًا</span><span class="toc__d">العنوان، المادة، الوصف، الصور، الروابط</span></div>
  <div class="toc__row"><span class="toc__n">٦</span><span class="toc__t">أعدّل وأرشّف وأحذف</span><span class="toc__d">تصحيح ما كتبتِه</span></div>
  <div class="toc__row"><span class="toc__n">٧</span><span class="toc__t">إنجازاتي وشهاداتي</span><span class="toc__d">الشهادات والمراكز</span></div>
  <div class="toc__row"><span class="toc__n">٨</span><span class="toc__t">أقرأ تقييم معلمتي</span><span class="toc__d">النجوم والتعليق والشارة</span></div>
  <div class="toc__row"><span class="toc__n">٩</span><span class="toc__t">لولي الأمر</span><span class="toc__d">كيف تتابعين ابنتك</span></div>
</div>

<div class="box box--safe"><div class="box__t">🔒 قاعدة واحدة تحفظ ملفّك</div>
<p>رابطك <strong>خاص بك وحدك</strong>. لا ترسليه في مجموعات، ولا تنشريه على وسائل
التواصل. أرسليه لوالديك فقط. من يملك الرابط يستطيع التعديل على ملفّك.</p></div>
`, "دليل الطالبة وولي الأمر");

// --- الخطوة 1
page("", "١ · أفتح ملفّي", `
<h2><span class="num">١</span>أفتح ملفّي</h2>
<p class="sub">رابطٌ واحد يفتح صفحتك — احفظيه ولا تفقديه.</p>

<div class="steps">
  <div class="step"><b>استلمي الرابط من المعلمة أو المشرفة.</b> يصلك عبر الواتساب
  أو مكتوبًا في ورقة. شكله يبدأ بـ <span class="k">${SITE}</span>.</div>
  <div class="step"><b>افتحيه في المتصفّح.</b> اضغطي عليه مباشرةً، أو انسخيه
  والصقيه في شريط العنوان.</div>
  <div class="step"><b>احفظيه في شاشة الجوّال.</b> من قائمة المتصفّح اختاري
  «إضافة إلى الشاشة الرئيسية» ليصير أيقونة تفتحينها بضغطة واحدة.</div>
  <div class="step"><b>تأكّدي أنه ملفّك.</b> اسمك يظهر في الأعلى مع صفّك.</div>
</div>

${phone("s02-portfolio-top", "أعلى ملفّك: اسمك، صفّك، وثلاثة أزرار — «تخصيص الملف» و«عني» و«هواياتي».<br>وتحتها مؤشّراتك: عدد المشاريع، ومتوسّط النجوم، وعدد شارات التميّز.")}

<div class="box box--tip"><div class="box__t">💡 الأزرار الثلاثة لا تظهر إلا لكِ</div>
<p>إذا فتح شخصٌ ملفّك بلا رابطك الخاص فسيرى أعمالك فقط — بلا أي زرّ تعديل.
هذا مقصود: ملفّك يُقرأ من الجميع، ولا يُعدَّل إلا منكِ.</p></div>
`, "دليل الطالبة وولي الأمر");

// --- الخطوة 2
page("", "٢ · أخصّص ملفّي", `
<h2><span class="num">٢</span>أخصّص ملفّي</h2>
<p class="sub">اجعلي الصفحة تشبهك: لونٌ تحبّينه، وأيقونةٌ تمثّلك، وصورتك.</p>

<div class="steps">
  <div class="step">اضغطي <span class="k">تخصيص الملف</span> في أعلى الصفحة.</div>
  <div class="step">اختاري <b>لون الغلاف</b> — هو الشريط الملوّن أعلى صورتك.</div>
  <div class="step">اختاري <b>أيقونتك</b> — نجمة، صاروخ، زهرة، قلب… ما يعبّر عنك.</div>
  <div class="step">ارفعي <b>صورتك</b> إن أحببتِ (اختياري تمامًا).</div>
  <div class="step">اضغطي <span class="k">حفظ التخصيص</span>.</div>
</div>

${phone("s03-personalize", "نافذة «تخصيص الملف»: الألوان والأيقونات والصورة في مكان واحد.")}

<div class="box box--warn"><div class="box__t">📸 عن الصورة الشخصية</div>
<p>الصورة اختيارية. إن لم ترفعي صورة فسيظهر أول حرف من اسمك في دائرة ملوّنة —
وهو جميل أيضًا. استشيري والديك قبل رفع صورتك، فالملف يفتحه كل من يملك الرابط.</p></div>
`, "دليل الطالبة وولي الأمر");

// --- الخطوة 3
page("", "٣ · أكتب عنّي", `
<h2><span class="num">٣</span>أكتب عنّي</h2>
<p class="sub">قسم «عني» يحكي من أنتِ: نبذة، طموحك، مهاراتك، أو ما تريدين.</p>

<div class="steps">
  <div class="step">اضغطي زرّ <span class="k">عني</span>.</div>
  <div class="step">اكتبي <b>عنوان القسم</b> — أو اضغطي أحد الاقتراحات الجاهزة
  أسفل الخانة («نبذة عني»، «مهاراتي»، «طموحي»، «أشياء أحبّها»).</div>
  <div class="step">اكتبي <b>النصّ</b> في الخانة الكبيرة.</div>
  <div class="step">اختاري <b>أيقونة</b> تناسب القسم.</div>
  <div class="step">اضغطي <span class="k">إضافة القسم</span> — يُضاف إلى قائمتك أسفل النافذة.</div>
  <div class="step">كرّري لكل قسم تريدينه، ثم اضغطي <span class="k">حفظ</span> في الأسفل.</div>
</div>

${row([
  ["s04-about-empty", "النافذة عند فتحها أول مرّة."],
  ["s05-about-filled", "بعد كتابة العنوان والنصّ."],
  ["s06-about-added", "أقسامك أُضيفت إلى القائمة — ويبقى الضغط على «حفظ»."],
])}

<div class="box box--stop"><div class="box__t">⚠️ «إضافة القسم» شيء… و«حفظ» شيء آخر</div>
<p><strong>إضافة القسم</strong> تضع القسم في القائمة داخل النافذة فقط.
<strong>حفظ</strong> هو الذي يُثبّته في ملفّك. إن أغلقتِ النافذة قبل «حفظ»
ستُسألين: «لديكِ تعديل لم يُحفظ. هل تُغلقين بلا حفظ؟» — اضغطي «إلغاء» ثم «حفظ».</p></div>
`, "دليل الطالبة وولي الأمر");

// --- الخطوة 4
page("", "٤ · أضيف هواياتي", `
<h2><span class="num">٤</span>أضيف هواياتي</h2>
<p class="sub">الرسم، القراءة، السباحة، البرمجة… ما تحبّين فعله خارج الدرس.</p>

<div class="steps">
  <div class="step">اضغطي زرّ <span class="k">هواياتي</span>.</div>
  <div class="step">اكتبي اسم الهواية في الخانة.</div>
  <div class="step">اختاري لها أيقونة من الشبكة أسفل الخانة.</div>
  <div class="step">اضغطي <span class="k">إضافة</span> — أو اضغطي زرّ Enter في لوحة المفاتيح.</div>
  <div class="step">أضيفي ما شئتِ من الهوايات، ثم اضغطي <span class="k">حفظ</span>.</div>
</div>

${row([
  ["s07-hobby-typing", "أثناء كتابة اسم الهواية — واختيار أيقونتها."],
  ["s08-hobby-added", "الهواية أُضيفت وظهرت في القائمة."],
])}

<div class="box box--tip"><div class="box__t">💡 ترتيب الهوايات</div>
<p>تستطيعين سحب الهواية وإفلاتها لتغيّري ترتيبها — الأولى تظهر أولًا في ملفّك.
وزرّ <b>تراجع</b> يعيد كل شيء كما كان قبل تعديلك ما دمتِ لم تحفظي بعد.</p></div>
`, "دليل الطالبة وولي الأمر");

// --- الخطوة 5 (أ)
page("", "٥ · أضيف مشروعًا", `
<h2><span class="num">٥</span>أضيف مشروعًا</h2>
<p class="sub">هذا قلب ملفّك: كل عملٍ أنجزتِه في أي مادة.</p>

<div class="steps">
  <div class="step">انزلي إلى قسم <span class="k">مشاريعي</span> واضغطي
  <span class="k">+ إضافة مشروع</span>.</div>
  <div class="step">اكتبي <b>عنوان المشروع</b> — واضحًا ومحدّدًا.</div>
  <div class="step">اختاري <b>المادة</b> من القائمة (الرياضيات، لغتي، العلوم،
  الدراسات الإسلامية، English).</div>
  <div class="step">اختاري <b>التاريخ</b> — اليوم تلقائيًا، وتستطيعين تغييره.</div>
  <div class="step">اكتبي <b>الوصف</b>: ماذا نفّذتِ؟ وماذا تعلّمتِ منه؟</div>
</div>

${row([
  ["s09-project-empty", "نموذج «إضافة مشروع» فارغًا."],
  ["s10-project-filled", "بعد كتابة العنوان واختيار المادة والوصف."],
])}

<div class="box box--tip"><div class="box__t">✍️ عنوانٌ ووصفٌ يستحقّان النجوم</div>
<ul>
  <li><strong>العنوان:</strong> «مجسّم دورة الماء في الطبيعة» أوضح بكثير من «مشروع علوم».</li>
  <li><strong>الوصف:</strong> اذكري ماذا صنعتِ، وبأي أدوات، وما أهم شيء تعلّمتِه.
  سطران أو ثلاثة تكفي.</li>
</ul></div>
`, "دليل الطالبة وولي الأمر");

// --- الخطوة 5 (ب)
page("", "٥ · أضيف مشروعًا", `
<h3>الصور والمرفقات والروابط</h3>
<p>بعد الوصف تجدين ثلاثة أشياء تُغني مشروعك:</p>

<table>
<tr><th>الحقل</th><th>لماذا؟</th><th>كيف؟</th></tr>
<tr><td><strong>صورة الغلاف</strong></td><td>الصورة التي تظهر على بطاقة المشروع</td>
<td>اضغطي منطقة الرفع واختاري صورة من جهازك</td></tr>
<tr><td><strong>صور إضافية</strong></td><td>خطوات العمل أو زوايا أخرى</td>
<td>يمكنك رفع أكثر من صورة</td></tr>
<tr><td><strong>رابط</strong></td><td>عرض تقديمي أو ملف PDF على Google Drive</td>
<td>ألصقي الرابط، واكتبي له اسمًا مفهومًا</td></tr>
<tr><td><strong>رمز QR</strong></td><td>يُنشأ تلقائيًا من رابطك ليُمسح بالجوّال</td>
<td>اختاري إطاره فقط</td></tr>
</table>

${row([
  ["s11-project-link", "إضافة رابط للمشروع مع اسم واضح له."],
  ["s12-project-qr", "رمز QR يُنشأ من الرابط تلقائيًا."],
])}

<div class="box box--warn"><div class="box__t">⏳ الصورة تحتاج لحظة</div>
<p>بعد اختيار الصورة انتظري حتى تظهر معاينتها. لو ضغطتِ «حفظ المشروع» قبل أن
تكتمل، ستمنعكِ المنصّة وتخبرك أن الرفع لم ينتهِ — هذا حمايةٌ لكِ حتى لا يُحفظ
مشروعك بلا صورته. وإذا كانت الصورة كبيرة جدًا فستُطلب منك صورةٌ أصغر.</p></div>
`, "دليل الطالبة وولي الأمر");

// --- الخطوة 5 (ج) الحفظ
page("", "٥ · أضيف مشروعًا", `
<h3>الحفظ — الخطوة التي لا تُنسى</h3>
<p>في أسفل النموذج شريطٌ يخبرك بحالة مشروعك دائمًا:</p>

<div class="cards">
  <div class="card card--rose"><div class="card__t">⚠ لم يُحفظ بعد</div>
    <p>كل ما كتبتِه ما زال في الشاشة فقط. لو أغلقتِ الآن ضاع.</p></div>
  <div class="card card--mint"><div class="card__t">✓ تم الحفظ</div>
    <p>مشروعك صار في ملفّك ويراه الجميع. تستطيعين الإغلاق باطمئنان.</p></div>
</div>

${row([
  ["s13-project-savebar", "شريط الحالة يقول «لم يُحفظ بعد»."],
  ["s14-project-saving", "لحظة النجاح: «تم الحفظ بنجاح»."],
  ["s15-project-saved", "ثم تُغلق النافذة، ويظهر مشروعك في ملفّك."],
])}

<div class="box box--stop"><div class="box__t">🚫 لا تضغطي «حفظ المشروع» مرّتين</div>
<p>الضغطة الأولى تكفي. المنصّة تُعطّل الزرّ أثناء الحفظ حتى لا يتكرّر مشروعك،
فانتظري ظهور «تم الحفظ» ثم أغلقي النافذة من علامة <strong>✕</strong> في أعلاها.</p></div>
`, "دليل الطالبة وولي الأمر");

// --- الخطوة 6
page("", "٦ · أعدّل وأرشّف وأحذف", `
<h2><span class="num">٦</span>مشروعي في ملفّي</h2>
<p class="sub">المشاريع مرتّبة تحت موادّها، وفي كل بطاقة ثلاثة أزرار صغيرة.</p>

${phone("s16-project-card", "بطاقة المشروع داخل مادّتها، واسم معلمة المادة مكتوبٌ فوقها.")}

<table>
<tr><th>الزرّ</th><th>ماذا يفعل؟</th><th>هل يمكن التراجع؟</th></tr>
<tr><td>✏️ <strong>تعديل</strong></td><td>يفتح المشروع لتصحيحه أو إضافة صور له</td><td>نعم — عدّلي متى شئتِ</td></tr>
<tr><td>🗄 <strong>أرشفة</strong></td><td>يُخفي المشروع من ملفّك دون حذفه</td><td>نعم — من زرّ «الأرشيف» أعلى الصفحة</td></tr>
<tr><td>🗑 <strong>حذف</strong></td><td>يمحو المشروع وصوره نهائيًا</td><td><strong>لا — لا رجعة فيه</strong></td></tr>
</table>

`, "دليل الطالبة وولي الأمر");

page("", "٦ · أعدّل وأرشّف وأحذف", `
<h3>تعديل مشروع بعد حفظه</h3>
<p>لا شيء نهائيٌّ إلا الحذف. افتحي المشروع من زرّ ✏️ فيظهر كما حفظتِه: غيّري
العنوان أو الوصف، أضيفي صورًا أو روابط، ثم احفظي.</p>

${phone("s17-project-edit", "المشروع بعد الضغط على «تعديل» — كل ما كتبتِه موجود ويمكن تغييره.")}

<div class="box box--stop"><div class="box__t">🗑 قبل أن تضغطي «حذف»</div>
<p>الحذف نهائي: يمحو المشروع وصوره وتقييم معلمتك معه. إن كنتِ تريدين إخفاءه
فقط فاستخدمي <strong>الأرشفة</strong> — تُخفيه من ملفّك ويبقى محفوظًا، وتستعيدينه
متى شئتِ. ستسألك المنصّة سؤال تأكيد قبل أي حذف.</p></div>

<h3>أرشفة أم حذف؟</h3>
<div class="cards">
  <div class="card card--mint"><div class="card__t">🗄 أرشّفي حين…</div>
    <p>تريدين ملفًّا أنظف، أو صار المشروع قديمًا. كل شيء يبقى محفوظًا ويعود بضغطة.</p></div>
  <div class="card card--rose"><div class="card__t">🗑 احذفي فقط حين…</div>
    <p>أضفتِ المشروع مرّتين بالخطأ. وتذكّري: لا رجعة بعد الحذف.</p></div>
</div>

<div class="box box--tip"><div class="box__t">💡 خانة «الظهور»</div>
<p>«ظاهر للجميع» يعني أن كل من يفتح ملفّك يراه. وإن أخفيتِه بقي في ملفّك
تَرَينه أنتِ وحدك، وتُظهرينه حين يكتمل.</p></div>
`, "دليل الطالبة وولي الأمر");

// --- الخطوة 7
page("", "٧ · إنجازاتي وشهاداتي", `
<h2><span class="num">٧</span>إنجازاتي وشهاداتي</h2>
<p class="sub">قسمان في أسفل ملفّك للمراكز والجوائز والشهادات.</p>

<div class="cards">
  <div class="card card--gold"><div class="card__t">⭐ إنجازاتي</div>
    <p>المراكز والمسابقات والمواقف التي تفتخرين بها — «المركز الأول في مسابقة القراءة».</p></div>
  <div class="card card--lilac"><div class="card__t">👑 شهاداتي</div>
    <p>الشهادات الرسمية التي حصلتِ عليها — «شهادة تفوّق الفصل الأول».</p></div>
</div>

<div class="steps">
  <div class="step">اضغطي <span class="k">+ إضافة</span> بجانب عنوان القسم المناسب.</div>
  <div class="step">اكتبي <b>العنوان</b> و<b>التاريخ</b>.</div>
  <div class="step">أضيفي <b>الجهة</b> (من منحكِ إيّاها) و<b>التصنيف</b> — اختياريان.</div>
  <div class="step">ارفعي <b>صورة الشهادة</b>، أو ألصقي رابطها إن كانت ملف PDF على Drive.</div>
  <div class="step">اضغطي <span class="k">حفظ</span>.</div>
</div>

${phone("s18-certificate", "نموذج إضافة شهادة — الحقول نفسها للإنجاز والشهادة.")}
`, "دليل الطالبة وولي الأمر");

// --- الخطوة 8
page("", "٨ · تقييم معلمتي", `
<h2><span class="num">٨</span>أقرأ تقييم معلمتي</h2>
<p class="sub">بعد أن تفتح معلمتك مشروعك، يظهر تقييمها على البطاقة نفسها.</p>

${phone("s20-evaluation-arrived", "النجوم الذهبية وحالة المشروع تظهران على بطاقة المشروع مباشرةً.")}

<table>
<tr><th>ما تراه</th><th>معناه</th></tr>
<tr><td>⭐ <strong>النجوم</strong> (من ١ إلى ٥)</td><td>تقدير معلمتك لمستوى العمل</td></tr>
<tr><td>👑 <strong>شارة التميّز</strong></td><td>لا تُمنح لكل مشروع — علامة تميّزٍ خاص</td></tr>
<tr><td>💬 <strong>تعليق المعلمة</strong></td><td>ما أعجبها، وما تقترحه للمرّة القادمة</td></tr>
<tr><td>🏷 <strong>الحالة</strong></td><td>مكتمل · قيد العمل · يحتاج مراجعة</td></tr>
</table>

<h3>ماذا أفعل بعد أن أقرأ التعليق؟</h3>
<div class="cards">
  <div class="card card--mint"><div class="card__t">مكتمل ✓</div>
    <p>اطمئنّي — العمل تمّ. اقرئي ما أعجب معلمتك واحملي هذه النقطة إلى مشروعك القادم.</p></div>
  <div class="card card--sky"><div class="card__t">قيد العمل</div>
    <p>مشروعك ما زال يُبنى. أكملي ما ينقصه، واحفظي — ستراه معلمتك محدَّثًا.</p></div>
  <div class="card card--gold"><div class="card__t">يحتاج مراجعة</div>
    <p>اقرئي التعليق بتمعّن: فيه طلبٌ محدّد. نفّذيه من زرّ «تعديل» ثم احفظي.</p></div>
</div>
`, "دليل الطالبة وولي الأمر");

page("", "٨ · تقييم معلمتي", `
<div class="box box--tip"><div class="box__t">⏳ لم يظهر التقييم بعد؟</div>
<p>معلمتك تفتح بوابتها في وقتها — التقييم لا يصل في اللحظة نفسها. أعيدي تحميل
الصفحة بعد يومٍ أو يومين. وكل معلمة تقيّم مشاريع مادّتها وحدها، فقد يصلك تقييم
العلوم قبل تقييم لغتي.</p></div>

<div class="box box--tip"><div class="box__t">💡 التعليق ليس نهاية العمل</div>
<p>إذا كتبت معلمتك اقتراحًا، تستطيعين فتح المشروع و<strong>تعديله</strong> وإضافة
ما طلبته — ملفّك ينمو معك طوال العام. و<strong>متوسّط النجوم</strong> في أعلى
ملفّك يتغيّر تلقائيًا مع كل تقييم جديد.</p></div>

<h3>ملفّك كاملًا</h3>
<p>انزلي إلى أسفل الصفحة لترَي كل ما جمعتِه هذا العام: مشاريعك في المواد
الخمس، وإنجازاتك، وشهاداتك — صفحةٌ واحدة تحكي عامك كلّه.</p>

${phone("s19-portfolio-bottom", "أسفل ملفّك: بقية المواد وإنجازاتك وشهاداتك.")}
`, "دليل الطالبة وولي الأمر");

// --- ولي الأمر
page("", "٩ · لولي الأمر", `
<h2><span class="num">٩</span>لولي الأمر</h2>
<p class="sub">كيف تتابع ابنتك، وما الذي يجب أن تعرفه.</p>

<h3>ما هذه المنصّة؟</h3>
<p>ملف إنجاز رقمي لابنتك في ${SCHOOL}. تُوثَّق فيه أعمالها الصفّية على مدار العام،
وتقرؤها معلماتها فتضع لها تقييمًا مكتوبًا بدل الدرجة وحدها.</p>

<h3>كيف أتابع؟</h3>
<div class="steps">
  <div class="step">افتح <b>الرابط نفسه</b> الذي استلمته ابنتك — لا يلزمك حساب ولا كلمة مرور.</div>
  <div class="step">احفظه في مفضّلة متصفّحك أو في شاشة جوّالك الرئيسية.</div>
  <div class="step">افتحه كل أسبوعين: سترى المشاريع الجديدة وتقييمات المعلمات.</div>
  <div class="step">اقرأ التعليقات مع ابنتك — هي أهم من عدد النجوم.</div>
</div>

`, "دليل الطالبة وولي الأمر");

page("", "٩ · لولي الأمر", `
<h3>أسئلة يسألها أولياء الأمور</h3>
<div class="qa"><div class="qa__q">هل يستطيع أحدٌ الوصول إلى ملف ابنتي؟</div>
<div class="qa__a">من يملك الرابط يستطيع فتحه وقراءته. ولهذا نؤكّد: الرابط لا يُنشر
في المجموعات العامة. والتعديل محميٌّ على مستوى قاعدة البيانات نفسها لا على مستوى
إخفاء الأزرار فقط.</div></div>

<div class="qa"><div class="qa__q">ضاع الرابط — ماذا أفعل؟</div>
<div class="qa__a">تواصل مع المشرفة. تستطيع إنشاء رابط جديد لابنتك، وإلغاء القديم
فورًا فلا يعود يعمل. لا تُفقد أي من أعمال ابنتها بذلك.</div></div>

<div class="qa"><div class="qa__q">هل أستطيع الكتابة نيابةً عنها؟</div>
<div class="qa__a">تقنيًا نعم، لكن الفائدة التربوية في أن تكتب هي. ساعدها بالمراجعة
والتشجيع، ودعها تكتب بلغتها — الملف يحكي عنها هي.</div></div>

<div class="qa"><div class="qa__q">لا تظهر الصورة بعد رفعها.</div>
<div class="qa__a">غالبًا لم يكتمل الرفع قبل الحفظ. افتح المشروع من «تعديل»، أعد
رفع الصورة، انتظر ظهور معاينتها، ثم احفظ.</div></div>

<div class="qa"><div class="qa__q">حُذف مشروع بالخطأ.</div>
<div class="qa__a">الحذف نهائي ولا يمكن استرجاعه. لهذا نوصي دائمًا باستخدام
<strong>الأرشفة</strong> بدلًا من الحذف.</div></div>

<div class="box box--safe"><div class="box__t">🔒 ما لا يُطلب منكم أبدًا</div>
<p>لن تطلب منكم المنصّة رقم هوية، ولا بيانات بنكية، ولا أي رسوم. وإن وصلتكم رسالة
تطلب ذلك باسم المنصّة فهي ليست منها — أبلغوا المدرسة.</p></div>
`, "دليل الطالبة وولي الأمر");

// --- النهاية
page("end", "", `
<h2>ملفّك ينتظرك ✨</h2>
<p class="sub">قائمةٌ سريعة قبل أن تبدئي.</p>

<div class="box box--safe"><div class="box__t">✅ تذكّري دائمًا</div>
<ul>
  <li>رابطك خاصٌّ بك — لا تنشريه، وأرسليه لوالديك فقط.</li>
  <li>لا شيء يُحفظ إلا بالضغط على زرّ <strong>الحفظ</strong>.</li>
  <li>انتظري ظهور <strong>«تم الحفظ»</strong> قبل إغلاق أي نافذة.</li>
  <li><strong>الأرشفة</strong> تُخفي، و<strong>الحذف</strong> يمحو بلا رجعة.</li>
  <li>صفٌّ أو سطران في الوصف خيرٌ من حقلٍ فارغ.</li>
  <li>اقرئي تعليق معلمتك، وعدّلي مشروعك بناءً عليه.</li>
</ul></div>

<div class="box box--safe"><div class="box__t">🆘 إذا واجهتكِ مشكلة</div>
<ul>
  <li><strong>الصفحة لا تفتح:</strong> تأكّدي من الإنترنت، ثم أعيدي تحميل الصفحة.</li>
  <li><strong>«انتهت صلاحية الرابط»:</strong> اطلبي رابطًا جديدًا من المشرفة.</li>
  <li><strong>لا تظهر أزرار التعديل:</strong> فتحتِ الصفحة برابط عام لا برابطك الخاص.</li>
  <li><strong>الكتابة لا تُحفظ:</strong> تأكّدي من الضغط على «حفظ» وظهور رسالة النجاح.</li>
</ul></div>

<p style="margin-top:26px;font-family:var(--display);font-weight:600;font-size:14pt;
   text-align:center;color:#ffd98a;">كل إنجازٍ… يحكي قصّة تميّز</p>
<p style="text-align:center;font-size:10pt;">${SCHOOL} · الصف الرابع / 2</p>
`, "دليل الطالبة وولي الأمر");

writeFileSync(`${OUT}/student.html`, doc("دليل الطالبة وولي الأمر — إنجازي يحكي", P.join("")));

/* ==================================================================
   الدليل الثاني — المعلمة
   ================================================================== */
const T = [];
let tn = 0;
const tpage = (cls, section, inner) => {
  tn++;
  T.push(`<div class="page ${cls}">${section ? head(section) : ""}${inner}${foot(
    "دليل المعلمة",
    tn,
  )}</div>`);
};

T.push(`<div class="page cover">${stars(19, 190)}<div class="cover__inner">
  <span class="cover__badge">${STAR_ICON} بوابة المعلمات</span>
  <div class="cover__kicker">دليل الاستخدام</div>
  <h1 class="cover__title">للمعلمة</h1>
  <div class="cover__rule"></div>
  <p class="cover__lede">كيف تدخلين بوابتك، وتجدين مشاريع طالباتك، وتضعين النجوم
  وشارة التميّز والتعليق — وكيف تكتبين تقييمًا يصنع فرقًا حقيقيًا في تعلّم الطالبة.</p>
  <div class="cover__foot">
    <div><div class="cover__school">${SCHOOL}</div>
      <div>الصف الرابع / 2 · العام الدراسي ١٤٤٨هـ</div></div>
    <div>${SITE}</div>
  </div></div></div>`);
tn = 1;

tpage("", "دورك في المنصّة", `
<h2>تقييمكِ… هو صوت المنصّة</h2>
<p class="sub">الطالبة تكتب، وأنتِ تقرئين وتردّين. هذا الردّ هو ما يبقى.</p>

<p>في «إنجازي يحكي» ترفع الطالبة مشاريعها وأوراق عملها في مادّتك، فتصل إلى
<strong>بوابة المعلمات</strong> مباشرةً. دورك أن تفتحي المشروع، وتضعي له نجومًا
وحالةً وتعليقًا مكتوبًا — وربما شارة تميّز. ويظهر تقييمك في ملف الطالبة فورًا،
يقرؤه والداها كما تقرؤه هي.</p>

<div class="cards">
  <div class="card card--sky"><div class="card__t">١ · ترين</div>
    <p>مشاريع مادّتك فقط، من كل الطالبات، مرتّبةً ويمكن البحث فيها.</p></div>
  <div class="card card--gold"><div class="card__t">٢ · تقيّمين</div>
    <p>نجوم من ١ إلى ٥، وحالة، وشارة تميّز، وتعليق مكتوب.</p></div>
  <div class="card card--mint"><div class="card__t">٣ · يصل فورًا</div>
    <p>يظهر تقييمك في ملف الطالبة في اللحظة نفسها.</p></div>
</div>

<h3>محتويات الدليل</h3>
<div class="toc">
  <div class="toc__row"><span class="toc__n">١</span><span class="toc__t">الدخول إلى بوابتك</span><span class="toc__d">برابطك الخاص — بلا كلمة مرور</span></div>
  <div class="toc__row"><span class="toc__n">٢</span><span class="toc__t">بوابتك</span><span class="toc__d">ما الذي ترينه وما الذي لا ترينه</span></div>
  <div class="toc__row"><span class="toc__n">٣</span><span class="toc__t">البحث والتصفية</span><span class="toc__d">الوصول إلى مشروع بعينه</span></div>
  <div class="toc__row"><span class="toc__n">٤</span><span class="toc__t">تقييم مشروع</span><span class="toc__d">النجوم والحالة والشارة والتعليق</span></div>
  <div class="toc__row"><span class="toc__n">٥</span><span class="toc__t">التقييم بعد الحفظ</span><span class="toc__d">التعديل والاطمئنان</span></div>
  <div class="toc__row"><span class="toc__n">٦</span><span class="toc__t">فتح ملف الطالبة</span><span class="toc__d">رؤية الصورة كاملة</span></div>
  <div class="toc__row"><span class="toc__n">٧</span><span class="toc__t">كيف أكتب تعليقًا نافعًا</span><span class="toc__d">أمثلة عملية</span></div>
  <div class="toc__row"><span class="toc__n">٨</span><span class="toc__t">أسئلة شائعة</span><span class="toc__d">حلول للمواقف المتكرّرة</span></div>
</div>
`);

tpage("", "١ · الدخول إلى بوابتك", `
<h2><span class="num">١</span>الدخول إلى بوابتك</h2>
<p class="sub">رابطٌ واحد خاصٌّ بكِ — بلا بريد، وبلا كلمة مرور، وبلا تسجيل.</p>

<p>المنصّة لا تطلب منكِ حسابًا ولا كلمة سرّ. تستلمين من المشرفة
<strong>رابطًا خاصًّا بكِ وحدك</strong>، وفتحُكِ إيّاه هو الدخول نفسه:
تفتح بوابتك باسمك ومادّتك مباشرةً.</p>

<div class="steps">
  <div class="step"><b>استلمي رابطك من المشرفة.</b> يصلك في الواتساب أو
  الرسائل. شكله: <span class="k">${SITE}/#/t/…</span></div>
  <div class="step"><b>اضغطي الرابط.</b> تظهر شاشة قصيرة مكتوبٌ فيها
  «جارٍ فتح بوابتك…».</div>
  <div class="step"><b>تفتح بوابتك</b> ويظهر اسمك في أعلاها. لا خطوة بعدها.</div>
  <div class="step"><b>احفظي الرابط.</b> في مفضّلة المتصفّح، أو أضيفيه إلى
  شاشة جوّالك الرئيسية ليصير أيقونةً تفتحينها بضغطة.</div>
</div>

${wide("t01-link-opening", "شاشة فتح الرابط — تظهر لحظةً ثم تنتقلين إلى بوابتك تلقائيًا.")}
`);

tpage("", "١ · الدخول إلى بوابتك", `
<div class="box box--safe"><div class="box__t">🔒 رابطك هو مفتاحك</div>
<p>ما دام الدخول بالرابط وحده، فالرابط نفسه يعادل كلمة المرور تمامًا:</p>
<ul>
  <li>لا ترسليه في مجموعة واتساب، ولا تنشريه، ولا تُصوّري الشاشة وفيه ظاهر.</li>
  <li>من يفتحه يدخل بوابتك باسمك، ويستطيع التقييم نيابةً عنك.</li>
  <li>على جهاز مشترك: اضغطي <strong>خروج</strong> بعد الانتهاء.</li>
  <li>إن تسرّب الرابط أو شككتِ فيه: أبلغي المشرفة فورًا — تُلغيه في ثانية
  وتُنشئ لكِ غيره، ولا يضيع شيء من تقييماتك.</li>
</ul></div>

<h3>لم يفتح الرابط — ما السبب؟</h3>
<table>
<tr><th>ما يظهر لكِ</th><th>السبب والحل</th></tr>
<tr><td>«تعذّر فتح الرابط»</td>
<td>الرابط أُلغي أو استُبدل — اطلبي من المشرفة رابطًا جديدًا</td></tr>
<tr><td>الرابط لا يعمل بعد نسخه</td>
<td>غالبًا نُسخ ناقصًا. انسخيه كاملًا من أوّله إلى آخره، أو اطلبي إرساله من جديد</td></tr>
<tr><td>«تعذّر الاتصال»</td>
<td>الإنترنت منقطع أو ضعيف — أعيدي المحاولة بعد عودته</td></tr>
<tr><td>دخلتُ لكن بلا مادة</td>
<td>رابطك لم يُربط بمادتك بعد — تواصلي مع المشرفة</td></tr>
</table>

${wide("t02-link-failed", "هكذا تبدو الشاشة إن لم يعد الرابط صالحًا — والحلّ رابطٌ جديد من المشرفة.")}
`);

tpage("", "٢ · بوابتك", `
<h2><span class="num">٢</span>بوابتك</h2>
<p class="sub">بعد الدخول تفتح لكِ صفحةٌ واحدة فيها كل ما يخصّ مادّتك.</p>

${wide("t03-portal", "بوابة المعلمات: مشاريع مادّتك من جميع الطالبات في مكان واحد.")}

<table>
<tr><th>العنصر</th><th>ماذا يعني؟</th></tr>
<tr><td><strong>اسمك ومادّتك</strong></td><td>في الأعلى — تأكيدٌ أنكِ فتحتِ رابطكِ أنتِ لا رابط زميلتك</td></tr>
<tr><td><strong>بطاقات الطالبات</strong></td><td>كل طالبة وبطاقتها، ومنها تفتحين ملفّها كاملًا</td></tr>
<tr><td><strong>قائمة المشاريع</strong></td><td>مشاريع مادّتك مرتّبةً — اضغطي أي بطاقة لتقييمها</td></tr>
<tr><td><strong>النجوم على البطاقة</strong></td><td>المشروع مُقيَّم من قبل · بلا نجوم = ينتظر تقييمك</td></tr>
</table>

<div class="box box--safe"><div class="box__t">🔒 لماذا لا أرى مشاريع المواد الأخرى؟</div>
<p>هذا مقصود. كل معلمة ترى مشاريع مادّتها وحدها، والحماية مطبّقة في
<strong>قاعدة البيانات نفسها</strong> لا في إخفاء الأزرار فقط: لو حاول أحد قراءة
مشاريع مادةٍ أخرى لرُفض الطلب من الخادم. وكذلك لا تستطيع معلمةٌ تعديل تقييم زميلتها.</p></div>
`);

tpage("", "٣ · البحث والتصفية", `
<h2><span class="num">٣</span>البحث والتصفية</h2>
<p class="sub">حين يكثر العدد، تصلين إلى ما تريدين في ثوانٍ.</p>

${wide("t04-filters", "بطاقات الطالبات الثماني، وتحتها أدوات البحث والتصفية والترتيب في قسم «مشاريع الطالبات».")}

<div class="cards">
  <div class="card card--lilac"><div class="card__t">🔎 البحث بالاسم</div>
    <p>اكتبي جزءًا من اسم الطالبة أو عنوان المشروع — تُصفّى القائمة أثناء الكتابة.</p></div>
  <div class="card card--sky"><div class="card__t">🏷 التصفية بالحالة</div>
    <p>اعرضي «قيد العمل» أو «يحتاج مراجعة» لتعرفي ما ينتظرك.</p></div>
  <div class="card card--mint"><div class="card__t">👩‍🎓 بطاقة الطالبة</div>
    <p>افتحي ملف طالبة بعينها لترَي أعمالها في المواد كلها.</p></div>
</div>

<div class="box box--tip"><div class="box__t">💡 روتين أسبوعي مقترح</div>
<p>خصّصي عشرين دقيقة أسبوعيًا: افتحي البوابة، رتّبي بالأحدث، وقيّمي كل مشروع
جديد. التقييم الذي يصل بعد أسبوع يفيد الطالبة أضعاف ما يفيدها بعد شهر.</p></div>
`);

tpage("", "٤ · تقييم مشروع", `
<h2><span class="num">٤</span>تقييم مشروع</h2>
<p class="sub">اضغطي بطاقة المشروع لتفتح نافذة التقييم.</p>

${wide("t05-project-card", "بطاقة المشروع في قائمة مادّتك — اضغطيها لتفتح التقييم.")}
${wide("t06-eval-open", "نافذة التقييم: بيانات المشروع ووصفه ومرفقاته في الأعلى، وأدوات التقييم تحتها.")}

<div class="box box--warn"><div class="box__t">⏳ انتظري اكتمال التحميل</div>
<p>إن كان للمشروع تقييمٌ سابق — منكِ أو من المعلمة السابقة — فسيظهر في النافذة
عند تحميلها. لا تحفظي قبل أن يظهر: المنصّة تُعطّل زرّ الحفظ حتى يكتمل التحميل
حمايةً لتقييمكِ السابق من أن يُمحى بالخطأ.</p></div>
`);

tpage("", "٤ · تقييم مشروع", `
<h3>النجوم والحالة</h3>
${wide("t07-eval-stars", "اختيار النجوم بالضغط على النجمة المطلوبة — والحالة أسفلها.")}

<table>
<tr><th>النجوم</th><th>متى؟</th></tr>
<tr><td>⭐ واحدة</td><td>محاولة أولى تحتاج إعادة</td></tr>
<tr><td>⭐⭐ اثنتان</td><td>ناقص في عناصر أساسية</td></tr>
<tr><td>⭐⭐⭐ ثلاث</td><td>أدّى المطلوب</td></tr>
<tr><td>⭐⭐⭐⭐ أربع</td><td>جيد جدًا مع إتقان واضح</td></tr>
<tr><td>⭐⭐⭐⭐⭐ خمس</td><td>متميّز في التنفيذ والعرض معًا</td></tr>
</table>

<table>
<tr><th>الحالة</th><th>معناها للطالبة</th></tr>
<tr><td><strong>مكتمل</strong></td><td>العمل تمّ ولا مطلوب بعده</td></tr>
<tr><td><strong>قيد العمل</strong></td><td>ما زال يُبنى — تكملينه معها</td></tr>
<tr><td><strong>يحتاج مراجعة</strong></td><td>عليها تعديلٌ محدّد اذكريه في التعليق</td></tr>
</table>

<div class="box box--tip"><div class="box__t">👑 شارة التميّز</div>
<p>اضغطي مربّع الشارة لتمنحيها. قيمتها في نُدرتها: لو مُنحت لكل مشروع فقدت
معناها. احفظيها للعمل الذي يستحقّ أن يُعرض على الفصل كلّه.</p></div>
`);

tpage("", "٤ · تقييم مشروع", `
<h3>التعليق — أهمّ حقلٍ في الصفحة</h3>
${wide("t08-eval-comment", "التعليق المكتوب — الطالبة تقرؤه، ووالداها يقرآنه معها.")}
${wide("t09-eval-bottom", "أسفل النافذة: الشارة والحالة وزرّ «حفظ التقييم».")}

<div class="steps">
  <div class="step">اختاري <b>النجوم</b>.</div>
  <div class="step">اختاري <b>الحالة</b> من القائمة.</div>
  <div class="step">امنحي <b>شارة التميّز</b> إن استحقّها العمل.</div>
  <div class="step">اكتبي <b>التعليق</b>.</div>
  <div class="step">اضغطي <span class="k">حفظ التقييم</span> — ضغطةً واحدة وانتظري.</div>
</div>
`);

tpage("", "٥ · التقييم بعد الحفظ", `
<h2><span class="num">٥</span>التقييم بعد الحفظ</h2>
<p class="sub">يصل إلى ملف الطالبة فورًا، ويبقى محفوظًا.</p>

${wide("t10-eval-saved", "بعد الحفظ تُغلق النافذة، وتظهر نجومك وحالة المشروع على بطاقته في قائمتك مباشرةً.")}
`);

tpage("", "٥ · التقييم بعد الحفظ", `
${wide("t11-eval-persisted", "عند إعادة فتح المشروع لاحقًا: نجومك وتعليقك كما تركتِهما.")}

<div class="box box--tip"><div class="box__t">✏️ التعديل متاحٌ دائمًا</div>
<p>افتحي المشروع مرّةً أخرى، غيّري ما تشائين، ثم احفظي. يحلّ التقييم الجديد محلّ
القديم — ولا يُنشأ تقييمان لمشروع واحد.</p></div>

<div class="box box--warn"><div class="box__t">🌐 إن انقطع الإنترنت أثناء الحفظ</div>
<p>ستظهر لكِ رسالة واضحة بالعربية تشرح السبب — ولن تُترك في حيرة. أعيدي المحاولة
بعد عودة الاتصال، وتقييمك السابق يبقى كما هو ولا يُمحى.</p></div>
`);

tpage("", "٦ · فتح ملف الطالبة", `
<h2><span class="num">٦</span>فتح ملف الطالبة</h2>
<p class="sub">أحيانًا يحتاج التقييم العادل أن ترَي الصورة كاملة.</p>

${wide("t12-student-view", "ملف الطالبة كما ترينه: مشاريعها في كل المواد، وهواياتها، وإنجازاتها وشهاداتها.")}

<p>من الصفحة الرئيسية للمنصّة، أو من بطاقة الطالبة في بوابتك، تفتحين ملفّها
كاملًا فترين: ما كتبته عن نفسها، وهواياتها، ومشاريعها في المواد الأخرى، وشهاداتها،
وتقييمات زميلاتك المعلمات.</p>

<div class="box box--safe"><div class="box__t">🔒 القراءة مفتوحة… والتعديل مغلق</div>
<p>أنتِ تقرئين ملف الطالبة كاملًا، لكنكِ لا ترين أزرار تعديل محتواها — ولن تفتح
لكِ نماذج التعديل حتى لو حاولتِ الضغط على بطاقة مشروع. محتوى الطالبة ملكها وحدها،
والتقييم ملككِ وحدك. وهذا مطبَّق في قاعدة البيانات لا في الواجهة فقط.</p></div>
`);

tpage("", "٧ · كيف أكتب تعليقًا نافعًا", `
<h2><span class="num">٧</span>كيف أكتب تعليقًا نافعًا</h2>
<p class="sub">التعليق الجيّد يُقرأ مرّات، ويغيّر المشروع القادم.</p>

<h3>ثلاث خطوات في ثلاثة أسطر</h3>
<div class="steps">
  <div class="step"><b>سمّي ما أُتقن بالتحديد.</b> لا «ممتاز» وحدها، بل
  «ترتيب المراحل الثلاث كان واضحًا».</div>
  <div class="step"><b>اذكري خطوةً واحدة للتحسين.</b> واحدة فقط — أكثر من ذلك
  يُربك طالبة في التاسعة.</div>
  <div class="step"><b>اختمي بتشجيع صادق.</b> جملة قصيرة تدفعها للمشروع القادم.</div>
</div>

<table>
<tr><th>بدلًا من</th><th>اكتبي</th></tr>
<tr><td>«ممتاز»</td><td>«شرحُكِ لدورة الماء كان واضحًا ومرتّبًا، والمجسّم أظهر المراحل الثلاث بدقّة.»</td></tr>
<tr><td>«ناقص»</td><td>«ينقص المشروع صورة للخطوة الأخيرة — أضيفيها وسيكتمل تمامًا.»</td></tr>
<tr><td>«أعيدي العمل»</td><td>«فكرتك صحيحة، لكن الوصف مختصر. اكتبي سطرين عمّا تعلّمتِه وسيصير متكاملًا.»</td></tr>
<tr><td>«خط رديء»</td><td>«المحتوى قويّ — لو كتبتِ العناوين بخطٍّ أكبر لظهر أجمل.»</td></tr>
</table>

<div class="box box--tip"><div class="box__t">💡 اكتبي للطالبة لا عنها</div>
<p>خاطبيها مباشرةً بضمير المخاطب: «أحسنتِ في…»، «جرّبي في المرّة القادمة…».
الطالبة تقرأ تعليقك بنفسها — وكذلك والداها.</p></div>
`);

tpage("", "٨ · أسئلة شائعة", `
<h2><span class="num">٨</span>أسئلة شائعة</h2>

<div class="qa"><div class="qa__q">دخلتُ ولا أرى أي مشروع.</div>
<div class="qa__a">إمّا أن طالباتك لم يرفعن شيئًا بعد في مادّتك، أو أن رابطك غير
مربوطٍ بالمادة الصحيحة. تأكّدي أوّلًا من اسم المادة المكتوب تحت اسمك في أعلى
البوابة، ثم تواصلي مع المشرفة إن كان خطأً.</div></div>

<div class="qa"><div class="qa__q">أرى مشروعًا لطالبة ليست في فصلي.</div>
<div class="qa__a">البوابة تعرض مشاريع مادّتك من كل الطالبات المسجّلات في المنصّة.
هذا هو السلوك الصحيح — قيّمي ما يخصّ مادّتك.</div></div>

<div class="qa"><div class="qa__q">حفظتُ التقييم ولم يظهر عند الطالبة.</div>
<div class="qa__a">اطلبي منها إعادة تحميل الصفحة. وإن لم يظهر، افتحي المشروع من
بوابتك وتأكّدي أن النجوم والتعليق محفوظان فعلًا داخل النافذة.</div></div>

<div class="qa"><div class="qa__q">هل أستطيع تعديل تقييم معلمة أخرى؟</div>
<div class="qa__a">لا. كل معلمة تملك تقييماتها وحدها، وتُرفض المحاولة من الخادم
نفسه لا من الواجهة فقط.</div></div>

<div class="qa"><div class="qa__q">حذفت الطالبة مشروعًا قيّمتُه.</div>
<div class="qa__a">يُحذف التقييم معه — التقييم تابعٌ للمشروع. ولا يمكن استرجاعه.</div></div>

<div class="qa"><div class="qa__q">اختفت الكتابة أثناء كتابتي التعليق.</div>
<div class="qa__a">لم يعد هذا يحدث؛ النافذة تحتفظ بما تكتبينه ولا تمحوه أثناء
الكتابة. لو تكرّر الأمر فأبلغي المشرفة بوصف دقيق لما حدث.</div></div>

<div class="qa"><div class="qa__q">ظهرت رسالة خطأ بالعربية — ماذا أفعل؟</div>
<div class="qa__a">اقرئيها: الرسائل مكتوبة لتُفهم لا لتُتجاهل. غالبًا تخبرك بانقطاع
الاتصال أو نقص صلاحية. عالجي السبب وأعيدي المحاولة.</div></div>

<div class="qa"><div class="qa__q">فقدتُ رابطي / غيّرتُ جوّالي.</div>
<div class="qa__a">اطلبي من المشرفة إرساله مرّةً أخرى، أو إنشاء رابطٍ جديد لكِ.
تقييماتك السابقة كلها محفوظة ولا يمسّها ذلك. ولو خشيتِ أن يكون القديم قد
تسرّب فاطلبي إلغاءه صراحةً.</div></div>
`);

tpage("end", "", `
<h2>شكرًا لكِ ✨</h2>
<p class="sub">قائمةٌ سريعة تحفظ لكِ وقتك وجهدك.</p>

<div class="box box--safe"><div class="box__t">✅ قبل أن تحفظي أي تقييم</div>
<ul>
  <li>انتظري اكتمال تحميل النافذة — لا تحفظي على نموذجٍ لم يظهر تقييمه السابق.</li>
  <li>راجعي النجوم والحالة معًا: نجومٌ عالية مع «يحتاج مراجعة» تُربك الطالبة.</li>
  <li>اكتبي تعليقًا ولو سطرًا — بلا تعليقٍ تبقى النجوم رقمًا صامتًا.</li>
  <li>اضغطي «حفظ التقييم» مرّةً واحدة وانتظري رسالة النجاح.</li>
  <li>على جهازٍ مشترك: سجّلي الخروج.</li>
</ul></div>

<div class="box box--safe"><div class="box__t">🔒 الحماية التي تعمل خلفك</div>
<ul>
  <li>كل معلمة ترى مادّتها وتملك تقييماتها وحدها.</li>
  <li>لا تستطيع معلمة تعديل تقييم زميلتها ولا محتوى الطالبة.</li>
  <li>القواعد مطبَّقة في قاعدة البيانات لا في إخفاء الأزرار.</li>
  <li>رابطك مفتاحك: لا يُنشر ولا يُصوَّر، ويُلغى فورًا إن تسرّب.</li>
</ul></div>

<p style="margin-top:26px;font-family:var(--display);font-weight:600;font-size:14pt;
   text-align:center;color:#ffd98a;">كل إنجازٍ… يحكي قصّة تميّز</p>
<p style="text-align:center;font-size:10pt;">${SCHOOL} · الصف الرابع / 2</p>
`);

writeFileSync(`${OUT}/teacher.html`, doc("دليل المعلمة — إنجازي يحكي", T.join("")));

// ================= التصيير إلى PDF =================
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await browser.newContext();
for (const [html, pdf, label] of [
  ["student.html", "دليل-الطالبة-وولي-الأمر.pdf", "دليل الطالبة وولي الأمر"],
  ["teacher.html", "دليل-المعلمة.pdf", "دليل المعلمة"],
]) {
  const p = await ctx.newPage();
  await p.goto(`file://${OUT}/${html}`, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2500);
  await p.pdf({ path: `${OUT}/${pdf}`, format: "A4", printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await p.close();
  console.log(`✓ ${label} → ${pdf}`);
}
await browser.close();
