/*
  صلاحيات المعلمة — الثلاث نقاط التي لم تُقَس من قبل.
  ------------------------------------------------------------------
    ١) هل ترى ملفات الطالبات الثماني كلهنّ، وتفتح ملف أي واحدة؟
    ٢) هل ترى داخل الملف: الشهادات، والإنجازات، والصور، والروابط؟
    ٣) هل تكتب تعليقًا نصيًّا ويُحفظ ويبقى بعد إعادة التحميل، وبعد
       خروج ودخول جديدين؟

  وفي المقابل: ما لا يجوز لها — تعديل ملف الطالبة، أو الكتابة في مادة
  زميلتها، أو انتحال اسم معلمة أخرى — يُقاس من القواعد لا من الواجهة.

  التشغيل: node tests/e2e/injazi.teacher.e2e.mjs
*/
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:5173/#";
const OUT = process.env.IZ_SHOTS || "./.e2e-shots";
mkdirSync(OUT, { recursive: true });
const STAMP = Date.now().toString().slice(-5);
writeFileSync("/tmp/tp.png", Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8//8/AzJgYkAD5AsAAP//DlgBhQe0M+wAAAAASUVORK5CYII=",
  "base64"));

let passed = 0, failed = 0;
const failures = [];
const ok = (n, c, note = "") => {
  if (c) { passed++; console.log(`✓ ${n}${note ? ` — ${note}` : ""}`); }
  else { failed++; failures.push(n); console.log(`✗ ${n}${note ? ` — ${note}` : ""}`); }
};

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

// ===== المشرفة: أسماء الطالبات ورابط طالبة واحدة لتجهيز محتوى حقيقي =====
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
ok("أسماء الطالبات قُرئت من النظام", NAMES.length >= 8, `${NAMES.length}`);

const target = NAMES[0];
const row = admin.locator(".iz-admin-row").filter({ hasText: target }).first();
await row.getByRole("button", { name: /رابطها/ }).click();
await admin.waitForTimeout(700);
const make = admin.getByRole("button", { name: /إنشاء الرابط/ });
if (await make.count()) { await make.click(); await admin.waitForTimeout(2200); }
const studentLink = await admin.locator(".iz-modal input").first().inputValue();
await admin.locator(".iz-modal__foot button").first().click();
await actx.close();

