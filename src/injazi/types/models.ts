/*
  إنجازي يحكي — نماذج البيانات
  مصدر واحد لأشكال المستندات في Firestore. لا يُكرَّر أي شكل داخل مكوّن.
*/

export type Role = "admin" | "teacher" | "parent" | "viewer";

/** من يرى المحتوى: عام للجميع، أو للمسجّلات فقط، أو للمالك والإدارة. */
export type Visibility = "public" | "school" | "private";

export type EvaluationStatus = "excellent" | "complete" | "needs-revision";

export type LinkKind = "drive" | "youtube" | "telegram" | "url";

export type MediaKind = "image" | "pdf" | "video" | "file";

/** users/{uid} — مصدر الصلاحيات. تُكتب من لوحة الإدارة فقط. */
export type UserDoc = {
  id: string;
  role: Role;
  name: string;
  email: string;
  active: boolean;
  /** للمعلمة: معرّف مستند المعلمة. */
  teacherId?: string;
  /** للمعلمة: المواد المسموح لها بتقييمها (منسوخة للقواعد الأمنية). */
  subjectIds?: string[];
  /** لولي الأمر: الطالبات المرتبطات به. */
  studentIds?: string[];
  /**
   * للمعلمة الداخلة برابط: رمز الدعوة الذي منحها الصلاحية.
   * وجوده يعني أن صلاحيتها مشروطة ببقاء الرابط صالحًا — القواعد الأمنية
   * تتحقّق من ذلك عند كل كتابة، فإلغاء الرابط يقطع الصلاحية فورًا.
   */
  inviteCode?: string;
  /**
   * للطالبة/ولي أمرها الداخلَين برابط الطالبة: رمز الرابط الذي منحهما
   * الصلاحية. وجوده يجعل الصلاحية مشروطة ببقاء الرابط صالحًا.
   */
  linkCode?: string;
  createdAt: string;
};

/**
 * invites/{code} — رابط دخول معلمة.
 * معرّف المستند نفسه هو السر (١٢٨ بت عشوائية)، ولذلك لا توجد قراءة
 * بالقائمة إلا للمشرفة: من لا يملك الرابط لا يستطيع تعداد الروابط.
 */
