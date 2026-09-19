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

/*
  نفس الاختبارات تُشغَّل على ملفين: القواعد المشتركة، والملف المولَّد
  الخاص بإنجازي (npm run injazi:rules:check:rules). لو افترق المولَّد عن
  مصدره في أي سلوك فعلي لظهر هنا، لا في مراجعة بصرية للنص.
*/
const RULES_FILE = process.env.IZ_RULES_FILE || "firestore.rules";
let env: RulesTestEnvironment;

const STUDENT_A = "student-a";
const STUDENT_B = "student-b";
const SUBJECT_MATH = "subject-math";
const SUBJECT_ARABIC = "subject-arabic";
const INVITE_MATH = "code-math-0123456789ab";
const INVITE_ARABIC = "code-arab-0123456789ab";

/** ملف الصلاحيات الذي يكتبه التطبيق حين تفتح المعلمة رابطها. */
const claim = (code: string, teacherId: string, subjectIds: string[]) => ({
  role: "teacher",
  name: "معلمة",
  email: "",
  active: true,
  teacherId,
  subjectIds,
  inviteCode: code,
  createdAt: "2026-09-17T00:00:00.000Z",
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-injazi-rules",
    firestore: {
      rules: readFileSync(RULES_FILE, "utf8"),
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

    // رابط دعوة صالح لمعلمة الرياضيات، وآخر لمعلمة اللغة.
    await setDoc(doc(db, `${ROOT}/invites/${INVITE_MATH}`), {
      teacherId: "t-math", teacherName: "سميرة", subjectIds: [SUBJECT_MATH], active: true,
    });
    await setDoc(doc(db, `${ROOT}/invites/${INVITE_ARABIC}`), {
      teacherId: "t-ar", teacherName: "دلال", subjectIds: [SUBJECT_ARABIC], active: true,
    });
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

  it("يؤرشف مشروع ابنته فقط", async () => {
    await assertSucceeds(
      updateDoc(doc(as("parentA"), `${ROOT}/projects/p-a-math`), { archived: true }),
    );
    await assertFails(
      updateDoc(doc(as("parentB"), `${ROOT}/projects/p-a-math`), { archived: true }),
    );
  });

  it("لا يحذف مشروع طالبة أخرى", async () => {
    await assertFails(deleteDoc(doc(as("parentB"), `${ROOT}/projects/p-a-math`)));
  });

  /*
    الحارس الأهم: فتح رابط طالبة أخرى مباشرة. الواجهة تخفي الأزرار،
    لكن المنع الحقيقي هنا — لا كتابة ولا حذف مهما كان المسار الذي
    وصل منه الطلب (الرابط، أو REST API، أو طرفية).
  */
  it("فتح ملف طالبة أخرى بالرابط لا يمنح أي صلاحية كتابة", async () => {
    const db = as("parentA");
    await assertFails(updateDoc(doc(db, `${ROOT}/students/${STUDENT_B}`), { name: "اسم مزيّف" }));
    await assertFails(updateDoc(doc(db, `${ROOT}/students/${STUDENT_B}`), { photoUrl: "x" }));
    await assertFails(updateDoc(doc(db, `${ROOT}/students/${STUDENT_B}`), { themeId: "pink" }));
    await assertFails(deleteDoc(doc(db, `${ROOT}/students/${STUDENT_B}`)));
    await assertFails(
      setDoc(doc(db, `${ROOT}/achievements/sneak`), {
        studentId: STUDENT_B, kind: "achievement", title: "تسلل", visibility: "public", order: 0,
      }),
    );
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


describe("هجمات محدَّدة على تصعيد الصلاحية", () => {
  it("المعلمة لا تغيّر موادها المسنَدة (لا في ملف الصلاحيات ولا في مستندها)", async () => {
    const db = as("mathTeacher");
    // محاولة منح النفس مادة زميلتها عبر ملف الصلاحيات
    await assertFails(
      updateDoc(doc(db, `${ROOT}/users/mathTeacher`), { subjectIds: [SUBJECT_MATH, SUBJECT_ARABIC] }),
    );
    // ومحاولة الالتفاف عبر مستند المعلمة نفسه
    await assertFails(
      setDoc(doc(db, `${ROOT}/teachers/t-math`), { name: "سميرة", email: "t1@x", subjectIds: [SUBJECT_ARABIC] }),
    );
    // ومحاولة إسناد المادة لنفسها من مستند المادة
    await assertFails(updateDoc(doc(db, `${ROOT}/subjects/${SUBJECT_MATH}`), { teacherId: "t-math" }));
  });

  it("المعلمة لا تنقل ملكية مشروع إلى طالبة أخرى", async () => {
    await assertFails(
      updateDoc(doc(as("mathTeacher"), `${ROOT}/projects/p-a-math`), { studentId: STUDENT_B }),
    );
  });

  it("المعلمة لا تُنشئ حساب مشرفة ولا ترقّي نفسها", async () => {
    const db = as("mathTeacher");
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/newAdmin`), { role: "admin", name: "مزيّفة", email: "x@x", active: true }),
    );
    await assertFails(updateDoc(doc(db, `${ROOT}/users/mathTeacher`), { role: "admin" }));
  });

  it("ولي الأمر لا يُنشئ مشرفة ولا معلمة", async () => {
    const db = as("parentA");
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/anotherAdmin`), { role: "admin", name: "مزيّفة", email: "y@y", active: true }),
    );
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/anotherTeacher`), {
        role: "teacher", name: "مزيّفة", email: "z@z", active: true, subjectIds: [SUBJECT_MATH],
      }),
    );
  });

  it("ولي الأمر لا يربط طالبة أخرى بحسابه", async () => {
    await assertFails(
      updateDoc(doc(as("parentA"), `${ROOT}/users/parentA`), { studentIds: [STUDENT_A, STUDENT_B] }),
    );
  });

  it("الزائرة لا تكتب شيئًا في أي مجموعة", async () => {
    const db = guest();
    await assertFails(setDoc(doc(db, `${ROOT}/students/x`), { name: "x", visibility: "public" }));
    await assertFails(setDoc(doc(db, `${ROOT}/subjects/x`), { name: "x", order: 0, archived: false }));
    await assertFails(updateDoc(doc(db, `${ROOT}/settings/app`), { tagline: "x" }));
    await assertFails(
      setDoc(doc(db, `${ROOT}/evaluations/x`), {
        projectId: "p-a-math", studentId: STUDENT_A, subjectId: SUBJECT_MATH,
        teacherId: "t-math", teacherName: "x", stars: 5, badge: true, comment: "", status: "excellent",
      }),
    );
  });

  it("المنع الافتراضي: أي مسار خارج المخطّط مرفوض للجميع", async () => {
    await assertFails(getDoc(doc(as("admin1"), `${ROOT}/unknownCollection/x`)));
    await assertFails(setDoc(doc(as("admin1"), `${ROOT}/unknownCollection/x`), { a: 1 }));
    await assertFails(getDoc(doc(guest(), "randomTopLevel/x")));
  });
});


describe("مخزن الصور (media)", () => {
  const image = (ownerUid: string, extra: Record<string, unknown> = {}) => ({
    ownerUid,
    studentId: STUDENT_A,
    name: "photo.webp",
    mime: "image/webp",
    size: 1234,
    data: "data:image/webp;base64,AAAA",
    createdAt: new Date().toISOString(),
    ...extra,
  });

  it("الصور تُقرأ من الجميع (الصفحة الرئيسية مفتوحة)", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `${ROOT}/media/m1`), image("parentA"));
    });
    await assertSucceeds(getDoc(doc(guest(), `${ROOT}/media/m1`)));
  });

  it("ولي الأمر يحفظ صورة باسمه هو", async () => {
    await assertSucceeds(setDoc(doc(as("parentA"), `${ROOT}/media/m2`), image("parentA")));
  });

  it("لا يحفظ صورة باسم مستخدمة أخرى", async () => {
    await assertFails(setDoc(doc(as("parentA"), `${ROOT}/media/m3`), image("parentB")));
  });

  it("الزائرة لا تحفظ صورًا", async () => {
    await assertFails(setDoc(doc(guest(), `${ROOT}/media/m4`), image("parentA")));
  });

  it("ترفض نوعًا غير صورة", async () => {
    await assertFails(
      setDoc(doc(as("parentA"), `${ROOT}/media/m5`), image("parentA", { mime: "text/html" })),
    );
    await assertFails(
      setDoc(doc(as("parentA"), `${ROOT}/media/m6`), image("parentA", { mime: "application/pdf" })),
    );
  });

  it("ترفض صورة تتجاوز حد المستند", async () => {
    await assertFails(
      setDoc(
        doc(as("parentA"), `${ROOT}/media/m7`),
        image("parentA", { data: "x".repeat(970000) }),
      ),
    );
  });

  it("الصورة غير قابلة للتعديل بعد الحفظ", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `${ROOT}/media/m8`), image("parentA"));
    });
    await assertFails(
      updateDoc(doc(as("parentA"), `${ROOT}/media/m8`), { data: "data:image/webp;base64,BBBB" }),
    );
  });

  it("يحذف صوره فقط، والمشرفة تحذف أي صورة", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `${ROOT}/media/m9`), image("parentA"));
      await setDoc(doc(ctx.firestore(), `${ROOT}/media/m10`), image("parentA"));
    });
    await assertFails(deleteDoc(doc(as("parentB"), `${ROOT}/media/m9`)));
    await assertFails(deleteDoc(doc(as("mathTeacher"), `${ROOT}/media/m9`)));
    await assertSucceeds(deleteDoc(doc(as("parentA"), `${ROOT}/media/m9`)));
    await assertSucceeds(deleteDoc(doc(as("admin1"), `${ROOT}/media/m10`)));
  });

  /*
    جلسة الطالبة مجهولة، وuid المجهول يخصّ الجهاز لا الشخص: تفتح رابطها
    من جوّال آخر فتصير uid مختلفًا. فلو كان ownerUid وحده شرط الحذف
    لعجزت عن حذف صورتها هي — ولبقيت الصورة في قاعدة البيانات بلا مرجع
    بعد إزالتها من الشاشة.
  */
  it("مالكة الملف تحذف صورة ملفها ولو رفعها جهاز آخر", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `${ROOT}/media/m11`), image("جهاز-قديم"));
      await setDoc(doc(ctx.firestore(), `${ROOT}/media/m12`), image("جهاز-قديم"));
      await setDoc(
        doc(ctx.firestore(), `${ROOT}/media/m13`),
        image("جهاز-قديم", { studentId: null }),
      );
    });
    // ولي أمر طالبة أخرى لا يقترب منها.
    await assertFails(deleteDoc(doc(as("parentB"), `${ROOT}/media/m11`)));
    // ولا المعلمة: تقرأ وتقيّم ولا تحذف صور الطالبات.
    await assertFails(deleteDoc(doc(as("mathTeacher"), `${ROOT}/media/m11`)));
    // وصورة بلا طالبة تبقى لصاحبها وحده — لا تتّسع الصلاحية إلى كل شيء.
    await assertFails(deleteDoc(doc(as("parentA"), `${ROOT}/media/m13`)));
    await assertSucceeds(deleteDoc(doc(as("parentA"), `${ROOT}/media/m11`)));
    await assertSucceeds(deleteDoc(doc(as("admin1"), `${ROOT}/media/m12`)));
  });
});

describe("روابط المعلمات", () => {
  it("فتح الرابط يمنح صلاحية المعلمة المذكورة فيه", async () => {
    const db = as("device1");
    await assertSucceeds(getDoc(doc(db, `${ROOT}/invites/${INVITE_MATH}`)));
    await assertSucceeds(
      setDoc(doc(db, `${ROOT}/users/device1`), claim(INVITE_MATH, "t-math", [SUBJECT_MATH])),
    );
    // وتستطيع فعلًا ما جاءت من أجله: تقييم مشروع مادتها.
    await assertSucceeds(
      setDoc(doc(db, `${ROOT}/evaluations/e-link`), {
        projectId: "p-a-math", studentId: STUDENT_A, subjectId: SUBJECT_MATH,
        teacherId: "t-math", teacherName: "سميرة", stars: 4, badge: false,
        comment: "أحسنتِ", status: "complete",
      }),
    );
  });

  it("لا تُعدّ الروابط ولا تُنشأ إلا من المشرفة", async () => {
    // التعداد هو ما يحوّل «رمز سرّي» إلى «قائمة مفاتيح».
    await assertFails(getDocs(collection(as("device1"), `${ROOT}/invites`)));
    await assertFails(getDocs(collection(guest(), `${ROOT}/invites`)));
    await assertFails(getDocs(collection(as("mathTeacher"), `${ROOT}/invites`)));
    await assertSucceeds(getDocs(collection(as("admin1"), `${ROOT}/invites`)));

    await assertFails(
      setDoc(doc(as("device1"), `${ROOT}/invites/forged`), {
        teacherId: "t-math", teacherName: "س", subjectIds: [SUBJECT_MATH], active: true,
      }),
    );
    await assertSucceeds(
      setDoc(doc(as("admin1"), `${ROOT}/invites/fresh`), {
        teacherId: "t-math", teacherName: "س", subjectIds: [SUBJECT_MATH], active: true,
      }),
    );
  });

  it("الرابط لا يمنح أكثر ممّا فيه: لا مواد زميلاتها ولا دور آخر", async () => {
    const db = as("device2");
    // مواد أوسع ممّا في الدعوة
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/device2`), claim(INVITE_MATH, "t-math", [SUBJECT_MATH, SUBJECT_ARABIC])),
    );
    // معلمة أخرى
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/device2`), claim(INVITE_MATH, "t-ar", [SUBJECT_ARABIC])),
    );
    // دور المشرفة
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/device2`), {
        ...claim(INVITE_MATH, "t-math", [SUBJECT_MATH]), role: "admin",
      }),
    );
    // رمز غير موجود
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/device2`), claim("no-such-code", "t-math", [SUBJECT_MATH])),
    );
    // ولا ملف صلاحيات بلا رمز أصلًا
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/device2`), {
        role: "teacher", name: "دخيلة", email: "", active: true,
        teacherId: "t-math", subjectIds: [SUBJECT_MATH], createdAt: "2026-09-17T00:00:00.000Z",
      }),
    );
  });

  it("لا تكتب ملف صلاحيات لهوية أخرى", async () => {
    await assertFails(
      setDoc(doc(as("device3"), `${ROOT}/users/device4`), claim(INVITE_MATH, "t-math", [SUBJECT_MATH])),
    );
  });

  it("إلغاء الرابط يقطع الصلاحية فورًا عن كل جهاز فتحه", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, `${ROOT}/users/deviceA`), claim(INVITE_MATH, "t-math", [SUBJECT_MATH]));
      await setDoc(doc(db, `${ROOT}/users/deviceB`), claim(INVITE_MATH, "t-math", [SUBJECT_MATH]));
    });

    const evaluation = (id: string) => ({
      projectId: "p-a-math", studentId: STUDENT_A, subjectId: SUBJECT_MATH,
      teacherId: "t-math", teacherName: "سميرة", stars: 5, badge: true,
      comment: id, status: "excellent",
    });

    await assertSucceeds(
      setDoc(doc(as("deviceA"), `${ROOT}/evaluations/e-before`), evaluation("قبل")),
    );

    // المشرفة تلغي الرابط.
    await assertSucceeds(deleteDoc(doc(as("admin1"), `${ROOT}/invites/${INVITE_MATH}`)));

    // الجهازان يفقدان الصلاحية في الحال — بلا تسجيل خروج ولا انتظار.
    await assertFails(
      setDoc(doc(as("deviceA"), `${ROOT}/evaluations/e-after-a`), evaluation("بعد أ")),
    );
    await assertFails(
      setDoc(doc(as("deviceB"), `${ROOT}/evaluations/e-after-b`), evaluation("بعد ب")),
    );
    // ولا يقرآن المشاريع الخاصة بعدها.
    await assertFails(getDoc(doc(as("deviceA"), `${ROOT}/projects/p-a-private`)));
  });

  it("الدخول بالرابط لا يكشف بيانات أولياء الأمور ولا زميلاتها", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), `${ROOT}/users/deviceC`),
        claim(INVITE_MATH, "t-math", [SUBJECT_MATH]),
      );
    });
    const db = as("deviceC");
    await assertSucceeds(getDoc(doc(db, `${ROOT}/users/deviceC`)));
    await assertFails(getDoc(doc(db, `${ROOT}/users/parentA`)));
    await assertFails(getDoc(doc(db, `${ROOT}/users/arabicTeacher`)));
    await assertFails(getDocs(collection(db, `${ROOT}/users`)));
    await assertFails(getDocs(collection(db, `${ROOT}/activityLogs`)));
  });

  it("صاحبة الرابط لا ترقّي نفسها بعد الدخول", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), `${ROOT}/users/deviceD`),
        claim(INVITE_MATH, "t-math", [SUBJECT_MATH]),
      );
    });
    const db = as("deviceD");
    await assertFails(updateDoc(doc(db, `${ROOT}/users/deviceD`), { role: "admin" }));
    await assertFails(updateDoc(doc(db, `${ROOT}/users/deviceD`), { subjectIds: [SUBJECT_MATH, SUBJECT_ARABIC] }));
    // ولا تُوسّع دعوتها لتشمل مادة أخرى.
    await assertFails(updateDoc(doc(db, `${ROOT}/invites/${INVITE_MATH}`), { subjectIds: [SUBJECT_ARABIC] }));
    // ولا تقيّم مادة ليست لها.
    await assertFails(
      setDoc(doc(db, `${ROOT}/evaluations/e-wrong`), {
        projectId: "p-a-math", studentId: STUDENT_A, subjectId: SUBJECT_ARABIC,
        teacherId: "t-math", teacherName: "سميرة", stars: 5, badge: true,
        comment: "خارج مادتي", status: "excellent",
      }),
    );
  });
});

it("المخطّط الأساسي مبذور كما هو متوقَّع", async () => {
  const snapshot = await getDocs(collection(guest(), `${ROOT}/students`));
  expect(snapshot.size).toBe(2);
});
