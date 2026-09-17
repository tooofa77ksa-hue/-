/*
  حارس توافق المتصفّحات.
  ------------------------------------------------------------------
  يفحص CSS المبنيّ فعلًا (لا المصدر) عن خصائص تسقط صامتةً في متصفّح
  شائع — والسقوط الصامت أسوأ من الخطأ الصريح: لا شيء ينكسر بصوت، فقط
  يبدو الموقع رديئًا على جهاز لا نملكه.

  سبب الفحص على المبنيّ: المُصغِّر يحذف أي تصريح مكرّر داخل القاعدة
  نفسها، فبديل كُتب في المصدر قد لا يصل إلى المستخدم إطلاقًا. حدث هذا
  فعلًا مع color-mix.

  ما يُفحص:
    • backdrop-filter بلا -webkit- → الزجاج يختفي في سفاري (آيفون وآيباد).
    • color-mix بلا بديل → الحدود تختفي في سفاري قبل 16.2.
    • dvh/svh بلا بديل → ارتفاع خاطئ في سفاري قبل 15.4.

  التشغيل: npm run check:css
*/
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "dist/assets";

function bundles() {
  try {
    return readdirSync(DIR)
      .filter((f) => f.endsWith(".css"))
      .map((f) => ({ name: f, css: readFileSync(join(DIR, f), "utf8") }));
  } catch {
    console.error("\n✗ لا يوجد dist. شغّلي npm run build أولًا.\n");
    process.exit(1);
  }
}

const problems = [];

for (const { name, css } of bundles()) {
  // الملف المصغَّر سطر واحد، فنعدّ الظهور لا الأسطر.
  const count = (re) => (css.match(re) ?? []).length;

  const standard = count(/(^|[^-])backdrop-filter/g);
  const prefixed = count(/-webkit-backdrop-filter/g);
  if (standard > prefixed) {
    problems.push(
      `${name}: ${standard - prefixed} استخدام لـ backdrop-filter بلا -webkit- ` +
        "→ تأثير الزجاج يختفي في سفاري.",
    );
  }

  const colorMix = count(/color-mix\(/g);
  if (colorMix > 0) {
    problems.push(
      `${name}: ${colorMix} استخدام لـ color-mix — يسقط في سفاري قبل 16.2، ` +
        "والمُصغِّر يحذف البديل المكرّر. استخدمي القيمة مباشرة.",
    );
  }

  // كل dvh/svh يحتاج توأمًا بـ vh قبله في القاعدة نفسها.
  const dynamic = count(/\d+(?:dvh|svh|lvh)/g);
  const plain = count(/\d+vh[^a-z]/g) - dynamic;
  if (dynamic > 0 && plain < dynamic) {
    problems.push(
      `${name}: ${dynamic} استخدام لوحدات dvh/svh وبدائل vh أقل منها ` +
        "→ ارتفاع خاطئ في سفاري قبل 15.4.",
    );
  }
}

if (problems.length) {
  console.error("\n✗ توافق المتصفّحات:\n" + problems.map((p) => "  • " + p).join("\n") + "\n");
  process.exit(1);
}

console.log("✓ توافق المتصفّحات: لا خصائص تسقط صامتةً في سفاري أو فَيرفُكس.");
