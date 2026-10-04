/*
  مولّد ورقة التعريف الرسمية بمنصة «إنجازي يحكي» — صفحة A4 واحدة.
  ==================================================================
  لمن؟ للجنة الزائرة وللإدارة التي ترفعها إلى إدارة التعليم.

  • الهوية: ألوان وخطوط «دليل الهوية البصرية لوزارة التعليم» كما هي —
    الأخضر #07a869 والكحلي #15445a والفيروزي #0da9a6 والأزرق #3d7eb9
    والرملي #c1b489، وخطّ Helvetica Neue W23 for SKY بوزنيه.
  • شعار الوزارة في هذه الورقة وحدها — لا يدخل المنصة نفسها.
  • الباركود يحمل رابطًا لا صورة: لوحة العرض تُقرأ من قاعدة البيانات
    لحظة الفتح، فتظهر فيها التقييمات والطالبات والمشاريع الجديدة بلا
    إعادة طباعة الورقة أبدًا.

  الأصول خارج المستودع عمدًا (خطوط مرخّصة وصور الطالبات):
    IZ_SHEET_DIR (افتراضيًا /tmp/sheet) يحوي
      fonts/sky-reg.ttf   fonts/sky-bd.ttf
      assets/moe-logo.png assets/moe-dots.png
      shots/board.png shots/projects.png shots/phone.png

  التشغيل:  node scripts/buildCommitteeSheet.mjs
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { chromium } from "playwright";
import QRCode from "qrcode";

const DIR = process.env.IZ_SHEET_DIR || "/tmp/sheet";
const OUT = process.env.IZ_SHEET_OUT || "docs/committee";
const BOARD_URL = process.env.IZ_BOARD_URL || "https://mauve-pi-99.vercel.app/#/board";

// ------------------------------------------------------------ الهوية
const C = {
  green: "#07a869",
  navy: "#15445a",
  teal: "#0da9a6",
  blue: "#3d7eb9",
  sand: "#c1b489",
  grey: "#c2c1c1",
};

// ------------------------------------------------------------ الأصول
function need(p) {
  if (!existsSync(p)) throw new Error(`أصل مفقود: ${p}`);
  return p;
}
const b64 = (p) => readFileSync(need(p)).toString("base64");
const png = (p) => `data:image/png;base64,${b64(p)}`;

const fontReg = b64(`${DIR}/fonts/sky-reg.ttf`);
const fontBd = b64(`${DIR}/fonts/sky-bd.ttf`);
const logo = png(`${DIR}/assets/moe-logo.png`);
const dots = png(`${DIR}/assets/moe-dots.png`);

/*
  اللقطات تُضغَط قبل التضمين: أصلها PNG بكثافة ×2 (~١٫٦ ميغابايت لكل
  واحدة) فتخرج الورقة بأكثر من خمسة ميغابايت ويتعذّر إرسالها. العرض
  المستهدف هنا يفوق ما تحتاجه الطباعة عند مقاسها على الصفحة.
*/
const encoder = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const encPage = await (await encoder.newContext()).newPage();

async function shot(name, maxWidth) {
  const raw = png(`${DIR}/shots/${name}.png`);
  return encPage.evaluate(
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
          resolve(c.toDataURL("image/jpeg", 0.9));
        };
        im.src = src;
      }),
    [raw, maxWidth],
  );
}

const shotBoard = await shot("board", 1180);
const shotProjects = await shot("projects", 1180);
const shotPhone = await shot("phone", 520);
await encoder.close();

// ---------------------------------------------------------- الباركود
/*
  مستوى تصحيح الخطأ H: الرمز يُقرأ ولو اتّسخت الورقة أو انطوى ركنها،
  وهو شرط عملي لورقة تُتداول باليد في زيارة لجنة.
*/
const qr = await QRCode.toDataURL(BOARD_URL, {
  errorCorrectionLevel: "H",
  margin: 1,
  width: 900,
  color: { dark: C.navy, light: "#ffffff" },
});