// ===== الطالبة تُنشئ محتوى حقيقيًا: مشروع بصورة ورابط + شهادة =====
const PROJ = `مشروع للمعلمة ${STAMP}`;
const CERT = `شهادة للمعلمة ${STAMP}`;
const LINKURL = "https://drive.google.com/file/d/teachercheck/view";
{
  const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  await p.goto(studentLink, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(4500);

  await p.getByRole("button", { name: /^إضافة مشروع$/ }).first().click();
  await p.waitForTimeout(1200);
  await p.locator(".iz-modal input").first().fill(PROJ);
  await p.locator(".iz-modal textarea").first().fill(`وصف ${PROJ}`);
  await p.locator('.iz-modal input[type="file"]').first().setInputFiles("/tmp/tp.png");
  await p.waitForTimeout(2200);
  const crop = p.locator(".iz-modal").last().getByRole("button", { name: /حفظ الصورة/ });
  if (await crop.count()) { await crop.click(); await p.waitForTimeout(3200); }
  await p.locator('.iz-modal input[aria-label="الرابط"]').fill(LINKURL);
  await p.locator(".iz-modal__foot").getByRole("button", { name: /^حفظ المشروع$/ }).click();
  await p.waitForTimeout(4000);

  const sec = p.locator("section").filter({ has: p.getByText("شهاداتي", { exact: true }) }).first();
  await sec.getByRole("button", { name: /^إضافة$/ }).first().click();
  await p.waitForTimeout(1000);
  await p.locator(".iz-modal input").first().fill(CERT);
  await p.locator(".iz-modal textarea").first().fill("شهادة تقدير من المدرسة");
  await p.locator(".iz-modal__foot button").last().click();
  await p.waitForTimeout(2800);
  await c.close();
}

// ===== المعلمة =====
const ctx = await browser.newContext({ viewport: { width: 1360, height: 950 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/teacher/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.locator('input[type="email"]').fill("teacher1@injazi.local");
await page.locator('input[type="password"]').fill("Teacher#2026");
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(3500);
ok("المعلمة تدخل بوابتها", /#\/teacher$/.test(page.url()), page.url());

// ---- ١) ترى الطالبات الثماني
const cards = await page.locator(".iz-student-card__name").allInnerTexts();
const seen = NAMES.slice(0, 8).filter((n) => cards.some((c) => c.trim() === n.trim()));
ok("ترى ملفات الطالبات الثماني", seen.length === 8, `${seen.length}/8`);
await page.screenshot({ path: `${OUT}/teacher-students.png` });

// ---- تفتح ملف أي طالبة
await page.locator(".iz-student-card").filter({ hasText: target }).first()
  .locator(".iz-student-card__cta").click();
await page.waitForTimeout(4000);
ok("تفتح ملف الطالبة", /#\/student\/[^/]+$/.test(page.url()), page.url());
const heading = await page.locator("h1").first().innerText().catch(() => "");
ok("الملف المفتوح لصاحبته", heading.includes(target.split(" ")[0]), heading);

// ---- ٢) ترى المحتوى: مشروع، صورة، رابط، شهادة
ok("ترى المشروع", (await page.getByText(PROJ).count()) > 0);
const projCard = page.locator(".iz-project, .iz-card").filter({ hasText: PROJ }).first();
ok("ترى صورة المشروع", (await projCard.locator("img").count()) > 0);
ok("ترى رابط المشروع", (await projCard.locator('a[href*="drive.google.com"]').count()) > 0);
ok("ترى الشهادة", (await page.getByText(CERT).count()) > 0);
ok("ترى وصف الشهادة", (await page.getByText("شهادة تقدير من المدرسة").count()) > 0);

// ---- لا تملك تعديل ملف الطالبة
ok(
  "لا تملك أدوات تخصيص ملف الطالبة",
  (await page.getByRole("button", { name: /تخصيص الملف/ }).count()) === 0 &&
    (await page.getByRole("button", { name: /^عني$/ }).count()) === 0,
);
await page.screenshot({ path: `${OUT}/teacher-portfolio.png`, fullPage: true });

// ---- ٣) تكتب تعليقًا وتقييمًا ويُحفظان
const COMMENT = `عمل متقن يا بطلة ${STAMP}`;
await page.goto(`${BASE}/teacher`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
const reviewRow = page.locator(".iz-review-row").first();
const hasRows = (await reviewRow.count()) > 0;
ok("ترى مشاريع مادتها للتقييم", hasRows);

if (hasRows) {
  await reviewRow.click();
  await page.waitForTimeout(1500);
  // النجمة زرّ بدور radio واسمه «٤ من ٥»؛ نقرُها بالمحدّد العام يصطدم
  // برسم الـSVG داخلها، فنستهدف الدور والاسم مباشرةً.
  const star4 = page.locator('.iz-modal [role="radio"][aria-label="4 من 5"]');
  if (await star4.count()) await star4.click({ force: true });
  await page.waitForTimeout(300);
  const badge = page.locator(".iz-badge-toggle");
  if (await badge.count()) await badge.click();
  await page.locator(".iz-modal textarea").first().fill(COMMENT);
  await page.locator(".iz-modal__foot button").last().click();
  await page.waitForTimeout(3500);
  ok("التقييم والتعليق حُفظا", (await page.locator(".iz-modal").count()) === 0);

  // البقاء بعد إعادة التحميل
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await page.locator(".iz-review-row").first().click();
  await page.waitForTimeout(1800);
  const kept = await page.locator(".iz-modal textarea").first().inputValue().catch(() => "");
  ok("التعليق باقٍ بعد التحديث", kept.includes(STAMP), kept.slice(0, 40));
  await page.locator(".iz-modal__foot button").first().click();
  await page.waitForTimeout(800);

  // البقاء بعد خروج ودخول جديدين
  await page.goto(`${BASE}/teacher`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const logout = page.getByRole("button", { name: /خروج/ }).first();
  if (await logout.count()) { await logout.click(); await page.waitForTimeout(2500); }
  await page.goto(`${BASE}/teacher/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  await page.locator('input[type="email"]').fill("teacher1@injazi.local");
  await page.locator('input[type="password"]').fill("Teacher#2026");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(4000);
  await page.locator(".iz-review-row").first().click();
  await page.waitForTimeout(1800);
  const kept2 = await page.locator(".iz-modal textarea").first().inputValue().catch(() => "");
  ok("التعليق باقٍ بعد خروج ودخول جديدين", kept2.includes(STAMP), kept2.slice(0, 40));
  await page.locator(".iz-modal__foot button").first().click();
  await page.waitForTimeout(600);

  // التعليق يظهر للطالبة/ولي الأمر في الملف
  const sctx = await browser.newContext();
  const spage = await sctx.newPage();
  await spage.goto(studentLink, { waitUntil: "domcontentloaded" });
  await spage.waitForTimeout(4500);
  ok("التعليق يظهر في ملف الطالبة", (await spage.getByText(COMMENT).count()) > 0);
  await sctx.close();
}

// ---- ما لا يجوز لها: يُقاس من القواعد
const denyEdit = await page.evaluate(async () => {
  const mod = await import("/src/injazi/services/repo.ts");
  const list = await mod.listOnce?.("apps/injazi/students").catch(() => null);
  void list;
  try {
    const students = await fetch(
      "http://127.0.0.1:8080/v1/projects/demo-injazi/databases/(default)/documents/apps/injazi/students?pageSize=1",
    ).then((r) => r.json());
    const id = students.documents[0].name.split("/").pop();
    await mod.updateStudent(id, { bio: "المعلمة عدّلت الملف" });
    return "ALLOWED";
  } catch (err) { return String(err?.code ?? err?.message ?? err); }
});
ok("لا تستطيع تعديل ملف الطالبة (القواعد)", /permission-denied/i.test(denyEdit), denyEdit);

const denyForge = await page.evaluate(async () => {
  const mod = await import("/src/injazi/services/repo.ts");
  try {
    await mod.saveEvaluation({
      projectId: "x", studentId: "x", teacherId: "معلمة-أخرى", subjectId: "مادة-ليست-لها",
      stars: 5, badge: true, status: "excellent", comment: "تقييم منتحَل",
    });
    return "ALLOWED";
  } catch (err) { return String(err?.code ?? err?.message ?? err); }
});
ok("لا تستطيع الكتابة باسم معلمة أخرى (القواعد)", /permission-denied/i.test(denyForge), denyForge);

await ctx.close();
await browser.close();
console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
if (failures.length) console.log("الفاشل: " + failures.join(" · "));
process.exit(failed === 0 ? 0 : 1);
