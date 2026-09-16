/*
  اختبارات القواعد الأمنية لـ «إنجازي يحكي».
  تعمل على محاكي Firestore بمستخدمات حقيقية (مصادقة مزيّفة بأدوار)،
  وتتحقق من المنع لا من السماح فقط — المنع هو ما يحمي البيانات فعلًا.

  التشغيل:  npm run test:rules
*/
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const ROOT = "apps/injazi";
let env: RulesTestEnvironment;

const STUDENT_A = "student-a";
const STUDENT_B = "student-b";
const SUBJECT_MATH = "subject-math";
const SUBJECT_ARABIC = "subject-arabic";

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-injazi-rules",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  // بذر البيانات بتجاوز القواعد — تهيئة الحالة ليست جزءًا مما نختبره.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, `${ROOT}/users/admin1`), { role: "admin", name: "مشرفة", email: "a@x", active: true });
    await setDoc(doc(db, `${ROOT}/users/parentA`), {
      role: "parent", name: "ولي أ", email: "pa@x", active: true, studentIds: [STUDENT_A],
    });
    await setDoc(doc(db, `${ROOT}/users/parentB`), {
      role: "parent", name: "ولي ب", email: "pb@x", active: true, studentIds: [STUDENT_B],
    });
    await setDoc(doc(db, `${ROOT}/users/mathTeacher`), {
      role: "teacher", name: "سميرة", email: "t1@x", active: true,
      teacherId: "t-math", subjectIds: [SUBJECT_MATH],
    });
    await setDoc(doc(db, `${ROOT}/users/arabicTeacher`), {
      role: "teacher", name: "دلال", email: "t2@x", active: true,
      teacherId: "t-ar", subjectIds: [SUBJECT_ARABIC],
    });
    await setDoc(doc(db, `${ROOT}/users/disabledTeacher`), {
      role: "teacher", name: "معطّلة", email: "t3@x", active: false,
      teacherId: "t-off", subjectIds: [SUBJECT_MATH],
    });

    for (const id of [STUDENT_A, STUDENT_B]) {
      await setDoc(doc(db, `${ROOT}/students/${id}`), {
        name: id, grade: "رابع", bio: "", themeId: "lavender", visibility: "public",
        order: 0, active: true, hobbies: [],
      });
    }
    await setDoc(doc(db, `${ROOT}/subjects/${SUBJECT_MATH}`), { name: "الرياضيات", teacherId: "t-math", order: 0, archived: false });
    await setDoc(doc(db, `${ROOT}/projects/p-a-math`), {
      studentId: STUDENT_A, subjectId: SUBJECT_MATH, title: "مشروع", visibility: "public", media: [], links: [], order: 0,
    });
    await setDoc(doc(db, `${ROOT}/projects/p-a-private`), {
      studentId: STUDENT_A, subjectId: SUBJECT_MATH, title: "خاص", visibility: "private", media: [], links: [], order: 1,
    });
    await setDoc(doc(db, `${ROOT}/settings/app`), { platformName: "إنجازي يحكي" });
  });
});

const guest = () => env.unauthenticatedContext().firestore();
const as = (uid: string) => env.authenticatedContext(uid).firestore();

describe("القراءة العامة", () => {
  it("الزائرة تقرأ بطاقات الطالبات والمواد والإعدادات", async () => {
    const db = guest();
    await assertSucceeds(getDocs(collection(db, `${ROOT}/students`)));
    await assertSucceeds(getDocs(collection(db, `${ROOT}/subjects`)));
    await assertSucceeds(getDoc(doc(db, `${ROOT}/settings/app`)));
  });

  it("الزائرة تقرأ المشروع العام ولا تقرأ الخاص", async () => {
    const db = guest();
    await assertSucceeds(getDoc(doc(db, `${ROOT}/projects/p-a-math`)));
    await assertFails(getDoc(doc(db, `${ROOT}/projects/p-a-private`)));
  });

  it("الزائرة لا تقرأ سجل النشاط ولا ملفات الصلاحيات", async () => {
    const db = guest();
    await assertFails(getDocs(collection(db, `${ROOT}/activityLogs`)));
    await assertFails(getDoc(doc(db, `${ROOT}/users/admin1`)));
  });
});

