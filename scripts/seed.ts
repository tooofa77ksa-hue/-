/**
 * سكربت تهيئة البيانات الأولية (Seed) لمشروع «شُعلة لغتي».
 *
 * مصدر الأسئلة: كراسة "أستعد لأنافس - مادة لغتي - الصف الثالث الابتدائي"
 * (الملف المرفوع من المستخدم). الأسئلة أدناه مأخوذة حرفيًا من نصوص ونماذج
 * الكراسة (الفقرة/السؤال/الاختيارات كما وردت)، والإجابة الصحيحة حُدِّدت
 * بالمعنى اللغوي الواضح لكل عنصر. الكراسة المرفوعة (32 صفحة) غطّت 11 من
 * أصل 14 مهارة معتمدة في هذا المشروع؛ مهارات "الرأي" و"التعبير الجمالي"
 * و"نهاية مختلفة للنص" لم ترد في الصفحات المرفوعة، لذا لم تُضَف لها أسئلة
 * تجنبًا لاختلاق محتوى غير مصدره الكراسة - إضافتها متاحة لاحقًا من لوحة
 * المعلمة فور توفر تلك الصفحات.
 *
 * الاستخدام (محاكي محلي، بلا أي Secret - موصى به للتطوير):
 *   1) شغّلي في نافذة طرفية: npm run emulator
 *   2) في نافذة أخرى: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed
 *
 * الاستخدام (مشروع Firebase حقيقي):
 *   1) نزّلي مفتاح حساب خدمة من Firebase Console > Project Settings > Service
 *      Accounts > Generate new private key، واحفظيه باسم serviceAccountKey.json
 *      في جذر المشروع (هذا الملف مُستبعد من git عبر .gitignore).
 *   2) شغّلي: npm run seed
 *
 * السكربت آمن لإعادة التشغيل: يتحقق أولًا من وجود كل مجموعة (مجموعة
 * الأسئلة التجريبية، gameSettings، audioSettings) ويتخطاها إن كانت
 * موجودة بالفعل، فلا يُكرِّر البيانات ولا يستبدل أي تعديل حقيقي قامت به
 * المعلمة لاحقًا (مثل تخصيص اسم اللعبة أو الفوتر من صفحة الإعدادات).
 */
import { getFirestore } from "firebase-admin/firestore";
import { initAdminApp } from "./adminApp";

initAdminApp();
const db = getFirestore();

const SKILLS: Array<{ key: string; labelAr: string; order: number }> = [
  { key: "comprehension", labelAr: "الفهم", order: 1 },
  { key: "inference", labelAr: "الاستنتاج", order: 2 },
  { key: "synonym", labelAr: "المرادف", order: 3 },
  { key: "antonym", labelAr: "المضاد", order: 4 },
  { key: "gender", labelAr: "مذكر / مؤنث", order: 5 },
  { key: "word_type", labelAr: "اسم / فعل / حرف", order: 6 },
  { key: "number_form", labelAr: "مفرد / مثنى / جمع", order: 7 },
  { key: "main_idea", labelAr: "الفكرة الرئيسة", order: 8 },
  { key: "general_goal", labelAr: "الهدف العام", order: 9 },
  { key: "cause_effect", labelAr: "السبب والنتيجة", order: 10 },
  { key: "event_order", labelAr: "ترتيب الأحداث", order: 11 },
  { key: "opinion", labelAr: "الرأي", order: 12 },
  { key: "aesthetic_expression", labelAr: "التعبير الجمالي", order: 13 },
  { key: "alternative_ending", labelAr: "نهاية مختلفة للنص", order: 14 },
];

const SET_ID = "sample-set-01";

