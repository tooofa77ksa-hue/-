/*
  توليد قواعد «إنجازي يحكي» وحدها.
  ------------------------------------------------------------------
  firestore.rules ملف مشترك يخدم مشروعَي Firebase معًا: «شُعلة لغتي»
  و«إنجازي يحكي». نشره كما هو على مشروع إنجازي يحمل معه قواعد لغتي،
  وفيها مسار bootstrap لمرة واحدة مربوط ببريد داخلي ثابت. ذلك البريد
  محجوز فعلًا في مشروع لغتي، لكنه **غير محجوز** في مشروع إنجازي — فأي
  شخص يقرأ المستودع العام يستطيع تسجيله هناك ويمنح نفسه دور teacher في
  مجموعات لغتي العليا (students, groups, questions...). تلك المجموعات
  فارغة في إنجازي ولا تمسّ بيانات الطالبات (كلها تحت apps/injazi/*)،
  لكن بابًا مفتوحًا على لا شيء يبقى بابًا مفتوحًا.

  فنولّد ملفًا خاصًا بإنجازي: دوالّه العامة + قسم إنجازي حرفيًا + منع
  كل ما عداه. لا نسخ يدوي ولا ملفان يفترقان بمرور الوقت: المصدر واحد،
  وهذا السكربت يستخرج منه، واختبار يتحقّق أن المولَّد مطابق للمصدر.

  التشغيل:  npm run injazi:rules:build
  التحقّق:  npm run injazi:rules:check   (يفشل إن تخلّف الملف عن مصدره)
*/
import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = "firestore.rules";
const TARGET = "firestore.injazi.rules";

/** بداية قسم إنجازي — سطر العنوان نفسه في الملف المشترك. */
const START = "    // «إنجازي يحكي» — كل شيء تحت apps/injazi/... معزولًا عن شُعلة لغتي";
/** نهايته: المنع الشامل في آخر الملف. */
const END = "    match /{document=**} {";
/** الدالة العامة الوحيدة التي يعتمد عليها قسم إنجازي. */
const SHARED = `    function isSignedIn() {
      return request.auth != null;
    }`;

export function buildInjaziRules(source = readFileSync(SOURCE, "utf8")) {
  const startAt = source.indexOf(START);
  const endAt = source.indexOf(END);
  if (startAt < 0 || endAt < 0 || endAt < startAt) {
    throw new Error(
      `تعذّر تحديد قسم «إنجازي» داخل ${SOURCE}. ` +
        "غُيّر سطر العنوان أو المنع الشامل — حدّثي الحدود في هذا السكربت.",
    );
  }
  if (!source.includes(SHARED)) {
    throw new Error(`لم تعد isSignedIn كما هي في ${SOURCE} — حدّثي هذا السكربت.`);
  }

  // نبدأ من سطر الإطار (====) الذي يسبق العنوان مباشرة.
  const frameAt = source.lastIndexOf("    // ", startAt - 1);
  const section = source.slice(frameAt, endAt).trimEnd();

  return `rules_version = '2';

/*
  قواعد «إنجازي يحكي» — مولَّدة، لا تُحرَّر يدويًا.
  المصدر: ${SOURCE} (قسم إنجازي وحده)
  التوليد: npm run injazi:rules:build

  سبب الفصل: ${SOURCE} يخدم مشروعَي Firebase معًا، ونشره كما هو على
  مشروع إنجازي يمنح قواعد «شُعلة لغتي» موطئ قدم فيه بلا داعٍ. هنا لا
  يوجد إلا ما تحتاجه إنجازي، وكل ما عداه ممنوع.
*/
service cloud.firestore {
  match /databases/{database}/documents {

${SHARED}

${section}

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
if (isMain) {
  const generated = buildInjaziRules();
  const check = process.argv.includes("--check");

  if (check) {
    let current = "";
    try {
      current = readFileSync(TARGET, "utf8");
    } catch {
      /* غير موجود بعد */
    }
    if (current !== generated) {
      console.error(
        `\n✗ ${TARGET} متخلّف عن ${SOURCE}.\n  شغّلي: npm run injazi:rules:build ثم أعيدي النشر.\n`,
      );
      process.exit(1);
    }
    console.log(`✓ ${TARGET} مطابق لمصدره.`);
  } else {
    writeFileSync(TARGET, generated);
    console.log(`✓ وُلّد ${TARGET} من ${SOURCE} (${generated.length} حرفًا).`);
  }
}