describe("عزل ولي الأمر", () => {
  it("يعدّل ملف ابنته", async () => {
    await assertSucceeds(updateDoc(doc(as("parentA"), `${ROOT}/students/${STUDENT_A}`), { bio: "نبذة" }));
  });

  it("لا يعدّل ملف طالبة أخرى", async () => {
    await assertFails(updateDoc(doc(as("parentA"), `${ROOT}/students/${STUDENT_B}`), { bio: "اختراق" }));
  });

  it("لا يغيّر ترتيب الظهور ولا يخفي الملف", async () => {
    const db = as("parentA");
    await assertFails(updateDoc(doc(db, `${ROOT}/students/${STUDENT_A}`), { order: 99 }));
    await assertFails(updateDoc(doc(db, `${ROOT}/students/${STUDENT_A}`), { active: false }));
  });

  it("لا ينشئ ولا يحذف طالبة", async () => {
    const db = as("parentA");
    await assertFails(setDoc(doc(db, `${ROOT}/students/new-one`), { name: "جديدة", visibility: "public" }));
    await assertFails(deleteDoc(doc(db, `${ROOT}/students/${STUDENT_A}`)));
  });

  it("ينشئ مشروعًا لابنته فقط", async () => {
    const db = as("parentA");
    await assertSucceeds(
      setDoc(doc(db, `${ROOT}/projects/new-a`), {
        studentId: STUDENT_A, subjectId: SUBJECT_MATH, title: "جديد", visibility: "public", media: [], links: [], order: 2,
      }),
    );
    await assertFails(
      setDoc(doc(db, `${ROOT}/projects/new-b`), {
        studentId: STUDENT_B, subjectId: SUBJECT_MATH, title: "تسلل", visibility: "public", media: [], links: [], order: 0,
      }),
    );
  });

  it("لا ينقل مشروع ابنته إلى طالبة أخرى", async () => {
    await assertFails(
      updateDoc(doc(as("parentA"), `${ROOT}/projects/p-a-math`), { studentId: STUDENT_B }),
    );
  });

  it("لا يرقّي نفسه إلى مشرفة", async () => {
    await assertFails(updateDoc(doc(as("parentA"), `${ROOT}/users/parentA`), { role: "admin" }));
  });

  it("يقرأ المشروع الخاص بابنته فقط", async () => {
    await assertSucceeds(getDoc(doc(as("parentA"), `${ROOT}/projects/p-a-private`)));
    await assertFails(getDoc(doc(as("parentB"), `${ROOT}/projects/p-a-private`)));
  });
});

describe("عزل المعلمات", () => {
  it("تقيّم مادتها", async () => {
    await assertSucceeds(
      setDoc(doc(as("mathTeacher"), `${ROOT}/evaluations/p-a-math_t-math`), {
        projectId: "p-a-math", studentId: STUDENT_A, subjectId: SUBJECT_MATH,
        teacherId: "t-math", teacherName: "سميرة", stars: 5, badge: true,
        comment: "ممتاز", status: "excellent",
      }),
    );
  });

  it("لا تقيّم مادة زميلتها", async () => {
    await assertFails(
      setDoc(doc(as("arabicTeacher"), `${ROOT}/evaluations/x`), {
        projectId: "p-a-math", studentId: STUDENT_A, subjectId: SUBJECT_MATH,
        teacherId: "t-ar", teacherName: "دلال", stars: 5, badge: false,
        comment: "", status: "complete",
      }),
    );
  });

  it("لا تنتحل اسم معلمة أخرى في مادتها", async () => {
    await assertFails(
      setDoc(doc(as("mathTeacher"), `${ROOT}/evaluations/y`), {
        projectId: "p-a-math", studentId: STUDENT_A, subjectId: SUBJECT_MATH,
        teacherId: "t-ar", teacherName: "دلال", stars: 5, badge: false,
        comment: "", status: "complete",
      }),
    );
  });

  it("ترفض نجومًا خارج النطاق 1-5", async () => {
    const base = {
      projectId: "p-a-math", studentId: STUDENT_A, subjectId: SUBJECT_MATH,
      teacherId: "t-math", teacherName: "سميرة", badge: false, comment: "", status: "complete",
    };
    await assertFails(setDoc(doc(as("mathTeacher"), `${ROOT}/evaluations/z1`), { ...base, stars: 9 }));
    await assertFails(setDoc(doc(as("mathTeacher"), `${ROOT}/evaluations/z2`), { ...base, stars: 0 }));
  });

  it("ترفض حالة غير معروفة", async () => {
    await assertFails(
      setDoc(doc(as("mathTeacher"), `${ROOT}/evaluations/z3`), {
        projectId: "p-a-math", studentId: STUDENT_A, subjectId: SUBJECT_MATH,
        teacherId: "t-math", teacherName: "سميرة", stars: 4, badge: false,
        comment: "", status: "hacked",
      }),
    );
  });

  it("لا تعدّل مشاريع الطالبات ولا تحذفها", async () => {
    const db = as("mathTeacher");
    await assertFails(updateDoc(doc(db, `${ROOT}/projects/p-a-math`), { title: "تعديل" }));
    await assertFails(deleteDoc(doc(db, `${ROOT}/projects/p-a-math`)));
  });

  it("لا تضيف مادة ولا معلمة", async () => {
    const db = as("mathTeacher");
    await assertFails(setDoc(doc(db, `${ROOT}/subjects/new`), { name: "مادة", order: 9, archived: false }));
    await assertFails(setDoc(doc(db, `${ROOT}/teachers/new`), { name: "معلمة", email: "n@x", subjectIds: [] }));
  });

  it("المعلمة المعطَّلة لا تقيّم", async () => {
    await assertFails(
      setDoc(doc(as("disabledTeacher"), `${ROOT}/evaluations/off`), {
        projectId: "p-a-math", studentId: STUDENT_A, subjectId: SUBJECT_MATH,
        teacherId: "t-off", teacherName: "معطّلة", stars: 3, badge: false,
        comment: "", status: "complete",
      }),
    );
  });
});

