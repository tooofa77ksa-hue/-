/*
  روابط الطالبات — تدقيق الوصول.
  ------------------------------------------------------------------
  كل اختبار هنا محاولة اختراق فعلية، لا تأكيد على أن المسموح يعمل:
  طالبة تحاول فتح ملف زميلتها، تغيّر معرّف الطالبة، تضيف طالبة أخرى إلى
  قائمتها، ترقّي نفسها مشرفة، تعدّل تقييم معلمة، أو ترفع صورة باسم غيرها.
  كلها يجب أن تُرفض من الخادم لا من إخفاء زر.

  التشغيل:  npx vitest run tests/rules/injazi.studentlinks.test.ts
*/
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const ROOT = "apps/injazi";
const RULES_FILE = process.env.IZ_RULES_FILE || "firestore.rules";
let env: RulesTestEnvironment;

/** الطالبات الثماني بأسمائهنّ الحقيقية — الاختبار يجري على كل واحدة. */
const STUDENTS = [
  { id: "st-nadeen", name: "نادين", code: "code-nadeen-0000000001" },
  { id: "st-ritaj", name: "ريتاج", code: "code-ritaj-00000000002" },
  { id: "st-lana", name: "لانا", code: "code-lana-000000000003" },
  { id: "st-tala", name: "تالا", code: "code-tala-000000000004" },
  { id: "st-nada", name: "ندى", code: "code-nada-000000000005" },
  { id: "st-rose", name: "روز", code: "code-rose-000000000006" },
  { id: "st-maryam", name: "مريم", code: "code-maryam-000000007" },
  { id: "st-jana", name: "جنى", code: "code-jana-000000000008" },
];

const SUBJECT = "subject-math";

/** ملف الصلاحيات الذي يكتبه التطبيق عند فتح رابط الطالبة. */
const claim = (code: string, studentId: string, name: string) => ({
  role: "parent",
  name,
  email: "",
  active: true,
  studentIds: [studentId],
  linkCode: code,
  createdAt: "2026-09-17T00:00:00.000Z",
});

/** جهاز الطالبة رقم i بعد أن فتحت رابطها. */
const deviceOf = (i: number) => `device-${STUDENTS[i].id}`;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-injazi-links",
    firestore: { rules: readFileSync(RULES_FILE, "utf8"), host: "127.0.0.1", port: 8080 },
  });
});

afterAll(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, `${ROOT}/users/admin1`), {
      role: "admin", name: "مشرفة", email: "a@x", active: true,
    });
    await setDoc(doc(db, `${ROOT}/users/mathTeacher`), {
      role: "teacher", name: "سميرة", email: "t@x", active: true,
      teacherId: "t-math", subjectIds: [SUBJECT],
    });
    await setDoc(doc(db, `${ROOT}/subjects/${SUBJECT}`), {
      name: "الرياضيات", teacherId: "t-math", order: 0, archived: false,
    });

    for (const [index, student] of STUDENTS.entries()) {
      await setDoc(doc(db, `${ROOT}/students/${student.id}`), {
        name: student.name, grade: "رابع", bio: "", themeId: "lavender",
        visibility: "public", order: index, active: true, hobbies: [],
      });
      await setDoc(doc(db, `${ROOT}/studentLinks/${student.code}`), {
        studentId: student.id, studentName: student.name, active: true,
      });
      // مشروع خاص لكل طالبة — لا يقرؤه إلا هي وإدارتها ومعلماتها.
      await setDoc(doc(db, `${ROOT}/projects/p-${student.id}`), {
        studentId: student.id, subjectId: SUBJECT, title: `مشروع ${student.name}`,
        visibility: "private", media: [], links: [], order: 0, archived: false,
      });
      // تقييم معلمة — لا تمسّه الطالبة.
      await setDoc(doc(db, `${ROOT}/evaluations/e-${student.id}`), {
        projectId: `p-${student.id}`, studentId: student.id, subjectId: SUBJECT,
        teacherId: "t-math", teacherName: "سميرة", stars: 3, badge: false,
        comment: "أصلي", status: "complete",
      });
    }
  });
});

const guest = () => env.unauthenticatedContext().firestore();
const as = (uid: string) => env.authenticatedContext(uid).firestore();

