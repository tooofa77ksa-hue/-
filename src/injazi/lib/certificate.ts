/*
  شهادة التميّز — تُرسَم ثم تُحمَّل PDF.
  ==================================================================
  الرسم على لوحة (canvas) لا في HTML، لسببين: الشهادة تُطبَع وتُرسَل
  فتحتاج دقّة ثابتة لا تتغيّر بعرض الشاشة، ولأن الـPDF يُبنى من الصورة
  نفسها فيخرج مطابقًا لما رأته الطالبة تمامًا.

  الـPDF يُبنى هنا بلا أي مكتبة: ملف PDF الذي يحمل صورة JPEG واحدة
  بنيته خمسة كائنات وجدول إزاحات. إضافة مكتبة كاملة (٣٠٠ك+) لتوليد
  صفحة واحدة لا يُبرَّر في منصّة تفتحها طالبات على جوّالات بشبكة مدرسة.

  المقاس: A4 أفقي. اللوحة ٢٤٨٠×١٧٥٤ (≈٢١٢ نقطة/بوصة) — تطبع نظيفة
  ولا تبلغ ٣٤ ميغابايت من الذاكرة التي يبلغها مقاس ٣٠٠ نقطة على جوّال.
*/

export type CertificateData = {
  studentName: string;
  grade: string;
  schoolName: string;
  platformName: string;
  projects: number;
  stars: string | number;
  badges: number;
  /** نصّ التاريخ كما يُكتب في الشهادة. */
  dateText: string;
};

export const CERT_W = 2480;
export const CERT_H = 1754;

/** A4 أفقي بالنقاط الطباعية. */
const PDF_W = 842;
const PDF_H = 595;

const GOLD = "#ffc96b";
const GOLD_DEEP = "#e09a26";
const GOLD_LIGHT = "#fff0c8";
const INK = "#f4f1ff";
const INK_SOFT = "#cfc7f0";

const DISPLAY = '"Baloo Bhaijaan 2", "Readex Pro", system-ui, sans-serif';
const BODY = '"Readex Pro", "Tajawal", system-ui, sans-serif';

/**
 * الخطوط تُحمَّل كسولًا في المتصفّح. الرسم قبل اكتمالها يُخرج الشهادة
 * بخطّ النظام الاحتياطي — وهو ما كان يحدث عند أول فتح دائمًا.
 */
export async function ensureFonts(): Promise<void> {
  if (!("fonts" in document)) return;
  const faces = [
    `800 120px ${DISPLAY}`,
    `700 120px ${DISPLAY}`,
    `600 120px ${DISPLAY}`,
    `300 60px ${BODY}`,
    `400 60px ${BODY}`,
    `500 60px ${BODY}`,
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f, "شهادة تميّز ١٢٣")));
  await document.fonts.ready;
}

/* ------------------------------------------------------------------ أدوات */

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** نجمة خماسية — الشكل نفسه المستخدَم في شعار المنصّة. */
function starPath(c: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number) {
  c.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.closePath();
}

/** كتاب مفتوح — أيقونة عدد المشاريع. */
function bookPath(c: CanvasRenderingContext2D, cx: number, cy: number, w: number) {
  const h = w * 0.66;
  const l = cx - w / 2;
  const t = cy - h / 2;
  // دفّتان تلتقيان عند الكعب، وانحناءة خفيفة أعلى كل صفحة
  c.beginPath();
  c.moveTo(cx, t + h * 0.12);
  c.quadraticCurveTo(l + w * 0.16, t - h * 0.06, l, t + h * 0.16);
  c.lineTo(l, t + h);
  c.quadraticCurveTo(l + w * 0.18, t + h * 0.8, cx, t + h * 0.92);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(cx, t + h * 0.12);
  c.quadraticCurveTo(l + w * 0.84, t - h * 0.06, l + w, t + h * 0.16);
  c.lineTo(l + w, t + h);
  c.quadraticCurveTo(l + w * 0.82, t + h * 0.8, cx, t + h * 0.92);
  c.closePath();
}

/** تاج بسيط لشارة التميّز. */
function crownPath(c: CanvasRenderingContext2D, cx: number, cy: number, w: number) {
  const h = w * 0.72;
  const l = cx - w / 2;
  const b = cy + h / 2;
  c.beginPath();
  c.moveTo(l, b);
  c.lineTo(l + w * 0.08, cy - h * 0.18);
  c.lineTo(l + w * 0.3, cy + h * 0.06);
  c.lineTo(cx, cy - h / 2);
  c.lineTo(l + w * 0.7, cy + h * 0.06);
  c.lineTo(l + w * 0.92, cy - h * 0.18);
  c.lineTo(l + w, b);
  c.closePath();
}

