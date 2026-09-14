import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

let testEnv: RulesTestEnvironment;

const FAMILY1_UID = "family-nadeen";
const FAMILY2_UID = "family-retaj";
const TEACHER_LUGHATI_UID = "teacher-dalal";
const TEACHER_RIYADIYAT_UID = "teacher-samira";
const STUDENT1_ID = "nadeen";
const STUDENT2_ID = "retaj";

async function seedFixture() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.collection("users").doc(FAMILY1_UID).set({ role: "family", studentId: STUDENT1_ID, displayName: "نادين" });
    await db.collection("users").doc(FAMILY2_UID).set({ role: "family", studentId: STUDENT2_ID, displayName: "ريتاج" });
    await db.collection("users").doc(TEACHER_LUGHATI_UID).set({ role: "teacher", subject: "lughati", displayName: "دلال" });
    await db.collection("users").doc(TEACHER_RIYADIYAT_UID).set({ role: "teacher", subject: "riyadiyat", displayName: "سميرة" });

    for (const [studentId, familyUid, name] of [
      [STUDENT1_ID, FAMILY1_UID, "نادين الشمراني"],
      [STUDENT2_ID, FAMILY2_UID, "ريتاج العواجي"],
    ] as const) {
      await db.collection("students").doc(studentId).set({
        name,
        nickname: name,
        color: "#e0568c",
        photoUrl: null,
        bio: "",
        interests: "",
        familyUid,
        createdAt: 1,
        updatedAt: 1,
      });
    }

    await db.collection("students").doc(STUDENT1_ID).collection("items").doc("item1").set({
      section: "lughati",
      kind: "link",
      url: "https://example.com/story",
      title: "قصتي",
      createdAt: 1,
      rating: null,
      seen: true,
    });
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-khatawati-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedFixture();
});

describe("students - عزل العائلات عن بعض", () => {
  it("العائلة تقرأ ملف طالبتها هي", async () => {
    const db = testEnv.authenticatedContext(FAMILY1_UID).firestore();
    await assertSucceeds(db.collection("students").doc(STUDENT1_ID).get());
  });

  it("العائلة لا تقرأ ملف طالبة أخرى", async () => {
    const db = testEnv.authenticatedContext(FAMILY1_UID).firestore();
    await assertFails(db.collection("students").doc(STUDENT2_ID).get());
  });

  it("زائر بلا تسجيل دخول لا يقرأ أي شي", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection("students").doc(STUDENT1_ID).get());
  });

  it("المعلمة (أي مادة) تقرأ كل الطالبات", async () => {
    const dbL = testEnv.authenticatedContext(TEACHER_LUGHATI_UID).firestore();
    const dbR = testEnv.authenticatedContext(TEACHER_RIYADIYAT_UID).firestore();
    await assertSucceeds(dbL.collection("students").doc(STUDENT2_ID).get());
    await assertSucceeds(dbR.collection("students").doc(STUDENT1_ID).get());
  });

  it("العائلة تعدّل الحقول الشخصية المسموحة فقط", async () => {
    const db = testEnv.authenticatedContext(FAMILY1_UID).firestore();
    await assertSucceeds(
      db.collection("students").doc(STUDENT1_ID).set(
        {
          name: "نادين الشمراني",
          nickname: "نونو",
          color: "#2e9bd6",
          photoUrl: null,
          bio: "أحب القراءة",
          interests: "الرسم",
          familyUid: FAMILY1_UID,
          createdAt: 1,
          updatedAt: 2,
        },
        { merge: false }
      )
    );
  });

  it("العائلة لا تقدر تغيّر اسمها الحقيقي", async () => {
    const db = testEnv.authenticatedContext(FAMILY1_UID).firestore();
    await assertFails(
      db.collection("students").doc(STUDENT1_ID).set(
        {
          name: "اسم مزوّر",
          nickname: "نونو",
          color: "#2e9bd6",
          photoUrl: null,
          bio: "",
          interests: "",
          familyUid: FAMILY1_UID,
          createdAt: 1,
          updatedAt: 2,
        },
        { merge: false }
      )
    );
  });

  it("عائلة أخرى لا تقدر تعدّل ملف ليس لها", async () => {
    const db = testEnv.authenticatedContext(FAMILY2_UID).firestore();
    await assertFails(
      db.collection("students").doc(STUDENT1_ID).set(
        {
          name: "نادين الشمراني",
          nickname: "مخترقة",
          color: "#2e9bd6",
          photoUrl: null,
          bio: "",
          interests: "",
          familyUid: FAMILY1_UID,
          createdAt: 1,
          updatedAt: 2,
        },
        { merge: false }
      )
    );
  });
});