// -------------------------------------------------------------- النص
const PLATFORM = "إنجازي يحكي";
const SCHOOL = "المدرسة الابتدائية الخامسة والستون بعد المائة";
const DEPARTMENT = "الإدارة العامة للتعليم بمحافظة جدة";

const ROWS = [
  [
    "اسم المنصة",
    `<b>${PLATFORM}</b> — ملف الإنجاز الرقمي لطالبات الصف الرابع / ٢.`,
  ],
  [
    "ما هي",
    "ملف إنجاز إلكتروني لكل طالبة، تُرفع فيه أعمالها بالصورة والرابط، ويبقى محفوظًا منظَّمًا طوال العام يُفتح بضغطة.",
  ],
  [
    "الهدف منها",
    "تشجيع الطالبات على الإنجاز وإبراز أعمالهن، وتقدير المتميّزة منهن بوسام يظهر في ملفها ويراه الجميع.",
  ],
  [
    "بدل الأوراق",
    "عمل إلكتروني بالكامل بدل الملفات الورقية: لا يُحمَل ولا يتلف ولا يُفقد، ويُراجَع من أي جهاز.",
  ],
  [
    "مواكبة توجّه الوزارة",
    "استجابةً لدعوة وزارة التعليم إلى توظيف التطبيقات الإلكترونية والذكاء الاصطناعي في العمل التربوي.",
  ],
  [
    "تصميم محبَّب للطالبات",
    "ألوان وحركات وبطاقة تختارها الطالبة لنفسها، و<b>أنشودة بأسماء الطالبات</b> تُسمَع داخل المنصة فتحمّسهن على إنجاز مشاريعهن.",
  ],
  [
    "تقييم المعلمات",
    "لكل معلمة بوابتها الخاصة: نجوم، ووسام تميّز، وتعليق مكتوب يظهر في ملف الطالبة فور حفظه.",
  ],
  [
    "الصلاحيات والخصوصية",
    "الدخول بالصلاحية: لوحة الإدارة بكلمة مرور، ولكل معلمة وطالبة مدخلها في حدوده. وهذا الباركود <b>للعرض والمشاهدة فقط</b> لا يعدّل شيئًا.",
  ],
  [
    "المحتوى حتى تاريخه",
    "٨ طالبات، و١٠ معلمات، و١٠ مواد، و٥٣ مشروعًا — والعدد يتزايد، ويظهر محدَّثًا داخل اللوحة.",
  ],
];

