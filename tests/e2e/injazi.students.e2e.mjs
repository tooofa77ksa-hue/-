/*
  اختبار الطالبات الثماني — واحدة واحدة، على متصفّح حقيقي.
  ------------------------------------------------------------------
  لكل طالبة: تُنشئ المشرفة رابطها، ثم يُفتح الرابط في سياق متصفّح نظيف
  تمامًا (لا جلسة سابقة ولا تخزين مشترك)، ويُتحقّق فعليًا من:

    ١) الرابط يفتح ملفها هي بالذات.
    ٢) يظهر لها زر التعديل (أي أن الصلاحية وصلت فعلًا).
    ٣) ترفع إنجازًا حقيقيًا ويظهر لها.
    ٤) يبقى بعد تحديث الصفحة (أي أنه حُفظ في قاعدة البيانات لا في الشاشة).
    ٥) تفتح ملف زميلتها فلا تجد أي زر تعديل.
    ٦) تفتح /admin فلا تصل.
    ٧) تفتح /teacher فلا تصل.

  الخطوة ٤ هي الفرق بين «الرفع يعمل» و«الرفع يبدو أنه يعمل».

  التشغيل: node tests/e2e/injazi.students.e2e.mjs
*/
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:5173/#";
const OUT = process.env.IZ_SHOTS || "./.e2e-shots";
mkdirSync(OUT, { recursive: true });
const EXE = "/opt/pw-browsers/chromium";

/** أسماء الطالبات الثماني كما أرسلتهنّ المشرفة. */
const NAMES = ["نادين", "ريتاج", "لانا", "تالا", "ندى", "روز", "مريم", "جنى"];

const rows = [];
const errors = [];

const browser = await chromium.launch({
  executablePath: EXE,
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

function watch(page, tag) {
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !t.includes("ERR_CERT") && !t.includes("favicon")) {
      errors.push(`[${tag}] ${t.slice(0, 200)}`);
    }
  });
  page.on("pageerror", (e) => errors.push(`[${tag}] ${e.message.slice(0, 200)}`));
}

// ==================== المشرفة: توليد الروابط الثمانية ====================
const actx = await browser.newContext({ viewport: { width: 1360, height: 950 } });
const admin = await actx.newPage();
watch(admin, "admin");

await admin.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await admin.waitForTimeout(1500);
await admin.locator('input[type="email"]').fill("admin@injazi.local");
await admin.locator('input[type="password"]').fill("Injazi#2026");
await admin.locator('button[type="submit"]').click();
await admin.waitForTimeout(3000);

const adminReached = (await admin.locator(".iz-tabs").count()) > 0;

await admin.goto(`${BASE}/admin/students`, { waitUntil: "domcontentloaded" });
await admin.waitForTimeout(2500);

/** رابط كل طالبة، مفهرسًا باسمها. */
const links = {};
for (const name of NAMES) {
  const row = admin.locator(".iz-admin-row").filter({ hasText: name }).first();
  if ((await row.count()) === 0) {
    links[name] = null;
    continue;
  }
  await row.getByRole("button", { name: /رابطها/ }).click();
  await admin.waitForTimeout(700);
  const make = admin.getByRole("button", { name: /إنشاء الرابط/ });
  if (await make.count()) {
    await make.click();
    await admin.waitForTimeout(2200);
  }
  links[name] = await admin.locator(".iz-modal input").first().inputValue();
  await admin.locator(".iz-modal__foot button").first().click();
  await admin.waitForTimeout(500);
}
await admin.screenshot({ path: `${OUT}/students-links.png` });

