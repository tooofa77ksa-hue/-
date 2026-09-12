/**
 * اختبارات آلية لقواعد أمان Firestore (firestore.rules) على Firebase Local
 * Emulator Suite - لا تحتاج مشروع Firebase حقيقي ولا أي Secret.
 *
 * التشغيل: npm run test:rules
 * (يشغّل firebase emulators:exec الذي يرفع المحاكيات، يضبط متغيرات
 * FIRESTORE_EMULATOR_HOST/FIREBASE_AUTH_EMULATOR_HOST تلقائيًا، يشغّل هذا
 * الملف عبر vitest، ثم يطفئ المحاكيات - بدون أي بيانات حقيقية أو دائمة).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

const PROJECT_ID = "demo-shualat-lughati";

function emulatorHostPort(envVar: string, fallbackPort: number) {
  const raw = process.env[envVar];
  if (!raw) return { host: "127.0.0.1", port: fallbackPort };
  const [host, port] = raw.split(":");
  return { host, port: Number(port) };
}

const PUBLISHED_QUESTION = {
  questionSetId: "set-1",
  skill: "synonym",
  question: "ما مرادف كلمة (سعيد)؟",
  choices: ["فرِح", "حزين", "غاضب", "خائف"],
  correctAnswer: 0,
  difficulty: "easy",
  gameMode: "rocket_mission",
  published: true,
  active: true,
  order: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: "seed",
};

const UNPUBLISHED_QUESTION = {
  ...PUBLISHED_QUESTION,
  published: false,
};

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const firestoreEmu = emulatorHostPort("FIRESTORE_EMULATOR_HOST", 8080);
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: firestoreEmu.host,
      port: firestoreEmu.port,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // تهيئة بيانات ثابتة قبل كل اختبار متجاوزةً القواعد (Setup فقط، لا يُختبر هنا)
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.collection("users").doc("teacher-1").set({
      email: "teacher@example.com",
      displayName: "معلمة الاختبار",
      role: "teacher",
      createdAt: Date.now(),
    });
    await db.collection("users").doc("plain-user-1").set({
      email: "student-account@example.com",
      displayName: "حساب بلا صلاحية",
      role: "guest",
      createdAt: Date.now(),
    });
    await db.collection("questions").doc("published-1").set(PUBLISHED_QUESTION);
    await db.collection("questions").doc("unpublished-1").set(UNPUBLISHED_QUESTION);
  });
});

describe("مستخدم غير مسجل (طالبة بلا حساب)", () => {
  it("لا يستطيع الكتابة على questions", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection("questions").add(PUBLISHED_QUESTION));
  });

  it("لا يستطيع قراءة سؤال غير منشور", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection("questions").doc("unpublished-1").get());
  });

  it("يستطيع قراءة سؤال منشور ومفعّل فقط", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(db.collection("questions").doc("published-1").get());
  });

  it("يستطيع تنفيذ استعلام مقيّد بـ published==true و active==true", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const snap = await assertSucceeds(
      db.collection("questions").where("published", "==", true).where("active", "==", true).get()
    );
    expect(snap.size).toBe(1);
    expect(snap.docs[0].id).toBe("published-1");
  });

  it("لا يستطيع تنفيذ استعلام غير مقيّد (يكشف كل الأسئلة)", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection("questions").get());
  });
});

describe("معلمة مصرَّح لها (role: teacher)", () => {
  it("تستطيع إضافة سؤال صالح", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertSucceeds(
      db.collection("questions").add({ ...PUBLISHED_QUESTION, published: false })
    );
  });

  it("تستطيع تعديل سؤال موجود بشكل صحيح", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertSucceeds(
      db.collection("questions").doc("published-1").update({ question: "سؤال مُعدَّل" })
    );
  });

  it("لا تستطيع حفظ سؤال بعدد اختيارات غير صحيح (3 بدل 4)", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertFails(
      db.collection("questions").add({
        ...PUBLISHED_QUESTION,
        choices: ["أ", "ب", "ج"],
      })
    );
  });

  it("لا تستطيع تعديل سؤال ليصبح بعدد اختيارات غير صحيح", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertFails(
      db.collection("questions").doc("published-1").update({ choices: ["أ", "ب", "ج"] })
    );
  });

  it("لا تستطيع حفظ correctAnswer خارج المدى (create)", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertFails(
      db.collection("questions").add({ ...PUBLISHED_QUESTION, correctAnswer: 5 })
    );
  });

  it("لا تستطيع تعديل correctAnswer إلى قيمة خارج المدى (update)", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertFails(
      db.collection("questions").doc("published-1").update({ correctAnswer: 9 })
    );
  });

  it("تستطيع حذف سؤال", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertSucceeds(db.collection("questions").doc("published-1").delete());
  });

  it("تستطيع قراءة سؤال غير منشور (للمراجعة قبل النشر)", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertSucceeds(db.collection("questions").doc("unpublished-1").get());
  });
});

describe("مستخدم مسجَّل دخول لكنه ليس معلمة (role != teacher/admin)", () => {
  it("لا يستطيع إضافة سؤال", async () => {
    const db = testEnv.authenticatedContext("plain-user-1").firestore();
    await assertFails(db.collection("questions").add(PUBLISHED_QUESTION));
  });

  it("لا يستطيع تعديل سؤال", async () => {
    const db = testEnv.authenticatedContext("plain-user-1").firestore();
    await assertFails(
      db.collection("questions").doc("published-1").update({ question: "تعديل غير مصرَّح" })
    );
  });

  it("لا يستطيع حذف سؤال", async () => {
    const db = testEnv.authenticatedContext("plain-user-1").firestore();
    await assertFails(db.collection("questions").doc("published-1").delete());
  });

  it("لا يستطيع قراءة سؤال غير منشور", async () => {
    const db = testEnv.authenticatedContext("plain-user-1").firestore();
    await assertFails(db.collection("questions").doc("unpublished-1").get());
  });

  it("لا يستطيع منح نفسه صلاحية teacher عبر الكتابة على users", async () => {
    const db = testEnv.authenticatedContext("plain-user-1").firestore();
    await assertFails(db.collection("users").doc("plain-user-1").set({ role: "admin" }));
  });
});

// ------------------------------------------------------------------
// استثناء bootstrap ضيّق جدًا لحساب المعلمة الوحيد المعروف بريده مسبقًا:
// dalal@teacher.shualat-lughati.internal. يجب ألا يعمل لأي بريد آخر ولا
// لأي دور غير "teacher"، ويجب ألا يعمل إلا مرة واحدة (create وليس update).
// ------------------------------------------------------------------
const BOOTSTRAP_EMAIL = "dalal@teacher.shualat-lughati.internal";

describe("استثناء bootstrap لحساب المعلمة المعروف فقط (users/{uid})", () => {
  it("الحساب صاحب البريد الداخلي المحدَّد يستطيع إنشاء مستند دوره الخاص بـ role=teacher لأول مرة", async () => {
    const db = testEnv
      .authenticatedContext("dalal-uid", { email: BOOTSTRAP_EMAIL })
      .firestore();
    await assertSucceeds(
      db.collection("users").doc("dalal-uid").set({
        email: BOOTSTRAP_EMAIL,
        displayName: "دلال",
        role: "teacher",
        createdAt: Date.now(),
      })
    );
  });

  it("نفس الحساب لا يستطيع تعديل الدور لاحقًا بعد إنشاء المستند مرة واحدة", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("users").doc("dalal-uid").set({
        email: BOOTSTRAP_EMAIL,
        role: "teacher",
        createdAt: Date.now(),
      });
    });
    const db = testEnv
      .authenticatedContext("dalal-uid", { email: BOOTSTRAP_EMAIL })
      .firestore();
    await assertFails(db.collection("users").doc("dalal-uid").update({ role: "admin" }));
  });

  it("لا يستطيع إنشاء المستند بدور غير teacher حتى لو كان بريده مطابقًا", async () => {
    const db = testEnv
      .authenticatedContext("dalal-uid", { email: BOOTSTRAP_EMAIL })
      .firestore();
    await assertFails(
      db.collection("users").doc("dalal-uid").set({ email: BOOTSTRAP_EMAIL, role: "admin" })
    );
  });

  it("لا يستطيع أي حساب آخر (بريد مختلف) استخدام هذا الاستثناء إطلاقًا", async () => {
    const db = testEnv
      .authenticatedContext("someone-else-uid", { email: "someone-else@example.com" })
      .firestore();
    await assertFails(
      db.collection("users").doc("someone-else-uid").set({
        email: "someone-else@example.com",
        role: "teacher",
      })
    );
  });

  it("لا يستطيع حتى الحساب المطابق كتابة هذا الدور لحساب مستخدم آخر (uid مختلف)", async () => {
    const db = testEnv
      .authenticatedContext("dalal-uid", { email: BOOTSTRAP_EMAIL })
      .firestore();
    await assertFails(
      db.collection("users").doc("someone-else-uid").set({ email: BOOTSTRAP_EMAIL, role: "teacher" })
    );
  });
});

// ------------------------------------------------------------------
// students / groups / testSessions / attempts
// ------------------------------------------------------------------
const STUDENT_1 = {
  name: "طالبة الاختبار الأولى",
  groupId: "group-1",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: "teacher-1",
};

const GROUP_1 = {
  name: "مجموعة الاختبار",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: "teacher-1",
};

const ACTIVE_SESSION = {
  type: "individual",
  participants: [{ studentId: "student-1", name: "طالبة الاختبار الأولى" }],
  participantIds: ["student-1"],
  questionIds: ["published-1"],
  gameMode: "rocket_mission",
  active: true,
  createdAt: Date.now(),
  createdBy: "teacher-1",
};

const INACTIVE_SESSION = { ...ACTIVE_SESSION, active: false };

function validAttempt(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: "session-active",
    studentId: "student-1",
    studentNameSnapshot: "طالبة الاختبار الأولى",
    startedAt: Date.now(),
    completedAt: Date.now(),
    durationMs: 1000,
    gameMode: "rocket_mission",
    totalQuestions: 1,
    correctCount: 1,
    incorrectCount: 0,
    scorePercentage: 100,
    answers: [
      {
        questionId: "published-1",
        questionTextSnapshot: "ما مرادف كلمة (سعيد)؟",
        choicesSnapshot: ["فرِح", "حزين", "غاضب", "خائف"],
        studentAnswer: 0,
        correctAnswerSnapshot: 0,
        isCorrect: true,
        answeredAt: Date.now(),
      },
    ],
    createdAt: Date.now(),
    ...overrides,
  };
}

/** معرّف المحاولة الحتمي الذي تفرضه قواعد الأمان الآن - راجعي
 * attemptDocId في src/lib/repo.ts (نفس الصيغة بالضبط). */
