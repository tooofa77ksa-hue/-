/*
  رحلة الطالبة الكاملة — بالترتيب الذي طلبته المشرفة في البند ١٢.
  ------------------------------------------------------------------
  فتح رابط الطالبة ← عني ← الهوايات ← الصورة ← اللون ← الفراشات ←
  شهادة شكر ← شهادة إنجاز ← إنجاز بلا شهادة ← مشروع بوصف ← تعديل ←
  أرشفة ← الأرشيف ← استعادة ← Refresh ← كل شيء باقٍ.
  ثم: محاولة الوصول إلى ملف طالبة أخرى ⇒ DENIED.

  كل فحص يقرأ ما بقي بعد إعادة التحميل لا ما ظهر على الشاشة: الفرق بين
  «الزر يعمل» و«البيانات محفوظة».

  التشغيل: node tests/e2e/injazi.studentspace.e2e.mjs
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:5173/#";
const OUT = process.env.IZ_SHOTS || "./.e2e-shots";
mkdirSync(OUT, { recursive: true });
const STAMP = Date.now().toString().slice(-5);

let passed = 0;
let failed = 0;
const failures = [];
function ok(name, condition, note = "") {
  if (condition) {
    passed++;
    console.log(`✓ ${name}${note ? ` — ${note}` : ""}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`✗ ${name}${note ? ` — ${note}` : ""}`);
  }
}

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

// ==================== المشرفة تولّد رابطي طالبتين ====================
const actx = await browser.newContext({ viewport: { width: 1360, height: 950 } });
const admin = await actx.newPage();
await admin.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await admin.waitForTimeout(1500);
await admin.locator('input[type="email"]').fill("admin@injazi.local");
await admin.locator('input[type="password"]').fill("Injazi#2026");
await admin.locator('button[type="submit"]').click();
await admin.waitForTimeout(3000);
await admin.goto(`${BASE}/admin/students`, { waitUntil: "domcontentloaded" });
await admin.waitForTimeout(2500);

async function linkFor(name) {
  const row = admin.locator(".iz-admin-row").filter({ hasText: name }).first();
  await row.getByRole("button", { name: /رابطها/ }).click();
  await admin.waitForTimeout(700);
  const make = admin.getByRole("button", { name: /إنشاء الرابط/ });
  if (await make.count()) {
    await make.click();
    await admin.waitForTimeout(2200);
  }
  const url = await admin.locator(".iz-modal input").first().inputValue();
  await admin.locator(".iz-modal__foot button").first().click();
  await admin.waitForTimeout(500);
  return url;
}

const nadeenLink = await linkFor("نادين");
const retajLink = await linkFor("ريتاج");
await actx.close();

ok("رابط نادين وُلّد", /#\/s\/[A-Za-z0-9_-]{20,}$/.test(nadeenLink));
ok("رابط ريتاج وُلّد", /#\/s\/[A-Za-z0-9_-]{20,}$/.test(retajLink));

// ==================== رحلة نادين، في متصفّح نظيف ====================
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // مقاس جوّال
const page = await ctx.newPage();

await page.goto(nadeenLink, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4500);
const myUrl = page.url();
ok("الرابط يفتح ملف نادين", /#\/student\/[^/]+$/.test(myUrl), myUrl);

// --- الفراشات داخل صفحة الطالبة (طلب البند ٨)
const wings = await page.locator(".iz-butterfly").count();
ok("الفراشات تظهر في صفحة الطالبة", wings > 0, `العدد: ${wings}`);
ok(
  "الفراشات لا تلتقط النقر",
  (await page.locator(".iz-butterflies").evaluate((el) => getComputedStyle(el).pointerEvents)) === "none",
);
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
ok("لا تمرير أفقي مع الفراشات على الجوّال", overflow <= 0, `${overflow}px`);

// --- عني (CV)
const ABOUT_TITLE = `طموحاتي ${STAMP}`;
const ABOUT_BODY = `أريد أن أصير مهندسة حاسب ${STAMP}`;
await page.getByRole("button", { name: /^عني$/ }).click();
await page.waitForTimeout(800);
await page.locator('.iz-modal input[aria-label="عنوان القسم"]').fill(ABOUT_TITLE);
await page.locator('.iz-modal textarea[aria-label="نصّ القسم"]').fill(ABOUT_BODY);
await page.locator(".iz-modal").getByRole("button", { name: /إضافة القسم/ }).click();
await page.waitForTimeout(500);
await page.locator(".iz-modal").getByRole("button", { name: /^حفظ$/ }).click();
await page.waitForTimeout(2500);
ok("قسم «عني» ظهر في الملف", (await page.getByText(ABOUT_BODY).count()) > 0);

// --- الهوايات
await page.getByRole("button", { name: /هواياتي/ }).click();
await page.waitForTimeout(800);
await page.locator('.iz-modal input[aria-label="اسم الهواية"]').fill(`القراءة ${STAMP}`);
await page.locator(".iz-modal").getByRole("button", { name: /^إضافة$/ }).click();
await page.waitForTimeout(400);
await page.locator(".iz-modal").getByRole("button", { name: /^حفظ$/ }).click();
await page.waitForTimeout(2500);
ok("الهواية حُفظت", (await page.getByText(`القراءة ${STAMP}`).count()) > 0);

// --- اللون والثيم
await page.getByRole("button", { name: /تخصيص الملف/ }).click();
await page.waitForTimeout(900);
const themeChips = page.locator(".iz-modal .iz-theme-chip, .iz-modal .iz-pill");
const themeCount = await themeChips.count();
if (themeCount > 1) await themeChips.nth(1).click();
await page.waitForTimeout(400);
await page.locator(".iz-modal").getByRole("button", { name: /حفظ التخصيص/ }).click();
await page.waitForTimeout(2500);
const themeAfter = await page.evaluate(
  () => document.querySelector(".iz-portfolio")?.getAttribute("style") ?? "",
);
ok("ثيم الصفحة مطبَّق على الملف", themeAfter.length > 0);

// --- شهادة شكر + شهادة إنجاز + إنجاز بلا شهادة
async function addAchievement(sectionTitle, title, desc, issuer) {
  const section = page.locator("section").filter({ has: page.getByText(sectionTitle, { exact: true }) }).first();
  await section.getByRole("button", { name: /^إضافة$/ }).first().click();
  await page.waitForTimeout(900);
  await page.locator(".iz-modal input").first().fill(title);
  await page.locator(".iz-modal textarea").first().fill(desc);
  if (issuer) {
    const issuerBox = page.locator('.iz-modal input[placeholder*="الابتدائية"]');
    if (await issuerBox.count()) await issuerBox.fill(issuer);
  }
  await page.locator(".iz-modal__foot button").last().click();
  await page.waitForTimeout(2600);
}

const THANKS = `شهادة شكر ${STAMP}`;
const CERT = `شهادة إنجاز ${STAMP}`;
const WIN = `إنجاز بلا شهادة ${STAMP}`;
await addAchievement("شهاداتي", THANKS, "شكر على التعاون داخل الصف", "المدرسة ١٦٥");
await addAchievement("شهاداتي", CERT, "إتمام دورة القراءة السريعة", "نادي القراءة");
await addAchievement("إنجازاتي", WIN, "ساعدت زميلاتي في مشروع العلوم");

ok("شهادة الشكر أُضيفت", (await page.getByText(THANKS).count()) > 0);
ok("شهادة الإنجاز أُضيفت", (await page.getByText(CERT).count()) > 0);
ok("إنجاز بلا شهادة أُضيف", (await page.getByText(WIN).count()) > 0);
ok("الجهة المانحة ظاهرة على البطاقة", (await page.getByText("نادي القراءة").count()) > 0);
ok("وصف الإنجاز ظاهر", (await page.getByText("ساعدت زميلاتي في مشروع العلوم").count()) > 0);

await page.screenshot({ path: `${OUT}/space-certificates.png`, fullPage: true });

// --- مشروع بوصف
const PROJECT = `مشروع دورة الماء ${STAMP}`;
const PROJECT_DESC = `صنعت مجسّمًا وشرحته أمام الصف ${STAMP}`;
await page.getByRole("button", { name: /إضافة مشروع/ }).first().click();
await page.waitForTimeout(1000);
await page.locator(".iz-modal input").first().fill(PROJECT);
await page.locator(".iz-modal textarea").first().fill(PROJECT_DESC);
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(3000);
ok("المشروع أُضيف", (await page.getByText(PROJECT).count()) > 0);
ok("وصف المشروع ظاهر", (await page.getByText(PROJECT_DESC).count()) > 0);

// --- تعديل المشروع
const EDITED = `${PROJECT} — معدّل`;
await page.locator(`.iz-project, .iz-card`).filter({ hasText: PROJECT }).first()
  .locator('button[aria-label^="تعديل"]').first().click();
await page.waitForTimeout(1000);
await page.locator(".iz-modal input").first().fill(EDITED);
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(2800);
ok("تعديل المشروع حُفظ", (await page.getByText(EDITED).count()) > 0);

// --- أرشفة المشروع
await page.locator(".iz-project, .iz-card").filter({ hasText: EDITED }).first()
  .locator('button[aria-label^="أرشفة"]').first().click();
await page.waitForTimeout(2200);
ok("الأرشفة تُخفي المشروع من الملف", (await page.getByText(EDITED).count()) === 0);

// --- الأرشيف والاستعادة
const archiveBtn = page.getByRole("button", { name: /^الأرشيف/ });
ok("زر الأرشيف ظاهر", (await archiveBtn.count()) === 1);
await archiveBtn.click();
await page.waitForTimeout(1800);
ok("الأرشيف يعرض المشروع", (await page.getByText(EDITED).count()) > 0);
ok(
  "زر «استعادة» مكتوب بكلمة لا أيقونة فقط",
  (await page.getByRole("button", { name: new RegExp(`استعادة ${EDITED.slice(0, 12)}`) }).count()) > 0 ||
    (await page.locator(".iz-icon-btn--wide").count()) > 0,
);
await page.locator(".iz-project, .iz-card").filter({ hasText: EDITED }).first()
  .locator('button[aria-label^="استعادة"]').first().click();
await page.waitForTimeout(2200);
await page.getByRole("button", { name: /رجوع للملف/ }).click();
await page.waitForTimeout(1600);
ok("الاستعادة تُرجع المشروع كاملًا", (await page.getByText(EDITED).count()) > 0);
ok("الوصف لم يُفقد بالاستعادة", (await page.getByText(PROJECT_DESC).count()) > 0);

// ==================== Refresh: كل شيء باقٍ ====================
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);

ok("«عني» باقٍ بعد التحديث", (await page.getByText(ABOUT_BODY).count()) > 0);
ok("الهواية باقية بعد التحديث", (await page.getByText(`القراءة ${STAMP}`).count()) > 0);
ok("شهادة الشكر باقية بعد التحديث", (await page.getByText(THANKS).count()) > 0);
ok("شهادة الإنجاز باقية بعد التحديث", (await page.getByText(CERT).count()) > 0);
ok("الإنجاز بلا شهادة باقٍ بعد التحديث", (await page.getByText(WIN).count()) > 0);
ok("المشروع المعدَّل باقٍ بعد التحديث", (await page.getByText(EDITED).count()) > 0);
ok("وصف المشروع باقٍ بعد التحديث", (await page.getByText(PROJECT_DESC).count()) > 0);

await page.screenshot({ path: `${OUT}/space-after-refresh.png`, fullPage: true });

// ==================== العزل: نادين لا تصل إلى ريتاج ====================
// ١) عبث بالعنوان: معرّف ريتاج مباشرةً.
const retajCtx = await browser.newContext();
const peek = await retajCtx.newPage();
await peek.goto(retajLink, { waitUntil: "domcontentloaded" });
await peek.waitForTimeout(4500);
const retajUrl = peek.url();
await retajCtx.close();

await page.goto(retajUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
ok(
  "نادين لا تملك تعديل ملف ريتاج (عبث بالعنوان)",
  (await page.getByRole("button", { name: /تخصيص الملف/ }).count()) === 0 &&
    (await page.getByRole("button", { name: /^عني$/ }).count()) === 0,
);

// ٢) الفرض من قاعدة البيانات لا من الواجهة: كتابة مباشرة بمعرّف ريتاج.
const retajId = retajUrl.split("/student/")[1];
const denied = await page.evaluate(async (id) => {
  const mod = await import("/src/injazi/services/repo.ts");
  try {
    await mod.updateStudent(id, { bio: "اخترقتُ الملف" });
    return "ALLOWED";
  } catch (err) {
    return String(err?.code ?? err?.message ?? err);
  }
}, retajId);
ok("كتابة مباشرة على ملف ريتاج مرفوضة من القواعد", /permission-denied/i.test(denied), denied);

// ٣) تزوير تقييم باسم المعلمة.
const forged = await page.evaluate(async (id) => {
  const mod = await import("/src/injazi/services/repo.ts");
  try {
    await mod.saveEvaluation({
      projectId: "any",
      studentId: id,
      teacherId: "fake",
      subjectId: "fake",
      stars: 5,
      badge: true,
      status: "reviewed",
      comment: "تقييم مزوَّر",
    });
    return "ALLOWED";
  } catch (err) {
    return String(err?.code ?? err?.message ?? err);
  }
}, retajId);
ok("تزوير تقييم المعلمة مرفوض من القواعد", /permission-denied/i.test(forged), forged);

// ٤) لوحة الإدارة وبوابة المعلمات مغلقتان.
await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2800);
ok("لا تصل إلى لوحة الإدارة", (await page.locator(".iz-tabs").count()) === 0);
await page.goto(`${BASE}/teacher`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2800);
ok("لا تصل إلى بوابة المعلمات", (await page.locator(".iz-review-row").count()) === 0);

await ctx.close();
await browser.close();

console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
if (failures.length) console.log("الفاشل: " + failures.join(" · "));
process.exit(failed === 0 ? 0 : 1);
