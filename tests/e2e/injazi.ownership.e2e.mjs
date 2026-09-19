/*
  الملكية وتحميل التقييم — A-01 و A-02.
  ==================================================================
  A-01: نافذة التقييم كانت تُعبَّأ مرّة واحدة عند الفتح. فإن وصلت لقطة
  التقييمات **بعد** الفتح — وهو ما يحدث على شبكة بطيئة أو حين تفتح
  المعلمة المشروع فور دخولها — لا يُطبَّق تقييمها المحفوظ إطلاقًا:
  ترى ٥ نجوم وتعليقًا فارغًا، فتحفظ فوق تقييمها السابق وتمحوه.
  هنا تُبطَّأ قناة الاستماع عمدًا لجعل السباق مؤكَّدًا لا احتماليًا.

  A-02: زرّ فتح بطاقة المشروع كان يستدعي onOpen بلا فحص صلاحية، فتفتح
  زائرةٌ (أو معلمة) نموذج تعديل كامل لمشروع طالبة. القواعد ترفض الحفظ،
  لكن الباب لا ينبغي أن يُفتح أصلًا.

  التشغيل: node tests/e2e/injazi.ownership.e2e.mjs
*/
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/#";
const DB = "http://127.0.0.1:8080/v1/projects/demo-injazi/databases/(default)/documents";
const STAMP = Date.now().toString().slice(-4);

let passed = 0, failed = 0;
const failures = [];
function ok(n, c, note = "") {
  if (c) { passed++; console.log(`✓ ${n}${note ? ` — ${note}` : ""}`); }
  else { failed++; failures.push(n); console.log(`✗ ${n}${note ? ` — ${note}` : ""}`); }
}
const json = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);

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

// ---------------- الطالبة تضيف مشروعًا
const sctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const student = await sctx.newPage();
await student.goto(link, { waitUntil: "domcontentloaded" });
await student.waitForTimeout(4500);
const studentUrl = student.url();
const TITLE = `مشروع الملكية ${STAMP}`;
await student.getByRole("button", { name: /^إضافة مشروع$/ }).first().click();
await student.waitForTimeout(1500);
await student.locator(".iz-modal input").first().fill(TITLE);
await student.locator(".iz-modal select").first().selectOption({ index: 0 });
await student.locator(".iz-modal__foot").getByRole("button", { name: /^حفظ المشروع$/ }).click();
await student.waitForTimeout(4500);
const project = ((await json(`${DB}/apps/injazi/projects?pageSize=300`))?.documents ?? []).find(
  (d) => (d.fields?.title?.stringValue ?? "") === TITLE,
);
ok("تهيئة: المشروع محفوظ", Boolean(project), TITLE);
const projectId = project ? project.name.split("/").pop() : "";

// ================= A-02 — لا نموذج تعديل لمن لا يملك =================
const gctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const guest = await gctx.newPage();
await guest.goto(studentUrl, { waitUntil: "domcontentloaded" });
await guest.waitForTimeout(5000);
ok("A-02 · الزائرة ترى المشروع", (await guest.getByText(TITLE).count()) > 0);
ok("A-02 · ولا يظهر لها زرّ تعديل", (await guest.locator('button[aria-label^="تعديل"]').count()) === 0);

const guestCard = guest.locator(".iz-project, .iz-card").filter({ hasText: TITLE }).first();
await guestCard.click({ force: true }).catch(() => {});
await guest.waitForTimeout(2000);
const guestModal = await guest.locator(".iz-modal").count();
ok("A-02 · الضغط على البطاقة لا يفتح نموذج تعديل", guestModal === 0, `نوافذ مفتوحة: ${guestModal}`);
ok(
  "A-02 · ولا خانة عنوان قابلة للكتابة",
  (await guest.locator('.iz-modal input[maxlength="90"]').count()) === 0,
);
await gctx.close();

// ================= A-01 — التقييم المحفوظ يُحمَّل ولو تأخّرت اللقطة =================
const tctx = await browser.newContext({ viewport: { width: 1360, height: 950 } });
const teacher = await tctx.newPage();
await teacher.goto(`${BASE}/teacher/login`, { waitUntil: "domcontentloaded" });
await teacher.waitForTimeout(1500);
await teacher.locator('input[type="email"]').fill("teacher1@injazi.local");
await teacher.locator('input[type="password"]').fill("Teacher#2026");
await teacher.locator('button[type="submit"]').click();
await teacher.waitForTimeout(4000);

const COMMENT = `تقييم محفوظ ${STAMP}`;
const card = () => teacher.locator(".iz-card, .iz-review-row").filter({ hasText: TITLE }).first();
const found = (await card().count()) > 0;
ok("تهيئة: المعلمة ترى المشروع", found);

