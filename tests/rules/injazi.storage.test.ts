/*
  اختبارات قواعد Firebase Storage لـ «إنجازي يحكي».
  ==================================================================
  القواعد تُثبت الملكية من المسار (<نطاق>/<uid>/<نوع>/<ملف>) لا من
  قراءة في Firestore، ولذلك تُختبَر بالكامل محليًا — وهذا كان سبب
  اختيار التصميم: قاعدة لا يمكن اختبارها قبل النشر ليست قاعدة أمان.

  ما يُختبَر هنا لا يمكن اختباره في الواجهة: فحص المتصفح للنوع والحجم
  تجميلي ويُتجاوَز بطلب مباشر إلى واجهة التخزين.

  التشغيل:  npm run test:rules
*/
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { ref, uploadBytes, getMetadata, deleteObject } from "firebase/storage";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const STUDENT_A = "student-a";
const STUDENT_B = "student-b";

const PARENT_A = "parentA";
const PARENT_B = "parentB";
const TEACHER = "teacher1";
const ADMIN = "admin1";

let env: RulesTestEnvironment;

const BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const asImage = { contentType: "image/png" };
const asPdf = { contentType: "application/pdf" };
const asVideo = { contentType: "video/mp4" };
const asAudio = { contentType: "audio/mpeg" };
const asHtml = { contentType: "text/html" };

/** أكبر من حد الصور (٨ ميجابايت). */
const TOO_BIG = new Uint8Array(9 * 1024 * 1024);

/** مسار ملف طالبة يملكه uid معيّن. */
const studentFile = (studentId: string, ownerUid: string, name = "f.png") =>
  `students/${studentId}/${ownerUid}/projects/${name}`;

const platformFile = (ownerUid: string, kind: string, name: string) =>
  `platform/${ownerUid}/${kind}/${name}`;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-injazi-storage",
    storage: { rules: readFileSync("storage.rules", "utf8"), host: "127.0.0.1", port: 9199 },
  });
});

afterAll(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const storage = ctx.storage();
    await uploadBytes(ref(storage, studentFile(STUDENT_A, PARENT_A, "existing.png")), BYTES, asImage);
    await uploadBytes(ref(storage, platformFile(ADMIN, "settings", "logo.png")), BYTES, asImage);
  });
});

const guest = () => env.unauthenticatedContext().storage();
const as = (uid: string) => env.authenticatedContext(uid).storage();

describe("ولي الأمر", () => {
  it("يرفع صورة وPDF وفيديو في مساره تحت ملف ابنته", async () => {
    const s = as(PARENT_A);
    await assertSucceeds(
      uploadBytes(ref(s, `students/${STUDENT_A}/${PARENT_A}/profile/a.png`), BYTES, asImage),
    );
    await assertSucceeds(uploadBytes(ref(s, studentFile(STUDENT_A, PARENT_A, "a.pdf")), BYTES, asPdf));
    await assertSucceeds(uploadBytes(ref(s, studentFile(STUDENT_A, PARENT_A, "a.mp4")), BYTES, asVideo));
  });

  it("لا يرفع في مسار ولي أمر آخر (حتى داخل ملف ابنته)", async () => {
    await assertFails(
      uploadBytes(ref(as(PARENT_A), studentFile(STUDENT_A, PARENT_B, "x.png")), BYTES, asImage),
    );
  });

  it("لا يرفع في مسار ولي أمر آخر تحت طالبة أخرى", async () => {
    await assertFails(
      uploadBytes(ref(as(PARENT_A), studentFile(STUDENT_B, PARENT_B, "x.png")), BYTES, asImage),
    );
  });

  it("يحذف ملفاته ولا يحذف ملفات غيره", async () => {
    await assertFails(
      deleteObject(ref(as(PARENT_B), studentFile(STUDENT_A, PARENT_A, "existing.png"))),
    );
    await assertSucceeds(
      deleteObject(ref(as(PARENT_A), studentFile(STUDENT_A, PARENT_A, "existing.png"))),
    );
  });

  it("لا يرفع نوعًا غير آمن (HTML/سكربت)", async () => {
    await assertFails(
      uploadBytes(ref(as(PARENT_A), studentFile(STUDENT_A, PARENT_A, "evil.html")), BYTES, asHtml),
    );
  });

  it("لا يتجاوز حد حجم الصورة", async () => {
    await assertFails(
      uploadBytes(ref(as(PARENT_A), studentFile(STUDENT_A, PARENT_A, "huge.png")), TOO_BIG, asImage),
    );
  });

  it("لا يرفع صوتًا في مسار الطالبات (الصوت للمنصة فقط)", async () => {
    await assertFails(
      uploadBytes(ref(as(PARENT_A), studentFile(STUDENT_A, PARENT_A, "s.mp3")), BYTES, asAudio),
    );
  });

  it("لا يرفع في مسار المنصة الخاص بالمشرفة", async () => {
    const s = as(PARENT_A);
    await assertFails(uploadBytes(ref(s, platformFile(ADMIN, "settings", "logo.png")), BYTES, asImage));
    await assertFails(
      uploadBytes(ref(s, platformFile(ADMIN, "settings/audio", "song.mp3")), BYTES, asAudio),
    );
    await assertFails(uploadBytes(ref(s, platformFile(ADMIN, "teachers", "t.png")), BYTES, asImage));
  });
});

