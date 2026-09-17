/*
  الضغطة الواحدة على منصة فارغة تمامًا.
  تتحقّق أن «إدخال البيانات الأولى» يُنتج فعلًا: ٨ طالبات + ٥ مواد +
  ٥ معلمات + ٨ روابط جاهزة للنسخ — ثم يختفي الزر فلا يُضغط مرتين.
*/
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/#";
const NAMES = ["نادين", "ريتاج", "لانا", "تالا", "ندى", "روز", "مريم", "جنى"];
const out = [];
const ok = (n, p, note = "") => out.push({ n, p, note });

const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await (await b.newContext({ viewport: { width: 1360, height: 950 } })).newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message.slice(0, 160)));

await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.locator('input[type="email"]').fill("admin@injazi.local");
await page.locator('input[type="password"]').fill("Injazi#2026");
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(3500);

const card = page.getByRole("button", { name: /إدخال البيانات الأولى/ });
ok("بطاقة البدء تظهر على منصة فارغة", (await card.count()) === 1);
await card.click();
await page.waitForTimeout(9000);

await page.goto(`${BASE}/admin/students`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
const studentRows = await page.locator(".iz-admin-row").count();
ok("٨ طالبات أُدخلن", studentRows === 8, `العدد: ${studentRows}`);

// الروابط الثمانية جاهزة بلا ضغطة إضافية
const links = [];
for (const name of NAMES) {
  const row = page.locator(".iz-admin-row").filter({ hasText: name }).first();
  if ((await row.count()) === 0) { links.push(null); continue; }
  await row.getByRole("button", { name: /رابطها/ }).click();
  await page.waitForTimeout(800);
  const ready = (await page.getByRole("button", { name: /إنشاء الرابط/ }).count()) === 0;
  const url = ready ? await page.locator(".iz-modal input").first().inputValue() : null;
  links.push(ready && /#\/s\/[A-Za-z0-9_-]{20,}$/.test(url ?? "") ? url : null);
  await page.locator(".iz-modal__foot button").first().click();
  await page.waitForTimeout(400);
}
const good = links.filter(Boolean).length;
ok("٨ روابط جاهزة فورًا بلا ضغطة إضافية", good === 8, `الجاهز: ${good}/8`);
ok("كل رابط فريد", new Set(links.filter(Boolean)).size === good);

await page.goto(`${BASE}/admin/subjects`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
ok("٥ مواد", (await page.locator(".iz-admin-row").count()) === 5);
await page.goto(`${BASE}/admin/teachers`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
ok("٥ معلمات", (await page.locator(".iz-admin-row").count()) === 5);

await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
ok("البطاقة تختفي بعد الإدخال فلا تُضغط مرتين",
   (await page.getByRole("button", { name: /إدخال البيانات الأولى/ }).count()) === 0);

// أول رابط يفتح فعلًا في متصفّح نظيف
if (links[0]) {
  const ctx2 = await b.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto(links[0], { waitUntil: "domcontentloaded" });
  await p2.waitForTimeout(5000);
  const h = await p2.locator("h1").first().innerText().catch(() => "");
  ok("رابط نادين المولَّد تلقائيًا يفتح ملفها", h.includes("نادين"), h.slice(0, 30));
  await ctx2.close();
} else ok("رابط نادين المولَّد تلقائيًا يفتح ملفها", false, "لا رابط");

await b.close();
const pass = out.filter((r) => r.p).length;
console.log(`\n=== ${pass}/${out.length} ===`);
out.forEach((r) => console.log(`${r.p ? "✓" : "✗"} ${r.n}${r.note ? ` — ${r.note}` : ""}`));
if (errs.length) console.log("أخطاء:", [...new Set(errs)].slice(0, 5));
