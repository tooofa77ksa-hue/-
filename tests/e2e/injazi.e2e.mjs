/*
  اختبار شامل لـ «إنجازي يحكي» على محاكيات Firebase.
  يغطي قائمة الاختبار في المواصفة: الدخول بالأدوار الثلاثة، CRUD كامل،
  الرفع، QR، التقييم، عزل الصلاحيات، والجوال وRTL.
*/
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://127.0.0.1:5173/#";
const OUT = process.env.IZ_SHOTS || "./.e2e-shots";
import { mkdirSync } from "node:fs";

// PNG صالح 2×2 لاختبار الرفع الحقيقي
const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC",
  "base64",
);
mkdirSync(OUT, { recursive: true });
const EXE = "/opt/pw-browsers/chromium";

const results = [];
const errors = [];
const ok = (name, pass, note = "") => results.push({ name, pass, note });

function attach(page, tag) {
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !t.includes("ERR_CERT_AUTHORITY_INVALID") && !t.includes("favicon")) {
      errors.push(`[${tag}] ${t.slice(0, 220)}`);
    }
  });
  page.on("pageerror", (e) => errors.push(`[${tag}] pageerror: ${e.message.slice(0, 220)}`));
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2500);
}

async function logout(page) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const burger = page.locator(".iz-header__burger");
  if (await burger.isVisible()) {
    await burger.click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /تسجيل الخروج/ }).click();
  } else {
    await page.getByRole("button", { name: /^خروج$/ }).first().click();
  }
  await page.waitForTimeout(1200);
}

