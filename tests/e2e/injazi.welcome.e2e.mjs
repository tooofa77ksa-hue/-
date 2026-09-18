/*
  ثلاث لحظات طلبتها المشرفة بنصّها.
  ------------------------------------------------------------------
    ١) «احتاج انو اول ماادخل تطلع الانشودة وامكانيه الايقاف»
    ٢) «الفراشات التي تتحرك لم تخرج»
    ٣) «اريد كمعلمه ابحث باسم الطللبة ويخرج لي ملفها»

  الصوت لا يُقاس بوجود الزر بل بحالة عنصر <audio> نفسه: paused و
  currentTime هما الفرق بين «يبدو أنه يعمل» و«يعمل».

  التشغيل: node tests/e2e/injazi.welcome.e2e.mjs
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:5173/#";
const OUT = process.env.IZ_SHOTS || "./.e2e-shots";
mkdirSync(OUT, { recursive: true });

let passed = 0;
let failed = 0;
function ok(name, condition, note = "") {
  if (condition) {
    passed++;
    console.log(`✓ ${name}${note ? ` — ${note}` : ""}`);
  } else {
    failed++;
    console.log(`✗ ${name}${note ? ` — ${note}` : ""}`);
  }
}

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: [
    "--no-sandbox",
    "--use-gl=swiftshader",
    "--enable-unsafe-swiftshader",
    // يسمح للمتصفّح بالتشغيل بلا إيماءة، كما يفعل جهاز زارت صاحبته
    // الموقع من قبل. الحالة المعاكسة (المنع) تُختبر في سياق مستقل أدناه.
    "--autoplay-policy=no-user-gesture-required",
  ],
});

// ==================== ١) الأنشودة تبدأ وحدها، وتتوقّف بضغطة ====================
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  const audioExists = (await page.locator("audio").count()) > 0;
  ok("عنصر الأنشودة موجود في الصفحة", audioExists);

  const state = await page.evaluate(() => {
    const el = document.querySelector("audio");
    return el ? { paused: el.paused, src: el.getAttribute("src"), time: el.currentTime } : null;
  });
  ok("مصدر الأنشودة مضبوط", Boolean(state?.src), state?.src ?? "لا مصدر");
  ok("الأنشودة تعمل بمجرّد الدخول", state?.paused === false);

  await page.waitForTimeout(1200);
  const advanced = await page.evaluate(() => document.querySelector("audio")?.currentTime ?? 0);
  ok("الصوت يتقدّم فعلًا لا شكلًا", advanced > 0, `الثانية ${advanced.toFixed(2)}`);

  // الإيقاف: الزر نفسه الذي تراه المشرفة في الترويسة.
  const stop = page.getByRole("button", { name: /إيقاف الأنشودة/ });
  ok("زر الإيقاف ظاهر أثناء التشغيل", (await stop.count()) === 1);
  await stop.click();
  await page.waitForTimeout(900);
  const afterStop = await page.evaluate(() => document.querySelector("audio")?.paused);
  ok("الضغط يوقف الأنشودة", afterStop === true);

  const resume = page.getByRole("button", { name: /تشغيل الأنشودة/ });
  ok("الزر يتحوّل إلى «تشغيل» بعد الإيقاف", (await resume.count()) === 1);
  await resume.click();
  await page.waitForTimeout(900);
  ok(
    "الضغط يعيدها",
    (await page.evaluate(() => document.querySelector("audio")?.paused)) === false,
  );

  await page.screenshot({ path: `${OUT}/welcome-audio.png` });
  await ctx.close();
}

// ==================== ٢) الفراشات تطير في كل زيارة جديدة ====================
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const first = await page.locator("svg.iz-butterfly, .iz-butterfly").count();
  ok("الفراشات تطير عند أول فتح", first > 0, `العدد: ${first}`);

  // التنقّل داخل الزيارة نفسها لا يعيدها — الترحيب مرة لكل زيارة.
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const again = await page.locator("svg.iz-butterfly, .iz-butterfly").count();
  ok("لا تتكرّر أثناء التنقّل في الزيارة نفسها", again === 0, `العدد: ${again}`);

  await ctx.close();

  // زيارة جديدة = سياق متصفّح جديد (الجلسة انتهت) ⇒ تعود الفراشات.
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page2.waitForTimeout(1200);
  const fresh = await page2.locator("svg.iz-butterfly, .iz-butterfly").count();
  ok("تعود في الزيارة التالية", fresh > 0, `العدد: ${fresh}`);
  await page2.screenshot({ path: `${OUT}/welcome-butterflies.png` });
  await ctx2.close();
}

// ==================== ٣) المعلمة تبحث باسم الطالبة فيُفتح ملفها ====================
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/teacher/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.locator('input[type="email"]').fill("teacher1@injazi.local");
  await page.locator('input[type="password"]').fill("Teacher#2026");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3500);

  ok("المعلمة دخلت بوابتها", /#\/teacher$/.test(page.url()), page.url());

  const search = page.getByRole("searchbox", { name: /ابحثي عن طالبة/ });
  ok("مربّع البحث عن الطالبة موجود في البوابة", (await search.count()) === 1);

  const allCards = await page.locator(".iz-student-card").count();
  ok("ملفات الطالبات معروضة للمعلمة", allCards > 0, `العدد: ${allCards}`);

  // البحث بالاسم — وبكتابة «ى» بدل «ي» كما تكتب لوحة مفاتيح الجوّال.
  await search.fill("نادين الشمرانى");
  await page.waitForTimeout(900);
  const matched = await page.locator(".iz-student-card").count();
  ok("البحث بالاسم يُبقي طالبة واحدة رغم اختلاف ى/ي", matched === 1, `العدد: ${matched}`);

  const name = await page.locator(".iz-student-card__name").first().innerText();
  ok("الطالبة الظاهرة هي المطلوبة", name.includes("نادين"), name);

  await page.screenshot({ path: `${OUT}/welcome-teacher-search.png` });

  // فتح ملفها — «عرض الملف» هو الرابط المقصود في البطاقة.
  await page.locator(".iz-student-card__cta").first().click();
  await page.waitForTimeout(3000);
  ok("الضغط يفتح ملف الطالبة", /#\/student\/[^/]+$/.test(page.url()), page.url());

  const heading = await page.locator("h1").first().innerText().catch(() => "");
  ok("الملف المفتوح يحمل اسمها", heading.includes("نادين"), heading);

  // القراءة لا تمنح تعديلًا: المعلمة لا ترى أدوات تخصيص الملف.
  ok(
    "المعلمة تقرأ الملف ولا تعدّله",
    (await page.getByRole("button", { name: /تخصيص الملف/ }).count()) === 0,
  );

  await page.screenshot({ path: `${OUT}/welcome-teacher-portfolio.png` });
  await ctx.close();
}

await browser.close();

console.log(`\n=== ${passed} نجح · ${failed} فشل ===`);
process.exit(failed === 0 ? 0 : 1);
