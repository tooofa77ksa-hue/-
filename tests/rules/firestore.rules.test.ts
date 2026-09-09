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
