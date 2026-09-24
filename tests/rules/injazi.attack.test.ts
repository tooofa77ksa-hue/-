/*
  فحص ثغرات — محاولات اختراق حقيقية على القواعد المنشورة.
  ==================================================================
  السؤال الذي يجيب عنه هذا الملف: هل يستطيع أحد أن يضيف أو يعدّل أو
  يحذف شيئًا في المنصة بلا كلمة مرور ولا رابط صالح؟

  يُشغَّل على firestore.injazi.rules — الملف المنشور فعلًا على مشروع
  الإنتاج، لا على firestore.rules المشترك. اختبار الملف الخطأ يعطي
  طمأنينة كاذبة.

  التشغيل:
    IZ_RULES_FILE=firestore.injazi.rules npx vitest run tests/rules/injazi.attack.test.ts
*/
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

const RULES_FILE = process.env.IZ_RULES_FILE || "firestore.injazi.rules";
const ROOT = "apps/injazi";
let env: RulesTestEnvironment;

function hostPort(envVar: string, fallback: number) {
  const raw = process.env[envVar];
  if (!raw) return { host: "127.0.0.1", port: fallback };
  const [host, port] = raw.split(":");
  return { host, port: Number(port) };
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-injazi-attack",
    firestore: { ...hostPort("FIRESTORE_EMULATOR_HOST", 8080), rules: readFileSync(RULES_FILE, "utf8") },
  });
});

afterAll(async () => env?.cleanup());

/* ------------------------------------------------------------------
   بذرة ثابتة: مشرفة، معلمتان لمادتين، طالبتان ورابطاهما، مشروع
   وتقييم لكل معلمة.
------------------------------------------------------------------ */
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const put = (path: string, data: unknown) => setDoc(doc(db, path), data as never);

    // صلاحيات
    await put(`${ROOT}/users/admin-uid`, { role: "admin", active: true, name: "المشرفة" });
    await put(`${ROOT}/invites/INVITE-A`, { active: true, teacherId: "t-a", teacherName: "أ. أ", subjectIds: ["sub-a"] });
    await put(`${ROOT}/invites/INVITE-B`, { active: true, teacherId: "t-b", teacherName: "أ. ب", subjectIds: ["sub-b"] });
    await put(`${ROOT}/users/teacherA-uid`, {
      role: "teacher", name: "أ. أ", active: true, inviteCode: "INVITE-A", teacherId: "t-a", subjectIds: ["sub-a"],
    });
    await put(`${ROOT}/users/teacherB-uid`, {
      role: "teacher", name: "أ. ب", active: true, inviteCode: "INVITE-B", teacherId: "t-b", subjectIds: ["sub-b"],
    });
    await put(`${ROOT}/studentLinks/LINK-1`, { active: true, studentId: "st-1" });
    await put(`${ROOT}/studentLinks/LINK-2`, { active: true, studentId: "st-2" });
    await put(`${ROOT}/users/parent1-uid`, {
      role: "parent", name: "طالبة ١", active: true, linkCode: "LINK-1", studentIds: ["st-1"],
    });

    // بيانات
    await put(`${ROOT}/students/st-1`, { name: "طالبة ١", order: 1, active: true });
    await put(`${ROOT}/students/st-2`, { name: "طالبة ٢", order: 2, active: true });
    await put(`${ROOT}/subjects/sub-a`, { name: "مادة أ", teacherId: "t-a" });
    await put(`${ROOT}/subjects/sub-b`, { name: "مادة ب", teacherId: "t-b" });
    await put(`${ROOT}/projects/p-1`, { studentId: "st-1", subjectId: "sub-b", title: "مشروع", visibility: "public" });
    await put(`${ROOT}/achievements/a-1`, { studentId: "st-1", title: "إنجاز", visibility: "public" });
    // تقييم المعلمة ب على مادتها
    await put(`${ROOT}/evaluations/ev-b`, {
      projectId: "p-1", studentId: "st-1", subjectId: "sub-b", teacherId: "t-b",
      stars: 5, badge: true, status: "excellent", comment: "تقييم المعلمة ب",
    });
    await put(`${ROOT}/media/m-1`, { ownerUid: "parent1-uid", studentId: "st-1", data: "xx", mime: "image/webp" });
    await put(`${ROOT}/activityLogs/log-1`, { kind: "x", message: "حدث", actorName: "المشرفة", actorRole: "admin", at: 1 });
    await put(`${ROOT}/settings/main`, { platformName: "إنجازي يحكي" });
  });
});