export type TeacherInvite = {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectIds: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * studentLinks/{code} — رابط ملف الطالبة.
 * تفتحه الطالبة وولي أمرها معًا (رابط واحد لا رابطان)، فيمنح تعديل ملف
 * تلك الطالبة وحدها. المعرّف نفسه هو السر، ولا تعداد له إلا للمشرفة.
 */
export type StudentLink = {
  id: string;
  studentId: string;
  studentName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * قسم حرّ في سيرة الطالبة: عنوان تكتبه هي ونصّ تحته.
 * حرّ عمدًا لا حقولًا ثابتة (نبذة/مهارات/طموحات…): الطالبة في الرابع
 * الابتدائي تعرف ما تريد أن تقوله عن نفسها أكثر ممّا نعرف، والحقول
 * الثابتة تحبس ما لم نتوقّعه وتترك الفارغ منها ندبةً في الصفحة.
 */
export type AboutEntry = {
  id: string;
  title: string;
  body: string;
  /** اسم أيقونة Lucide. */
  icon: string;
};

export type Hobby = {
  id: string;
  label: string;
  /** اسم أيقونة Lucide. */
  icon: string;
};

/** students/{id} — بطاقة الطالبة قابلة للقراءة عامًا (الاسم والصورة). */
export type Student = {
  id: string;
  name: string;
  grade: string;
  bio: string;
  photoUrl: string | null;
  photoPath: string | null;
  themeId: string;
  /** لون مخصّص يعلو لون الثيم عند اختياره. */
  accentColor: string | null;
  coverStyle: "arc" | "wave" | "confetti" | "plain";
  cardStyle: "clay" | "glass" | "outline";
  /** أيقونة زخرفية صغيرة تميّز البطاقة. */
  decorIcon: string;
  hobbies: Hobby[];
  /** أقسام «عني» — اختيارية لأن ملفات أُنشئت قبل هذه الميزة لا تحملها. */
  about?: AboutEntry[];
  visibility: Visibility;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

/** teachers/{id} */
export type Teacher = {
  id: string;
  name: string;
  email: string;
  subjectIds: string[];
  photoUrl: string | null;
  photoPath: string | null;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

/** subjects/{id} */
export type Subject = {
  id: string;
  name: string;
  /** اسم أيقونة Lucide — قابل للتغيير من لوحة الإدارة. */
  icon: string;
  /** مفتاح لون من عائلة الصلصال. */
  tone: string;
  teacherId: string | null;
  order: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MediaItem = {
  id: string;
  kind: MediaKind;
  url: string;
  path: string;
  name: string;
  size: number;
  mime: string;
};

export type LinkItem = {
  id: string;
  url: string;
  label: string;
  kind: LinkKind;
};

/** projects/{id} */
export type Project = {
  id: string;
  studentId: string;
  subjectId: string;
  title: string;
  description: string;
  date: string;
  coverUrl: string | null;
  coverPath: string | null;
  media: MediaItem[];
  links: LinkItem[];
  visibility: Visibility;
  /** مؤرشف: يختفي من الملف والبوابة لكنه لا يُحذف — يُستعاد بضغطة. */
  archived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

/** evaluations/{id} — تقييم واحد لكل (مشروع × معلمة). */
export type Evaluation = {
  id: string;
  projectId: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  teacherName: string;
  /** من 1 إلى 5. */
  stars: number;
  /** شارة التميّز (التاج). */
  badge: boolean;
  comment: string;
  status: EvaluationStatus;
  createdAt: string;
  updatedAt: string;
};

/** achievements/{id} — يشمل الشهادات عبر الحقل kind. */
export type Achievement = {
  id: string;
  studentId: string;
  kind: "achievement" | "certificate";
  title: string;
  description: string;
  date: string;
  imageUrl: string | null;
  imagePath: string | null;
  /** الجهة التي منحت الشهادة — اختياري، ويبقى غائبًا في الإنجاز بلا شهادة. */
  issuer?: string;
  /** تصنيف حرّ تكتبه الطالبة: مسابقة، دورة، مشاركة… لا قائمة مغلقة. */
  category?: string;
  /**
   * رابط الشهادة الأصلية إن كانت ملفًا (PDF مثلًا) على Drive أو غيره.
   * رابط لا ملفًا مرفوعًا: المنصّة تخزّن الوسائط داخل مستندات Firestore
   * (الخطة المجانية بلا Cloud Storage)، وحدّ المستند ~١ ميجابايت،
   * فالـ PDF يتجاوزه غالبًا. صورة الشهادة تُرفع كما هي أعلاه.
   */
  fileUrl?: string | null;
  fileName?: string;
  visibility: Visibility;
  /** مؤرشف: يختفي من الملف لكنه لا يُحذف — يُستعاد بضغطة. */
  archived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

/** settings/app — كل النصوص والألوان القابلة للتغيير دون لمس الكود. */
export type Settings = {
  platformName: string;
  subtitle: string;
  tagline: string;
  schoolName: string;
  gradeLabel: string;
  logoUrl: string | null;
  logoPath: string | null;
  primaryColor: string;
  secondaryColor: string;
  background: string;
  cardRadius: number;
  defaultTheme: string;
  audioUrl: string | null;
  audioPath: string | null;
  audioTitle: string;
  audioEnabled: boolean;
  audioLoop: boolean;
  audioVolume: number;
  features: {
    hero3d: boolean;
    music: boolean;
    qr: boolean;
    publicPortfolios: boolean;
  };
  updatedAt: string;
};

/** activityLogs/{id} */
export type ActivityLog = {
  id: string;
  kind: string;
  message: string;
  actorName: string;
  actorRole: Role | "guest";
  at: string;
};

export const DEFAULT_SETTINGS: Settings = {
  platformName: "إنجازي يحكي",
  subtitle: "ملف الإنجاز الرقمي لطالبات الصف الرابع / 2",
  tagline: "كل إنجاز… يحكي قصة تميّز",
  schoolName: "الابتدائية الخامسة والستون بعد المائة",
  gradeLabel: "الصف الرابع / 2",
  logoUrl: null,
  logoPath: null,
  primaryColor: "#7fdcff",
  secondaryColor: "#ffc96b",
  background: "midnight",
  cardRadius: 28,
  defaultTheme: "lavender",
  audioUrl: "/audio/injazi/nasheed.mp3",
  audioPath: null,
  audioTitle: "إنشودة إنجازي يحكي",
  audioEnabled: true,
  audioLoop: true,
  audioVolume: 0.5,
  features: { hero3d: true, music: true, qr: true, publicPortfolios: true },
  updatedAt: "",
};
