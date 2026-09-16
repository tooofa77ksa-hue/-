/*
  تهيئة «إنجازي يحكي» — للمحاكي فقط.
  ------------------------------------------------------------------
  يُنشئ البيانات الأولى: الطالبات السبع، المواد الخمس، المعلمات
  الخمس بحساباتهن، حساب المشرفة، والإعدادات.

  آمن للتشغيل المتكرر (idempotent): يبحث بالاسم/البريد قبل الإنشاء،
  ولا يلمس أي مستند موجود — تشغيله بعد بدء الاستخدام لا يفقد أي بيانات.

  التشغيل على المحاكي:
    FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
    FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
    GOOGLE_CLOUD_PROJECT=<projectId> npm run injazi:seed

  للإنتاج استخدمي سكربتًا آخر: npm run injazi:bootstrap
  (حسابات .local وكلمات المرور الافتراضية هنا صالحة للمحاكي وحده،
  ولذلك يرفض هذا السكربت العمل خارجه.)
*/
import { cert, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "demo-injazi";
const USING_EMULATOR = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const ROOT = "apps/injazi";

const ADMIN_EMAIL = process.env.INJAZI_ADMIN_EMAIL || "admin@injazi.local";
const ADMIN_PASSWORD = process.env.INJAZI_ADMIN_PASSWORD || "Injazi#2026";
const DEFAULT_TEACHER_PASSWORD = process.env.INJAZI_TEACHER_PASSWORD || "Teacher#2026";
const DEFAULT_PARENT_PASSWORD = process.env.INJAZI_PARENT_PASSWORD || "Parent#2026";

// حارس صريح: هذه البيانات (admin@injazi.local وكلمات مرور معروفة) يجب
// ألا تصل إلى مشروع حقيقي بأي حال، ولو بخطأ في متغيّر بيئة.
if (!USING_EMULATOR) {
  console.error(
    "\n✗ هذا السكربت للمحاكي فقط — يُنشئ حسابات .local بكلمات مرور معروفة.\n" +
      "  للإنتاج: npm run injazi:bootstrap\n",
  );
  process.exit(1);
}

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
// على المحاكي لا تُمرَّر بيانات اعتماد إطلاقًا: تمرير undefined صراحةً
// يفشل لأن Admin SDK يتحقق من شكل الكائن، والحل هو حذف المفتاح نفسه.
initializeApp(
  USING_EMULATOR
    ? { projectId: PROJECT_ID }
    : {
        projectId: PROJECT_ID,
        credential: credentialsPath
          ? cert(JSON.parse(readFileSync(credentialsPath, "utf8")))
          : applicationDefault(),
      },
);

const db = getFirestore();
const auth = getAuth();
const now = () => new Date().toISOString();

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

/** بريد داخلي مشتق من اسم المعلمة — تُغيّره المشرفة لاحقًا من اللوحة. */
function teacherEmail(name: string, index: number): string {
  return `teacher${index + 1}@injazi.local`.toLowerCase().replace(/\s+/g, "");
}

async function findByField(collection: string, field: string, value: string) {
  const snapshot = await db.collection(collection).where(field, "==", value).limit(1).get();
  return snapshot.empty ? null : snapshot.docs[0];
}

/** ينشئ حساب Auth إن لم يوجد، ويعيد uid في الحالتين. */
async function ensureAccount(email: string, password: string, displayName: string): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(email);
    return existing.uid;
  } catch {
    const created = await auth.createUser({ email, password, displayName, emailVerified: true });
    return created.uid;
  }
}

async function seedSettings() {
  const ref = db.doc(`${ROOT}/settings/app`);
  if ((await ref.get()).exists) {
    console.log("• الإعدادات موجودة — لم تُلمَس");
    return;
  }
  await ref.set({
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
    updatedAt: now(),
  });
  console.log("✓ الإعدادات");
}