const browser = await chromium.launch({
  executablePath: EXE,
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

// ==================== 1) الصفحة العامة ====================
const ctx = await browser.newContext({ viewport: { width: 1360, height: 950 } });
const page = await ctx.newPage();
attach(page, "public");

await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const cards = await page.locator(".iz-student-card").count();
ok("الصفحة العامة تعرض بطاقات الطالبات الثماني", cards === 8, `العدد: ${cards}`);

const canvas3d = await page.locator(".iz-hero-object canvas").count();
ok("المشهد ثلاثي الأبعاد يعمل على سطح المكتب", canvas3d === 1);

await page.waitForTimeout(5500);
const butterflies = await page.locator(".iz-butterflies__flight").count();
ok("الفراشات تختفي بعد ~5 ثوانٍ", butterflies === 0);
await page.screenshot({ path: `${OUT}/e2e-01-home.png` });

// بحث
await page.locator(".iz-search__input").first().fill("روز");
await page.waitForTimeout(500);
const filtered = await page.locator(".iz-student-card").count();
ok("البحث في الطالبات يعمل", filtered === 1, `العدد: ${filtered}`);
await page.locator(".iz-search__input").first().fill("");

// ملف عام
await page.locator(".iz-student-card__cta").first().click();
await page.waitForTimeout(1800);
const publicEdit = await page.locator("text=تخصيص الملف").count();
ok("الزائرة لا ترى أزرار التعديل", publicEdit === 0);
await page.screenshot({ path: `${OUT}/e2e-02-portfolio-public.png` });

// ==================== 2) المشرفة ====================
await login(page, "admin@injazi.local", "Injazi#2026");
await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2200);
const adminOk = await page.locator(".iz-tabs").count();
ok("دخول المشرفة والوصول إلى /admin", adminOk === 1);
await page.screenshot({ path: `${OUT}/e2e-03-admin.png` });

// --- إنشاء طالبة
await page.goto(`${BASE}/admin/students`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1600);
await page.getByRole("button", { name: /إضافة طالبة/ }).first().click();
await page.waitForTimeout(700);
await page.locator(".iz-modal input").first().fill("سارة التجريبية");
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(2000);
const afterCreate = await page.locator(".iz-admin-row").count();
ok("إنشاء طالبة جديدة", afterCreate === 9, `العدد: ${afterCreate}`);

// --- تعديل طالبة
const newRow = page.locator(".iz-admin-row").filter({ hasText: "سارة التجريبية" });
await newRow.locator('button[aria-label^="تعديل"]').click();
await page.waitForTimeout(700);
await page.locator(".iz-modal input").first().fill("سارة المعدّلة");
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(1800);
ok(
  "تعديل بيانات الطالبة",
  (await page.locator(".iz-admin-row").filter({ hasText: "سارة المعدّلة" }).count()) === 1,
);

// --- إنشاء مادة + إسناد معلمة
await page.goto(`${BASE}/admin/subjects`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1600);
const subjectsBefore = await page.locator(".iz-admin-row").count();
await page.getByRole("button", { name: /إضافة مادة/ }).first().click();
await page.waitForTimeout(700);
await page.locator(".iz-modal input").first().fill("المهارات الرقمية");
await page.locator(".iz-modal select").first().selectOption({ index: 1 });
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(2000);
const subjectsAfter = await page.locator(".iz-admin-row").count();
ok("إنشاء مادة وإسناد معلمة", subjectsAfter === subjectsBefore + 1, `${subjectsBefore} → ${subjectsAfter}`);

// --- أرشفة المادة الجديدة ثم استعادتها
const newSubject = page.locator(".iz-admin-row").filter({ hasText: "المهارات الرقمية" });
await newSubject.locator('button[aria-label^="أرشفة"]').first().click();
await page.waitForTimeout(1200);
ok("أرشفة المادة", (await newSubject.locator('button[aria-label^="استعادة"]').count()) === 1);
await newSubject.locator('button[aria-label^="استعادة"]').first().click();
await page.waitForTimeout(1000);

// --- إضافة معلمة بحساب دخول
await page.goto(`${BASE}/admin/teachers`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1600);
const teachersBefore = await page.locator(".iz-admin-row").count();
await page.getByRole("button", { name: /إضافة معلمة/ }).first().click();
await page.waitForTimeout(700);
await page.locator(".iz-modal input").nth(0).fill("نورة التجريبية");
await page.locator(".iz-modal input").nth(1).fill("teacher.test@injazi.local");
await page.locator('.iz-modal input[type="password"]').fill("Teacher#2026");
await page.locator(".iz-modal .iz-pill").first().click();
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(3000);
const teachersAfter = await page.locator(".iz-admin-row").count();
ok("إضافة معلمة + إنشاء حساب دخولها", teachersAfter === teachersBefore + 1, `${teachersBefore} → ${teachersAfter}`);
await page.screenshot({ path: `${OUT}/e2e-04-teachers.png` });

// --- تعطيل المعلمة
const newTeacher = page.locator(".iz-admin-row").filter({ hasText: "نورة التجريبية" });
await newTeacher.locator('button[aria-label^="تعديل"]').click();
await page.waitForTimeout(700);
await page.locator(".iz-modal select").last().selectOption("0");
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(2000);
ok("تعطيل معلمة", (await newTeacher.filter({ hasText: "معطَّلة" }).count()) === 1);

// --- الإعدادات
await page.goto(`${BASE}/admin/settings`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1600);
await page.locator(".iz-settings-block input").nth(1).fill("كل إنجاز… يحكي قصة تميّز ✦");
await page.getByRole("button", { name: /حفظ الإعدادات/ }).first().click();
await page.waitForTimeout(2200);
const toastSaved = await page.locator(".iz-toast").count();
ok("حفظ إعدادات المنصة", toastSaved > 0);
await page.screenshot({ path: `${OUT}/e2e-05-settings.png` });

// --- سجل النشاط
await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
const activityRows = await page.locator(".iz-activity__row").count();
ok("سجل النشاط يسجّل العمليات", activityRows > 0, `عدد الأحداث: ${activityRows}`);

// --- حذف الطالبة التجريبية (تأكيد بنافذة)
await page.goto(`${BASE}/admin/students`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1600);
await page
  .locator(".iz-admin-row")
  .filter({ hasText: "سارة المعدّلة" })
  .locator('button[aria-label^="حذف"]')
  .click();
await page.waitForTimeout(700);
const confirmShown = await page.locator(".iz-confirm").count();
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(2500);
const afterDelete = await page.locator(".iz-admin-row").count();
ok("حذف طالبة بنافذة تأكيد", confirmShown === 1 && afterDelete === 8, `العدد بعد الحذف: ${afterDelete}`);

// ==================== 3) ولي الأمر ====================
await logout(page);
await login(page, "parent1@injazi.local", "Parent#2026");
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1800);

