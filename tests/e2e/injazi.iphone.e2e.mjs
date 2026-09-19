/*
  سيناريو الجوّال الحقيقي — بمقاس آيفون وبترتيب المشرفة حرفيًا.
  ------------------------------------------------------------------
  iPhone 14 Pro: 393×659 هو الارتفاع المرئي فعلًا بعد شريط العنوان
  وشريط سفاري السفلي — لا 852 الكامل. الفرق هو بالضبط ما كان يخفي زرّ
  الحفظ، فالقياس هنا بالارتفاع المرئي لا بمواصفات الجهاز.

  ويفحص السبب الجذري الذي لا يظهر في المحاكي أبدًا: الاستعلام المركّب.
  محاكي Firestore ينشئ الفهارس تلقائيًا، فالعطل كان خفيًّا محليًا وظاهرًا
  في الإنتاج وحده — لذلك نفحص هنا أن الاستعلام لم يعد يحتاج فهرسًا.

  التشغيل: node tests/e2e/injazi.iphone.e2e.mjs
*/
import { chromium, devices } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:5173/#";
const OUT = process.env.IZ_SHOTS || "./.e2e-shots";
mkdirSync(OUT, { recursive: true });
const STAMP = Date.now().toString().slice(-5);
writeFileSync("/tmp/ip.png", Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8//8/AzJgYkAD5AsAAP//DlgBhQe0M+wAAAAASUVORK5CYII=",
  "base64"));

let passed = 0, failed = 0;
const failures = [], techLeaks = [], consoleErrors = [];
const ok = (n, c, note = "") => {
  if (c) { passed++; console.log(`✓ ${n}${note ? ` — ${note}` : ""}`); }
  else { failed++; failures.push(n); console.log(`✗ ${n}${note ? ` — ${note}` : ""}`); }
};

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

// رابط طالبة
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
const NAMES = await admin.locator(".iz-admin-row__text strong").allInnerTexts();
async function linkFor(name) {
  const r = admin.locator(".iz-admin-row").filter({ hasText: name }).first();
  await r.getByRole("button", { name: /رابطها/ }).click();
  await admin.waitForTimeout(700);
  const m = admin.getByRole("button", { name: /إنشاء الرابط/ });
  if (await m.count()) { await m.click(); await admin.waitForTimeout(2200); }
  const u = await admin.locator(".iz-modal input").first().inputValue();
  await admin.locator(".iz-modal__foot button").first().click();
  await admin.waitForTimeout(500);
  return u;
}
const links = {};
for (const n of NAMES.slice(0, 8)) links[n] = await linkFor(n);
await actx.close();

// ===== آيفون: الارتفاع المرئي بعد أشرطة سفاري =====
const iphone = {
  ...devices["iPhone 14 Pro"],
  viewport: { width: 393, height: 659 },
  hasTouch: true,
  isMobile: true,
};
const ctx = await browser.newContext(iphone);
const page = await ctx.newPage();
page.on("console", (m) => {
  const t = m.text();
  // ERR_TUNNEL/ERR_CERT انقطاع شبكة بيئة الفحص (خطوط Google مثلًا)
  // لا خطأ في التطبيق؛ استثناؤه يمنع إنذارًا كاذبًا يُدرَّب عليه الناس.
  const envNoise = /ERR_CERT|ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|favicon|fonts\.googleapis/.test(t);
  if (m.type() === "error" && !envNoise) {
    consoleErrors.push(t.slice(0, 160));
  }
});