const QUESTIONS: Array<{
  skill: string;
  passage?: string;
  question: string;
  choices: [string, string, string, string];
  correctAnswer: 0 | 1 | 2 | 3;
  difficulty: "easy" | "medium" | "hard";
  gameMode: "rocket_mission" | "squishy_treasure" | "magic_gate";
  order: number;
}> = [
  {
    skill: "synonym",
    question: "في يوم صيفي حار، عطِش الغراب كثيرًا، وبحث عن الماء فلم يجده. ما معنى كلمة (عطش)؟",
    choices: ["احتاج للماء", "احتاج للنوم", "جلس", "شرب"],
    correctAnswer: 0,
    difficulty: "easy",
    gameMode: "rocket_mission",
    order: 1,
  },
  {
    skill: "synonym",
    question: "ألقى عليه سؤالًا. ما مرادف كلمة (ألقى)؟",
    choices: ["طرحَ عليه", "أسقطَه", "أكسره", "ناداه"],
    correctAnswer: 0,
    difficulty: "easy",
    gameMode: "squishy_treasure",
    order: 2,
  },
  {
    skill: "antonym",
    question: "كان هناك سنجاب صغير يُدعى (سنجوب). ما ضد كلمة (صغير)؟",
    choices: ["كبير", "كثير", "جميل", "سريع"],
    correctAnswer: 0,
    difficulty: "easy",
    gameMode: "rocket_mission",
    order: 3,
  },
  {
    skill: "antonym",
    question: "قالت النحلة بفرح: شكرًا كثيرًا لك. ما ضد كلمة (بفرح)؟",
    choices: ["بحزن", "بخوف", "بسرعة", "بشغف"],
    correctAnswer: 0,
    difficulty: "easy",
    gameMode: "squishy_treasure",
    order: 4,
  },
  {
    skill: "gender",
    question: "اختاري الكلمة المذكَّرة.",
    choices: ["ملعب", "مدرسة", "حديقة", "روضة"],
    correctAnswer: 0,
    difficulty: "easy",
    gameMode: "magic_gate",
    order: 5,
  },
  {
    skill: "gender",
    question: "ما مذكر كلمة (بنت)؟",
    choices: ["ولد", "بنات", "أصدقاء", "أولاد"],
    correctAnswer: 0,
    difficulty: "easy",
    gameMode: "rocket_mission",
    order: 6,
  },
  {
    skill: "word_type",
    question: "محمد وبلال صديقان، مرض محمد وغاب عن المدرسة. ما نوع كلمة (عن) في الجملة؟",
    choices: ["حرف", "اسم", "فعل", "جميع ما سبق"],
    correctAnswer: 0,
    difficulty: "medium",
    gameMode: "squishy_treasure",
    order: 7,
  },
  {
    skill: "word_type",
    question: "أنا أحب الغذاء الصحي فأتناول طعامًا صحيًا. ما نوع كلمة (الغذاء) في الجملة؟",
    choices: ["اسم", "فعل", "حرف", "اسم إشارة"],
    correctAnswer: 0,
    difficulty: "medium",
    gameMode: "magic_gate",
    order: 8,
  },
  {
    skill: "number_form",
    question: "ما مثنى كلمة (الطالب)؟",
    choices: ["الطالبان", "الطلاب", "الطالبات", "جميع ما سبق"],
    correctAnswer: 0,
    difficulty: "medium",
    gameMode: "rocket_mission",
    order: 9,
  },
  {
    skill: "number_form",
    question: "أي الكلمات التالية مفرد بين الجموع: (مدارس / بيوت / فصل / مساجد)؟",
    choices: ["فصل", "مدارس", "بيوت", "مساجد"],
    correctAnswer: 0,
    difficulty: "medium",
    gameMode: "squishy_treasure",
    order: 10,
  },
  {
    skill: "comprehension",
    passage: "وضع أحد الصيادين في أحد أيام الصيف شبكة كبيرة على الأرض بالقرب من شجرة كبيرة.",
    question: "متى وضع الصياد الشبكة؟",
    choices: ["في فصل الصيف", "في فصل الخريف", "في فصل الربيع", "في فصل الشتاء"],
    correctAnswer: 0,
    difficulty: "medium",
    gameMode: "magic_gate",
    order: 11,
  },
  {
    skill: "general_goal",
    passage: "أنا أحب الغذاء الصحي فأتناول طعامًا صحيًا فيه خضروات وفاكهة وبروتينات.",
    question: "ما الهدف العام لهذه الفقرة؟",
    choices: ["الغذاء الصحي", "تناول الحليب", "أهمية الأسماك", "ممارسة الرياضة"],
    correctAnswer: 0,
    difficulty: "medium",
    gameMode: "magic_gate",
    order: 12,
  },
  {
    skill: "main_idea",
    passage: "محمد رسّام مبدع؛ لأنه يرسم كثيرًا ويتعلم خلط الألوان.",
    question: "ما الفكرة الرئيسة لهذه الفقرة؟",
    choices: ["موهبة الرسم", "موهبة الخط", "موهبة الشعر", "موهبة الخطابة"],
    correctAnswer: 0,
    difficulty: "hard",
    gameMode: "rocket_mission",
    order: 13,
  },
  {
    skill: "cause_effect",
    passage: "في يوم صيفي حار، عطِش الغراب كثيرًا.",
    question: "لماذا عطِش الغراب كثيرًا؟",
    choices: ["بسبب حرارة الجو المرتفعة", "بسبب نومه كثيرًا", "لأنه ذكي", "لا سبب واضح"],
    correctAnswer: 0,
    difficulty: "hard",
    gameMode: "squishy_treasure",
    order: 14,
  },
  {
    skill: "event_order",
    passage:
      "كان هناك سنجاب صغير يُدعى (سنجوب)، أحبّ يومًا أن يتمشى مع أمه في الغابة القريبة لرؤية الأشجار والورود التي تفتحت مع قدوم فصل الربيع.",
    question: "أين دار حدث القصة؟",
    choices: ["الغابة", "الحديقة", "البستان", "الشارع"],
    correctAnswer: 0,
    difficulty: "hard",
    gameMode: "magic_gate",
    order: 15,
  },
  {
    skill: "inference",
    passage:
      "تُعتبر الفراشة واحدة من أجمل الحشرات قاطبة، ولذا فُتِن الناس بجمالها بأجنحتها الرقيقة ذات الألوان الجذّابة.",
    question: "لماذا فُتِن الناس بجمال أجنحة الفراشة؟",
    choices: [
      "لأن ألوانها متعددة وجذابة",
      "لأنها صغيرة الحجم",
      "بسبب سرعتها في الطيران",
      "لأنها تعيش على قمم الجبال",
    ],
    correctAnswer: 0,
    difficulty: "hard",
    gameMode: "rocket_mission",
    order: 16,
  },
];