/* توزيع نجوم ثابت: الشهادة نفسها تُنتج الصورة نفسها في كل مرّة. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ الرسم */

export function drawCertificate(canvas: HTMLCanvasElement, data: CertificateData): void {
  canvas.width = CERT_W;
  canvas.height = CERT_H;
  const c = canvas.getContext("2d");
  if (!c) return;

  c.textAlign = "center";
  c.textBaseline = "middle";
  // الاتجاه مهم: بدونه تُقلب علامات الترقيم وأقواس العربية في بعض المتصفّحات.
  c.direction = "rtl";

  // ---------- أرضية الليل ----------
  const sky = c.createLinearGradient(0, 0, CERT_W * 0.35, CERT_H);
  sky.addColorStop(0, "#120d35");
  sky.addColorStop(0.55, "#0b0824");
  sky.addColorStop(1, "#06041a");
  c.fillStyle = sky;
  c.fillRect(0, 0, CERT_W, CERT_H);

  const glow = (x: number, y: number, r: number, color: string, alpha: number) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = alpha;
    c.fillStyle = g;
    c.fillRect(0, 0, CERT_W, CERT_H);
    c.globalAlpha = 1;
  };
  glow(CERT_W * 0.78, CERT_H * 0.12, CERT_W * 0.5, "#8e6dfb", 0.5);
  glow(CERT_W * 0.16, CERT_H * 0.9, CERT_W * 0.44, "#34aee4", 0.4);
  glow(CERT_W * 0.5, CERT_H * 0.5, CERT_W * 0.42, "#e09a26", 0.1);

  // ---------- نجوم ----------
  const rnd = seeded(2026);
  for (let i = 0; i < 420; i += 1) {
    const x = rnd() * CERT_W;
    const y = rnd() * CERT_H;
    const r = rnd() * 2.6 + 0.6;
    c.globalAlpha = rnd() * 0.7 + 0.15;
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;

  // ---------- الإطار الذهبي المزدوج ----------
  const m = 86;
  const frame = c.createLinearGradient(m, m, CERT_W - m, CERT_H - m);
  frame.addColorStop(0, GOLD);
  frame.addColorStop(0.5, GOLD_LIGHT);
  frame.addColorStop(1, GOLD_DEEP);

  c.strokeStyle = frame;
  c.lineWidth = 7;
  roundRect(c, m, m, CERT_W - m * 2, CERT_H - m * 2, 46);
  c.stroke();

  c.lineWidth = 2.5;
  c.globalAlpha = 0.72;
  roundRect(c, m + 22, m + 22, CERT_W - (m + 22) * 2, CERT_H - (m + 22) * 2, 32);
  c.stroke();
  c.globalAlpha = 1;

  // زخرفة الأركان: نجمة صغيرة في كل ركن
  for (const [cx, cy] of [
    [m + 22, m + 22],
    [CERT_W - m - 22, m + 22],
    [m + 22, CERT_H - m - 22],
    [CERT_W - m - 22, CERT_H - m - 22],
  ] as const) {
    c.fillStyle = GOLD;
    starPath(c, cx, cy, 20, 8);
    c.fill();
  }

  const mid = CERT_W / 2;

  // ---------- النجمة العلوية ----------
  c.save();
  c.shadowColor = "rgba(255,201,107,0.75)";
  c.shadowBlur = 56;
  const starFill = c.createLinearGradient(mid - 70, 190, mid + 70, 330);
  starFill.addColorStop(0, GOLD_LIGHT);
  starFill.addColorStop(1, GOLD_DEEP);
  c.fillStyle = starFill;
  starPath(c, mid, 258, 72, 30);
  c.fill();
  c.restore();

  // ---------- اسم المنصّة ----------
  c.fillStyle = INK_SOFT;
  c.font = `500 40px ${BODY}`;
  c.fillText(data.platformName, mid, 366);

  // ---------- العنوان ----------
  c.save();
  c.shadowColor = "rgba(255,201,107,0.45)";
  c.shadowBlur = 40;
  const title = c.createLinearGradient(mid - 420, 0, mid + 420, 0);
  title.addColorStop(0, GOLD);
  title.addColorStop(0.5, GOLD_LIGHT);
  title.addColorStop(1, GOLD);
  c.fillStyle = title;
  c.font = `800 152px ${DISPLAY}`;
  c.fillText("شهادة تميّز", mid, 492);
  c.restore();

  // فاصل مزخرف
  const rule = (y: number, half: number) => {
    const g = c.createLinearGradient(mid - half, 0, mid + half, 0);
    g.addColorStop(0, "rgba(255,201,107,0)");
    g.addColorStop(0.5, GOLD);
    g.addColorStop(1, "rgba(255,201,107,0)");
    c.fillStyle = g;
    c.fillRect(mid - half, y, half * 2, 3);
  };
  rule(584, 330);

  // ---------- الإهداء ----------
  c.fillStyle = INK_SOFT;
  c.font = `300 46px ${BODY}`;
  c.fillText("تُمنح هذه الشهادة بكل فخرٍ واعتزاز إلى الطالبة", mid, 668);

  // ---------- اسم الطالبة ----------
  c.save();
  c.shadowColor = "rgba(127,220,255,0.4)";
  c.shadowBlur = 44;
  const nameFill = c.createLinearGradient(mid - 560, 0, mid + 560, 0);
  nameFill.addColorStop(0, "#ffffff");
  nameFill.addColorStop(0.45, "#eaf6ff");
  nameFill.addColorStop(1, "#c3adff");
  c.fillStyle = nameFill;
  // الأسماء الطويلة تُصغَّر بدل أن تخرج من الإطار
  let size = 136;
  c.font = `800 ${size}px ${DISPLAY}`;
  const maxName = CERT_W - m * 2 - 240;
  while (c.measureText(data.studentName).width > maxName && size > 64) {
    size -= 4;
    c.font = `800 ${size}px ${DISPLAY}`;
  }
  c.fillText(data.studentName, mid, 790);
  c.restore();

  // خطّ تحت الاسم
  rule(886, 460);

  // ---------- الصف والمدرسة ----------
  c.fillStyle = INK;
  c.font = `500 50px ${BODY}`;
  c.fillText(data.grade, mid, 962);
  c.fillStyle = INK_SOFT;
  c.font = `300 42px ${BODY}`;
  c.fillText(data.schoolName, mid, 1032);

  // ---------- سبب المنح ----------
  c.fillStyle = INK_SOFT;
  c.font = `300 40px ${BODY}`;
  c.fillText("تقديرًا لاجتهادها وتميّزها في ملف إنجازها الرقمي", mid, 1118);

  // ---------- المؤشّرات ----------
  const stats: Array<{ label: string; value: string; icon: "book" | "star" | "crown" }> = [
    { label: "مشروع", value: String(data.projects), icon: "book" },
    { label: "متوسط النجوم", value: String(data.stars), icon: "star" },
    { label: "شارة تميّز", value: String(data.badges), icon: "crown" },
  ];

  const boxW = 420;
  const boxH = 196;
  const gap = 46;
  const totalW = boxW * 3 + gap * 2;
  let bx = mid + totalW / 2 - boxW; // من اليمين إلى اليسار
  const by = 1200;

  for (const s of stats) {
    c.fillStyle = "rgba(255,255,255,0.055)";
    roundRect(c, bx, by, boxW, boxH, 28);
    c.fill();
    c.strokeStyle = "rgba(255,201,107,0.4)";
    c.lineWidth = 2;
    roundRect(c, bx, by, boxW, boxH, 28);
    c.stroke();

    const cx = bx + boxW / 2;
    c.fillStyle = GOLD;
    if (s.icon === "star") starPath(c, cx, by + 50, 26, 11);
    else if (s.icon === "crown") crownPath(c, cx, by + 50, 54);
    else bookPath(c, cx, by + 50, 58);
    c.fill();

    c.fillStyle = INK;
    c.font = `800 68px ${DISPLAY}`;
    c.fillText(s.value, cx, by + 118);
    c.fillStyle = INK_SOFT;
    c.font = `300 34px ${BODY}`;
    c.fillText(s.label, cx, by + 168);

    bx -= boxW + gap;
  }

  // ---------- التذييل: التاريخ والتوقيع ----------
  const footY = CERT_H - 240;

  c.fillStyle = INK_SOFT;
  c.font = `300 36px ${BODY}`;
  c.textAlign = "right";
  c.fillText(`التاريخ: ${data.dateText}`, CERT_W - m - 110, footY + 86);

  c.textAlign = "left";
  c.fillText("مديرة المدرسة", m + 110, footY + 86);
  c.strokeStyle = "rgba(255,201,107,0.55)";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(m + 110, footY + 40);
  c.lineTo(m + 430, footY + 40);
  c.stroke();

  c.textAlign = "center";
  c.fillStyle = "rgba(207,199,240,0.65)";
  c.font = `300 30px ${BODY}`;
  c.fillText("كل إنجازٍ… يحكي قصّة تميّز", mid, CERT_H - 128);
}

