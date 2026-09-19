/*
  بوابة الانحدار الكاملة — مع تركيز على الحذف.
  ==================================================================
  السؤال الذي يجيب عنه هذا الملف ليس «هل اختفى من الشاشة؟» بل «ماذا
  بقي في قاعدة البيانات؟». الفرق بينهما هو كل الأعطال التي عولجت هنا:

    • تُحذف صورة ثم يُضغط «إلغاء» ⇒ كانت الصورة تُمحى فعلًا بينما
      المشروع ما زال يشير إليها: صورة مكسورة دائمة، والأصل ذهب.
    • يُحذف مشروع ⇒ كانت نسخ الصور (base64، حتى ٧٠٠ كيلوبايت لكل
      صورة) تبقى في قاعدة البيانات بلا أي مرجع إليها ولا زرّ يحذفها.
    • يُمسح نصّ ويُحفظ ⇒ لقطة حيّة واحدة كانت تعيد تعبئة النموذج من
      المحفوظ، فيعود النص القديم فوق ما كُتب.

  ولذلك كل صفّ هنا يُقرأ من Firestore مباشرة (REST على المحاكي) لا من
  الشاشة، والصفوف تتبع جدول التحقّق المطلوب صفًّا صفًّا.

  التشغيل: node tests/e2e/injazi.delete.e2e.mjs
*/
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:5173/#";
const DB = "http://127.0.0.1:8080/v1/projects/demo-injazi/databases/(default)/documents";
const OUT = process.env.IZ_SHOTS || "./.e2e-shots";
mkdirSync(OUT, { recursive: true });
const STAMP = Date.now().toString().slice(-5);

writeFileSync("/tmp/del.png", Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8//8/AzJgYkAD5AsAAP//DlgBhQe0M+wAAAAASUVORK5CYII=",
  "base64"));

let passed = 0, failed = 0;
const failures = [];
const consoleErrors = [];
const netFailures = [];
function ok(n, c, note = "") {
  if (c) { passed++; console.log(`✓ ${n}${note ? ` — ${note}` : ""}`); }
  else { failed++; failures.push(n); console.log(`✗ ${n}${note ? ` — ${note}` : ""}`); }
}
function watch(page, tag) {
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !t.includes("ERR_CERT") && !t.includes("favicon") && !t.includes("ERR_TUNNEL")) {
      consoleErrors.push(`[${tag}] ${t.slice(0, 160)}`);
    }
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${tag}] ${e.message.slice(0, 160)}`));
  page.on("requestfailed", (r) => {
    const url = r.url();
    // خطوط جوجل محجوبة عن هذه البيئة المعزولة، لا عن المستخدمة.
    if (url.includes("fonts.g") || url.includes("gstatic")) return;
    // ERR_ABORTED = المتصفّح ألغى الطلب لأننا انتقلنا بالصفحة أثناء
    // تحميلها. ليس فشل شبكة، وعدّه فشلًا يجعل الصفّ كذبًا في الاتجاهين.
    const why = r.failure()?.errorText ?? "?";
    if (why.includes("ERR_ABORTED")) return;
    netFailures.push(`[${tag}] ${why} ${url.slice(0, 110)}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().includes("favicon")) {
      netFailures.push(`[${tag}] HTTP ${r.status()} ${r.url().slice(0, 110)}`);
    }
  });
}

// ------------------------------------------------------ قراءة من المصدر
const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

async function projectDoc(title) {
  const data = await json(`${DB}/apps/injazi/projects?pageSize=300`);
  return (data?.documents ?? []).find((d) => (d.fields?.title?.stringValue ?? "") === title) ?? null;
}
const idOfDoc = (doc) => doc.name.split("/").pop();
const str = (doc, field) => doc?.fields?.[field]?.stringValue ?? null;
const arr = (doc, field) => doc?.fields?.[field]?.arrayValue?.values ?? [];
const mediaId = (reference) => (reference ?? "").replace("iz-media://", "");

async function mediaExists(reference) {
  if (!reference) return false;
  const data = await json(`${DB}/apps/injazi/media/${mediaId(reference)}`);
  return data !== null;
}

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

// ==================== المشرفة: رابط الطالبة ====================
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

const ME = NAMES[0];
const OTHER = NAMES[1];
const myLink = await linkFor(ME);
const otherLink = await linkFor(OTHER);
await actx.close();