/**
 * السكربت "تهيئة أولى" (Bootstrap) لا "مزامنة دائمة": أي وثيقة تُنشئها
 * المعلمة/الإدارة أو تُعدِّلها لاحقًا من /teacher (خصوصًا gameSettings
 * وquestionSets/sample-set-01) لن تُلمَس أو تُستبدَل في التشغيلات
 * التالية - فقط ما لم يكن موجودًا بعد يُنشأ. هذا ما يجعل إعادة التشغيل
 * آمنة فعليًا: لا تكرار للأسئلة، ولا استرجاع للقيم الافتراضية فوق تخصيص
 * حقيقي قامت به المعلمة.
 */
async function main() {
  console.log("[seed] بدء تهيئة البيانات...");
  const batch = db.batch();
  let writes = 0;

  for (const s of SKILLS) {
    batch.set(db.collection("skills").doc(s.key), s, { merge: true });
    writes++;
  }

  const setRef = db.collection("questionSets").doc(SET_ID);
  const setSnap = await setRef.get();
  if (!setSnap.exists) {
    batch.set(setRef, {
      title: "أستعد لأنافس - المستوى الأول",
      description:
        "أسئلة من كراسة أستعد لأنافس (لغتي - ثالث ابتدائي)، تغطي 11 مهارة من أصل 14. أضيفي بقية المهارات (الرأي، التعبير الجمالي، نهاية مختلفة للنص) من لوحة التحكم.",
      gradeLevel: "الثالث الابتدائي",
      order: 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "seed-script",
    });
    writes++;

    QUESTIONS.forEach((q, i) => {
      const ref = db.collection("questions").doc(`sample-q-${String(i + 1).padStart(2, "0")}`);
      batch.set(ref, {
        ...q,
        questionSetId: SET_ID,
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
      branding: {
        gameName: "شُعلة لغتي",
        gameTagline: "منصة تعليمية تفاعلية - لغتي - الصف الثالث الابتدائي",
        welcomeMessage: "اختاري لعبتك المفضلة! 🌟",
        schoolName: "المدرسة الابتدائية الخامسة والستون بعد المائة",
        principalName: "جازية السميري",
        deputyName: "ناهد الحربي",
        designerCredit: "دلال السناني",
      },
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
