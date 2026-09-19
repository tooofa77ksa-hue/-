/*
  ما تكتبه الطالبة وما تكتبه المعلمة — هل يصل إلى قاعدة البيانات؟
  ==================================================================
  هذا الملف يختبر العطل الذي عطّل ميزتين كاملتين منذ إطلاق المنصة:

  النموذج المفتوح كان مربوطًا بقراءة حيّة بلا حارس تعبئة. كل لقطة من
  Firestore تُنتج كائنًا جديدًا، وكان الأثر يعيد تعبئة النموذج منها —
  فيمسح ما كُتب ويُرجعه إلى المحفوظ، ثم يموت زرّ «حفظ» لأن شيئًا لم
  «يتغيّر». واللقطة تصل حتمًا: لقطة الخادم بعد لقطة الذاكرة، أو سحب
  المشرفة لإعادة ترتيب الطالبات، أو عودة الاتصال على جوّال.

  ولذلك لا يكفي أن نكتب ونحفظ: نُطلق لقطة حيّة **عمدًا** أثناء الكتابة
  (تعديل مستند من الخادم مباشرةً)، ثم نسأل النموذج: ماذا تحمل الآن؟

  والقراءة النهائية من Firestore لا من الشاشة.

  التشغيل: node tests/e2e/injazi.identity.e2e.mjs
*/
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/#";
const DB = "http://127.0.0.1:8080/v1/projects/demo-injazi/databases/(default)/documents";
const STAMP = Date.now().toString().slice(-5);

let passed = 0, failed = 0;
const failures = [];
function ok(n, c, note = "") {
  if (c) { passed++; console.log(`✓ ${n}${note ? ` — ${note}` : ""}`); }
  else { failed++; failures.push(n); console.log(`✗ ${n}${note ? ` — ${note}` : ""}`); }
}

const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const idOfDoc = (d) => d.name.split("/").pop();

/** كتابة إدارية على المحاكي تتجاوز القواعد — لإطلاق لقطة حيّة عمدًا. */
async function touch(path, id) {
  const res = await fetch(`${DB}/${path}/${id}?updateMask.fieldPaths=updatedAt`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({ fields: { updatedAt: { stringValue: new Date().toISOString() } } }),
  }).catch(() => null);
  return res?.ok ?? false;
}

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

// ==================== المشرفة: رابط طالبة ====================
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
ok("قائمة الطالبات قُرئت", NAMES.length >= 8, `${NAMES.length}`);
const ME = NAMES[0];
const row = admin.locator(".iz-admin-row").filter({ hasText: ME }).first();
await row.getByRole("button", { name: /رابطها/ }).click();
await admin.waitForTimeout(800);
const make = admin.getByRole("button", { name: /إنشاء الرابط/ });
if (await make.count()) { await make.click(); await admin.waitForTimeout(2200); }
const myLink = await admin.locator(".iz-modal input").first().inputValue();
await actx.close();