// ==================== الطالبة على الجوّال ====================
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
watch(page, "student");
await page.goto(myLink, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4500);
const myUrl = page.url();
ok("١٨ · الجوّال: رابط الطالبة يفتح ملفها", /#\/student\/[^/]+$/.test(myUrl), ME);

const openEditor = async () => {
  await page.getByRole("button", { name: /^إضافة مشروع$/ }).first().click();
  await page.waitForTimeout(1200);
};
const saveBtn = () => page.locator(".iz-modal__foot").getByRole("button", { name: /^حفظ المشروع$/ });
const cancelBtn = () => page.locator(".iz-modal__foot").getByRole("button", { name: /^إلغاء$/ });
const modal = () => page.locator(".iz-modal");

async function uploadCover() {
  await modal().locator('input[type="file"]').first().setInputFiles("/tmp/del.png");
  await page.waitForTimeout(2500);
  const crop = page.locator(".iz-modal").last().getByRole("button", { name: /حفظ الصورة/ });
  if (await crop.count()) { await crop.click(); await page.waitForTimeout(3500); }
}
async function uploadAttachment() {
  await modal().locator('input[type="file"]').nth(1).setInputFiles("/tmp/del.png");
  await page.waitForTimeout(3500);
}

// -------- ١ إنشاء · ٢ نص · ٣ غلاف · ٤ صورة · ٥ رابط
const T = `مشروع الحذف ${STAMP}`;
const LINK = "https://drive.google.com/file/d/izdelete/view";
await openEditor();
await modal().locator("input").first().fill(T);
await modal().locator("textarea").first().fill(`وصف أوّلي ${STAMP}`);
await uploadCover();
await uploadAttachment();
await modal().locator('input[aria-label="الرابط"]').fill(LINK);
await saveBtn().click();
await page.waitForTimeout(4500);

let doc = await projectDoc(T);
ok("١ · إنشاء مشروع — المستند مكتوب في قاعدة البيانات", doc !== null);
const projectId = doc ? idOfDoc(doc) : "";
ok("٢ · حفظ النص — الوصف في قاعدة البيانات", str(doc, "description") === `وصف أوّلي ${STAMP}`);
const cover1 = str(doc, "coverUrl");
ok("٣ · رفع الغلاف — مرجعه في المستند", (cover1 ?? "").startsWith("iz-media://"), cover1 ?? "لا شيء");
ok("   ونسخة الصورة موجودة فعلًا", await mediaExists(cover1));
const attach1 = arr(doc, "media")[0]?.mapValue?.fields?.url?.stringValue ?? null;
ok("٤ · رفع صورة المشروع — مرجعها في المستند", (attach1 ?? "").startsWith("iz-media://"));
ok("   ونسختها موجودة فعلًا", await mediaExists(attach1));
ok("٥ · إضافة رابط — محفوظ ولو لم تُضغط «إضافة»",
  (arr(doc, "links")[0]?.mapValue?.fields?.url?.stringValue ?? "").includes("drive.google.com"));

// -------- ٦ البقاء بعد التحديث
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
ok("٦ · البقاء بعد إعادة التحميل", (await page.getByText(T).count()) > 0);
const card = () => page.locator(".iz-project, .iz-card").filter({ hasText: T }).first();
ok("   والغلاف يُعرض", (await card().locator("img").count()) > 0);

// -------- ٧ تعديل
const editCard = async () => {
  await card().locator('button[aria-label^="تعديل"]').first().click();
  await page.waitForTimeout(1500);
};
await editCard();
await modal().locator("textarea").first().fill(`وصف معدّل ${STAMP}`);
await saveBtn().click();
await page.waitForTimeout(4500);
doc = await projectDoc(T);
ok("٧ · تعديل — النص الجديد في قاعدة البيانات", str(doc, "description") === `وصف معدّل ${STAMP}`);

// -------- ٨ مسح النص + حفظ، ولا يعود
await editCard();
await modal().locator("textarea").first().fill("");
await saveBtn().click();
await page.waitForTimeout(4500);
doc = await projectDoc(T);
ok("٨ · مسح النص + حفظ — الوصف فارغ في قاعدة البيانات", str(doc, "description") === "");
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
doc = await projectDoc(T);
ok("   ولا يعود النص القديم بعد التحديث", str(doc, "description") === "");

/*
  ٨ب النص الممسوح لا يعود حين تصل لقطة حيّة.
  ------------------------------------------------------------------
  قائمة المواد قراءة حيّة، وكانت في اعتماديات أثر تعبئة النموذج. فأي
  تغيّر في أي مادة — من المشرفة أو من معلمة أو عند عودة الاتصال —
  يصل إلى الصفحة المفتوحة فيعيد تعبئة النموذج من المحفوظ: يعود النص
  القديم فوق ما كُتب، وتعود الصورة التي أُزيلت للتوّ.
  هنا تُحدَّث مادة عمدًا والنموذج مفتوح، ثم يُسأل النموذج: ماذا يحمل؟
*/
async function touchASubject() {
  const data = await json(`${DB}/apps/injazi/subjects?pageSize=20`);
  const first = (data?.documents ?? [])[0];
  if (!first) return false;
  const response = await fetch(`${DB}/apps/injazi/subjects/${idOfDoc(first)}?updateMask.fieldPaths=updatedAt`, {
    method: "PATCH",
    // Bearer owner: كتابة إدارية على المحاكي تتجاوز القواعد — تهيئة
    // الحالة ليست جزءًا مما نختبره.
    headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({ fields: { updatedAt: { stringValue: new Date().toISOString() } } }),
  }).catch(() => null);
  return response?.ok ?? false;
}

await editCard();
const TYPED = `نصّ قيد الكتابة ${STAMP}`;
await modal().locator("textarea").first().fill(TYPED);
ok("٨ب · لقطة حيّة تصل والنموذج مفتوح", await touchASubject());
await page.waitForTimeout(2500);
ok("     ما كُتب لم يُستبدل بالمحفوظ",
  (await modal().locator("textarea").first().inputValue()) === TYPED);
await modal().locator("textarea").first().fill("");
await touchASubject();
await page.waitForTimeout(2500);
ok("     والنص الممسوح لم يعد", (await modal().locator("textarea").first().inputValue()) === "");
await saveBtn().click();
await page.waitForTimeout(4500);
doc = await projectDoc(T);
ok("     والمحفوظ فارغ في قاعدة البيانات", str(doc, "description") === "");

// -------- ٩أ حذف صورة ثم إلغاء: الأصل لا يُمسّ
await editCard();
await modal().locator('button[aria-label="حذف صورة الغلاف"]').first().click();
await page.waitForTimeout(600);
await cancelBtn().click();
await page.waitForTimeout(2500);
doc = await projectDoc(T);
ok("٩أ · حذف صورة ثم إلغاء — المشروع ما زال يشير إليها", str(doc, "coverUrl") === cover1);
ok("     ونسخة الصورة لم تُمحَ (لا صورة مكسورة)", await mediaExists(cover1));

// -------- ٩ب حذف صورة + حفظ: تختفي من المستند ومن المخزن معًا
await editCard();
await modal().locator('button[aria-label="حذف صورة الغلاف"]').first().click();
await page.waitForTimeout(600);
await saveBtn().click();
await page.waitForTimeout(4500);
doc = await projectDoc(T);
ok("٩ب · حذف صورة + حفظ — المرجع أُزيل من المستند", str(doc, "coverUrl") === null);
ok("     ونسخة الصورة مُحيت من المخزن (بلا بقايا)", (await mediaExists(cover1)) === false);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
doc = await projectDoc(T);
ok("     ولا تعود بعد التحديث", str(doc, "coverUrl") === null);

// -------- ١٠ حذف رابط
await editCard();
await modal().getByRole("button", { name: /حذف الرابط/ }).first().click();
await page.waitForTimeout(600);
await saveBtn().click();
await page.waitForTimeout(4500);
doc = await projectDoc(T);
ok("١٠ · حذف رابط — اختفى من قاعدة البيانات", arr(doc, "links").length === 0);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
doc = await projectDoc(T);
ok("     ولا يعود بعد التحديث", arr(doc, "links").length === 0);

// -------- ١١ حذف المشروع كاملًا · ١٢ بعد التحديث
const attachBefore = str(doc, "media") === null ? attach1 : attach1;
await card().locator('button[aria-label^="حذف"]').first().click();
await page.waitForTimeout(1200);
await page.locator(".iz-modal__foot button").last().click();
await page.waitForTimeout(4000);
ok("١١ · حذف المشروع — اختفى من الشاشة", (await page.getByText(T).count()) === 0);
ok("     والمستند حُذف من قاعدة البيانات", (await projectDoc(T)) === null);
ok("     وصورته حُذفت معه (لا نسخة يتيمة)", (await mediaExists(attachBefore)) === false);
const evals = await json(`${DB}/apps/injazi/evaluations?pageSize=300`);
const leftover = (evals?.documents ?? []).filter(
  (d) => (d.fields?.projectId?.stringValue ?? "") === projectId,
).length;
ok("     ولا تقييم يتيم مرتبط به", leftover === 0, `${leftover}`);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
ok("١٢ · لا يعود بعد التحديث", (await page.getByText(T).count()) === 0);

// -------- ١٣ إنشاء بعد الحذف · ١٤ رفع صورة بعد الحذف
const T2 = `مشروع بعد الحذف ${STAMP}`;
await openEditor();
await modal().locator("input").first().fill(T2);
await uploadCover();
await saveBtn().click();
await page.waitForTimeout(4500);
let doc2 = await projectDoc(T2);
ok("١٣ · الإنشاء يعمل بعد الحذف", doc2 !== null);
const cover2 = str(doc2, "coverUrl");
ok("١٤ · رفع الصورة يعمل بعد الحذف", (cover2 ?? "").startsWith("iz-media://") && (await mediaExists(cover2)));
await page.screenshot({ path: `${OUT}/delete-mobile.png`, fullPage: true });

// -------- ١٧ الجوّال: لا تمرير أفقي
const overflow = await page.evaluate(() =>
  Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
ok("١٧ · الجوّال — لا تمرير أفقي", overflow === 0, `${overflow}px`);

/*
  ١٦ عزل الطالبات.
  ------------------------------------------------------------------
  معرّف الطالبة الأخرى يُقرأ من قاعدة البيانات لا بفتح رابطها في هذا
  المتصفّح: فتح الرابط هنا يمنح هذه الجلسة نفسها صلاحيةً على ملفها،
  فيصير الاختبار يقيس منحًا مشروعًا ويظنّه اختراقًا.
*/
const myId = (myUrl.match(/#\/student\/([^/?]+)/) ?? [])[1] ?? "";
const otherId = await (async () => {
  const data = await json(`${DB}/apps/injazi/students?pageSize=50`);
  const other = (data?.documents ?? []).map(idOfDoc).find((id) => id !== myId);
  return other ?? "";
})();
ok("   معرّف طالبة أخرى قُرئ من قاعدة البيانات", otherId !== "" && otherId !== myId, otherId);
const intrusion = await page.evaluate(async (target) => {
  const mod = await import("/src/injazi/services/repo.ts");
  try {
    await mod.createProject({ studentId: target, subjectId: "x", title: "تسلل" });
    return "نجح";
  } catch (err) {
    return String(err?.code ?? err?.message ?? err);
  }
}, otherId);
ok("١٦ · عزل الطالبات — الكتابة على ملف أخرى مرفوضة من القواعد",
  intrusion !== "نجح" && /permission|denied/i.test(intrusion), intrusion.slice(0, 60));

// ==================== ١٥ المعلمة ====================
const tctx = await browser.newContext({ viewport: { width: 1360, height: 950 } });
const teacher = await tctx.newPage();
watch(teacher, "teacher");
await teacher.goto(`${BASE}/teacher/login`, { waitUntil: "domcontentloaded" });
await teacher.waitForTimeout(1500);
await teacher.locator('input[type="email"]').fill("teacher1@injazi.local");
await teacher.locator('input[type="password"]').fill("Teacher#2026");
await teacher.locator('button[type="submit"]').click();
await teacher.waitForTimeout(4000);
ok("١٥ · المعلمة تدخل بوابتها", /#\/teacher$/.test(teacher.url()), teacher.url());
await teacher.goto(`${myUrl}`, { waitUntil: "domcontentloaded" });
await teacher.waitForTimeout(4500);
ok("     وترى مشروع الطالبة المسموح لها", (await teacher.getByText(T2).count()) > 0);
ok("     ولا تصل إلى لوحة الإدارة", (await teacher.goto(`${BASE}/admin/students`, { waitUntil: "domcontentloaded" })
  .then(() => teacher.waitForTimeout(3000))
  .then(() => teacher.locator(".iz-admin-row").count())) === 0);

// -------- ١٩ سطح المكتب
const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const desk = await dctx.newPage();
watch(desk, "desktop");
await desk.goto(myLink, { waitUntil: "domcontentloaded" });
await desk.waitForTimeout(4500);
ok("١٩ · سطح المكتب — الملف يفتح والمشروع ظاهر", (await desk.getByText(T2).count()) > 0);
await desk.getByRole("button", { name: /^إضافة مشروع$/ }).first().click();
await desk.waitForTimeout(1200);
ok("     والنموذج يفتح", (await desk.locator(".iz-modal").count()) > 0);
const deskOverflow = await desk.evaluate(() =>
  Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
ok("     بلا تمرير أفقي", deskOverflow === 0, `${deskOverflow}px`);
await desk.screenshot({ path: `${OUT}/delete-desktop.png`, fullPage: true });

// -------- تنظيف بيانات الاختبار
await desk.locator(".iz-modal__foot").getByRole("button", { name: /^إلغاء$/ }).click();
await desk.waitForTimeout(800);
const leftCard = desk.locator(".iz-project, .iz-card").filter({ hasText: T2 }).first();
await leftCard.locator('button[aria-label^="حذف"]').first().click();
await desk.waitForTimeout(1200);
await desk.locator(".iz-modal__foot button").last().click();
await desk.waitForTimeout(3500);
ok("نُظّفت بيانات الاختبار", (await projectDoc(T2)) === null);
ok("     ولم تبقَ نسخة صورة يتيمة", (await mediaExists(cover2)) === false);

// -------- ٢٠ الطرفية والشبكة
ok("٢٠ · لا أخطاء طرفية", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
ok("     ولا طلبات شبكة فاشلة بلا تفسير", netFailures.length === 0, netFailures.slice(0, 3).join(" | "));

await browser.close();
console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
if (failures.length) console.log("الإخفاقات:\n  " + failures.join("\n  "));
process.exit(failed === 0 ? 0 : 1);