const tableRows = ROWS.map(
  ([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`,
).join("");

// ------------------------------------------------------------- الصفحة
const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>التعريف بمنصة ${PLATFORM}</title>
<style>
@font-face{font-family:"SKY";font-weight:400;font-style:normal;font-display:block;
  src:url(data:font/ttf;base64,${fontReg}) format("truetype");}
@font-face{font-family:"SKY";font-weight:700;font-style:normal;font-display:block;
  src:url(data:font/ttf;base64,${fontBd}) format("truetype");}

@page{size:A4;margin:0;}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:210mm;}
body{
  font-family:"SKY","Tajawal",sans-serif;
  color:${C.navy};
  -webkit-print-color-adjust:exact;print-color-adjust:exact;
}

/* ارتفاع الصفحة 296mm لا 297: الكسر العشري الزائد يدفع سطرًا فارغًا
   إلى صفحة ثانية في الطباعة، وهذه ورقة من صفحة واحدة. */
.sheet{
  position:relative;width:210mm;height:296mm;overflow:hidden;
  padding:0 13mm 7mm;background:#ffffff;
  display:flex;flex-direction:column;
}

/* ---------------- الخلفية ---------------- */
.bg{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
.bg__band{position:absolute;top:0;left:0;right:0;height:5mm;
  background:linear-gradient(90deg,${C.navy} 0%,${C.blue} 32%,${C.teal} 64%,${C.green} 100%);}
.bg__wash-a{position:absolute;top:-30mm;left:-35mm;width:135mm;height:135mm;border-radius:50%;
  background:radial-gradient(circle,rgba(7,168,105,.10) 0%,rgba(7,168,105,0) 70%);}
.bg__wash-b{position:absolute;bottom:-45mm;right:-40mm;width:150mm;height:150mm;border-radius:50%;
  background:radial-gradient(circle,rgba(61,126,185,.10) 0%,rgba(61,126,185,0) 70%);}
.bg__dots{position:absolute;bottom:38mm;left:-16mm;width:120mm;opacity:.05;}
.bg__corner{position:absolute;top:5mm;right:0;width:46mm;height:46mm;
  background:linear-gradient(225deg,rgba(13,169,166,.14) 0%,rgba(13,169,166,0) 60%);}

.sheet > *:not(.bg){position:relative;z-index:1;}

/* ---------------- الترويسة الرسمية ----------------
   شعار وزارة التعليم في أعلى الصفحة لا في أسفلها: الشعار الرسمي
   لا يُنكَّس تحت المحتوى في أي مخاطبة رسمية. */
.letterhead{
  display:flex;align-items:center;justify-content:space-between;gap:5mm;
  padding:7mm 0 4mm;border-bottom:.35mm solid rgba(21,68,90,.16);
}
.letterhead__side{flex:1 1 0;font-size:8.4pt;line-height:1.62;color:${C.navy};}
.letterhead__side--left{text-align:left;}
.letterhead__kingdom{font-weight:700;font-size:8.8pt;}
.letterhead__org{color:#4a6b78;}
.letterhead__logo{flex:0 0 auto;height:17mm;display:block;}

.head{padding:5.5mm 0 0;text-align:center;}
.head__eyebrow{
  display:inline-block;padding:1.4mm 5mm;border-radius:999px;
  background:rgba(7,168,105,.10);color:${C.green};
  font-weight:700;font-size:8.6pt;letter-spacing:.2px;
}
.head__title{
  margin-top:2.6mm;font-weight:700;font-size:27pt;line-height:1.1;color:${C.navy};
}
.head__rule{
  width:40mm;height:1.1mm;margin:3mm auto 0;border-radius:999px;
  background:linear-gradient(90deg,${C.green},${C.teal},${C.blue});
}
.head__sub{margin-top:2.6mm;font-size:11pt;color:#3c6376;}

/* ---------------- الصف الأوسط ---------------- */
.row{display:flex;gap:5mm;margin-top:5.5mm;align-items:stretch;}

.table-wrap{flex:1 1 auto;min-width:0;}
.t-title{
  display:flex;align-items:center;gap:2.4mm;
  font-weight:700;font-size:11pt;color:${C.navy};margin-bottom:2.6mm;
}
.t-title::before{content:"";width:2mm;height:5.4mm;border-radius:999px;background:${C.green};}
table{width:100%;border-collapse:separate;border-spacing:0;
  border:.35mm solid rgba(21,68,90,.16);border-radius:3mm;overflow:hidden;}
th,td{text-align:right;vertical-align:top;padding:1.75mm 2.8mm;font-size:8.1pt;line-height:1.52;}
th{
  width:33mm;font-weight:700;color:${C.navy};
  background:rgba(21,68,90,.055);border-left:.35mm solid rgba(21,68,90,.12);
}
td{color:#324f5c;}
tr + tr th,tr + tr td{border-top:.35mm solid rgba(21,68,90,.11);}
tr:nth-child(even) td{background:rgba(13,169,166,.035);}
b{font-weight:700;color:${C.navy};}

/* ---------------- بطاقة الباركود ---------------- */
.qr{
  flex:0 0 56mm;display:flex;flex-direction:column;align-items:center;
  padding:5mm 4mm 4.5mm;border-radius:4mm;text-align:center;
  border:.4mm solid rgba(7,168,105,.3);
  background:linear-gradient(180deg,#ffffff 0%,rgba(7,168,105,.06) 100%);
}
.qr__img{width:40mm;height:40mm;border-radius:2mm;background:#fff;}
.qr__name{margin-top:3.4mm;font-weight:700;font-size:13pt;color:${C.navy};}
.qr__kind{margin-top:.8mm;font-size:8.6pt;color:${C.green};font-weight:700;}
.qr__note{
  margin-top:3mm;padding-top:2.6mm;border-top:.35mm dashed rgba(21,68,90,.22);
  font-size:7.8pt;line-height:1.6;color:#44636f;
}
.qr__scan{margin-top:2.2mm;font-size:7.4pt;color:#7b949e;}

/* ---------------- شريط اللقطات ---------------- */
.shots{display:flex;gap:3.5mm;margin-top:5.5mm;align-items:flex-end;}
.shot{flex:1 1 0;border-radius:2.6mm;overflow:hidden;
  border:.35mm solid rgba(21,68,90,.18);background:#1a1430;}
.shot img{display:block;width:100%;height:29.5mm;object-fit:cover;object-position:top center;}
.shot--mid img{object-position:center center;}
.shot--phone{flex:0 0 24mm;}
.shot--phone img{object-position:top center;}
.shots__cap{margin-top:2.2mm;text-align:center;font-size:7.6pt;color:#7b949e;}

/* ---------------- التوسّع ---------------- */
.grow{
  display:flex;align-items:center;gap:3mm;margin-top:5mm;
  padding:3.2mm 5mm;border-radius:3mm;
  background:rgba(7,168,105,.085);border-right:1.6mm solid ${C.green};
  font-weight:700;font-size:10.4pt;color:${C.navy};
}

.spacer{flex:1 1 auto;min-height:0;}

/* ---------------- التواقيع ---------------- */
.sign{display:flex;gap:10mm;padding-top:4.5mm;border-top:.35mm solid rgba(21,68,90,.14);}
.sign > div{flex:1 1 0;text-align:center;}
.sign__role{font-size:8.6pt;color:#6b8794;}
.sign__name{margin-top:1.6mm;font-weight:700;font-size:10.4pt;color:${C.navy};}
.sign__line{margin-top:5mm;height:.35mm;background:rgba(21,68,90,.22);}

/* ---------------- الذيل ---------------- */
.by{margin-top:5mm;padding-top:3.4mm;border-top:.35mm solid rgba(21,68,90,.14);text-align:center;font-size:6.6pt;color:#93a7b0;letter-spacing:.1px;}
a{color:inherit;text-decoration:none;}
</style></head>
<body>
<div class="sheet">
  <div class="bg">
    <div class="bg__band"></div>
    <div class="bg__corner"></div>
    <div class="bg__wash-a"></div>
    <div class="bg__wash-b"></div>
    <img class="bg__dots" src="${dots}" alt="">
  </div>

  <header class="letterhead">
    <div class="letterhead__side">
      <p class="letterhead__kingdom">المملكة العربية السعودية</p>
      <p class="letterhead__org">وزارة التعليم</p>
      <p class="letterhead__org">${DEPARTMENT}</p>
    </div>
    <img class="letterhead__logo" src="${logo}" alt="وزارة التعليم">
    <div class="letterhead__side letterhead__side--left">
      <p class="letterhead__kingdom">${SCHOOL}</p>
      <p class="letterhead__org">الصف الرابع / ٢</p>
    </div>
  </header>

  <header class="head">
    <span class="head__eyebrow">منصة إلكترونية لملفات إنجاز الطالبات</span>
    <h1 class="head__title">${PLATFORM}</h1>
    <div class="head__rule"></div>
    <p class="head__sub">ملف الإنجاز الرقمي لطالبات الصف الرابع / ٢ — كل إنجاز… يحكي قصة تميّز</p>
  </header>

  <section class="row">
    <div class="table-wrap">
      <h2 class="t-title">التعريف بالمنصة</h2>
      <table><tbody>${tableRows}</tbody></table>
    </div>

    <aside class="qr">
      <a href="${BOARD_URL}"><img class="qr__img" src="${qr}" alt="رمز الدخول إلى لوحة العرض"></a>
      <p class="qr__name">${PLATFORM}</p>
      <p class="qr__kind">لوحة العرض</p>
      <p class="qr__note">للعرض والمشاهدة فقط — تتحدّث تلقائيًا: كل تقييم جديد أو طالبة جديدة أو مشروع يُرفع يظهر فيها فور حدوثه، بالرمز نفسه.</p>
      <p class="qr__scan">امسحي الرمز بكاميرا الجوّال</p>
    </aside>
  </section>

  <section class="shots">
    <figure class="shot"><img src="${shotBoard}" alt="لوحة العرض"></figure>
    <figure class="shot shot--mid"><img src="${shotProjects}" alt="مشاريع طالبة"></figure>
    <figure class="shot shot--phone"><img src="${shotPhone}" alt="المنصة على الجوّال"></figure>
  </section>
  <p class="shots__cap">من المنصة: لوحة العرض، وأعمال الطالبات بتقييم معلماتهن، والعرض على الجوّال</p>

  <p class="grow">إمكانية التوسّع لتشمل جميع طالبات الفصل.</p>

  <div class="spacer"></div>

  <section class="sign">
    <div>
      <p class="sign__role">مديرة المدرسة</p>
      <p class="sign__name">جازي السميري</p>
      <div class="sign__line"></div>
    </div>
    <div>
      <p class="sign__role">وكيلة الشؤون التعليمية</p>
      <p class="sign__name">عهود باهويني</p>
      <div class="sign__line"></div>
    </div>
  </section>

  <p class="by">مبادرة من أم الطالبة نادين الشمراني</p>
</div>
</body></html>`;

mkdirSync(OUT, { recursive: true });
mkdirSync(`${DIR}/build`, { recursive: true });
writeFileSync(`${DIR}/build/sheet.html`, html);

// ------------------------------------------------------------ التصيير
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await (await browser.newContext()).newPage();
await page.goto(`file://${DIR}/build/sheet.html`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

const fit = await page.evaluate(() => {
  const sheet = document.querySelector(".sheet");
  const last = document.querySelector(".by");
  const box = sheet.getBoundingClientRect();
  const end = last.getBoundingClientRect().bottom - box.top;
  const pad = parseFloat(getComputedStyle(sheet).paddingBottom);
  return { need: Math.ceil(end + pad), have: sheet.clientHeight };
});
const over = fit.need - fit.have;
console.log(`  الارتفاع: ${fit.need}px من ${fit.have}px متاحة` + (over > 1 ? `  ← فائض ${over}px` : "  ← يدخل"));

const file = `${OUT}/التعريف-بمنصة-إنجازي-يحكي.pdf`;
await page.pdf({
  path: file,
  format: "A4",
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
await browser.close();

/* عدد صفحات الملف يجب أن يساوي واحدًا — ورقة واحدة لا أكثر. */
const pdf = readFileSync(file);
const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`✓ ${file}`);
console.log(`  الصفحات: ${pages}  ·  الحجم: ${(pdf.length / 1048576).toFixed(2)} ميغابايت`);
if (pages !== 1 || over > 1) {
  // overflow:hidden يقصّ الفائض بصمت فتخرج الورقة «صفحة واحدة» بلا توقيع
  // ولا شعار. الفحصان معًا لا أحدهما.
  console.error(over > 1 ? "✗ المحتوى يفيض عن الصفحة فيُقصّ" : "✗ الورقة تجاوزت صفحة واحدة");
  process.exit(1);
}