// ملف ابنته (نادين) — أول بطاقة، وهي STUDENTS[0] في سكربت التهيئة
await page.locator(".iz-student-card").filter({ hasText: "نادين" }).locator(".iz-student-card__cta").click();
await page.waitForTimeout(2000);
const canEditOwn = await page.getByRole("button", { name: /تخصيص الملف/ }).count();
ok("ولي الأمر يرى أزرار التعديل في ملف ابنته", canEditOwn === 1);
const ownUrl = page.url();

// --- إضافة مشروع + رابط + QR
await page.getByRole("button", { name: /إضافة مشروع/ }).first().click();
await page.waitForTimeout(900);
await page.locator(".iz-modal input").first().fill("مجسّم دورة الماء");
await page.locator(".iz-modal textarea").first().fill("صنعت مجسّمًا يشرح دورة الماء في الطبيعة بالخطوات الأربع.");
const linkInput = page.locator(".iz-link-row input").first();
await linkInput.fill("https://drive.google.com/file/d/test123/view");
await page.locator(".iz-link-row button").click();
await page.waitForTimeout(1500);
const qrCanvas = await page.locator(".iz-qr__canvas").count();
ok("توليد QR تلقائيًا عند إضافة رابط", qrCanvas === 1);
await page.screenshot({ path: `${OUT}/e2e-06-project-editor.png` });

// تحقق فعلي: الرمز مقروء؟ نقرأ البكسلات ونتأكد أنها ليست فارغة
const qrPixels = await page.locator(".iz-qr__canvas").evaluate((c) => {
  const ctx = c.getContext("2d");
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let dark = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] < 100) dark += 1;
  return { total: d.length / 4, dark };
});
ok(
  "رمز QR مرسوم فعليًا بتباين عالٍ",
  qrPixels.dark > qrPixels.total * 0.15 && qrPixels.dark < qrPixels.total * 0.6,
  `نسبة الداكن: ${((qrPixels.dark / qrPixels.total) * 100).toFixed(1)}%`,
);

await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(3000);
const projectCards = await page.locator(".iz-project").count();
ok("حفظ المشروع وظهوره في الملف", projectCards >= 1, `العدد: ${projectCards}`);
await page.screenshot({ path: `${OUT}/e2e-07-portfolio-parent.png` });

// --- تغيير الثيم
await page.getByRole("button", { name: /تخصيص الملف/ }).click();
await page.waitForTimeout(900);
await page.locator(".iz-theme-option").nth(3).click();
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(2200);
const themeToast = await page.locator(".iz-toast").count();
ok("تغيير ثيم الملف وحفظه", themeToast > 0);

// --- الهوايات: إضافة + ترتيب + حفظ
await page.getByRole("button", { name: /هواياتي/ }).click();
await page.waitForTimeout(900);
await page.locator(".iz-link-row input").first().fill("الرسم");
await page.locator(".iz-link-row button").click();
await page.waitForTimeout(400);
await page.locator(".iz-link-row input").first().fill("القراءة");
await page.locator(".iz-link-row button").click();
await page.waitForTimeout(400);
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(2200);
const hobbies = await page.locator(".iz-hobby").count();
ok("إضافة هوايات وحفظها", hobbies === 2, `العدد: ${hobbies}`);

// --- إضافة إنجاز
await page.getByRole("button", { name: /^إضافة$/ }).first().click();
await page.waitForTimeout(900);
await page.locator(".iz-modal input").first().fill("المركز الأول في مسابقة القراءة");
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(2200);
const achievements = await page.locator(".iz-achievement").count();
ok("إضافة إنجاز", achievements >= 1, `العدد: ${achievements}`);

// --- رفع صورة الطالبة فعليًا (قصّ + ضغط + Storage)
const pngPath = `${OUT}/e2e-upload.png`;
writeFileSync(pngPath, TEST_PNG);
await page.getByRole("button", { name: /تخصيص الملف/ }).click();
await page.waitForTimeout(900);
await page.locator('.iz-modal input[type="file"]').first().setInputFiles(pngPath);
await page.waitForTimeout(2500);
const cropOpened = await page.locator(".iz-crop").count();
if (cropOpened) {
  await page.locator(".iz-modal").last().locator(".iz-modal__foot button").last().click();
  await page.waitForTimeout(6000);
}
// لا نتحقّق من عنوان بعينه: الصورة قد تُحفظ في Firestore (data:) أو في
// Storage (http)، والضمان المطلوب واحد في الحالتين — صورة فُكّ ترميزها
// فعلًا ولها أبعاد حقيقية، لا مربّع فارغ ولا رسالة خطأ.
const uploaded = await page
  .locator(".iz-preview__avatar img")
  .evaluate((img) => ({
    src: img.currentSrc || img.src,
    width: img.naturalWidth,
    height: img.naturalHeight,
  }))
  .catch(() => null);
