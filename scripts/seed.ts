/**
 * سكربت تهيئة البيانات الأولية (Seed) لمشروع «شُعلة لغتي».
 * البيانات نفسها في src/lib/starterData.ts (مصدر مشترك مع زر "استيراد
 * الأسئلة النموذجية" داخل /teacher لمن لا يستطيع تشغيل هذا السكربت).
 *
 * الاستخدام (محاكي محلي، بلا أي Secret - موصى به للتطوير):
 *   1) شغّلي في نافذة طرفية: npm run emulator
 *   2) في نافذة أخرى: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed
 *
 * الاستخدام (مشروع Firebase حقيقي، بدون Terminal على جهاز المعلمة):
 *   استخدمي بدلًا من هذا السكربت زر "استيراد الأسئلة النموذجية" في أعلى
 *   لوحة التحكم بعد تسجيل الدخول - يكتب نفس البيانات مباشرة من المتصفح.
 *
 * السكربت آمن لإعادة التشغيل: يتحقق أولًا من وجود كل مجموعة (مجموعة
 * الأسئلة التجريبية، gameSettings، audioSettings) ويتخطاها إن كانت
 * موجودة بالفعل، فلا يُكرِّر البيانات ولا يستبدل أي تعديل حقيقي قامت به
 * المعلمة لاحقًا (مثل تخصيص اسم اللعبة أو الفوتر من صفحة الإعدادات).
 */
import { getFirestore } from "firebase-admin/firestore";
import { initAdminApp } from "./adminApp";
import { DEFAULT_BRANDING, STARTER_QUESTIONS, STARTER_SET, STARTER_SET_ID, STARTER_SKILLS } from "../src/lib/starterData";

initAdminApp();
const db = getFirestore();

async function main() {
  console.log("[seed] بدء تهيئة البيانات...");
  const batch = db.batch();
  let writes = 0;

  for (const s of STARTER_SKILLS) {
    batch.set(db.collection("skills").doc(s.key), s, { merge: true });
    writes++;
  }

  const setRef = db.collection("questionSets").doc(STARTER_SET_ID);
  const setSnap = await setRef.get();
  if (!setSnap.exists) {
    batch.set(setRef, {
      ...STARTER_SET,
      order: 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "seed-script",
    });
    writes++;

    STARTER_QUESTIONS.forEach((q, i) => {
      const ref = db.collection("questions").doc(`sample-q-${String(i + 1).padStart(2, "0")}`);
      batch.set(ref, {
        ...q,
        questionSetId: STARTER_SET_ID,
        feedback: {
          correct: "ممتازة! إجابة صحيحة",
          incorrect: "حاولي مرة أخرى",
        },
        published: true,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: "seed-script",
      });
      writes++;
    });
  } else {
    console.log("[seed] مجموعة أسئلة أستعد لأنافس موجودة مسبقًا - تم تخطيها (لن تُستبدَل أي تعديلات للمعلمة).");
  }

  const gameSettingsRef = db.collection("gameSettings").doc("default");
  const gameSettingsSnap = await gameSettingsRef.get();
  if (!gameSettingsSnap.exists) {
    batch.set(gameSettingsRef, {
      activeGameModes: ["rocket_mission", "squishy_treasure", "magic_gate"],
      defaultGameMode: "rocket_mission",
      defaultDifficulty: "easy",
      questionsPerRound: 6,
      branding: DEFAULT_BRANDING,
      updatedAt: Date.now(),
    });
    writes++;
  } else {
    console.log("[seed] gameSettings موجودة مسبقًا - تم تخطيها (إعدادات المعلمة الحالية محفوظة).");
  }

  const audioSettingsRef = db.collection("audioSettings").doc("default");
  const audioSettingsSnap = await audioSettingsRef.get();
  if (!audioSettingsSnap.exists) {
    batch.set(audioSettingsRef, {
      masterVolumeDefault: 0.8,
      voiceVolumeDefault: 1,
      sfxVolumeDefault: 0.7,
      quietModeDefault: false,
      reducedMotionDefault: false,
      duckingAmount: 0.6,
      updatedAt: Date.now(),
    });
    writes++;
  } else {
    console.log("[seed] audioSettings موجودة مسبقًا - تم تخطيها.");
  }

  await batch.commit();
  console.log(`[seed] تم بنجاح (${writes} عملية كتابة).`);
  if (!setSnap.exists) {
    console.log("[seed] تذكير: 3 مهارات (الرأي/التعبير الجمالي/نهاية مختلفة) بلا أسئلة بعد - أضيفيها من لوحة المعلمة.");
  }
}

main().catch((err) => {
  console.error("[seed] فشل التنفيذ:", err);
  process.exit(1);
});
