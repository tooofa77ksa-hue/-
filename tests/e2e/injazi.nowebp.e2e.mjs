/*
  متصفّح لا يُرمّز WebP — ومع ذلك تُرفع الصورة.
  ------------------------------------------------------------------
  المشرفة رفعت صورة من جوّالها فقيل لها «الصورة كبيرة»، وصورتها ليست
  كبيرة: canvas.toBlob حين لا يدعم المتصفّح WebP لا يفشل، بل يعود بـ
  PNG صامتًا — وPNG يتجاهل الجودة ويبقى ضخمًا لصورة فوتوغرافية، فتفشل
  كل مراحل الضغط مهما صغّرت الأبعاد.

  هنا نُعطّل ترميز WebP في المتصفّح (كما هو حال بعض متصفّحات الجوّال)
  ونتحقّق أن الصورة تُرفع رغم ذلك، وتبقى بعد التحديث.

  التشغيل: node tests/e2e/injazi.nowebp.e2e.mjs
*/
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://127.0.0.1:5173/#";
// صورة كبيرة نسبيًا كي تدخل مسار الضغط فعلًا.
const big = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8//8/AzJgYkAD5AsAAP//DlgBhQe0M+wAAAAASUVORK5CYII=",
  "base64");
writeFileSync("/tmp/big.png", big);

let passed = 0, failed = 0;
const ok = (n, c, note = "") => {
  if (c) { passed++; console.log(`✓ ${n}${note ? ` — ${note}` : ""}`); }
  else { failed++; console.log(`✗ ${n}${note ? ` — ${note}` : ""}`); }
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 640 } });

// نُحاكي متصفّحًا لا يُرمّز WebP: أي طلب ترميز بهذه الصيغة يعود بـ PNG،
// وهو بالضبط ما تفعله المتصفّحات التي لا تدعمها.
await ctx.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function (cb, type, quality) {
    const fallback = type === "image/webp" ? "image/png" : type;
    return original.call(this, cb, fallback, quality);
  };
});

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

await page.getByRole("button", { name: /تخصيص الملف/ }).click();
await page.waitForTimeout(1200);
await page.locator('.iz-modal input[type="file"]').first().setInputFiles("/tmp/big.png");
await page.waitForTimeout(2000);
const cropBtn = page.locator(".iz-modal").last().getByRole("button", { name: /حفظ الصورة/ });
if (await cropBtn.count()) await cropBtn.click();
await page.waitForTimeout(6000);

const err = await page.locator(".iz-notice--danger, .iz-field__error").allInnerTexts();
ok("لا رسالة «الصورة كبيرة» على متصفّح بلا WebP", err.length === 0, err.join(" · ").slice(0, 90));
ok("المعاينة ظهرت", (await page.locator(".iz-preview__avatar img, .iz-thumb img").count()) > 0);

await page.locator(".iz-modal").getByRole("button", { name: /حفظ التخصيص/ }).click();
await page.waitForTimeout(4000);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(4500);
ok("الصورة باقية بعد التحديث", (await page.locator(".iz-profile__avatar img").count()) > 0);

await browser.close();
console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
process.exit(failed === 0 ? 0 : 1);
