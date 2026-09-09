// نماذج البيانات الأساسية لمنصة «شُعلة لغتي»
// هذه الأنواع تعكس مباشرة بنية المجموعات (Collections) في Cloud Firestore

export type UserRole = "teacher" | "admin";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
}

/** مفاتيح المهارات اللغوية المستخرجة من نطاق مادة لغتي - الصف الثالث الابتدائي */
export type SkillKey =
  | "comprehension" // الفهم
  | "inference" // الاستنتاج
  | "synonym" // المرادف
  | "antonym" // المضاد
  | "gender" // مذكر / مؤنث
  | "word_type" // اسم / فعل / حرف
  | "number_form" // مفرد / مثنى / جمع
  | "main_idea" // الفكرة الرئيسة
  | "general_goal" // الهدف العام
  | "cause_effect" // السبب والنتيجة
  | "event_order" // ترتيب الأحداث
  | "opinion" // الرأي
  | "aesthetic_expression" // التعبير الجمالي
  | "alternative_ending"; // نهاية مختلفة للنص

export interface Skill {
  id: string;
  key: SkillKey;
  labelAr: string;
  description?: string;
  order: number;
}

export type Difficulty = "easy" | "medium" | "hard";

/** معرّفات ألعاب معتمدة حاليًا. يمكن إضافة نوع جديد لاحقًا بدون تغيير البنية */
export type GameMode = "rocket_mission" | "squishy_treasure" | "magic_gate";

export interface QuestionSet {
  id: string;
  title: string;
  description?: string;
  gradeLevel: string; // مثال: "الثالث الابتدائي"
  order: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface Question {
  id: string;
  questionSetId: string;
  skill: SkillKey;
  passage?: string; // نص قرائي اختياري يسبق السؤال
  question: string;
  choices: [string, string, string, string];
  correctAnswer: 0 | 1 | 2 | 3; // فهرس الاختيار الصحيح
  difficulty: Difficulty;
  gameMode: GameMode;
  feedback?: {
    correct?: string;
    incorrect?: string;
  };
  published: boolean;
  active: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface GameSettings {
  activeGameModes: GameMode[];
  defaultGameMode: GameMode;
  defaultDifficulty: Difficulty;
  questionsPerRound: number;
  updatedAt: number;
}

export interface AudioSettings {
  masterVolumeDefault: number; // 0..1
  voiceVolumeDefault: number;
  sfxVolumeDefault: number;
  quietModeDefault: boolean;
  reducedMotionDefault: boolean;
  duckingAmount: number; // نسبة خفض المؤثرات أثناء كلام الشخصية 0..1
  updatedAt: number;
}