function attemptDocId(a: { sessionId?: unknown; studentId?: unknown }) {
  return `${a.sessionId ?? "session-active"}_${a.studentId ?? "student-1"}`;
}

describe("الطالبات (students) والمجموعات (groups)", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection("students").doc("student-1").set(STUDENT_1);
      await db.collection("groups").doc("group-1").set(GROUP_1);
    });
  });

  it("معلمة تستطيع إضافة طالبة", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertSucceeds(db.collection("students").add(STUDENT_1));
  });

  it("معلمة تستطيع قراءة/تعديل/حذف طالبة", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertSucceeds(db.collection("students").doc("student-1").get());
    await assertSucceeds(db.collection("students").doc("student-1").update({ name: "اسم مُعدَّل" }));
    await assertSucceeds(db.collection("students").doc("student-1").delete());
  });

  it("معلمة تستطيع إدارة المجموعات بالكامل", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertSucceeds(db.collection("groups").add(GROUP_1));
    await assertSucceeds(db.collection("groups").doc("group-1").update({ name: "اسم جديد" }));
    await assertSucceeds(db.collection("groups").doc("group-1").delete());
  });

  it("مستخدم غير مسجّل لا يستطيع قراءة الطالبات أو المجموعات", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection("students").doc("student-1").get());
    await assertFails(db.collection("students").get());
    await assertFails(db.collection("groups").doc("group-1").get());
  });

  it("مستخدم مسجَّل بلا صلاحية معلمة لا يستطيع قراءة أو كتابة الطالبات/المجموعات", async () => {
    const db = testEnv.authenticatedContext("plain-user-1").firestore();
    await assertFails(db.collection("students").doc("student-1").get());
    await assertFails(db.collection("students").add(STUDENT_1));
    await assertFails(db.collection("groups").doc("group-1").get());
    await assertFails(db.collection("groups").add(GROUP_1));
  });
});