describe("المعلمة", () => {
  it("تقرأ ملفات الطالبات (للتقييم)", async () => {
    await assertSucceeds(
      getMetadata(ref(as(TEACHER), studentFile(STUDENT_A, PARENT_A, "existing.png"))),
    );
  });

  it("لا ترفع في مسار ولي الأمر داخل ملف الطالبة", async () => {
    // الضمان الفعلي: لا أحد يكتب في مسار غيره. أما كتابة المعلمة داخل
    // مسارها هي تحت مجلد طالبة فهي ملف يتيم لا يمكن أن يظهر في أي ملف
    // إنجاز، لأن ربط الملف بالمستند محكوم بقواعد Firestore (والمعلمة لا
    // تستطيع كتابة مستندات المشاريع — مُختبَر في injazi.rules.test.ts).
    await assertFails(
      uploadBytes(ref(as(TEACHER), studentFile(STUDENT_A, PARENT_A, "t.png")), BYTES, asImage),
    );
  });

  it("لا تحذف ملفات الطالبات إطلاقًا", async () => {
    await assertFails(
      deleteObject(ref(as(TEACHER), studentFile(STUDENT_A, PARENT_A, "existing.png"))),
    );
  });

  it("لا تغيّر شعار المنصة ولا أغنيتها", async () => {
    const s = as(TEACHER);
    await assertFails(uploadBytes(ref(s, platformFile(ADMIN, "settings", "logo.png")), BYTES, asImage));
    await assertFails(
      uploadBytes(ref(s, platformFile(ADMIN, "settings/audio", "x.mp3")), BYTES, asAudio),
    );
  });
});

describe("المشرفة", () => {
  it("ترفع الشعار وصور المعلمات والأغنية في مسارها", async () => {
    const s = as(ADMIN);
    await assertSucceeds(
      uploadBytes(ref(s, platformFile(ADMIN, "settings", "logo2.png")), BYTES, asImage),
    );
    await assertSucceeds(uploadBytes(ref(s, platformFile(ADMIN, "teachers", "t.png")), BYTES, asImage));
    await assertSucceeds(
      uploadBytes(ref(s, platformFile(ADMIN, "settings/audio", "song.mp3")), BYTES, asAudio),
    );
  });

  it("ترفع في ملف الطالبة ضمن مسارها هي", async () => {
    await assertSucceeds(
      uploadBytes(ref(as(ADMIN), studentFile(STUDENT_A, ADMIN, "admin.png")), BYTES, asImage),
    );
  });

  it("لا ترفع نوعًا غير مسموح حتى وهي مشرفة", async () => {
    const s = as(ADMIN);
    await assertFails(uploadBytes(ref(s, platformFile(ADMIN, "settings", "evil.html")), BYTES, asHtml));
    await assertFails(
      uploadBytes(ref(s, platformFile(ADMIN, "settings/audio", "evil.html")), BYTES, asHtml),
    );
    // صورة أكبر من ٨ ميجابايت مرفوضة حتى للمشرفة
    await assertFails(
      uploadBytes(ref(s, platformFile(ADMIN, "settings", "huge.png")), TOO_BIG, asImage),
    );
  });

  it("لا تكتب في مسار مستخدمة أخرى", async () => {
    await assertFails(
      uploadBytes(ref(as(ADMIN), platformFile(TEACHER, "settings", "x.png")), BYTES, asImage),
    );
  });
});

describe("الزائرة", () => {
  it("تقرأ صور الملفات العامة (الصفحة الرئيسية مفتوحة)", async () => {
    await assertSucceeds(
      getMetadata(ref(guest(), studentFile(STUDENT_A, PARENT_A, "existing.png"))),
    );
    await assertSucceeds(getMetadata(ref(guest(), platformFile(ADMIN, "settings", "logo.png"))));
  });

  it("لا ترفع ولا تحذف شيئًا", async () => {
    const s = guest();
    await assertFails(uploadBytes(ref(s, studentFile(STUDENT_A, PARENT_A, "x.png")), BYTES, asImage));
    await assertFails(uploadBytes(ref(s, platformFile(ADMIN, "settings", "x.png")), BYTES, asImage));
    await assertFails(deleteObject(ref(s, studentFile(STUDENT_A, PARENT_A, "existing.png"))));
  });
});

describe("المنع الافتراضي", () => {
  it("أي مسار خارج المخطّط مغلق قراءةً وكتابةً للجميع", async () => {
    for (const path of ["private/secret.png", "students/only-two-segments.png", "random.png"]) {
      await assertFails(getMetadata(ref(guest(), path)));
      await assertFails(uploadBytes(ref(as(ADMIN), path), BYTES, asImage));
    }
  });
});