const anon = () => env.unauthenticatedContext().firestore();
const signedNoProfile = () => env.authenticatedContext("ghost-uid").firestore();
const admin = () => env.authenticatedContext("admin-uid").firestore();
const teacherA = () => env.authenticatedContext("teacherA-uid").firestore();
const teacherB = () => env.authenticatedContext("teacherB-uid").firestore();
const parent1 = () => env.authenticatedContext("parent1-uid").firestore();

/* ==================================================================
   ١ — زائر بلا تسجيل دخول: يقرأ ولا يكتب شيئًا إطلاقًا
================================================================== */
describe("زائر بلا تسجيل دخول", () => {
  it("يقرأ اللوحة العامة", async () => {
    await assertSucceeds(getDocs(collection(anon(), `${ROOT}/students`)));
    await assertSucceeds(getDoc(doc(anon(), `${ROOT}/projects/p-1`)));
  });

  it("لا يضيف مشروعًا", async () => {
    await assertFails(setDoc(doc(anon(), `${ROOT}/projects/hack`), { studentId: "st-1", title: "اختراق" }));
  });

  it("لا يعدّل مشروعًا", async () => {
    await assertFails(updateDoc(doc(anon(), `${ROOT}/projects/p-1`), { title: "مُخترَق" }));
  });

  it("لا يحذف مشروعًا", async () => {
    await assertFails(deleteDoc(doc(anon(), `${ROOT}/projects/p-1`)));
  });

  it("لا يحذف طالبة", async () => {
    await assertFails(deleteDoc(doc(anon(), `${ROOT}/students/st-1`)));
  });

  it("لا يغيّر اسم طالبة", async () => {
    await assertFails(updateDoc(doc(anon(), `${ROOT}/students/st-1`), { name: "اسم مزوَّر" }));
  });

  it("لا يكتب تقييمًا", async () => {
    await assertFails(setDoc(doc(anon(), `${ROOT}/evaluations/hack`), {
      projectId: "p-1", studentId: "st-1", subjectId: "sub-a", teacherId: "t-a",
      stars: 1, badge: false, status: "complete",
    }));
  });

  it("لا يحذف تقييمًا", async () => {
    await assertFails(deleteDoc(doc(anon(), `${ROOT}/evaluations/ev-b`)));
  });

  it("لا يغيّر إعدادات المنصة", async () => {
    await assertFails(updateDoc(doc(anon(), `${ROOT}/settings/main`), { platformName: "مخترَق" }));
  });

  it("لا يقرأ سجل النشاط", async () => {
    await assertFails(getDocs(collection(anon(), `${ROOT}/activityLogs`)));
  });

  it("لا يكتب في سجل النشاط", async () => {
    await assertFails(setDoc(doc(anon(), `${ROOT}/activityLogs/forged`), {
      kind: "x", message: "كذب", actorName: "المشرفة", actorRole: "admin", at: 1,
    }));
  });

  it("لا يقرأ روابط الطالبات ولا يعدّدها", async () => {
    await assertFails(getDocs(collection(anon(), `${ROOT}/studentLinks`)));
    await assertFails(getDoc(doc(anon(), `${ROOT}/studentLinks/LINK-1`)));
  });

  it("لا يقرأ روابط المعلمات ولا يعدّدها", async () => {
    await assertFails(getDocs(collection(anon(), `${ROOT}/invites`)));
  });

  it("لا يقرأ ملفات الصلاحيات", async () => {
    await assertFails(getDoc(doc(anon(), `${ROOT}/users/admin-uid`)));
  });

  it("لا يرفع صورة", async () => {
    await assertFails(setDoc(doc(anon(), `${ROOT}/media/hack`), { ownerUid: "x", data: "y", mime: "image/webp" }));
  });

  it("لا يحذف صورة", async () => {
    await assertFails(deleteDoc(doc(anon(), `${ROOT}/media/m-1`)));
  });
});