describe("جلسات الاختبار (testSessions)", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection("testSessions").doc("session-active").set(ACTIVE_SESSION);
      await db.collection("testSessions").doc("session-inactive").set(INACTIVE_SESSION);
    });
  });

  it("أي طرف (حتى بلا تسجيل دخول) يستطيع فتح جلسة عبر معرّفها المباشر (get)", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(db.collection("testSessions").doc("session-active").get());
  });

  it("لا يستطيع أي طرف غير المعلمة تعداد كل الجلسات (list/query)", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection("testSessions").get());
  });

  it("المعلمة تستطيع تعداد الجلسات وإنشاءها وتعديلها وحذفها", async () => {
    const db = testEnv.authenticatedContext("teacher-1").firestore();
    await assertSucceeds(db.collection("testSessions").get());
    await assertSucceeds(db.collection("testSessions").add(ACTIVE_SESSION));
    await assertSucceeds(db.collection("testSessions").doc("session-active").update({ active: false }));
    await assertSucceeds(db.collection("testSessions").doc("session-active").delete());
  });

  it("مستخدم غير معلمة لا يستطيع إنشاء أو تعديل جلسة", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection("testSessions").add(ACTIVE_SESSION));
    await assertFails(db.collection("testSessions").doc("session-active").update({ active: false }));
  });
});

