/*
  تهيئة الإنتاج — لمرة واحدة.
  ==================================================================
  يختلف عن scripts/seedInjazi.ts جوهريًا، ولذلك هو ملف مستقل:

    • لا يعمل إطلاقًا على المحاكي (وذاك لا يعمل إطلاقًا على الإنتاج).
    • لا بريد تجريبي ولا كلمة مرور افتراضية. حسابات .local ممنوعة
      بفحص صريح يوقف السكربت.
    • كلمة مرور المشرفة تُقرأ من متغيّر بيئة أو تُكتب في الطرفية بلا
      صدى (hidden input)، ولا تُطبَع ولا تُحفَظ ولا تُكتب في Firestore.
    • لا يُنشئ حسابات أولياء أمور إطلاقًا — تُربَط لاحقًا من لوحة
      الإدارة بحسابات حقيقية يوافق عليها أهلها.
    • حسابات دخول المعلمات لا تُنشأ هنا: تُنشئها المشرفة من اللوحة
      ببريد المعلمة الحقيقي. السكربت ينشئ مستندات المعلمات والمواد
      والربط بينها فقط.
    • آمن للتشغيل المتكرر: يبحث قبل الإنشاء ولا يلمس مستندًا موجودًا.

  التشغيل:
    GOOGLE_APPLICATION_CREDENTIALS=/path/serviceAccount.json \
    GOOGLE_CLOUD_PROJECT=<projectId> \
    INJAZI_ADMIN_EMAIL=you@school.sa \
    npm run injazi:bootstrap
*/
import { cert, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";

const ROOT = "apps/injazi";

// ------------------------------------------------------- فحوص السلامة

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "";
const ADMIN_EMAIL = (process.env.INJAZI_ADMIN_EMAIL || "").trim().toLowerCase();

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  fail(
    "هذا سكربت الإنتاج ولا يعمل على المحاكي.\n" +
      "  للمحاكي استخدمي: npm run injazi:seed",
  );
}

if (!PROJECT_ID) fail("اضبطي GOOGLE_CLOUD_PROJECT بمعرّف مشروع Firebase الحقيقي.");
if (PROJECT_ID.startsWith("demo-")) fail(`"${PROJECT_ID}" معرّف محاكي وليس مشروعًا حقيقيًا.`);
if (!ADMIN_EMAIL) fail("اضبطي INJAZI_ADMIN_EMAIL ببريد المشرفة الحقيقي.");

// الحارس الأهم: لا تتسرّب حسابات الاختبار إلى الإنتاج أبدًا.
if (/\.local$|@injazi\.local$|^admin@injazi|^teacher\d*@|^parent\d*@/.test(ADMIN_EMAIL)) {
  fail(
    `"${ADMIN_EMAIL}" يشبه حساب اختبار. حسابات .local والحسابات التجريبية\n` +
      "  ممنوعة في الإنتاج — استخدمي بريدًا حقيقيًا.",
  );
}

// ------------------------------------------------------- كلمة المرور

/** قراءة كلمة المرور بلا صدى على الشاشة؛ لا تُطبَع ولا تُخزَّن. */
function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as { output: NodeJS.WriteStream; _writeToOutput: (s: string) => void };
    process.stdout.write(question);
    output._writeToOutput = () => {};
    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function readAdminPassword(): Promise<string> {
  const fromEnv = process.env.INJAZI_ADMIN_PASSWORD;
  if (fromEnv) {
    if (fromEnv.length < 12) {
      fail("كلمة مرور المشرفة قصيرة — استخدمي ١٢ حرفًا على الأقل لحساب إداري.");
    }
    return fromEnv;
  }

  if (!process.stdin.isTTY) {
    fail(
      "كلمة مرور المشرفة مطلوبة.\n" +
        "  مرّريها عبر INJAZI_ADMIN_PASSWORD أو شغّلي السكربت في طرفية تفاعلية.",
    );
  }

  const first = await askHidden("كلمة مرور المشرفة (لن تظهر على الشاشة): ");
  if (first.length < 12) fail("كلمة المرور قصيرة — ١٢ حرفًا على الأقل.");
  const again = await askHidden("أعيدي كتابتها للتأكيد: ");
  if (first !== again) fail("الكلمتان غير متطابقتين.");
  return first;
}

// ------------------------------------------------------------ البيانات

const STUDENTS = [
  { name: "تالا القريقري", themeId: "lavender", decorIcon: "Sparkles" },
  { name: "روز الحمراني", themeId: "pink", decorIcon: "Heart" },
  { name: "لانا الشهري", themeId: "sky", decorIcon: "Rocket" },
  { name: "ندى السهلي", themeId: "mint", decorIcon: "Leaf" },
  { name: "ريتاج عواجي", themeId: "peach", decorIcon: "Palette" },
  { name: "نادين الشمراني", themeId: "sunny", decorIcon: "Star" },
  { name: "جنى الشريف", themeId: "lavender", decorIcon: "Music" },
];

const SUBJECTS = [
  { name: "الرياضيات", icon: "Calculator", tone: "sky", teacher: "سميرة الشريف" },
  { name: "لغتي", icon: "PenLine", tone: "lilac", teacher: "دلال السناني" },
  { name: "العلوم", icon: "Microscope", tone: "mint", teacher: "حنان" },
  { name: "الدراسات الإسلامية", icon: "BookOpen", tone: "apricot", teacher: "بدرية السفري" },
  { name: "English", icon: "Languages", tone: "rose", teacher: "عائشة" },
];