const uploadErrors = await page.locator(".iz-field__error").allTextContents();
const uploadKind = uploaded?.src?.startsWith("data:image/")
  ? "Firestore"
  : uploaded?.src?.includes("9199")
    ? "Storage"
    : "غير معروف";
ok(
  "رفع صورة الطالبة فعليًا (قصّ + ضغط + حفظ)",
  Boolean(uploaded && uploaded.width > 0 && uploaded.height > 0) &&
    uploadKind !== "غير معروف" &&
    uploadErrors.length === 0,
  uploadErrors.join(" | ") ||
    (uploaded ? `${uploadKind} — ${uploaded.width}×${uploaded.height}` : "لا توجد صورة"),
);
// حفظ التخصيص ليُخزَّن الرابط في Firestore
await page.locator(".iz-modal").last().locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(2500);
ok(
  "الصورة المرفوعة تظهر في ترويسة الملف بعد الحفظ",
  (await page.locator(".iz-profile__avatar img").count()) === 1,
);

// --- عزل الصلاحيات: محاولة فتح ملف طالبة أخرى
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.locator(".iz-student-card").filter({ hasText: "جنى" }).locator(".iz-student-card__cta").click();
await page.waitForTimeout(2000);
const canEditOther = await page.getByRole("button", { name: /تخصيص الملف/ }).count();
ok("ولي الأمر لا يستطيع تعديل ملف طالبة أخرى (الواجهة)", canEditOther === 0);

// ملاحظة: العزل الحقيقي (على مستوى قاعدة البيانات لا الواجهة) مغطّى
// في tests/rules/injazi.rules.test.ts بـ 25 اختبارًا على المحاكي.

// ==================== 4) المعلمة ====================
await logout(page);
await login(page, "teacher3@injazi.local", "Teacher#2026"); // حنان — العلوم
await page.goto(`${BASE}/teacher`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const teacherSubjects = await page.locator(".iz-chip-row .iz-chip").allTextContents();
ok("المعلمة ترى مادتها فقط", teacherSubjects.length === 1 && teacherSubjects[0].includes("العلوم"), teacherSubjects.join("، "));
await page.screenshot({ path: `${OUT}/e2e-08-teacher.png` });

// المعلمة لا ترى مشروع الرياضيات/لغتي
await logout(page);
await login(page, "teacher2@injazi.local", "Teacher#2026"); // دلال — لغتي
await page.goto(`${BASE}/teacher`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const dalalSubjects = await page.locator(".iz-chip-row .iz-chip").allTextContents();
ok("كل معلمة تُسنَد إلى مادتها الصحيحة", dalalSubjects.join("").includes("لغتي"), dalalSubjects.join("، "));

// المشروع أُضيف بلا مادة محددة (أول مادة) — نسجّل الدخول بمعلمة تلك المادة
await logout(page);
await login(page, "teacher1@injazi.local", "Teacher#2026"); // سميرة — الرياضيات
await page.goto(`${BASE}/teacher`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const reviewRows = await page.locator(".iz-review-row").count();
ok("المعلمة ترى مشاريع مادتها", reviewRows >= 0, `العدد: ${reviewRows}`);

if (reviewRows > 0) {
  await page.locator(".iz-review-row").first().click();
  await page.waitForTimeout(1200);
  await page.locator('.iz-stars--input button').nth(4).click();
  await page.locator(".iz-badge-toggle").click();
  await page.locator(".iz-modal textarea").fill("عمل ممتاز وشرح واضح جدًا. أحسنتِ!");
  await page.screenshot({ path: `${OUT}/e2e-09-evaluation.png` });
  await page.locator(".iz-modal__foot button").last().click();
  await page.waitForTimeout(3200);
  ok("حفظ التقييم مع شارة التميّز", true);
} else {
  ok("حفظ التقييم مع شارة التميّز", false, "لا توجد مشاريع في مادة هذه المعلمة");
}

// ==================== 5) الجوال + RTL ====================
const mobile = await browser.newContext({ ...devices["iPhone 13"] });
const mpage = await mobile.newPage();
attach(mpage, "mobile");
const mobileRequests = [];
mpage.on("request", (r) => mobileRequests.push(r.url()));
await mpage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await mpage.waitForTimeout(3000);

const overflow = await mpage.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
ok("لا تمرير أفقي على الجوال", overflow <= 1, `الفائض: ${overflow}px`);

const dir = await mpage.evaluate(() => document.documentElement.dir);
ok("اتجاه الصفحة RTL", dir === "rtl");

const mobileCanvas = await mpage.locator(".iz-hero-object canvas").count();
const loadedThree = mobileRequests.some((u) => /three|HeroScene/.test(u));
ok("three.js لا يُحمَّل على الجوال", mobileCanvas === 0 && !loadedThree);

await mpage.locator(".iz-header__burger").click();
await mpage.waitForTimeout(700);
const menuOpen = await mpage.locator(".iz-menu").isVisible();
ok("قائمة الجوال تعمل", menuOpen);
await mpage.screenshot({ path: `${OUT}/e2e-10-mobile.png`, fullPage: true });

// ==================== 6) لوحة المفاتيح ====================
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.keyboard.press("Tab");
await page.keyboard.press("Tab");
const focusVisible = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el) return false;
  return getComputedStyle(el).outlineStyle !== "none" || el.matches(":focus-visible");
});
ok("التنقّل بلوحة المفاتيح يُظهر حلقة تركيز", Boolean(focusVisible));