/* ==================================================================
   ٢ — حساب مجهول بلا ملف صلاحيات (من فتح الموقع فقط)
================================================================== */
describe("حساب مجهول بلا رابط", () => {
  it("لا يرقّي نفسه إلى مشرفة", async () => {
    await assertFails(setDoc(doc(signedNoProfile(), `${ROOT}/users/ghost-uid`), { role: "admin", active: true }));
  });

  it("لا يرقّي نفسه إلى معلمة", async () => {
    await assertFails(setDoc(doc(signedNoProfile(), `${ROOT}/users/ghost-uid`), {
      role: "teacher", active: true, teacherId: "t-a", subjectIds: ["sub-a"],
    }));
  });

  it("لا يطالب برابط طالبة غير موجود", async () => {
    await assertFails(setDoc(doc(signedNoProfile(), `${ROOT}/users/ghost-uid`), {
      role: "parent", active: true, linkCode: "LINK-MADE-UP", studentIds: ["st-1"],
    }));
  });

  it("لا يمنح نفسه طالبة غير التي في الرابط", async () => {
    await assertFails(setDoc(doc(signedNoProfile(), `${ROOT}/users/ghost-uid`), {
      role: "parent", active: true, linkCode: "LINK-1", studentIds: ["st-1", "st-2"],
    }));
  });

  it("لا يمنح نفسه مواد غير التي في دعوته", async () => {
    await assertFails(setDoc(doc(signedNoProfile(), `${ROOT}/users/ghost-uid`), {
      role: "teacher", active: true, inviteCode: "INVITE-A", teacherId: "t-a", subjectIds: ["sub-a", "sub-b"],
    }));
  });

  it("لا يضيف مشروعًا ولا يعدّل ولا يحذف", async () => {
    await assertFails(setDoc(doc(signedNoProfile(), `${ROOT}/projects/hack`), { studentId: "st-1", title: "x" }));
    await assertFails(updateDoc(doc(signedNoProfile(), `${ROOT}/projects/p-1`), { title: "x" }));
    await assertFails(deleteDoc(doc(signedNoProfile(), `${ROOT}/projects/p-1`)));
  });

  it("لا يكتب في سجل النشاط", async () => {
    await assertFails(setDoc(doc(signedNoProfile(), `${ROOT}/activityLogs/forged`), {
      kind: "x", message: "كذب", actorName: "المشرفة", actorRole: "admin", at: 1,
    }));
  });
});

/* ==================================================================
   ٣ — حاملة رابط طالبة: ملفها وحده
================================================================== */
describe("حاملة رابط الطالبة الأولى", () => {
  it("تعدّل مشروع طالبتها", async () => {
    await assertSucceeds(updateDoc(doc(parent1(), `${ROOT}/projects/p-1`), { title: "عنوان جديد" }));
  });

  it("لا تعدّل ملف طالبة أخرى", async () => {
    await assertFails(updateDoc(doc(parent1(), `${ROOT}/students/st-2`), { name: "تلاعب" }));
  });

  it("لا تضيف مشروعًا لطالبة أخرى", async () => {
    await assertFails(setDoc(doc(parent1(), `${ROOT}/projects/hack`), { studentId: "st-2", title: "x" }));
  });

  it("لا تنقل مشروعها إلى طالبة أخرى", async () => {
    await assertFails(updateDoc(doc(parent1(), `${ROOT}/projects/p-1`), { studentId: "st-2" }));
  });

  it("لا تكتب تقييمًا لنفسها", async () => {
    await assertFails(setDoc(doc(parent1(), `${ROOT}/evaluations/self`), {
      projectId: "p-1", studentId: "st-1", subjectId: "sub-a", teacherId: "t-a",
      stars: 5, badge: true, status: "excellent",
    }));
  });

  it("لا تعدّل تقييم المعلمة", async () => {
    await assertFails(updateDoc(doc(parent1(), `${ROOT}/evaluations/ev-b`), { stars: 5, comment: "تلاعب" }));
  });

  it("لا تحذف تقييم المعلمة", async () => {
    await assertFails(deleteDoc(doc(parent1(), `${ROOT}/evaluations/ev-b`)));
  });

  it("لا تغيّر ترتيب الظهور ولا تعطّل ملفها", async () => {
    await assertFails(updateDoc(doc(parent1(), `${ROOT}/students/st-1`), { order: 99 }));
    await assertFails(updateDoc(doc(parent1(), `${ROOT}/students/st-1`), { active: false }));
  });

  it("لا تغيّر إعدادات المنصة", async () => {
    await assertFails(updateDoc(doc(parent1(), `${ROOT}/settings/main`), { platformName: "x" }));
  });

  it("لا تقرأ سجل النشاط", async () => {
    await assertFails(getDocs(collection(parent1(), `${ROOT}/activityLogs`)));
  });

  it("لا تقرأ روابط الطالبات الأخريات", async () => {
    await assertFails(getDocs(collection(parent1(), `${ROOT}/studentLinks`)));
  });

  it("لا تضيف معلمة ولا مادة", async () => {
    await assertFails(setDoc(doc(parent1(), `${ROOT}/teachers/fake`), { name: "x" }));
    await assertFails(setDoc(doc(parent1(), `${ROOT}/subjects/fake`), { name: "x" }));
  });

  it("لا ترفع صورة باسم غيرها", async () => {
    await assertFails(setDoc(doc(parent1(), `${ROOT}/media/hack`), {
      ownerUid: "admin-uid", data: "y", mime: "image/webp",
    }));
  });

  it("لا تزوّر سجل نشاط باسم المشرفة", async () => {
    await assertFails(setDoc(doc(parent1(), `${ROOT}/activityLogs/forged`), {
      kind: "student.delete", message: "حذفت المشرفة كل الملفات",
      actorName: "المشرفة", actorRole: "admin", at: 1,
    }));
  });

  it("ولا تنتحل دور المشرفة باسمها هي", async () => {
    await assertFails(setDoc(doc(parent1(), `${ROOT}/activityLogs/forged2`), {
      kind: "x", message: "y", actorName: "طالبة ١", actorRole: "admin", at: 1,
    }));
  });

  it("ولا تنتحل اسم زميلتها بدورها هي", async () => {
    await assertFails(setDoc(doc(parent1(), `${ROOT}/activityLogs/forged3`), {
      kind: "x", message: "y", actorName: "طالبة ٢", actorRole: "parent", at: 1,
    }));
  });

  it("وتكتب سطرًا صحيحًا باسمها ودورها", async () => {
    await assertSucceeds(setDoc(doc(parent1(), `${ROOT}/activityLogs/honest`), {
      kind: "project.update", message: "حدّثت مشروعًا",
      actorName: "طالبة ١", actorRole: "parent", at: 1,
    }));
  });
});