// ==================== الطالبة على الجوّال ====================
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(myLink, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4500);
const studentId = (page.url().match(/#\/student\/([^/?]+)/) ?? [])[1] ?? "";
ok("رابط الطالبة يفتح ملفها", studentId !== "", ME);

const modal = () => page.locator(".iz-modal");
const footBtn = (name) => page.locator(".iz-modal__foot").getByRole("button", { name });

async function studentDoc() {
  return json(`${DB}/apps/injazi/students/${studentId}`);
}
const arrOf = (doc, field) => doc?.fields?.[field]?.arrayValue?.values ?? [];

// -------- هواياتي: الكتابة تصمد أمام لقطة حيّة، ثم تُحفظ
const HOBBY = `الرسم ${STAMP}`;
await page.getByRole("button", { name: /^هواياتي$/ }).first().click();
await page.waitForTimeout(1200);
await modal().locator('input[aria-label="اسم الهواية"]').fill(HOBBY);
await modal().getByRole("button", { name: /^إضافة$/ }).click();
await page.waitForTimeout(600);

ok("١ · الهواية أُضيفت إلى النموذج", (await modal().locator(`input[value="${HOBBY}"]`).count()) > 0);
ok("   ولقطة حيّة أُطلقت عمدًا", await touch("apps/injazi/students", studentId));
await page.waitForTimeout(2500);
ok("٢ · الهواية لم تُمسح بوصول اللقطة", (await modal().locator(`input[value="${HOBBY}"]`).count()) > 0);

/* الزرّ المعطَّل هو العَرَض الذي اشتكت منه الأمهات: تُكتب الهواية ثم
   تُمسح بوصول لقطة، فلا يعود هناك «تغيير» يُحفظ. ولذلك يُقاس هنا
   صراحةً بدل أن ينهار الاختبار عند النقر. */
const hobbySave = footBtn(/^حفظ$/);
const hobbyEnabled = await hobbySave.isEnabled();
ok("٣ · زرّ الحفظ ما زال حيًّا", hobbyEnabled);
if (hobbyEnabled) {
  await hobbySave.click();
  await page.waitForTimeout(4000);
} else {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
}

let doc = await studentDoc();
const savedHobbies = arrOf(doc, "hobbies");
ok(
  "٤ · الهواية في قاعدة البيانات",
  savedHobbies.some((h) => (h.mapValue?.fields?.label?.stringValue ?? "") === HOBBY),
  `${savedHobbies.length} هواية`,
);

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
ok("٥ · وتظهر في الملف بعد التحديث", (await page.getByText(HOBBY).count()) > 0);

// -------- عني: نفس الفحص
const ABOUT_TITLE = `اهتماماتي ${STAMP}`;
const ABOUT_BODY = `أحبّ القراءة والعلوم ${STAMP}`;
await page.getByRole("button", { name: /^عني$/ }).first().click();
await page.waitForTimeout(1200);
await modal().locator("input").first().fill(ABOUT_TITLE);
await modal().locator("textarea").first().fill(ABOUT_BODY);
await modal().getByRole("button", { name: /^إضافة/ }).first().click();
await page.waitForTimeout(600);
ok("٦ · قسم «عني» أُضيف للنموذج", (await modal().locator(`input[value="${ABOUT_TITLE}"]`).count()) > 0);
ok("   ولقطة حيّة أُطلقت عمدًا", await touch("apps/injazi/students", studentId));
await page.waitForTimeout(2500);
ok("٧ · القسم لم يُمسح بوصول اللقطة", (await modal().locator(`input[value="${ABOUT_TITLE}"]`).count()) > 0);
const aboutSave = footBtn(/^حفظ$/);
const aboutEnabled = await aboutSave.isEnabled();
ok("   وزرّ حفظ «عني» حيّ", aboutEnabled);
if (aboutEnabled) {
  await aboutSave.click();
  await page.waitForTimeout(4000);
} else {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
}

doc = await studentDoc();
const savedAbout = arrOf(doc, "about");
ok(
  "٨ · «عني» في قاعدة البيانات",
  savedAbout.some((a) => (a.mapValue?.fields?.title?.stringValue ?? "") === ABOUT_TITLE),
  `${savedAbout.length} قسم`,
);

// -------- مشروع للمعلمة كي تقيّمه
const TITLE = `مشروع للتقييم ${STAMP}`;
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
await page.getByRole("button", { name: /^إضافة مشروع$/ }).first().click();
await page.waitForTimeout(1200);
await modal().locator("input").first().fill(TITLE);
let subjectId = await modal().locator("select").first().inputValue();
await page.locator(".iz-modal__foot").getByRole("button", { name: /^حفظ المشروع$/ }).click();
await page.waitForTimeout(4500);

const projects = (await json(`${DB}/apps/injazi/projects?pageSize=300`))?.documents ?? [];
const project = projects.find((d) => (d.fields?.title?.stringValue ?? "") === TITLE);
ok("٩ · المشروع محفوظ وجاهز للتقييم", Boolean(project), subjectId);
const projectId = project ? idOfDoc(project) : "";

// -------- شهادة: ضغطتان لا تُنشئان سجلّين
const CERT = `شهادة ${STAMP}`;
await page.getByRole("button", { name: /^إضافة$/ }).last().click();
await page.waitForTimeout(1200);
if ((await modal().count()) > 0) {
  await modal().locator("input").first().fill(CERT);
  const certSave = footBtn(/^حفظ$/);
  await certSave.click();
  await certSave.click({ force: true }).catch(() => {});
  await certSave.click({ force: true }).catch(() => {});
  await page.waitForTimeout(5000);
  const certs = ((await json(`${DB}/apps/injazi/achievements?pageSize=300`))?.documents ?? []).filter(
    (d) => (d.fields?.title?.stringValue ?? "") === CERT,
  );
  ok("١٠ · ثلاث ضغطات ⇒ سجلّ واحد لا أكثر", certs.length === 1, `${certs.length} سجلًّا`);
} else {
  ok("١٠ · نافذة الشهادة تفتح", false, "لم تُفتح");
}

// ==================== المعلمة: النجوم والتعليق ====================
const tctx = await browser.newContext({ viewport: { width: 1360, height: 950 } });
const teacher = await tctx.newPage();
await teacher.goto(`${BASE}/teacher/login`, { waitUntil: "domcontentloaded" });
await teacher.waitForTimeout(1500);
await teacher.locator('input[type="email"]').fill("teacher1@injazi.local");
await teacher.locator('input[type="password"]').fill("Teacher#2026");
await teacher.locator('button[type="submit"]').click();
await teacher.waitForTimeout(4000);
ok("١١ · المعلمة تدخل بوابتها", /#\/teacher$/.test(teacher.url()), teacher.url());

const card = teacher.locator(".iz-card, .iz-review-row").filter({ hasText: TITLE }).first();
const found = (await card.count()) > 0;
ok("١٢ · ترى المشروع في قائمتها", found, TITLE);

async function evaluationDoc() {
  const rows = (await json(`${DB}/apps/injazi/evaluations?pageSize=300`))?.documents ?? [];
  return rows.find((d) => (d.fields?.projectId?.stringValue ?? "") === projectId) ?? null;
}

if (found) {
  const COMMENT = `عمل متقن، أحسنتِ ${STAMP}`;
  await card.click();
  await teacher.waitForTimeout(1800);
  const tModal = teacher.locator(".iz-modal");
  await tModal.locator('[role="radio"][aria-label="4 من 5"]').click({ force: true });
  await tModal.locator("textarea").first().fill(COMMENT);
  await teacher.waitForTimeout(400);

  // لقطة حيّة على مجموعة التقييمات أثناء الكتابة
  ok("   ولقطة حيّة أُطلقت عمدًا", await touch("apps/injazi/projects", projectId));
  await teacher.waitForTimeout(2500);
  ok("١٣ · التعليق لم يُمسح بوصول اللقطة",
    (await tModal.locator("textarea").first().inputValue()) === COMMENT);

  await teacher.locator(".iz-modal__foot").getByRole("button", { name: /حفظ التقييم/ }).click();
  await teacher.waitForTimeout(4500);

  let evaluation = await evaluationDoc();
  ok("١٤ · التقييم في قاعدة البيانات", evaluation !== null);
  ok("     النجوم محفوظة", (evaluation?.fields?.stars?.integerValue ?? "") === "4",
    evaluation?.fields?.stars?.integerValue ?? "—");
  ok("     والتعليق محفوظ", (evaluation?.fields?.comment?.stringValue ?? "") === COMMENT);

  // -------- تعديل تقييم موجود: أصعب حالة (existing كائن حيّ)
  const EDITED = `${COMMENT} — مراجعة`;
  await teacher.reload({ waitUntil: "domcontentloaded" });
  await teacher.waitForTimeout(4500);
  const again = teacher.locator(".iz-card, .iz-review-row").filter({ hasText: TITLE }).first();
  await again.click();
  await teacher.waitForTimeout(1800);
  const tModal2 = teacher.locator(".iz-modal");
  await tModal2.locator("textarea").first().fill(EDITED);
  ok("   ولقطة حيّة أُطلقت عمدًا", await touch("apps/injazi/projects", projectId));
  await teacher.waitForTimeout(2500);
  ok("١٥ · تعديل التعليق لم يُستبدل بالمحفوظ",
    (await tModal2.locator("textarea").first().inputValue()) === EDITED);
  await teacher.locator(".iz-modal__foot").getByRole("button", { name: /حفظ التقييم/ }).click();
  await teacher.waitForTimeout(4500);

  evaluation = await evaluationDoc();
  ok("١٦ · التعديل في قاعدة البيانات",
    (evaluation?.fields?.comment?.stringValue ?? "") === EDITED);

  const all = ((await json(`${DB}/apps/injazi/evaluations?pageSize=300`))?.documents ?? []).filter(
    (d) => (d.fields?.projectId?.stringValue ?? "") === projectId,
  );
  ok("١٧ · تقييم واحد لا تقييمان", all.length === 1, `${all.length}`);

  // -------- والطالبة ترى التقييم في ملفها
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  ok("١٨ · الطالبة ترى تعليق معلمتها", (await page.getByText(EDITED).count()) > 0);
}

await browser.close();
console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
if (failures.length) console.log("الإخفاقات:\n  " + failures.join("\n  "));
process.exit(failed === 0 ? 0 : 1);