/* ------------------------------------------------------------------ PDF */

function ascii(s: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.length; i += 1) out.push(s.charCodeAt(i) & 0xff);
  return out;
}

/**
 * ملف PDF من صفحة واحدة تحمل صورة JPEG.
 * جدول الإزاحات (xref) يجب أن يحمل موضع كل كائن بالبايت بدقّة، ولذلك
 * تُجمَّع البايتات تسلسليًا ويُسجَّل الموضع قبل كتابة كل كائن.
 */
export function buildPdf(jpeg: Uint8Array, pxW: number, pxH: number): Blob {
  const bytes: number[] = [];
  const offsets: number[] = [];
  const push = (s: string) => bytes.push(...ascii(s));
  const mark = () => offsets.push(bytes.length);

  // الصورة تملأ الصفحة مع الحفاظ على نسبتها
  const scale = Math.min(PDF_W / pxW, PDF_H / pxH);
  const w = pxW * scale;
  const h = pxH * scale;
  const x = (PDF_W - w) / 2;
  const y = (PDF_H - h) / 2;

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  mark();
  push("1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n");

  mark();
  push("2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n");

  mark();
  push(
    `3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${PDF_W} ${PDF_H}]` +
      `/Resources<</XObject<</Im0 4 0 R>>/ProcSet[/PDF/ImageC]>>/Contents 5 0 R>>\nendobj\n`,
  );

  mark();
  push(
    `4 0 obj\n<</Type/XObject/Subtype/Image/Width ${pxW}/Height ${pxH}` +
      `/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpeg.length}>>\nstream\n`,
  );
  for (let i = 0; i < jpeg.length; i += 1) bytes.push(jpeg[i]);
  push("\nendstream\nendobj\n");

  const content = `q\n${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`;
  mark();
  push(`5 0 obj\n<</Length ${content.length}>>\nstream\n${content}endstream\nendobj\n`);

  const xref = bytes.length;
  push("xref\n0 6\n0000000000 65535 f \n");
  for (const off of offsets) push(`${String(off).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`);

  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

/*
  اسم الملف بحروف لاتينية — لا بالعربية.
  ------------------------------------------------------------------
  اختُبر: حين يحمل خاصية download اسمًا فيه حرف عربي واحد، يُسقط
  Chromium الاسم كلّه وينزّل الملف باسم «download» بلا امتداد — فلا
  يفتحه الجوّال. والاسم العربي ليس خسارة: هو مكتوب داخل الشهادة نفسها
  بخطّ كبير، وإنما يخدم اسم الملف التمييز بين ثماني شهادات في مجلّد
  التنزيلات.
*/
const AR_LATIN: Record<string, string> = {
  ا: "a", أ: "a", إ: "i", آ: "aa", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h",
  خ: "kh", د: "d", ذ: "dh", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d",
  ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m",
  ن: "n", ه: "h", ة: "h", و: "w", ؤ: "u", ي: "y", ى: "a", ئ: "i", ء: "",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

export function safeFileName(name: string): string {
  const out = Array.from(name.normalize("NFKD"))
    .map((ch) => {
      if (AR_LATIN[ch] !== undefined) return AR_LATIN[ch];
      if (/[a-zA-Z0-9]/.test(ch)) return ch.toLowerCase();
      if (/[\s_-]/.test(ch)) return "-";
      return ""; // التشكيل والمحارف المحجوزة تسقط
    })
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return out || "certificate";
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  // الرابط يبقى في الصفحة حتى يلتقطه المتصفّح: نزعه فور click يجعل
  // بعض المتصفّحات تُسقط اسم الملف وتسمّيه download، كما يقطع الإلغاء
  // الفوري للعنوان التحميلَ قبل أن يبدأ.
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 10000);
}
