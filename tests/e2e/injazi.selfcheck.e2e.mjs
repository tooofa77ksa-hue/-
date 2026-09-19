/*
  صفحة الفحص الذاتي #/check — هل تقول الحقيقة؟
  ------------------------------------------------------------------
  صفحة تشخيص تكذب أسوأ من غياب التشخيص. فهنا يُتحقَّق من ثلاثة:
    • تُنفّذ العمليات الحقيقية وتقول «نجح» حين تنجح فعلًا.
    • لا تترك أثرًا: المشروع التجريبي لا يبقى في قاعدة البيانات.
    • حين تُفتح بلا صلاحية كتابة، لا تدّعي نجاحًا.

  التشغيل: node tests/e2e/injazi.selfcheck.e2e.mjs
*/
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/#";
const DB = "http://127.0.0.1:8080/v1/projects/demo-injazi/databases/(default)/documents";

let passed = 0, failed = 0;
const failures = [];
function ok(n, c, note = "") {
  if (c) { passed++; console.log(`✓ ${n}${note ? ` — ${note}` : ""}`); }
  else { failed++; failures.push(n); console.log(`✗ ${n}${note ? ` — ${note}` : ""}`); }
}

const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

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

const before = ((await json(`${DB}/apps/injazi/projects?pageSize=300`))?.documents ?? []).length;

// ---------------- الطالبة: تفتح الفحص من رابطها
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(link, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4500);
await page.goto(`${BASE}/check`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

ok("الصفحة تفتح", (await page.getByRole("heading", { name: /فحص النظام/ }).count()) > 0);
await page.getByRole("button", { name: /ابدئي الفحص/ }).click();
await page.waitForTimeout(25000);

const text = await page.locator("pre").first().innerText().catch(() => "");
const lines = text.split("\n").filter((l) => l.startsWith("✅") || l.startsWith("❌") || l.startsWith("⏭️"));
console.log(lines.map((l) => "    " + l).join("\n"));

ok("أنتج تقريرًا", lines.length >= 8, `${lines.length} سطرًا`);
ok("لا خطوة فاشلة في جلسة صحيحة", !text.includes("❌"), text.split("\n").find((l) => l.startsWith("❌")) ?? "");
ok("فحص الحفظ نُفّذ فعلًا", /حفظ مشروع تجريبي/.test(text));
ok("فحص الأرشفة نُفّذ", /أرشفة المشروع/.test(text));
ok("فحص الحذف نُفّذ", /حذف المشروع التجريبي/.test(text));

const after = ((await json(`${DB}/apps/injazi/projects?pageSize=300`))?.documents ?? []);
ok("لم يبقَ أثر في قاعدة البيانات", after.length === before, `${before} → ${after.length}`);
ok("ولا مشروع باسم الفحص", after.every((d) => !(d.fields?.title?.stringValue ?? "").includes("فحص تلقائي")));

// ---------------- زائرة بلا صلاحية: لا تدّعي نجاحًا
const gctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const guest = await gctx.newPage();
await guest.goto(`${BASE}/check`, { waitUntil: "domcontentloaded" });
await guest.waitForTimeout(3500);
await guest.getByRole("button", { name: /ابدئي الفحص/ }).click();
await guest.waitForTimeout(15000);
const gtext = await guest.locator("pre").first().innerText().catch(() => "");
ok("الزائرة: لا يُدّعى نجاح كتابة", /⏭️|❌/.test(gtext), gtext.split("\n").slice(3, 5).join(" | "));

await browser.close();
console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
if (failures.length) console.log("الإخفاقات:\n  " + failures.join("\n  "));
process.exit(failed === 0 ? 0 : 1);
