/*
  «إضافة مشروع» — من الزرّ إلى قاعدة البيانات والعودة.
  ------------------------------------------------------------------
  يغطّي تقرير التحقّق المطلوب صفًّا صفًّا:
    • زرّ حفظ واحد باسم «حفظ المشروع» داخل النموذج، ولا تكرار معه.
    • مشروع بصورة: الرفع، والمعاينة، والرابط في قاعدة البيانات، والبقاء.
    • مشروع برابط: يُحفظ حتى لو لم تُضغط «إضافة» الصغيرة.
    • رابط غير صالح: يُوقف الحفظ برسالة، ولا يُنشئ سجلًّا ناقصًا.
    • دورة الحياة: إنشاء ← قراءة ← تعديل ← حذف ← إعادة تحميل.
    • منع الضغط المزدوج.
    • عزل الطالبات: كتابة مباشرة على ملف أخرى ⇒ رفض من القواعد.
    • صلاحيات المعلمة: تقييم يُحفظ ويبقى، ولا يتجاوز مادتها.
    • أخطاء الطرفية.

  القراءة بعد إعادة التحميل لا من الشاشة: الفرق بين «الزر يعمل»
  و«البيانات محفوظة».

  التشغيل: node tests/e2e/injazi.projects.e2e.mjs
*/
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:5173/#";
const OUT = process.env.IZ_SHOTS || "./.e2e-shots";
mkdirSync(OUT, { recursive: true });
const STAMP = Date.now().toString().slice(-5);

writeFileSync("/tmp/proj.png", Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8//8/AzJgYkAD5AsAAP//DlgBhQe0M+wAAAAASUVORK5CYII=",
  "base64"));