const DEFAULT_SETTINGS = {
  platformName: "إنجازي يحكي",
  subtitle: "ملف الإنجاز الرقمي لطالبات الصف الرابع / 2",
  tagline: "كل إنجاز… يحكي قصة تميّز",
  schoolName: "الابتدائية الخامسة والستون بعد المائة",
  gradeLabel: "الصف الرابع / 2",
  logoUrl: null,
  logoPath: null,
  primaryColor: "#7a5fc7",
  secondaryColor: "#f6b93b",
  background: "cream",
  cardRadius: 28,
  defaultTheme: "lavender",
  audioUrl: null,
  audioPath: null,
  audioTitle: "أغنية المنصة",
  audioEnabled: true,
  audioLoop: true,
  audioVolume: 0.5,
  features: { hero3d: true, music: true, qr: true, publicPortfolios: true },
};

// ------------------------------------------------------------ التنفيذ

async function main() {
  const password = await readAdminPassword();

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  initializeApp({
    projectId: PROJECT_ID,
    credential: credentialsPath
      ? cert(JSON.parse(readFileSync(credentialsPath, "utf8")))
      : applicationDefault(),
  });

  const db = getFirestore();
  const auth = getAuth();
  const now = () => new Date().toISOString();

  console.log(`\nتهيئة الإنتاج — المشروع: ${PROJECT_ID}\n`);

  // ---- الإعدادات
  const settingsRef = db.doc(`${ROOT}/settings/app`);
  if ((await settingsRef.get()).exists) {
    console.log("• الإعدادات موجودة — لم تُلمَس");
  } else {
    await settingsRef.set({ ...DEFAULT_SETTINGS, updatedAt: now() });
    console.log("✓ الإعدادات");
  }

  // ---- المشرفة
  let adminUid: string;
  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    adminUid = existing.uid;
    console.log(`• حساب المشرفة موجود مسبقًا (لم تُغيَّر كلمة مروره)`);
  } catch {
    const created = await auth.createUser({
      email: ADMIN_EMAIL,
      password,
      displayName: "مشرفة المنصة",
      emailVerified: true,
    });
    adminUid = created.uid;
    console.log("✓ أُنشئ حساب المشرفة");
  }
  await db.doc(`${ROOT}/users/${adminUid}`).set(
    { role: "admin", name: "مشرفة المنصة", email: ADMIN_EMAIL, active: true, createdAt: now() },
    { merge: true },
  );
  console.log("✓ صلاحية admin");

  // ---- الطالبات
  for (const [index, student] of STUDENTS.entries()) {
    const found = await db
      .collection(`${ROOT}/students`)
      .where("name", "==", student.name)
      .limit(1)
      .get();
    if (!found.empty) {
      console.log(`• الطالبة موجودة: ${student.name}`);
      continue;
    }
    await db.collection(`${ROOT}/students`).add({
      name: student.name,
      grade: DEFAULT_SETTINGS.gradeLabel,
      bio: "",
      photoUrl: null,
      photoPath: null,
      themeId: student.themeId,
      accentColor: null,
      coverStyle: "arc",
      cardStyle: "clay",
      decorIcon: student.decorIcon,
      hobbies: [],
      visibility: "public",
      order: index,
      active: true,
      createdAt: now(),
      updatedAt: now(),
    });
    console.log(`✓ الطالبة: ${student.name}`);
  }

  // ---- المعلمات والمواد (مستندات فقط — بلا حسابات دخول)
  for (const [index, subject] of SUBJECTS.entries()) {
    let teacherId: string;
    const foundTeacher = await db
      .collection(`${ROOT}/teachers`)
      .where("name", "==", subject.teacher)
      .limit(1)
      .get();

    if (!foundTeacher.empty) {
      teacherId = foundTeacher.docs[0].id;
      console.log(`• المعلمة موجودة: ${subject.teacher}`);
    } else {
      const ref = await db.collection(`${ROOT}/teachers`).add({
        name: subject.teacher,
        // فارغ عمدًا: تكتبه المشرفة من اللوحة ببريد المعلمة الحقيقي،
        // فيُنشأ حساب دخولها هناك بكلمة مرور تختارها هي.
        email: "",
        subjectIds: [],
        photoUrl: null,
        photoPath: null,
        active: true,
        order: index,
        createdAt: now(),
        updatedAt: now(),
      });
      teacherId = ref.id;
      console.log(`✓ المعلمة: ${subject.teacher} (بلا حساب دخول بعد)`);
    }

    let subjectId: string;
    const foundSubject = await db
      .collection(`${ROOT}/subjects`)
      .where("name", "==", subject.name)
      .limit(1)
      .get();

    if (!foundSubject.empty) {
      subjectId = foundSubject.docs[0].id;
      console.log(`• المادة موجودة: ${subject.name}`);
    } else {
      const ref = await db.collection(`${ROOT}/subjects`).add({
        name: subject.name,
        icon: subject.icon,
        tone: subject.tone,
        teacherId,
        order: index,
        archived: false,
        createdAt: now(),
        updatedAt: now(),
      });
      subjectId = ref.id;
      console.log(`✓ المادة: ${subject.name}`);
    }

    await db.doc(`${ROOT}/teachers/${teacherId}`).set(
      { subjectIds: [subjectId], updatedAt: now() },
      { merge: true },
    );
    await db.doc(`${ROOT}/subjects/${subjectId}`).set({ teacherId, updatedAt: now() }, { merge: true });
  }

  console.log(
    "\nتمت التهيئة.\n" +
      "الخطوة التالية من لوحة الإدارة (#/admin):\n" +
      "  1) افتحي «المعلمات» وأضيفي لكل معلمة بريدها وكلمة مرور أوّلية.\n" +
      "  2) افتحي «الطالبات» واربطي كل طالبة بحساب ولي أمرها.\n",
  );
}

main().catch((error) => {
  console.error("\n✗ فشلت التهيئة:", error instanceof Error ? error.message : error);
  process.exit(1);
});