// ====================================================================
describe("الطالبات الثماني: كل واحدة تدخل ملفها وحده", () => {
  for (const [index, student] of STUDENTS.entries()) {
    it(`${student.name} — تفتح رابطها وتعدّل ملفها وترفع إنجازًا`, async () => {
      const uid = deviceOf(index);
      const db = as(uid);

      // ١) تقرأ الرابط بمعرّفه وتطالب به
      await assertSucceeds(getDoc(doc(db, `${ROOT}/studentLinks/${student.code}`)));
      await assertSucceeds(
        setDoc(doc(db, `${ROOT}/users/${uid}`), claim(student.code, student.id, student.name)),
      );

      // ٢) تعدّل ملفها
      await assertSucceeds(
        updateDoc(doc(db, `${ROOT}/students/${student.id}`), { bio: `أنا ${student.name}` }),
      );

      // ٣) ترفع مشروعًا وإنجازًا
      await assertSucceeds(
        setDoc(doc(db, `${ROOT}/projects/new-${student.id}`), {
          studentId: student.id, subjectId: SUBJECT, title: "مشروعي",
          visibility: "public", media: [], links: [], order: 1, archived: false,
        }),
      );
      await assertSucceeds(
        setDoc(doc(db, `${ROOT}/achievements/new-${student.id}`), {
          studentId: student.id, kind: "achievement", title: "شهادتي",
          visibility: "public", order: 0, archived: false,
        }),
      );

      // ٤) ترفع صورة باسمها
      await assertSucceeds(
        setDoc(doc(db, `${ROOT}/media/m-${student.id}`), {
          ownerUid: uid, studentId: student.id,
          data: "data:image/webp;base64,UklGRg==", mime: "image/webp", size: 24,
        }),
      );

      // ٥) تقرأ مشروعها الخاص
      await assertSucceeds(getDoc(doc(db, `${ROOT}/projects/p-${student.id}`)));
    });
  }
});