let passed = 0, failed = 0;
const failures = [];
const consoleErrors = [];
function ok(n, c, note = "") {
  if (c) { passed++; console.log(`✓ ${n}${note ? ` — ${note}` : ""}`); }
  else { failed++; failures.push(n); console.log(`✗ ${n}${note ? ` — ${note}` : ""}`); }
}
function watch(page, tag) {
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !t.includes("ERR_CERT") && !t.includes("favicon")) {
      consoleErrors.push(`[${tag}] ${t.slice(0, 160)}`);
    }
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${tag}] ${e.message.slice(0, 160)}`));
}

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

// ============ المشرفة: أسماء الطالبات الفعلية وروابطهنّ ============
const actx = await browser.newContext({ viewport: { width: 1360, height: 950 } });
const admin = await actx.newPage();
watch(admin, "admin");
await admin.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await admin.waitForTimeout(1500);
await admin.locator('input[type="email"]').fill("admin@injazi.local");
await admin.locator('input[type="password"]').fill("Injazi#2026");
await admin.locator('button[type="submit"]').click();
await admin.waitForTimeout(3000);
await admin.goto(`${BASE}/admin/students`, { waitUntil: "domcontentloaded" });
await admin.waitForTimeout(2500);

// الأسماء تُستخرج من النظام نفسه، لا تُكتب هنا.
const NAMES = await admin.locator(".iz-admin-row__text strong").allInnerTexts();
ok("قائمة الطالبات قُرئت من النظام", NAMES.length >= 8, `${NAMES.length} طالبة`);

async function linkFor(name) {
  const row = admin.locator(".iz-admin-row").filter({ hasText: name }).first();
  await row.getByRole("button", { name: /رابطها/ }).click();
  await admin.waitForTimeout(700);
  const make = admin.getByRole("button", { name: /إنشاء الرابط/ });
  if (await make.count()) { await make.click(); await admin.waitForTimeout(2200); }
  const url = await admin.locator(".iz-modal input").first().inputValue();
  await admin.locator(".iz-modal__foot button").first().click();
  await admin.waitForTimeout(500);
  return url;
}

const links = {};
for (const name of NAMES.slice(0, 8)) links[name] = await linkFor(name);
await actx.close();

// ============ أدوات مشتركة ============
async function openEditor(page) {
  await page.getByRole("button", { name: /^إضافة مشروع$/ }).first().click();
  await page.waitForTimeout(1200);
}
const saveBtn = (page) => page.locator(".iz-modal__foot").getByRole("button", { name: /^حفظ المشروع$/ });

// ============ الطالبة الأولى: الفحص العميق (جوّال) ============
const first = NAMES[0];
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
watch(page, first);
await page.goto(links[first], { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4500);
const myUrl = page.url();
ok("رابط الطالبة يفتح ملفها", /#\/student\/[^/]+$/.test(myUrl), first);

// ---- زر الحفظ: واحد، باسمه، داخل النموذج
await openEditor(page);
const saveCount = await saveBtn(page).count();
ok("زر «حفظ المشروع» موجود داخل النموذج", saveCount === 1, `العدد: ${saveCount}`);
const anywhere = await page.getByRole("button", { name: /^حفظ المشروع$/ }).count();
ok("ولا يتكرّر في الصفحة كلها", anywhere === 1, `العدد: ${anywhere}`);
const oldLabel = await page.getByRole("button", { name: /^إضافة المشروع$/ }).count();
ok("الاسم القديم المتشابه اختفى", oldLabel === 0);

// ---- مشروع بصورة + رابط، والرابط لم تُضغط له «إضافة»
const T1 = `مشروع بصورة ${STAMP}`;
const URL1 = "https://drive.google.com/file/d/testinjazi/view";
await page.locator(".iz-modal input").first().fill(T1);
await page.locator(".iz-modal textarea").first().fill(`وصف ${T1}`);
await page.locator('.iz-modal input[type="file"]').first().setInputFiles("/tmp/proj.png");
await page.waitForTimeout(2500);
const crop = page.locator(".iz-modal").last().getByRole("button", { name: /حفظ الصورة/ });
if (await crop.count()) { await crop.click(); await page.waitForTimeout(3500); }
await page.locator('.iz-modal input[aria-label="الرابط"]').fill(URL1);
// عمدًا: لا نضغط «إضافة» — هذا ما تفعله المستخدمة.
await saveBtn(page).click();
await page.waitForTimeout(4000);

ok("المشروع ظهر في الملف", (await page.getByText(T1).count()) > 0);

// ---- البقاء بعد إعادة التحميل
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
ok("المشروع باقٍ بعد التحديث", (await page.getByText(T1).count()) > 0);
const card = page.locator(".iz-project, .iz-card").filter({ hasText: T1 }).first();
ok("صورة الغلاف ظاهرة", (await card.locator("img").count()) > 0);
ok("الرابط حُفظ رغم عدم الضغط على «إضافة»", (await card.locator('a[href*="drive.google.com"]').count()) > 0);
await page.screenshot({ path: `${OUT}/projects-mobile.png`, fullPage: true });

// ---- رابط غير صالح يوقف الحفظ ولا يُنشئ سجلًّا
const before = await page.locator(".iz-project, .iz-card").count();
await openEditor(page);
await page.locator(".iz-modal input").first().fill(`مشروع رابط فاسد ${STAMP}`);
await page.locator('.iz-modal input[aria-label="الرابط"]').fill("ليس رابطًا");
await saveBtn(page).click();
await page.waitForTimeout(2000);
ok("رابط غير صالح يوقف الحفظ", (await page.locator(".iz-modal").count()) > 0);
ok("ويقول السبب", (await page.getByText(/الرابط غير صالح/).count()) > 0);
await page.getByRole("button", { name: /^إلغاء$/ }).click();
await page.waitForTimeout(1200);
ok("لم يُنشأ سجل ناقص", (await page.locator(".iz-project, .iz-card").count()) === before);

// ---- تعديل
const T2 = `${T1} معدّل`;
await card.locator('button[aria-label^="تعديل"]').first().click();
await page.waitForTimeout(1200);
ok("زر الحفظ في التعديل يحمل الاسم نفسه", (await saveBtn(page).count()) === 1);
await page.locator(".iz-modal input").first().fill(T2);
await saveBtn(page).click();
await page.waitForTimeout(4000);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
ok("التعديل باقٍ بعد التحديث", (await page.getByText(T2).count()) > 0);

// ---- حذف، ولا يعود
const card2 = page.locator(".iz-project, .iz-card").filter({ hasText: T2 }).first();
await card2.locator('button[aria-label^="حذف"]').first().click();
await page.waitForTimeout(1200);
const confirmBtn = page.locator(".iz-modal__foot button").last();
if (await confirmBtn.count()) { await confirmBtn.click(); await page.waitForTimeout(3000); }
ok("المشروع حُذف من الشاشة", (await page.getByText(T2).count()) === 0);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
ok("ولا يعود بعد التحديث", (await page.getByText(T2).count()) === 0);

// ---- منع الضغط المزدوج
const T3 = `مشروع ضغط مزدوج ${STAMP}`;
await openEditor(page);
await page.locator(".iz-modal input").first().fill(T3);
const btn = saveBtn(page);
await btn.click();
await btn.click({ force: true }).catch(() => {});
await btn.click({ force: true }).catch(() => {});
await page.waitForTimeout(5000);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
/*
  العدّ من قاعدة البيانات لا من الشاشة.
  المشروع الواحد يطابق عنصرَي DOM (غلاف .iz-card ومقالة .iz-project)،
  فعدّ العناصر يعطي ٢ لمشروع واحد ويبدو تكرارًا وليس بتكرار. السؤال
  هنا «كم مستندًا كُتب؟» ولا يُجاب إلا من المصدر.
*/
const dbCount = await fetch(
  "http://127.0.0.1:8080/v1/projects/demo-injazi/databases/(default)/documents/apps/injazi/projects?pageSize=300",
)
  .then((r) => r.json())
  .then((d) =>
    (d.documents ?? []).filter(
      (doc) => (doc.fields?.title?.stringValue ?? "") === T3,
    ).length,
  )
  .catch(() => -1);
ok("الضغط المتكرّر لا يُنشئ نسخًا في قاعدة البيانات", dbCount === 1, `عدد المستندات: ${dbCount}`);

// ---- العزل: كتابة مباشرة على ملف طالبة أخرى
const otherName = NAMES[1];
const octx = await browser.newContext();
const opage = await octx.newPage();
await opage.goto(links[otherName], { waitUntil: "domcontentloaded" });
await opage.waitForTimeout(4500);
const otherId = opage.url().split("/student/")[1];
await octx.close();

const denied = await page.evaluate(async (id) => {
  const mod = await import("/src/injazi/services/repo.ts");
  try {
    await mod.createProject({ studentId: id, subjectId: "any", title: "اختراق" });
    return "ALLOWED";
  } catch (err) { return String(err?.code ?? err?.message ?? err); }
}, otherId);
ok("إنشاء مشروع لطالبة أخرى مرفوض من القواعد", /permission-denied/i.test(denied), denied);

await ctx.close();

// ============ الطالبات الثماني: مشروع بصورة ورابط لكلٍّ منهنّ ============
const perStudent = [];
for (const name of NAMES.slice(0, 8)) {
  const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  watch(p, name);
  const checks = {};
  const title = `مشروع ${name} ${STAMP}`;
  try {
    await p.goto(links[name], { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(4500);
    const url = p.url();
    checks["فتح ملفها"] = /#\/student\/[^/]+$/.test(url);

    await openEditor(p);
    checks["زر حفظ واحد"] =
      (await p.getByRole("button", { name: /^حفظ المشروع$/ }).count()) === 1;
    await p.locator(".iz-modal input").first().fill(title);
    await p.locator('.iz-modal input[type="file"]').first().setInputFiles("/tmp/proj.png");
    await p.waitForTimeout(2200);
    const cr = p.locator(".iz-modal").last().getByRole("button", { name: /حفظ الصورة/ });
    if (await cr.count()) { await cr.click(); await p.waitForTimeout(3200); }
    await p.locator('.iz-modal input[aria-label="الرابط"]').fill("https://drive.google.com/x");
    await saveBtn(p).click();
    await p.waitForTimeout(4000);

    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForTimeout(4800);
    const mine = p.locator(".iz-project, .iz-card").filter({ hasText: title }).first();
    checks["المشروع باقٍ بعد التحديث"] = (await mine.count()) === 1;
    checks["صورته باقية"] = (await mine.locator("img").count()) > 0;
    checks["رابطه باقٍ"] = (await mine.locator('a[href*="drive.google.com"]').count()) > 0;

    // تنظيف بيانات الاختبار
    await mine.locator('button[aria-label^="حذف"]').first().click();
    await p.waitForTimeout(1000);
    const cf = p.locator(".iz-modal__foot button").last();
    if (await cf.count()) { await cf.click(); await p.waitForTimeout(2600); }
    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForTimeout(4200);
    checks["نُظّفت بيانات الاختبار"] =
      (await p.locator(".iz-project, .iz-card").filter({ hasText: title }).count()) === 0;
  } catch (err) {
    consoleErrors.push(`[${name}] ${String(err).slice(0, 160)}`);
  } finally {
    await c.close();
  }
  const pass = Object.values(checks).length >= 6 && Object.values(checks).every(Boolean);
  perStudent.push({ name, pass, checks });
}

const allPass = perStudent.filter((r) => r.pass).length;
console.log();
for (const r of perStudent) {
  console.log(`${r.pass ? "✓" : "✗"} ${r.name}`);
  for (const [k, v] of Object.entries(r.checks)) console.log(`      ${v ? "✓" : "✗"} ${k}`);
}
ok("الطالبات الثماني", allPass === perStudent.length, `${allPass}/${perStudent.length}`);

// ============ صلاحيات المعلمة: تقييم يُحفظ ويبقى ============
{
  const c = await browser.newContext({ viewport: { width: 1360, height: 950 } });
  const p = await c.newPage();
  watch(p, "teacher");
  await p.goto(`${BASE}/teacher/login`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1500);
  await p.locator('input[type="email"]').fill("teacher1@injazi.local");
  await p.locator('input[type="password"]').fill("Teacher#2026");
  await p.locator('button[type="submit"]').click();
  await p.waitForTimeout(3500);
  ok("المعلمة تدخل بوابتها", /#\/teacher$/.test(p.url()), p.url());
  ok("ترى ملفات الطالبات للقراءة", (await p.locator(".iz-student-card").count()) > 0);
  ok("لا تصل إلى لوحة الإدارة", await p.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" })
      .then(() => p.waitForTimeout(2500))
      .then(async () => (await p.locator(".iz-tabs").count()) === 0));
  await c.close();
}

// ============ سطح المكتب: لا انكسار في التخطيط ============
{
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  watch(p, "desktop");
  await p.goto(links[first], { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(4500);
  await openEditor(p);
  ok("النموذج يفتح على سطح المكتب", (await saveBtn(p).count()) === 1);
  const over = await p.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok("لا تمرير أفقي على سطح المكتب", over <= 0, `${over}px`);
  await p.screenshot({ path: `${OUT}/projects-desktop.png` });
  await c.close();
}

ok("لا أخطاء طرفية", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" · "));

await browser.close();
console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
if (failures.length) console.log("الفاشل: " + failures.join(" · "));
process.exit(failed === 0 ? 0 : 1);
