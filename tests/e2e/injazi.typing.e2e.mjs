/*
  الكتابة لا تنقطع — حرفًا حرفًا.
  ==================================================================
  بلاغ من الاستخدام الحقيقي: «كل ما كتبت تنزل لوحة الكتابة حرف بحرف،
  أرجع أدخل من جديد وأكتب — وهذا مرهق».

  السبب: أثر النافذة الذي ينقل التركيز عند الفتح كان يعتمد على onClose،
  وهي دالة تُعرَّف داخل النموذج فتصير كائنًا جديدًا مع كل إعادة رسم —
  أي مع كل حرف. فيُعاد تشغيل الأثر، ويقفز التركيز بعد ٤٠ جزءًا من
  الثانية إلى أول عنصر في النافذة (زرّ الإغلاق)، فتهبط لوحة المفاتيح
  على الجوّال وتتوقّف الكتابة.

  ولا يكفي أن نكتب النص دفعةً واحدة (fill) — ذلك لا يُشبه الواقع ولا
  يكشف العطل. هنا يُكتب حرفًا حرفًا (type)، ثم يُسأل المتصفّح بعد كل
  حرف: أيّ عنصر يحمل التركيز الآن؟

  التشغيل: node tests/e2e/injazi.typing.e2e.mjs
*/
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/#";
const STAMP = Date.now().toString().slice(-4);

let passed = 0, failed = 0;
const failures = [];
function ok(n, c, note = "") {
  if (c) { passed++; console.log(`✓ ${n}${note ? ` — ${note}` : ""}`); }
  else { failed++; failures.push(n); console.log(`✗ ${n}${note ? ` — ${note}` : ""}`); }
}

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

// ---------------- المشرفة: رابط طالبة
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
const row = admin.locator(".iz-admin-row").first();
await row.getByRole("button", { name: /رابطها/ }).click();
await admin.waitForTimeout(800);
const make = admin.getByRole("button", { name: /إنشاء الرابط/ });
if (await make.count()) { await make.click(); await admin.waitForTimeout(2200); }
const link = await admin.locator(".iz-modal input").first().inputValue();
await actx.close();

// ---------------- الطالبة على الجوّال
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(link, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4500);

/** يكتب حرفًا حرفًا ويرصد كل مرة يهرب فيها التركيز من الخانة. */
async function typeAndWatch(label, input, text) {
  await input.click();
  let escapes = 0;
  let firstEscapeAt = -1;
  for (let i = 0; i < text.length; i++) {
    // insertText لا press: مفاتيح الحروف العربية ليست أسماء مفاتيح
    // معروفة لدى المتصفّح، والمقصود هنا حدثُ الكتابة لا المفتاح نفسه.
    await page.keyboard.insertText(text[i]);
    // ٤٠ جزءًا من الثانية هو زمن مؤقّت التركيز في النافذة؛ ننتظر ضعفه.
    await page.waitForTimeout(120);
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return "none";
      return el.tagName === "INPUT" || el.tagName === "TEXTAREA"
        ? el.tagName
        : `${el.tagName}:${(el.getAttribute("aria-label") ?? el.className ?? "").slice(0, 30)}`;
    });
    if (focused !== "INPUT" && focused !== "TEXTAREA") {
      escapes++;
      if (firstEscapeAt < 0) firstEscapeAt = i + 1;
    }
  }
  const value = await input.inputValue();
  ok(
    `${label} — التركيز لم يهرب أثناء الكتابة`,
    escapes === 0,
    escapes ? `هرب ${escapes} مرة، أولها بعد الحرف ${firstEscapeAt}` : `${text.length} حرفًا`,
  );
  ok(`${label} — النص كامل في الخانة`, value === text, `«${value}»`);
  return value === text && escapes === 0;
}

const modal = () => page.locator(".iz-modal");

// ---------------- إضافة مشروع
await page.getByRole("button", { name: /^إضافة مشروع$/ }).first().click();
await page.waitForTimeout(1500);
const TITLE = `مشروع الكتابة ${STAMP}`;
await typeAndWatch("عنوان المشروع", modal().locator("input").first(), TITLE);
await typeAndWatch("وصف المشروع", modal().locator("textarea").first(), `وصف ${STAMP}`);
await page.locator(".iz-modal__foot").getByRole("button", { name: /^حفظ المشروع$/ }).click();
await page.waitForTimeout(4500);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
ok("المشروع حُفظ بعنوانه كاملًا", (await page.getByText(TITLE).count()) > 0);

// ---------------- إضافة شهادة
await page.getByRole("button", { name: /^إضافة$/ }).last().click();
await page.waitForTimeout(1500);
if ((await modal().count()) > 0) {
  const CERT = `شهادة شكر ${STAMP}`;
  await typeAndWatch("عنوان الشهادة", modal().locator("input").first(), CERT);
  await page.locator(".iz-modal__foot").getByRole("button", { name: /^حفظ$/ }).click();
  await page.waitForTimeout(4500);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  ok("الشهادة حُفظت بعنوانها كاملًا", (await page.getByText(CERT).count()) > 0);
} else {
  ok("نافذة الشهادة تفتح", false);
}

// ---------------- هواياتي
await page.getByRole("button", { name: /^هواياتي$/ }).first().click();
await page.waitForTimeout(1500);
await typeAndWatch("اسم الهواية", modal().locator('input[aria-label="اسم الهواية"]'), `السباحة ${STAMP}`);
await page.keyboard.press("Escape");
await page.waitForTimeout(800);
const leaving = page.getByRole("button", { name: /نعم|تجاهل|خروج/ });
if (await leaving.count()) await leaving.first().click();

await browser.close();
console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
if (failures.length) console.log("الإخفاقات:\n  " + failures.join("\n  "));
process.exit(failed === 0 ? 0 : 1);