// ====================================================================
describe("العزل: لا طالبة تصل إلى طالبة أخرى", () => {
  /** تُهيَّأ كل الأجهزة مرة واحدة بتجاوز القواعد — التهيئة ليست موضع الاختبار. */
  async function seedDevices() {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      for (const [index, student] of STUDENTS.entries()) {
        await setDoc(
          doc(db, `${ROOT}/users/${deviceOf(index)}`),
          claim(student.code, student.id, student.name),
        );
      }
    });
  }

  it("كل طالبة تُرفض على ملفات السبع الأخريات (٥٦ محاولة)", async () => {
    await seedDevices();
    for (const [i, mine] of STUDENTS.entries()) {
      const db = as(deviceOf(i));
      for (const [j, other] of STUDENTS.entries()) {
        if (i === j) continue;
        // تعديل ملف زميلتها
        await assertFails(
          updateDoc(doc(db, `${ROOT}/students/${other.id}`), { name: "اسم مزيّف" }),
        );
        // إضافة مشروع باسم زميلتها
        await assertFails(
          setDoc(doc(db, `${ROOT}/projects/forged-${i}-${j}`), {
            studentId: other.id, subjectId: SUBJECT, title: "دخيل",
            visibility: "public", media: [], links: [], order: 0, archived: false,
          }),
        );
        // قراءة مشروع زميلتها الخاص
        await assertFails(getDoc(doc(db, `${ROOT}/projects/p-${other.id}`)));
      }
      // ولا تحذف ملف أي زميلة
      await assertFails(deleteDoc(doc(db, `${ROOT}/students/${STUDENTS[(i + 1) % 8].id}`)));
      void mine;
    }
  });

  it("تغيير معرّف الطالبة في المطالبة لا يمنح شيئًا", async () => {
    const uid = "attacker1";
    const db = as(uid);
    // رابط نادين لكن بمعرّف ريتاج
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/${uid}`), claim(STUDENTS[0].code, STUDENTS[1].id, "نادين")),
    );
    // رابط نادين مع طالبتين
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/${uid}`), {
        ...claim(STUDENTS[0].code, STUDENTS[0].id, "نادين"),
        studentIds: [STUDENTS[0].id, STUDENTS[1].id],
      }),
    );
    // رمز غير موجود
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/${uid}`), claim("no-such-code", STUDENTS[0].id, "نادين")),
    );
    // بلا رمز أصلًا
    await assertFails(
      setDoc(doc(db, `${ROOT}/users/${uid}`), {
        role: "parent", name: "دخيلة", email: "", active: true,
        studentIds: [STUDENTS[0].id], createdAt: "2026-09-17T00:00:00.000Z",
      }),
    );
  });

  it("لا أحد يعدّد الروابط ولا ينشئها إلا المشرفة", async () => {
    await seedDevices();
    await assertFails(getDocs(collection(guest(), `${ROOT}/studentLinks`)));
    await assertFails(getDocs(collection(as(deviceOf(0)), `${ROOT}/studentLinks`)));
    await assertFails(getDocs(collection(as("mathTeacher"), `${ROOT}/studentLinks`)));
    await assertSucceeds(getDocs(collection(as("admin1"), `${ROOT}/studentLinks`)));

    await assertFails(
      setDoc(doc(as(deviceOf(0)), `${ROOT}/studentLinks/forged`), {
        studentId: STUDENTS[1].id, studentName: "ريتاج", active: true,
      }),
    );
  });
});

// ====================================================================
describe("تجاوز الصلاحيات: لا ترقية ولا تقييم ولا لوحة إدارة", () => {
  async function seedOne() {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), `${ROOT}/users/${deviceOf(0)}`),
        claim(STUDENTS[0].code, STUDENTS[0].id, STUDENTS[0].name),
      );
    });
  }

  it("لا ترقّي نفسها مشرفة ولا معلمة", async () => {
    await seedOne();
    const db = as(deviceOf(0));
    await assertFails(updateDoc(doc(db, `${ROOT}/users/${deviceOf(0)}`), { role: "admin" }));
    await assertFails(updateDoc(doc(db, `${ROOT}/users/${deviceOf(0)}`), { role: "teacher" }));
    await assertFails(
      updateDoc(doc(db, `${ROOT}/users/${deviceOf(0)}`), { studentIds: [STUDENTS[1].id] }),
    );
    // ولا توسّع رابطها ليشمل طالبة أخرى
    await assertFails(
      updateDoc(doc(db, `${ROOT}/studentLinks/${STUDENTS[0].code}`), { studentId: STUDENTS[1].id }),
    );
  });

  it("لا تكتب ولا تعدّل تقييم معلمة — حتى على ملفها هي", async () => {
    await seedOne();
    const db = as(deviceOf(0));
    await assertFails(
      updateDoc(doc(db, `${ROOT}/evaluations/e-${STUDENTS[0].id}`), { stars: 5, comment: "ممتاز" }),
    );
    await assertFails(
      setDoc(doc(db, `${ROOT}/evaluations/new-fake`), {
        projectId: `p-${STUDENTS[0].id}`, studentId: STUDENTS[0].id, subjectId: SUBJECT,
        teacherId: "t-math", teacherName: "سميرة", stars: 5, badge: true,
        comment: "قيّمت نفسي", status: "excellent",
      }),
    );
    await assertFails(deleteDoc(doc(db, `${ROOT}/evaluations/e-${STUDENTS[0].id}`)));
  });

  it("لا تصل إلى بيانات الإدارة ولا إلى ملفات المستخدمات", async () => {
    await seedOne();
    const db = as(deviceOf(0));
    await assertFails(getDoc(doc(db, `${ROOT}/users/admin1`)));
    await assertFails(getDoc(doc(db, `${ROOT}/users/mathTeacher`)));
    await assertFails(getDocs(collection(db, `${ROOT}/users`)));
    await assertFails(getDocs(collection(db, `${ROOT}/activityLogs`)));
    await assertFails(getDocs(collection(db, `${ROOT}/invites`)));
    // ولا تغيّر إعدادات المنصة
    await assertFails(updateDoc(doc(db, `${ROOT}/settings/app`), { platformName: "مُخترَق" }));
    // ولا تُنشئ مادة أو معلمة
    await assertFails(setDoc(doc(db, `${ROOT}/subjects/x`), { name: "x", order: 0 }));
    await assertFails(setDoc(doc(db, `${ROOT}/teachers/x`), { name: "x", order: 0 }));
  });

  it("لا تتجاوز حدود رفع الصور: نوع مرفوض أو حجم مبالغ فيه", async () => {
    await seedOne();
    const db = as(deviceOf(0));
    // نوع غير مسموح
    await assertFails(
      setDoc(doc(db, `${ROOT}/media/bad1`), {
        ownerUid: deviceOf(0), studentId: STUDENTS[0].id,
        data: "data:application/pdf;base64,AAAA", mime: "application/pdf", size: 10,
      }),
    );
    // حجم يتجاوز الحد
    await assertFails(
      setDoc(doc(db, `${ROOT}/media/bad2`), {
        ownerUid: deviceOf(0), studentId: STUDENTS[0].id,
        data: "x".repeat(970000), mime: "image/webp", size: 970000,
      }),
    );
    // انتحال مالك آخر
    await assertFails(
      setDoc(doc(db, `${ROOT}/media/bad3`), {
        ownerUid: deviceOf(1), studentId: STUDENTS[0].id,
        data: "data:image/webp;base64,UklGRg==", mime: "image/webp", size: 24,
      }),
    );
  });

  it("إلغاء الرابط يقطع الصلاحية فورًا", async () => {
    await seedOne();
    const db = as(deviceOf(0));
    await assertSucceeds(
      updateDoc(doc(db, `${ROOT}/students/${STUDENTS[0].id}`), { bio: "قبل الإلغاء" }),
    );

    await assertSucceeds(
      deleteDoc(doc(as("admin1"), `${ROOT}/studentLinks/${STUDENTS[0].code}`)),
    );

    await assertFails(
      updateDoc(doc(db, `${ROOT}/students/${STUDENTS[0].id}`), { bio: "بعد الإلغاء" }),
    );
    await assertFails(getDoc(doc(db, `${ROOT}/projects/p-${STUDENTS[0].id}`)));
  });
});
