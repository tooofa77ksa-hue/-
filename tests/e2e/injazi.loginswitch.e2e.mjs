/*
  جلسة بدور آخر لا تحجب صفحة الدخول.
  ------------------------------------------------------------------
  الحالة التي وقعت فعلًا: المشرفة فتحت رابط لوحة الإدارة وفي متصفّحها
  جلسة معلمة، فقُذفت إلى بوابة المعلمات ورأت «أهلًا سميرة» ولم تجد
  خانة الدخول أبدًا — «لا أجد دخول الإدارة».

  التشغيل: node tests/e2e/injazi.loginswitch.e2e.mjs
*/
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/#";
let passed = 0, failed = 0;
const ok = (n, c, note = "") => {
  if (c) { passed++; console.log(`✓ ${n}${note ? ` — ${note}` : ""}`); }
  else { failed++; console.log(`✗ ${n}${note ? ` — ${note}` : ""}`); }
};

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

// ١) تدخل كمعلمة — كما حدث على جهاز المشرفة.
await page.goto(`${BASE}/teacher/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.locator('input[type="email"]').fill("teacher1@injazi.local");
await page.locator('input[type="password"]').fill("Teacher#2026");
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(3500);
ok("جلسة المعلمة مفتوحة", /#\/teacher$/.test(page.url()), page.url());

// ٢) تفتح رابط لوحة الإدارة بالجلسة نفسها.
await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);

ok("لا تُقذَف إلى بوابة المعلمات", /#\/admin\/login$/.test(page.url()), page.url());
ok("خانة البريد ظاهرة", (await page.locator('input[type="email"]').count()) === 1);
ok("خانة كلمة المرور ظاهرة", (await page.locator('input[type="password"]').count()) === 1);
ok("تُخبَر باسم الجلسة المفتوحة", (await page.getByText(/داخل الآن باسم/).count()) > 0);

// ٣) زر الخروج يفتح لها الدخول بحسابها.
await page.getByRole("button", { name: /تسجيل الخروج/ }).click();
await page.waitForTimeout(2500);
ok("اللافتة تختفي بعد الخروج", (await page.getByText(/داخل الآن باسم/).count()) === 0);
ok("ما زالت على صفحة دخول الإدارة", /#\/admin\/login$/.test(page.url()), page.url());

await page.locator('input[type="email"]').fill("admin@injazi.local");
await page.locator('input[type="password"]').fill("Injazi#2026");
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(4000);
ok("تدخل اللوحة بحسابها", /#\/admin$/.test(page.url()) && (await page.locator(".iz-tabs").count()) > 0, page.url());

// ٤) ولا يتعطّل التحويل لمن جاءت إلى بوابتها هي.
await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2800);
ok("المشرفة الداخلة تُحوَّل إلى لوحتها كما كان", /#\/admin$/.test(page.url()), page.url());

await browser.close();
console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
process.exit(failed === 0 ? 0 : 1);