describe("نتائج الاختبارات (attempts)", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection("testSessions").doc("session-active").set(ACTIVE_SESSION);
      await db.collection("testSessions").doc("session-inactive").set(INACTIVE_SESSION);
    });
  });

  it("طالبة مشارِكة في جلسة نشطة تستطيع حفظ محاولة صالحة بلا تسجيل دخول", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const a = validAttempt();
    await assertSucceeds(db.collection("attempts").doc(attemptDocId(a)).set(a));
  });

  it("لا يمكن حفظ محاولة لجلسة غير موجودة", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const a = validAttempt({ sessionId: "no-such-session" });
    await assertFails(db.collection("attempts").doc(attemptDocId(a)).set(a));
  });

  it("لا يمكن حفظ محاولة لجلسة غير نشطة (active == false)", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const a = validAttempt({ sessionId: "session-inactive" });
    await assertFails(db.collection("attempts").doc(attemptDocId(a)).set(a));
  });

  it("لا يمكن انتحال محاولة باسم طالبة ليست ضمن مشاركي الجلسة", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const a = validAttempt({ studentId: "someone-else" });
    await assertFails(db.collection("attempts").doc(attemptDocId(a)).set(a));
  });

  it("لا يمكن حفظ محاولة بشكل بيانات غير صالح (totalQuestions ليس رقمًا)", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const a = validAttempt({ totalQuestions: "واحد" as unknown as number });
    await assertFails(db.collection("attempts").doc(attemptDocId(a)).set(a));
  });

  it("لا يمكن حفظ محاولة بـstudentNameSnapshot فارغ", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const a = validAttempt({ studentNameSnapshot: "" });
    await assertFails(db.collection("attempts").doc(attemptDocId(a)).set(a));
  });

  it("لا يمكن تلفيق scorePercentage لا يطابق correctCount/totalQuestions فعليًا", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const a = validAttempt({ correctCount: 0, incorrectCount: 1, scorePercentage: 100 });
    await assertFails(db.collection("attempts").doc(attemptDocId(a)).set(a));
  });

  it("لا يمكن ادّعاء عدد أسئلة أكبر من أسئلة الجلسة الفعلية", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const a = validAttempt({
      totalQuestions: 5,
      correctCount: 5,
      incorrectCount: 0,
      answers: Array(5).fill(validAttempt().answers[0]),
    });
    await assertFails(db.collection("attempts").doc(attemptDocId(a)).set(a));
  });

  it("لا يمكن إرسال محاولة ثانية لنفس الطالبة في نفس الجلسة (إغراق/تكرار)", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const a = validAttempt();
    await assertSucceeds(db.collection("attempts").doc(attemptDocId(a)).set(a));
    await assertFails(db.collection("attempts").doc(attemptDocId(a)).set(a));
  });

  it("لا يستطيع أي طرف غير المعلمة قراءة النتائج (get أو list)", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("attempts").doc("attempt-1").set(validAttempt());
    });
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection("attempts").doc("attempt-1").get());
    await assertFails(db.collection("attempts").get());
  });

  it("المعلمة تستطيع قراءة النتائج وحذفها، ولا يمكن لغيرها ذلك", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("attempts").doc("attempt-1").set(validAttempt());
    });
    const teacherDb = testEnv.authenticatedContext("teacher-1").firestore();
    await assertSucceeds(teacherDb.collection("attempts").doc("attempt-1").get());
    await assertSucceeds(teacherDb.collection("attempts").doc("attempt-1").delete());
  });
});
