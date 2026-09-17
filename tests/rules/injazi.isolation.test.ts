/*
  عزل مشروع «إنجازي يحكي».
  ------------------------------------------------------------------
  firestore.rules ملف مشترك يخدم مشروعَي Firebase. نشره كما هو على
  مشروع إنجازي كان يحمل معه قواعد «شُعلة لغتي»، وفيها مسار bootstrap
  مربوط ببريد داخلي ثابت — محجوز في مشروع لغتي، وغير محجوز في مشروع
  إنجازي. أي قارئ للمستودع العام كان يستطيع تسجيل ذلك البريد هناك
  ومنح نفسه دور teacher في مجموعات لغتي العليا.

  لم تكن تلك المجموعات تمسّ بيانات الطالبات (كلها تحت apps/injazi/*)،
  لكنها كانت بابًا بلا سبب. هذه الاختبارات تثبت أن الملف المولَّد
  (firestore.injazi.rules) أغلقه: لا شيء خارج apps/injazi مسموح، حتى
  لحامل ذلك البريد بعينه.
*/
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, it } from "vitest";

const BOOTSTRAP_EMAIL = "dalal@teacher.shualat-lughati.internal";
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-injazi-isolation",
    firestore: {
      rules: readFileSync("firestore.injazi.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => env?.cleanup());

describe("قواعد إنجازي المولَّدة لا تحمل قواعد شُعلة لغتي", () => {
  it("مسار bootstrap الخاص بلغتي مغلق حتى لحامل بريده بعينه", async () => {
    // هذا هو جوهر الأمر: نفس الرمز المميّز الذي يفتح المسار في الملف
    // المشترك لا يفتح شيئًا هنا.
    const db = env
      .authenticatedContext("intruder", { email: BOOTSTRAP_EMAIL, email_verified: true })
      .firestore();

    await assertFails(setDoc(doc(db, "users/intruder"), { role: "teacher", name: "دخيل" }));
    await assertFails(getDoc(doc(db, "users/intruder")));
  });

  it("مجموعات شُعلة لغتي العليا لا تُقرأ ولا تُكتب من أي أحد", async () => {
    const guest = env.unauthenticatedContext().firestore();
    const signed = env.authenticatedContext("anyone").firestore();
    const emailed = env
      .authenticatedContext("intruder", { email: BOOTSTRAP_EMAIL })
      .firestore();

    for (const name of [
      "students",
      "groups",
      "questions",
      "questionSets",
      "skills",
      "testSessions",
      "attempts",
      "gameSettings",
      "audioSettings",
    ]) {
      for (const db of [guest, signed, emailed]) {
        await assertFails(getDocs(collection(db, name)));
        await assertFails(setDoc(doc(db, `${name}/x`), { any: "thing" }));
      }
    }
  });

  it("لا مجموعة خارج apps/injazi مفتوحة بالخطأ", async () => {
    const db = env.authenticatedContext("anyone").firestore();
    for (const path of ["apps/other/students/s1", "random/doc", "apps/injazi2/users/u1"]) {
      await assertFails(getDoc(doc(db, path)));
      await assertFails(setDoc(doc(db, path), { any: "thing" }));
    }
  });
});
