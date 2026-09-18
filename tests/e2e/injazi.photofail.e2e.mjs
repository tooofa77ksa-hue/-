/*
  فشل رفع الصورة لا يمرّ صامتًا.
  ------------------------------------------------------------------
  الحالة التي وقعت: المشرفة أرفقت صورة وحفظت وحدّثت الصفحة، فلم تظهر
  الصورة — وقاعدة البيانات تقول photoUrl = null. أي أن الرفع فشل، ثم
  مضى الحفظ وكتب «بلا صورة» دون أن يقول شيئًا.

  هنا نُفشِل الكتابة عمدًا (اعتراض طلب Firestore) ونتحقّق أن:
    • الخطأ يظهر ظاهرًا لا سطرًا صغيرًا.
    • «حفظ التخصيص» يرفض المضيّ فوق فشل لم يُعالَج.
    • ويبقى الطريق مفتوحًا لمن تريد المتابعة بلا صورة.

  التشغيل: node tests/e2e/injazi.photofail.e2e.mjs
*/
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://127.0.0.1:5173/#";
writeFileSync("/tmp/p.png", Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8//8/AzJgYkAD5AsAAP//DlgBhQe0M+wAAAAASUVORK5CYII=",
  "base64"));

let passed = 0, failed = 0;
const ok = (n, c, note = "") => {
  if (c) { passed++; console.log(`✓ ${n}${note ? ` — ${note}` : ""}`); }
  else { failed++; console.log(`✗ ${n}${note ? ` — ${note}` : ""}`); }
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 640 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.locator('input[type="email"]').fill("admin@injazi.local");
await page.locator('input[type="password"]').fill("Injazi#2026");
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(3000);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.locator(".iz-student-card__cta").first().click();
await page.waitForTimeout(3500);

// نقطع كتابة الوسائط وحدها: بقية الصفحة تبقى تعمل كما في الواقع.
await page.route("**/google.firestore.v1.Firestore/Write/**", (route) => route.abort("failed"));

await page.getByRole("button", { name: /تخصيص الملف/ }).click();
await page.waitForTimeout(1200);
await page.locator('.iz-modal input[type="file"]').first().setInputFiles("/tmp/p.png");
await page.waitForTimeout(2000);
const cropBtn = page.locator(".iz-modal").last().getByRole("button", { name: /حفظ الصورة/ });
if (await cropBtn.count()) await cropBtn.click();
await page.waitForTimeout(26000);

const notice = await page.locator(".iz-notice--danger").count();
ok("الفشل يظهر بلافتة ظاهرة", notice > 0);

const noticeText = await page.locator(".iz-notice--danger").first().innerText().catch(() => "");
ok("اللافتة تذكر سببًا لا عبارة عامة", noticeText.length > 20, noticeText.slice(0, 80));

// الحفظ يرفض المضيّ
await page.locator(".iz-modal").getByRole("button", { name: /حفظ التخصيص/ }).click();
await page.waitForTimeout(1500);
ok("النافذة ما زالت مفتوحة (لم يُحفظ فوق الفشل)", (await page.locator(".iz-modal").count()) > 0);
ok(
  "تُخبَر بسبب رفض الحفظ",
  (await page.getByText(/لم تُرفع الصورة بعد/).count()) > 0,
);

// الطريق مفتوح لمن تريد المتابعة بلا صورة — بعد عودة الشبكة، وإلا
// فشل الحفظ نفسه لسبب آخر ولا يقول هذا الفحص شيئًا.
await page.unroute("**/google.firestore.v1.Firestore/Write/**");
await page.getByRole("button", { name: /تجاهل ومتابعة بلا صورة/ }).click();
await page.waitForTimeout(800);
ok("اللافتة تختفي بعد التجاهل", (await page.locator(".iz-notice--danger").count()) === 0);
await page.locator(".iz-modal").getByRole("button", { name: /حفظ التخصيص/ }).click();
// انتظار الحدث لا مدّة ثابتة: Firestore يحتاج وقتًا متفاوتًا ليستأنف
// الاتصال بعد انقطاع، ومدّة ثابتة تجعل الفحص يرجّح لا يقيس.
const closed = await page
  .locator(".iz-modal")
  .first()
  .waitFor({ state: "detached", timeout: 25000 })
  .then(() => true, () => false);
ok("المتابعة بلا صورة ممكنة بعد التجاهل", closed);

await browser.close();
console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
process.exit(failed === 0 ? 0 : 1);