async function seedAdmin() {
  const uid = await ensureAccount(ADMIN_EMAIL, ADMIN_PASSWORD, "مشرفة المنصة");
  await db.doc(`${ROOT}/users/${uid}`).set(
    {
      role: "admin",
      name: "مشرفة المنصة",
      email: ADMIN_EMAIL,
      active: true,
      createdAt: now(),
    },
    { merge: true },
  );
  console.log(`✓ المشرفة: ${ADMIN_EMAIL}`);
  return uid;
}

async function seedStudents() {
  const ids: Record<string, string> = {};
  for (const [index, student] of STUDENTS.entries()) {
    const existing = await findByField(`${ROOT}/students`, "name", student.name);
    if (existing) {
      ids[student.name] = existing.id;
      console.log(`• الطالبة موجودة: ${student.name}`);
      continue;
    }
    const ref = await db.collection(`${ROOT}/students`).add({
      name: student.name,
      grade: "الصف الرابع / 2",
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
    ids[student.name] = ref.id;
    console.log(`✓ الطالبة: ${student.name}`);
  }
  return ids;
}

async function seedTeachersAndSubjects() {
  for (const [index, subject] of SUBJECTS.entries()) {
    // ---- المعلمة
    let teacherId: string;
    const existingTeacher = await findByField(`${ROOT}/teachers`, "name", subject.teacher);
    const email = existingTeacher?.data().email ?? teacherEmail(subject.teacher, index);

    if (existingTeacher) {
      teacherId = existingTeacher.id;
      console.log(`• المعلمة موجودة: ${subject.teacher}`);
    } else {
      const ref = await db.collection(`${ROOT}/teachers`).add({
        name: subject.teacher,
        email,
        subjectIds: [],
        photoUrl: null,
        photoPath: null,
        active: true,
        order: index,
        createdAt: now(),
        updatedAt: now(),
      });
      teacherId = ref.id;
      console.log(`✓ المعلمة: ${subject.teacher} (${email})`);
    }

    // ---- المادة
    let subjectId: string;
    const existingSubject = await findByField(`${ROOT}/subjects`, "name", subject.name);
    if (existingSubject) {
      subjectId = existingSubject.id;
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

    // ---- الربط ثنائي الاتجاه + حساب الدخول
    await db.doc(`${ROOT}/teachers/${teacherId}`).set(
      { subjectIds: [subjectId], updatedAt: now() },
      { merge: true },
    );
    await db.doc(`${ROOT}/subjects/${subjectId}`).set({ teacherId, updatedAt: now() }, { merge: true });

    const uid = await ensureAccount(email, DEFAULT_TEACHER_PASSWORD, subject.teacher);
    await db.doc(`${ROOT}/users/${uid}`).set(
      {
        role: "teacher",
        name: subject.teacher,
        email,
        active: true,
        teacherId,
        subjectIds: [subjectId],
        createdAt: now(),
      },
      { merge: true },
    );
  }
}

/** حساب ولي أمر تجريبي مرتبط بالطالبة الأولى — لاختبار عزل الصلاحيات. */
async function seedSampleParent(studentIds: Record<string, string>) {
  const email = process.env.INJAZI_PARENT_EMAIL || "parent1@injazi.local";
  const studentName = STUDENTS[0].name;
  const studentId = studentIds[studentName];
  if (!studentId) return;

  const uid = await ensureAccount(email, DEFAULT_PARENT_PASSWORD, `ولي أمر ${studentName}`);
  await db.doc(`${ROOT}/users/${uid}`).set(
    {
      role: "parent",
      name: `ولي أمر ${studentName}`,
      email,
      active: true,
      studentIds: [studentId],
      createdAt: now(),
    },
    { merge: true },
  );
  console.log(`✓ ولي الأمر: ${email} → ${studentName}`);
}

async function main() {
  console.log(`\nتهيئة «إنجازي يحكي» — المشروع: ${PROJECT_ID}${USING_EMULATOR ? " (محاكي)" : ""}\n`);
  await seedSettings();
  await seedAdmin();
  const studentIds = await seedStudents();
  await seedTeachersAndSubjects();
  await seedSampleParent(studentIds);
  console.log("\nتمت التهيئة.\n");
}

main().catch((error) => {
  console.error("فشلت التهيئة:", error);
  process.exit(1);
});
