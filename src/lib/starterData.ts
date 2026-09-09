// بيانات البداية (Starter Data): مصدر واحد مشترك يستخدمه كل من:
// 1) scripts/seed.ts (للتشغيل عبر Firebase Admin SDK - محاكي محلي أو مشروع حقيقي).
// 2) زر "استيراد الأسئلة النموذجية" داخل /teacher (كتابة مباشرة من متصفح
//    المعلمة بعد تسجيل الدخول، بلا حاجة لأي سكربت أو صلاحية Admin منفصلة -
//    مناسب لمن لا يستطيع تشغيل Terminal أو Firebase CLI إطلاقًا).
//
// مصدر الأسئلة: كراسة "أستعد لأنافس - مادة لغتي - الصف الثالث الابتدائي"
// (الملف المرفوع من المستخدم). الأسئلة مأخوذة حرفيًا من نصوص ونماذج
// الكراسة، والإجابة الصحيحة حُدِّدت بالمعنى اللغوي الواضح لكل عنصر.
// الملف المرفوع (32 صفحة) غطّى 11 من أصل 14 مهارة معتمدة في هذا المشروع؛
// مهارات "الرأي" و"التعبير الجمالي" و"نهاية مختلفة للنص" لم ترد فيه، لذا
// لم تُضَف لها أسئلة تجنبًا لاختلاق محتوى غير مصدره الكراسة.
import type { BrandingSettings, Difficulty, GameMode, SkillKey } from "@/types/models";

export const STARTER_SKILLS: Array<{ key: SkillKey; labelAr: string; order: number }> = [
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

export const STARTER_SET_ID = "sample-set-01";

export const STARTER_SET = {
  title: "أستعد لأنافس - المستوى الأول",
  description:
    "أسئلة من كراسة أستعد لأنافس (لغتي - ثالث ابتدائي)، تغطي 11 مهارة من أصل 14. أضيفي بقية المهارات (الرأي، التعبير الجمالي، نهاية مختلفة للنص) من لوحة التحكم.",
  gradeLevel: "الثالث الابتدائي",
};

export interface StarterQuestion {
  skill: SkillKey;
  passage?: string;
  question: string;
  choices: [string, string, string, string];
  correctAnswer: 0 | 1 | 2 | 3;
  difficulty: Difficulty;
  gameMode: GameMode;
  order: number;
}

export const STARTER_QUESTIONS: StarterQuestion[] = [
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

export const DEFAULT_BRANDING: BrandingSettings = {
  gameName: "شُعلة لغتي",
  gameTagline: "منصة تعليمية تفاعلية - لغتي - الصف الثالث الابتدائي",
  welcomeMessage: "اختاري لعبتك المفضلة! 🌟",
  schoolName: "المدرسة الابتدائية الخامسة والستون بعد المائة",
  principalName: "جازية السميري",
  deputyName: "ناهد الحربي",
  designerCredit: "دلال السناني",
};