// ==================== كل طالبة في متصفّح نظيف ====================
for (const name of NAMES) {
  const checks = {};
  const url = links[name];

  if (!url || !/#\/s\/[A-Za-z0-9_-]{20,}$/.test(url)) {
    rows.push({ name, pass: false, note: "لم يُنشأ رابط", checks });
    continue;
  }

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  watch(page, name);

  try {
    // ١) الرابط يفتح ملفها
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4500);
    const onPortfolio = /#\/student\/[^/]+$/.test(page.url());
    const heading = await page.locator("h1").first().innerText().catch(() => "");
    checks["فتح ملفها"] = onPortfolio && heading.includes(name);

    // ٢) صلاحية التعديل وصلت
    checks["زر التعديل ظاهر"] =
      (await page.getByRole("button", { name: /تخصيص الملف/ }).count()) > 0;

    const myUrl = page.url();
    const myId = myUrl.split("/student/")[1];

    // ٣) رفع إنجاز حقيقي
    const title = `إنجاز ${name} ${Date.now().toString().slice(-5)}`;
    const before = await page.locator(".iz-achievement").count();
    const addBtn = page.getByRole("button", { name: /^إضافة$/ }).first();
    if (await addBtn.count()) {
      await addBtn.click();
      await page.waitForTimeout(900);
      await page.locator(".iz-modal input").first().fill(title);
      await page.locator(".iz-modal__foot button").last().click();
      await page.waitForTimeout(2600);
    }
    const after = await page.locator(".iz-achievement").count();
    checks["رفع إنجاز"] = after === before + 1;

    // ٤) الحفظ الحقيقي: يبقى بعد تحديث الصفحة
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    checks["بقي بعد التحديث"] =
      (await page.locator(".iz-achievement").filter({ hasText: title }).count()) === 1;

    await page.screenshot({ path: `${OUT}/student-${NAMES.indexOf(name)}-${name}.png` });

    // ٥) ملف زميلتها: تُعرض الصفحة العامة بلا أي صلاحية تعديل
    const otherName = NAMES[(NAMES.indexOf(name) + 1) % NAMES.length];
    // ننتقل إلى ملف الزميلة عبر المعرض العام (عبث بالعنوان كما تفعل طالبة)
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    const otherCard = page.locator(".iz-student-card").filter({ hasText: otherName }).first();
    if (await otherCard.count()) {
      await otherCard.locator(".iz-student-card__cta").click();
      await page.waitForTimeout(3000);
      const otherPage = page.url();
      checks["لا تعديل لملف زميلتها"] =
        otherPage !== myUrl &&
        (await page.getByRole("button", { name: /تخصيص الملف/ }).count()) === 0;
    } else {
      checks["لا تعديل لملف زميلتها"] = false;
    }

    // ٦) لوحة الإدارة مغلقة
    await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2800);
    checks["لا تصل للوحة الإدارة"] = (await page.locator(".iz-tabs").count()) === 0;

    // ٧) بوابة المعلمات مغلقة
    await page.goto(`${BASE}/teacher`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2800);
    checks["لا تصل لبوابة المعلمات"] =
      (await page.locator(".iz-review-row").count()) === 0 &&
      (await page.locator(".iz-chip-row .iz-chip").count()) === 0;

    void myId;
  } catch (err) {
    errors.push(`[${name}] ${String(err).slice(0, 200)}`);
  } finally {
    await ctx.close();
  }

  const pass = Object.values(checks).every(Boolean) && Object.keys(checks).length >= 6;
  const failed = Object.entries(checks)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  rows.push({ name, pass, note: failed.join("، "), checks });
}

await browser.close();

// ==================== التقرير ====================
const passed = rows.filter((r) => r.pass).length;
console.log(`\n=== الطالبات: ${passed}/${rows.length} ===`);
console.log(`لوحة الإدارة: ${adminReached ? "✓ تعمل" : "✗ تعذّر الدخول"}\n`);
for (const r of rows) {
  console.log(`${r.pass ? "✓ PASS" : "✗ FAIL"}  ${r.name}${r.note ? ` — ${r.note}` : ""}`);
  for (const [k, v] of Object.entries(r.checks)) console.log(`        ${v ? "✓" : "✗"} ${k}`);
}
if (errors.length) {
  console.log("\nأخطاء الطرفية:");
  [...new Set(errors)].slice(0, 12).forEach((e) => console.log("  " + e));
}
writeFileSync(`${OUT}/students-report.json`, JSON.stringify({ passed, rows, links, errors }, null, 2));
