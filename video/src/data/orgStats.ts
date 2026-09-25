/**
 * بيانات "الخريطة التنظيمية والإحصائية" - أملاها المستخدم مباشرة في الطلب
 * نفسه (وليست من ملف PDF)، ونُسخت هنا حرفيًا بنفس الأعداد التي أكّدتها في
 * الرسائل اللاحقة (تصحيح الإداريات إلى 10، إضافة تفصيل رخصة المعلمات،
 * وتصحيح الحالات الصحية إلى 5).
 *
 * هذه الخريطة تحل محل عرض "عدد المعلمات/الطالبات/الفصول" الذي كانت تعرضه
 * StatsIntroScene سابقًا - بناءً على طلب المستخدم الصريح بعدم تكرار هذه
 * الأرقام في مكانين، وبإلغاء رقم "34 موظفة" الإجمالي القديم نهائيًا (لا
 * يُذكر أي مجموع كلي بديل مثل 35 - كل رقم يُعرض مستقلاً كما أملته المستخدم).
 * StatsIntroScene.tsx نفسه لم يُحذف من المشروع، فقط أُزيل من تسلسل هذا
 * الفيديو في SchoolStats.tsx.
 */
export const supervisoryRoles = ["مديرة", "وكيلة", "توجيه طلابي"] as const;

/** تصنيف المعلمات المهني - بيانات مختلفة تمامًا عن رخصة المعلم أدناه (لا علاقة بينهما، أكّدته المستخدمة صراحة). */
export const teacherClassification = {
  expert: 0, // معلم خبير
  advanced: 0, // معلم متقدم
  practitioner: 21, // معلم ممارس
  assistant: 1, // مساعد معلم
} as const;

export const teacherLicense = {
  total: 22,
  licensed: 20,
  notLicensed: 2,
} as const;

export const adminsCount = 10;

export const economicCasesCount = 33;
export const socialCasesCount = 14;

export const healthCases = {
  total: 5,
  sugar: 4,
  epilepsy: 1,
} as const;

/** تُعرض مباشرة بعد بطاقة "الحالة الصحية" - بنود منفصلة، وليست جزءًا من إجمالي healthCases. */
export const specialNeedsCases = {
  gifted: 44, // موهبة
  disability: 0, // إعاقة
  learningDifficulty: 0, // صعوبات تعلم
} as const;