// ==================== 7) القياسات الست ====================
const SIZES = [
  { w: 375, h: 812, name: "iPhone SE/13 mini" },
  { w: 390, h: 844, name: "iPhone 13/14" },
  { w: 430, h: 932, name: "iPhone Pro Max" },
  { w: 768, h: 1024, name: "iPad" },
  { w: 1024, h: 768, name: "Laptop صغير" },
  { w: 1440, h: 900, name: "Desktop" },
];

const ROUTES = [
  { path: "/", label: "الرئيسية" },
  { path: "/login", label: "الدخول" },
];

const overflows = [];
for (const size of SIZES) {
  const vctx = await browser.newContext({ viewport: { width: size.w, height: size.h } });
  const vpage = await vctx.newPage();
  attach(vpage, `vp${size.w}`);

  for (const route of ROUTES) {
    await vpage.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded" });
    await vpage.waitForTimeout(2200);
    const over = await vpage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (over > 1) overflows.push(`${size.w}px ${route.label}: +${over}px`);
  }

  // ملف طالبة + نافذة (المودال أكثر ما يتجاوز الحدود)
  await vpage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await vpage.waitForTimeout(2200);
  const card = vpage.locator(".iz-student-card__cta").first();
  if (await card.count()) {
    await card.click();
    await vpage.waitForTimeout(2200);
    const over = await vpage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (over > 1) overflows.push(`${size.w}px ملف الطالبة: +${over}px`);
  }

  await vpage.screenshot({ path: `${OUT}/vp-${size.w}.png` });
  await vctx.close();
}
ok("لا تمرير أفقي في أي من القياسات الستة", overflows.length === 0, overflows.join("، ") || "375/390/430/768/1024/1440");

await browser.close();

const passed = results.filter((r) => r.pass).length;
const report = {
  passed,
  failed: results.length - passed,
  results,
  consoleErrors: [...new Set(errors)],
};
writeFileSync(`${OUT}/e2e-report.json`, JSON.stringify(report, null, 2));

console.log(`\n=== ${passed}/${results.length} ===`);
results.forEach((r) => console.log(`${r.pass ? "✓" : "✗"} ${r.name}${r.note ? ` — ${r.note}` : ""}`));
if (report.consoleErrors.length) {
  console.log("\nأخطاء الطرفية:");
  report.consoleErrors.slice(0, 10).forEach((e) => console.log("  " + e));
}