/* ==================================================================
   ٤ — معلمة: مادتها وحدها، وتقييمها وحده
================================================================== */
describe("المعلمة أ", () => {
  it("تكتب تقييم مادتها", async () => {
    await assertSucceeds(setDoc(doc(teacherA(), `${ROOT}/evaluations/ev-a`), {
      projectId: "p-1", studentId: "st-1", subjectId: "sub-a", teacherId: "t-a",
      stars: 4, badge: false, status: "complete", comment: "جيد",
    }));
  });

  it("لا تكتب تقييمًا لمادة زميلتها", async () => {
    await assertFails(setDoc(doc(teacherA(), `${ROOT}/evaluations/ev-x`), {
      projectId: "p-1", studentId: "st-1", subjectId: "sub-b", teacherId: "t-b",
      stars: 1, badge: false, status: "complete",
    }));
  });

  it("لا تكتب تقييمًا باسم زميلتها على مادتها هي", async () => {
    await assertFails(setDoc(doc(teacherA(), `${ROOT}/evaluations/ev-y`), {
      projectId: "p-1", studentId: "st-1", subjectId: "sub-a", teacherId: "t-b",
      stars: 1, badge: false, status: "complete",
    }));
  });

  it("لا تضع نجومًا خارج النطاق ١–٥", async () => {
    for (const stars of [0, 6, 99, -1]) {
      await assertFails(setDoc(doc(teacherA(), `${ROOT}/evaluations/ev-${stars}`), {
        projectId: "p-1", studentId: "st-1", subjectId: "sub-a", teacherId: "t-a",
        stars, badge: false, status: "complete",
      }));
    }
  });

  it("لا تعدّل محتوى الطالبة", async () => {
    await assertFails(updateDoc(doc(teacherA(), `${ROOT}/projects/p-1`), { title: "تعديل معلمة" }));
    await assertFails(updateDoc(doc(teacherA(), `${ROOT}/students/st-1`), { name: "تعديل معلمة" }));
    await assertFails(deleteDoc(doc(teacherA(), `${ROOT}/projects/p-1`)));
  });

  it("لا تحذف تقييمًا — ولا تقييمها هي", async () => {
    await assertFails(deleteDoc(doc(teacherA(), `${ROOT}/evaluations/ev-b`)));
  });

  it("لا تقرأ روابط الطالبات ولا ملفات الصلاحيات", async () => {
    await assertFails(getDocs(collection(teacherA(), `${ROOT}/studentLinks`)));
    await assertFails(getDoc(doc(teacherA(), `${ROOT}/users/parent1-uid`)));
  });

  it("لا تقرأ سجل النشاط", async () => {
    await assertFails(getDocs(collection(teacherA(), `${ROOT}/activityLogs`)));
  });

  it("لا تغيّر إعدادات المنصة ولا تضيف معلمات", async () => {
    await assertFails(updateDoc(doc(teacherA(), `${ROOT}/settings/main`), { platformName: "x" }));
    await assertFails(setDoc(doc(teacherA(), `${ROOT}/teachers/fake`), { name: "x" }));
  });

  it("لا تمنح نفسها مادة زميلتها بتعديل ملف صلاحياتها", async () => {
    await assertFails(updateDoc(doc(teacherA(), `${ROOT}/users/teacherA-uid`), { subjectIds: ["sub-a", "sub-b"] }));
    await assertFails(updateDoc(doc(teacherA(), `${ROOT}/users/teacherA-uid`), { role: "admin" }));
  });

  /* ---- الثغرة المشتبه بها: الاستيلاء على تقييم زميلتها ---- */
  it("لا تستولي على تقييم زميلتها بإعادة كتابته باسمها", async () => {
    await assertFails(setDoc(doc(teacherA(), `${ROOT}/evaluations/ev-b`), {
      projectId: "p-1", studentId: "st-1", subjectId: "sub-a", teacherId: "t-a",
      stars: 1, badge: false, status: "needs-revision", comment: "محو تقييم الزميلة",
    }));
  });

  it("لا تنقل تقييمها إلى مشروع آخر", async () => {
    await assertSucceeds(setDoc(doc(teacherA(), `${ROOT}/evaluations/ev-move`), {
      projectId: "p-1", studentId: "st-1", subjectId: "sub-a", teacherId: "t-a",
      stars: 3, badge: false, status: "complete",
    }));
    await assertFails(updateDoc(doc(teacherA(), `${ROOT}/evaluations/ev-move`), { projectId: "p-999" }));
  });
});