describe("المشرفة", () => {
  it("تدير الطالبات والمواد والمعلمات والإعدادات", async () => {
    const db = as("admin1");
    await assertSucceeds(setDoc(doc(db, `${ROOT}/students/new`), { name: "جديدة", visibility: "public", order: 9, active: true }));
    await assertSucceeds(setDoc(doc(db, `${ROOT}/subjects/new`), { name: "مادة", order: 9, archived: false }));
    await assertSucceeds(setDoc(doc(db, `${ROOT}/teachers/new`), { name: "معلمة", email: "n@x", subjectIds: [] }));
    await assertSucceeds(updateDoc(doc(db, `${ROOT}/settings/app`), { tagline: "شعار" }));
    await assertSucceeds(getDocs(collection(db, `${ROOT}/activityLogs`)));
  });

  it("تُنشئ ملفات صلاحيات وتغيّر الأدوار", async () => {
    await assertSucceeds(
      setDoc(doc(as("admin1"), `${ROOT}/users/newUser`), { role: "parent", name: "ولي", email: "n@x", active: true }),
    );
  });
});

describe("سجل النشاط", () => {
  it("أي حساب فعّال يكتب فيه، ولا أحد يعدّله أو يحذفه", async () => {
    const db = as("parentA");
    await assertSucceeds(
      setDoc(doc(db, `${ROOT}/activityLogs/log1`), {
        kind: "test", message: "حدث", actorName: "ولي أ", actorRole: "parent", at: new Date().toISOString(),
      }),
    );
    await assertFails(updateDoc(doc(db, `${ROOT}/activityLogs/log1`), { message: "تزوير" }));
    await assertFails(deleteDoc(doc(db, `${ROOT}/activityLogs/log1`)));
    await assertFails(getDocs(collection(db, `${ROOT}/activityLogs`)));
  });

  it("الزائرة لا تكتب فيه", async () => {
    await assertFails(
      setDoc(doc(guest(), `${ROOT}/activityLogs/log2`), {
        kind: "x", message: "y", actorName: "z", actorRole: "guest", at: "now",
      }),
    );
  });
});

describe("عزل التطبيقين", () => {
  it("دور شُعلة لغتي لا يمنح صلاحية في إنجازي يحكي", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      // معلمة في التطبيق القديم (مجموعة users الجذرية) بلا ملف في إنجازي يحكي
      await setDoc(doc(ctx.firestore(), "users/legacyTeacher"), { role: "teacher", name: "قديمة" });
    });
    const db = as("legacyTeacher");
    await assertFails(setDoc(doc(db, `${ROOT}/students/x`), { name: "تسلل", visibility: "public" }));
    await assertFails(updateDoc(doc(db, `${ROOT}/settings/app`), { tagline: "تسلل" }));
  });
});

it("المخطّط الأساسي مبذور كما هو متوقَّع", async () => {
  const snapshot = await getDocs(collection(guest(), `${ROOT}/students`));
  expect(snapshot.size).toBe(2);
});
