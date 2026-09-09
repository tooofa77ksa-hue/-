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

/** نصوص تعريفية قابلة للتعديل بالكامل من لوحة المعلمة، بلا أي Hard-coding
 * في الكود - أي تغيير هنا ينعكس فورًا في الواجهة عبر Firestore. */
export interface BrandingSettings {
  gameName: string; // اسم اللعبة/المنصة (Header + عنوان الصفحة)
  gameTagline: string; // الوصف المختصر تحت الاسم
  welcomeMessage: string; // عبارة الترحيب في شاشة اختيار اللعبة
  schoolName: string; // السطر الأول في الفوتر
  principalName: string; // اسم المديرة
  deputyName: string; // اسم الوكيلة
  designerCredit: string; // اسم مصممة المنصة (آخر سطر صغير في الفوتر)
}

export interface GameSettings {
  activeGameModes: GameMode[];
  defaultGameMode: GameMode;
  defaultDifficulty: Difficulty;
  questionsPerRound: number;
  branding: BrandingSettings;
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

// ------------------------------------------------------------------
// الطالبات والمجموعات: الاسم فقط، بلا أي هوية أو رقم أو بريد. القراءة
// والكتابة مقصورة على المعلمة/الإدارة عبر Firestore Security Rules.
// ------------------------------------------------------------------
export interface Student {
  id: string;
  name: string;
  groupId?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface Group {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export type SessionType = "individual" | "group";

/** جلسة اختبار تُنشئها المعلمة وتُشارك رابطها مع الطالبة/المجموعة. لا
 * قائمة عامة لأي جلسة (Firestore rules تمنع list) - فقط من يملك الرابط
 * (معرّف الجلسة) يستطيع فتحها، وتعرض فقط أسماء المشاركات في هذه الجلسة
 * تحديدًا، لا كل الطالبات. */
export interface TestSession {
  id: string;
  type: SessionType;
  groupId?: string;
  groupNameSnapshot?: string;
  /** لقطة أسماء المشاركات وقت إنشاء الجلسة - فردية (عنصر واحد) أو جماعية */
  participants: Array<{ studentId: string; name: string }>;
  participantIds: string[]; // نفس القائمة أعلاه لتسهيل التحقق في قواعد الأمان
  questionIds: string[];
  gameMode: GameMode;
  skill?: SkillKey;
  active: boolean;
  createdAt: number;
  createdBy: string;
}

export interface AttemptAnswer {
  questionId: string;
  questionTextSnapshot: string;
  choicesSnapshot: [string, string, string, string];
  studentAnswer: 0 | 1 | 2 | 3;
  correctAnswerSnapshot: 0 | 1 | 2 | 3;
  isCorrect: boolean;
  answeredAt: number;
  timeSpentMs?: number;
}

/** محاولة اختبار مكتملة (Session رسمية فقط، ليس اللعب العام). كل الأسئلة
 * والإجابات محفوظة كلقطة (Snapshot) وقت المحاولة، فلا يتأثر السجل
 * التاريخي إن عدّلت المعلمة السؤال لاحقًا. */
export interface Attempt {
  id: string;
  sessionId: string;
  studentId: string;
  studentNameSnapshot: string;
  groupId?: string;
  groupNameSnapshot?: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  gameMode: GameMode;
  skill?: SkillKey;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  scorePercentage: number;
  answers: AttemptAnswer[];
  createdAt: number;
}