if (found) {
  await card().click();
  await teacher.waitForTimeout(1800);
  await teacher.locator('.iz-modal [role="radio"][aria-label="4 من 5"]').click({ force: true });
  await teacher.locator(".iz-modal textarea").first().fill(COMMENT);
  await teacher.locator(".iz-modal__foot").getByRole("button", { name: /حفظ التقييم/ }).click();
  await teacher.waitForTimeout(4500);

  const saved = ((await json(`${DB}/apps/injazi/evaluations?pageSize=300`))?.documents ?? []).find(
    (d) => (d.fields?.projectId?.stringValue ?? "") === projectId,
  );
  ok("تهيئة: التقييم محفوظ", (saved?.fields?.comment?.stringValue ?? "") === COMMENT);

  /*
    السباق الحقيقي يقع على **جهاز جديد** لا ذاكرة محليّة فيه.
    ------------------------------------------------------------------
    Firestore يحتفظ بلقطة محليّة، فإعادة تحميل الصفحة نفسها تُعيد
    التقييمات فورًا من الذاكرة ويختفي السباق. أما المعلمة التي تفتح
    بوابتها أول مرّة على جوّالها — ولا ذاكرة عندها — فتصل قائمة
    المشاريع وتتأخّر التقييمات. ولذلك سياق متصفّح نظيف تمامًا، مع
    تأخير الاستجابة التي تحمل التقييمات وحدها.
  */
  const fctx = await browser.newContext({ viewport: { width: 1360, height: 950 } });
  const fresh = await fctx.newPage();
  await fresh.route("**/*", async (route) => {
    const url = route.request().url();
    if (!url.includes("/Listen/") && !url.includes("/channel")) return route.continue();
    let response;
    try {
      response = await route.fetch();
    } catch {
      return route.continue().catch(() => {});
    }
    const body = await response.body().catch(() => Buffer.alloc(0));
    if (body.includes("evaluations")) await new Promise((r) => setTimeout(r, 9000));
    await route.fulfill({ response, body }).catch(() => {});
  });

  await fresh.goto(`${BASE}/teacher/login`, { waitUntil: "domcontentloaded" });
  await fresh.waitForTimeout(2000);
  await fresh.locator('input[type="email"]').fill("teacher1@injazi.local");
  await fresh.locator('input[type="password"]').fill("Teacher#2026");
  await fresh.locator('button[type="submit"]').click();

  const slowCard = fresh.locator(".iz-card, .iz-review-row").filter({ hasText: TITLE }).first();
  const appeared = await slowCard
    .waitFor({ state: "visible", timeout: 60000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) {
    await slowCard.click();
    await fresh.waitForTimeout(1200);

    // قبل وصول التقييمات: يجب ألّا يُعرض نموذج فارغ قابل للحفظ.
    const earlyComment = await fresh.locator(".iz-modal textarea").first().inputValue().catch(() => "?");
    const earlySave = fresh.locator(".iz-modal__foot").getByRole("button", { name: /حفظ التقييم/ });
    const earlyEnabled = (await earlySave.count()) > 0 ? await earlySave.isEnabled() : false;
    ok(
      "A-01 · لا نموذج فارغ قابل للحفظ قبل وصول التقييم المحفوظ",
      !(earlyEnabled && earlyComment === ""),
      `الحفظ متاح=${earlyEnabled} · التعليق=«${earlyComment}»`,
    );

    await fresh.waitForTimeout(12000);
    const loadedComment = await fresh.locator(".iz-modal textarea").first().inputValue().catch(() => "");
    ok("A-01 · التعليق المحفوظ ظهر بعد وصول اللقطة", loadedComment === COMMENT, `«${loadedComment}»`);
    const checked = await fresh
      .locator('.iz-modal [role="radio"][aria-checked="true"]')
      .getAttribute("aria-label")
      .catch(() => null);
    ok("A-01 · والنجوم المحفوظة كذلك", checked === "4 من 5", checked ?? "—");

    await fresh.locator(".iz-modal__foot").getByRole("button", { name: /حفظ التقييم/ }).click();
    await fresh.waitForTimeout(5000);
    const after = ((await json(`${DB}/apps/injazi/evaluations?pageSize=300`))?.documents ?? []).find(
      (d) => (d.fields?.projectId?.stringValue ?? "") === projectId,
    );
    ok("A-01 · الحفظ لم يمحُ التقييم السابق", (after?.fields?.comment?.stringValue ?? "") === COMMENT);
    ok("A-01 · ولا النجوم", (after?.fields?.stars?.integerValue ?? "") === "4", after?.fields?.stars?.integerValue ?? "—");
  } else {
    ok("A-01 · البطاقة ظهرت بعد الإبطاء", false);
  }
}

await browser.close();
console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
if (failures.length) console.log("الإخفاقات:\n  " + failures.join("\n  "));
process.exit(failed === 0 ? 0 : 1);