/* ==================================================================
   ٥ — الرابط الملغى يسقط فورًا
================================================================== */
describe("إلغاء الرابط", () => {
  it("رابط طالبة ملغى يوقف التعديل فورًا", async () => {
    await assertSucceeds(updateDoc(doc(parent1(), `${ROOT}/projects/p-1`), { title: "قبل الإلغاء" }));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), `${ROOT}/studentLinks/LINK-1`), { active: false });
    });
    await assertFails(updateDoc(doc(parent1(), `${ROOT}/projects/p-1`), { title: "بعد الإلغاء" }));
  });

  it("رابط معلمة ملغى يوقف التقييم فورًا", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), `${ROOT}/invites/INVITE-A`), { active: false });
    });
    await assertFails(setDoc(doc(teacherA(), `${ROOT}/evaluations/ev-after`), {
      projectId: "p-1", studentId: "st-1", subjectId: "sub-a", teacherId: "t-a",
      stars: 5, badge: false, status: "complete",
    }));
  });

  it("حساب معطَّل لا يكتب شيئًا", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), `${ROOT}/users/parent1-uid`), { active: false });
    });
    await assertFails(updateDoc(doc(parent1(), `${ROOT}/projects/p-1`), { title: "معطَّلة" }));
  });
});

/* ==================================================================
   ٦ — سجل النشاط: أثرٌ لا يُزوَّر ولا يُمحى
================================================================== */
describe("سجل النشاط", () => {
  it("لا يُعدَّل ولا يُحذف — ولا من المشرفة", async () => {
    await assertFails(updateDoc(doc(admin(), `${ROOT}/activityLogs/log-1`), { message: "تزوير" }));
    await assertFails(deleteDoc(doc(admin(), `${ROOT}/activityLogs/log-1`)));
  });

  it("المشرفة وحدها تقرؤه", async () => {
    await assertSucceeds(getDocs(collection(admin(), `${ROOT}/activityLogs`)));
  });

  it("المشرفة تكتب سطرًا باسمها — السجل الشرعي لم ينكسر", async () => {
    await assertSucceeds(setDoc(doc(admin(), `${ROOT}/activityLogs/ok-admin`), {
      kind: "settings.save", message: "تم تحديث الإعدادات",
      actorName: "المشرفة", actorRole: "admin", at: 1,
    }));
  });

  it("والمعلمة كذلك", async () => {
    await assertSucceeds(setDoc(doc(teacherA(), `${ROOT}/activityLogs/ok-teacher`), {
      kind: "evaluation.save", message: "قيّمت مشروعًا",
      actorName: "أ. أ", actorRole: "teacher", at: 1,
    }));
  });
});

/* ==================================================================
   ٧ — خارج مسار إنجازي: كل شيء مغلق
================================================================== */
describe("خارج apps/injazi", () => {
  it("لا قراءة ولا كتابة في أي مسار آخر", async () => {
    await assertFails(getDoc(doc(anon(), "randomCollection/doc-1")));
    await assertFails(setDoc(doc(admin(), "randomCollection/doc-1"), { x: 1 }));
    await assertFails(getDoc(doc(admin(), "apps/shualat/questions/q-1")));
  });
});