const first = NAMES[0];
await page.goto(links[first], { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
ok("رابط الطالبة يفتح ملفها على آيفون", /#\/student\/[^/]+$/.test(page.url()), first);

// --- لا نصّ تقني على شاشة الطالبة
async function scanLeaks(where) {
  const body = await page.locator("body").innerText();
  const bad = [
    ["رابط Firebase", /firebase\.google\.com|console\.firebase/i],
    ["رمز فهرس", /create_composite|requires an index/i],
    ["نصّ إنجليزي تقني", /FAILED_PRECONDITION|PERMISSION_DENIED|FirebaseError/],
  ].filter(([, re]) => re.test(body));
  if (bad.length) techLeaks.push(`${where}: ${bad.map((b) => b[0]).join("، ")}`);
  return bad.length === 0;
}
ok("لا نصّ تقني في ملف الطالبة", await scanLeaks("الملف"));

// --- النموذج
await page.getByRole("button", { name: /^إضافة مشروع$/ }).first().click();
await page.waitForTimeout(1400);

const foot = page.locator(".iz-modal__foot");
const save = foot.getByRole("button", { name: /^حفظ المشروع$/ });
ok("زرّ «حفظ المشروع» في الشريط السفلي", (await save.count()) === 1);

async function saveVisible(label) {
  const box = await save.boundingBox();
  const inView = box !== null && box.y >= 0 && box.y + box.height <= 659;
  ok(`زرّ الحفظ ظاهر داخل الشاشة — ${label}`, inView,
     box ? `y=${Math.round(box.y)} إلى ${Math.round(box.y + box.height)} من 659` : "غير مرئي");
  return inView;
}
await saveVisible("عند الفتح");

// التمرير إلى آخر النموذج: الشريط يجب أن يبقى
await page.locator(".iz-modal__body").evaluate((el) => el.scrollTo(0, el.scrollHeight));
await page.waitForTimeout(700);
await saveVisible("بعد التمرير إلى الأسفل");

// الحشو السفلي يراعي منطقة الأمان
const padding = await foot.evaluate((el) => getComputedStyle(el).paddingBottom);
ok("الشريط يحجز حشوًا سفليًا (منطقة أمان آيفون)", parseFloat(padding) >= 16, padding);

// --- حالة الحفظ قبل الحفظ
ok("الحالة تقول «لم يُحفظ بعد» قبل الحفظ",
   (await page.locator(".iz-save-state--dirty").count()) === 1);

// --- السيناريو الحرفي
await page.locator(".iz-modal__body").evaluate((el) => el.scrollTo(0, 0));
const TITLE = `مشروعي على الجوّال ${STAMP}`;
const DESC = `شرحته أمام الصف ${STAMP}`;
const URL1 = "https://drive.google.com/file/d/iphone/view";
await page.locator(".iz-modal input").first().fill(TITLE);
const subject = page.locator(".iz-modal select").first();
if (await subject.count()) {
  const opts = await subject.locator("option").count();
  if (opts > 1) await subject.selectOption({ index: 1 });
}
await page.locator(".iz-modal textarea").first().fill(DESC);
await page.locator('.iz-modal input[type="file"]').first().setInputFiles("/tmp/ip.png");
await page.waitForTimeout(2500);
const crop = page.locator(".iz-modal").last().getByRole("button", { name: /حفظ الصورة/ });
if (await crop.count()) { await crop.click(); await page.waitForTimeout(3500); }
await page.locator('.iz-modal input[aria-label="الرابط"]').fill(URL1);
await page.waitForTimeout(400);

await save.click();
await page.waitForTimeout(4500);
ok("النموذج أُغلق بعد الحفظ", (await page.locator(".iz-modal").count()) === 0);
ok("المشروع ظهر فورًا بلا تحديث", (await page.getByText(TITLE).count()) > 0);
await page.screenshot({ path: `${OUT}/iphone-after-save.png`, fullPage: true });

// --- Refresh: القيم قبل وبعد
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5500);
ok("العنوان باقٍ بعد Refresh", (await page.getByText(TITLE).count()) > 0);
ok("الوصف باقٍ بعد Refresh", (await page.getByText(DESC).count()) > 0);
const card = page.locator(".iz-project").filter({ hasText: TITLE }).first();
ok("صورة الغلاف باقية", (await card.locator("img").count()) > 0);
ok("الرابط باقٍ", (await card.locator('a[href*="drive.google.com"]').count()) > 0);
ok("لا نصّ تقني بعد Refresh", await scanLeaks("بعد Refresh"));

// --- تعديل نقطة واحدة
const EDITED = `${TITLE} — معدّل`;
await card.locator('button[aria-label^="تعديل"]').first().click();
await page.waitForTimeout(1500);
await saveVisible("في وضع التعديل");
await page.locator(".iz-modal input").first().fill(EDITED);
await page.locator(".iz-modal__foot").getByRole("button", { name: /^حفظ المشروع$/ }).click();
await page.waitForTimeout(4500);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
ok("التعديل باقٍ بعد Refresh", (await page.getByText(EDITED).count()) > 0);

// --- تأكيد من قاعدة البيانات لا من الشاشة
const inDb = await fetch(
  "http://127.0.0.1:8080/v1/projects/demo-injazi/databases/(default)/documents/apps/injazi/projects?pageSize=300",
).then((r) => r.json()).then((d) =>
  (d.documents ?? []).filter((x) => (x.fields?.title?.stringValue ?? "") === EDITED),
).catch(() => []);
ok("المشروع مكتوب في قاعدة البيانات", inDb.length === 1, `عدد المستندات: ${inDb.length}`);
if (inDb.length === 1) {
  const f = inDb[0].fields;
  ok("الغلاف مخزَّن في قاعدة البيانات", Boolean(f.coverUrl?.stringValue));
  ok("الرابط مخزَّن في قاعدة البيانات",
     (f.links?.arrayValue?.values ?? []).length === 1);
  ok("الوصف مخزَّن في قاعدة البيانات", (f.description?.stringValue ?? "").includes(STAMP));
}

await ctx.close();

// ===== الطالبات الثماني على المقاس نفسه =====
const per = [];
for (const name of NAMES.slice(0, 8)) {
  const c = await browser.newContext(iphone);
  const p = await c.newPage();
  const t = `مشروع ${name} ${STAMP}`;
  const checks = {};
  try {
    await p.goto(links[name], { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(5000);
    const body = await p.locator("body").innerText();
    checks["لا نصّ تقني"] = !/firebase\.google\.com|requires an index|FirebaseError/i.test(body);
    await p.getByRole("button", { name: /^إضافة مشروع$/ }).first().click();
    await p.waitForTimeout(1400);
    const sv = p.locator(".iz-modal__foot").getByRole("button", { name: /^حفظ المشروع$/ });
    const box = await sv.boundingBox();
    checks["زرّ الحفظ ظاهر"] = box !== null && box.y + box.height <= 659;
    await p.locator(".iz-modal input").first().fill(t);
    await p.locator('.iz-modal input[aria-label="الرابط"]').fill("https://drive.google.com/x");
    await sv.click();
    await p.waitForTimeout(4200);
    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForTimeout(5000);
    checks["المشروع باقٍ بعد Refresh"] = (await p.getByText(t).count()) > 0;
    const mine = p.locator(".iz-project").filter({ hasText: t }).first();
    checks["الرابط باقٍ"] = (await mine.locator('a[href*="drive.google.com"]').count()) > 0;
    // تنظيف
    await mine.locator('button[aria-label^="حذف"]').first().click();
    await p.waitForTimeout(1000);
    const cf = p.locator(".iz-modal__foot button").last();
    if (await cf.count()) { await cf.click(); await p.waitForTimeout(2600); }
    checks["نُظّفت بيانات الاختبار"] = true;
  } catch (err) {
    consoleErrors.push(`[${name}] ${String(err).slice(0, 140)}`);
  } finally { await c.close(); }
  const pass = Object.keys(checks).length >= 5 && Object.values(checks).every(Boolean);
  per.push({ name, pass, checks });
}
console.log();
for (const r of per) {
  console.log(`${r.pass ? "✓" : "✗"} ${r.name}`);
  for (const [k, v] of Object.entries(r.checks)) console.log(`      ${v ? "✓" : "✗"} ${k}`);
}
ok("الطالبات الثماني على آيفون", per.every((r) => r.pass), `${per.filter((r) => r.pass).length}/8`);

ok("لا تسريب نصّ تقني في أي شاشة", techLeaks.length === 0, techLeaks.join(" · "));
ok("لا أخطاء طرفية", consoleErrors.length === 0, [...new Set(consoleErrors)].slice(0, 2).join(" · "));

await browser.close();
console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
if (failures.length) console.log("الفاشل: " + failures.join(" · "));
process.exit(failed === 0 ? 0 : 1);