describe("items - إضافة/حذف من العائلة، تقييم من المعلمة فقط", () => {
  it("العائلة تضيف عمل في ملف طالبتها", async () => {
    const db = testEnv.authenticatedContext(FAMILY1_UID).firestore();
    await assertSucceeds(
      db.collection("students").doc(STUDENT1_ID).collection("items").doc("new1").set({
        section: "lughati",
        kind: "link",
        url: "https://example.com/x",
        title: "عمل جديد",
        createdAt: 2,
        rating: null,
        seen: true,
      })
    );
  });

  it("عائلة أخرى لا تضيف عمل في ملف ليس ملفها", async () => {
    const db = testEnv.authenticatedContext(FAMILY2_UID).firestore();
    await assertFails(
      db.collection("students").doc(STUDENT1_ID).collection("items").doc("hack1").set({
        section: "lughati",
        kind: "link",
        url: "https://example.com/x",
        title: "اختراق",
        createdAt: 2,
        rating: null,
        seen: true,
      })
    );
  });

  it("العائلة تحذف عمل طالبتها", async () => {
    const db = testEnv.authenticatedContext(FAMILY1_UID).firestore();
    await assertSucceeds(db.collection("students").doc(STUDENT1_ID).collection("items").doc("item1").delete());
  });

  it("عائلة أخرى لا تحذف عمل ليس لها", async () => {
    const db = testEnv.authenticatedContext(FAMILY2_UID).firestore();
    await assertFails(db.collection("students").doc(STUDENT1_ID).collection("items").doc("item1").delete());
  });

  it("معلمة لغتي تقيّم عمل قسم لغتي", async () => {
    const db = testEnv.authenticatedContext(TEACHER_LUGHATI_UID).firestore();
    await assertSucceeds(
      db.collection("students").doc(STUDENT1_ID).collection("items").doc("item1").update({
        rating: {
          stars: 5,
          comment: "ممتازة",
          ratedByUid: TEACHER_LUGHATI_UID,
          ratedBySubject: "lughati",
          ratedAt: 3,
        },
        seen: false,
      })
    );
  });

  it("معلمة رياضيات لا تقيّم عمل قسم لغتي", async () => {
    const db = testEnv.authenticatedContext(TEACHER_RIYADIYAT_UID).firestore();
    await assertFails(
      db.collection("students").doc(STUDENT1_ID).collection("items").doc("item1").update({
        rating: {
          stars: 5,
          comment: "محاولة تقييم خارج المادة",
          ratedByUid: TEACHER_RIYADIYAT_UID,
          ratedBySubject: "riyadiyat",
          ratedAt: 3,
        },
        seen: false,
      })
    );
  });

  it("معلمة لا تقدر تنتحل هوية معلمة أخرى بالتقييم (ratedByUid لازم يطابق المسجّل دخوله)", async () => {
    const db = testEnv.authenticatedContext(TEACHER_LUGHATI_UID).firestore();
    await assertFails(
      db.collection("students").doc(STUDENT1_ID).collection("items").doc("item1").update({
        rating: {
          stars: 5,
          comment: "انتحال",
          ratedByUid: "someone-else",
          ratedBySubject: "lughati",
          ratedAt: 3,
        },
        seen: false,
      })
    );
  });

  it("نجوم خارج المدى المسموح (0-5) تُرفَض", async () => {
    const db = testEnv.authenticatedContext(TEACHER_LUGHATI_UID).firestore();
    await assertFails(
      db.collection("students").doc(STUDENT1_ID).collection("items").doc("item1").update({
        rating: {
          stars: 8,
          comment: "",
          ratedByUid: TEACHER_LUGHATI_UID,
          ratedBySubject: "lughati",
          ratedAt: 3,
        },
        seen: false,
      })
    );
  });

  it("المعلمة لا تضيف عمل جديد (إضافة الأعمال للعائلة فقط)", async () => {
    const db = testEnv.authenticatedContext(TEACHER_LUGHATI_UID).firestore();
    await assertFails(
      db.collection("students").doc(STUDENT1_ID).collection("items").doc("teacher-added").set({
        section: "lughati",
        kind: "link",
        url: "https://example.com/x",
        title: "من المعلمة",
        createdAt: 2,
        rating: null,
        seen: true,
      })
    );
  });

  it("العائلة تعلّم عنصرًا كمقروء (seen) بلا لمس التقييم", async () => {
    const db = testEnv.authenticatedContext(FAMILY1_UID).firestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("students").doc(STUDENT1_ID).collection("items").doc("item1").update({
        rating: { stars: 5, comment: "جيدة", ratedByUid: TEACHER_LUGHATI_UID, ratedBySubject: "lughati", ratedAt: 3 },
        seen: false,
      });
    });
    await assertSucceeds(
      db.collection("students").doc(STUDENT1_ID).collection("items").doc("item1").update({ seen: true })
    );
  });

  it("العائلة لا تقدر تلمس التقييم نفسه عبر تحديث 'seen'", async () => {
    const db = testEnv.authenticatedContext(FAMILY1_UID).firestore();
    await assertFails(
      db
        .collection("students")
        .doc(STUDENT1_ID)
        .collection("items")
        .doc("item1")
        .update({ seen: true, rating: { stars: 5, comment: "مزوّر", ratedByUid: FAMILY1_UID, ratedBySubject: "lughati", ratedAt: 9 } })
    );
  });
});
