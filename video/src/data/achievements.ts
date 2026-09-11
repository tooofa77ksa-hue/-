/**
 * بيانات شريحة "منجزات المدرسة" - أملاها المستخدم مباشرة في الطلب نفسه
 * (وليست من ملف PDF)، منسوخة هنا حرفيًا بنفس الترتيب والصياغة والأعداد.
 */
export type CompetitionRank = {
  rank: "الأول" | "الثاني" | "الثالث";
  grade: string;
  year: string;
  standout?: boolean;
};

export const competitionName = "مسابقة قادمون";

export const competitionRanks: CompetitionRank[] = [
  { rank: "الثالث", grade: "الصف السادس", year: "1446 هـ" },
  { rank: "الأول", grade: "الصف الرابع", year: "1447 هـ", standout: true },
  { rank: "الثاني", grade: "الصف الخامس", year: "1447 هـ" },
  { rank: "الثالث", grade: "الصف الثالث", year: "1447 هـ" },
];

export type HonoredStudent = {
  name: string;
  achievement: string;
  standout?: boolean;
  certificate: string;
};

/**
 * الأسماء محدَّثة للاسم الكامل الرسمي كما هو مطبوع حرفيًا على شهادة كل
 * طالبة (شهادات شكر وتقدير من موهبة/وزارة التعليم، أرسلها المستخدم وأكّد
 * أنها نفس الطالبتين المقصودتين في السرد). صور الشهادات تُعرض كما هي بلا
 * أي تعديل.
 */
export const honoredStudents: HonoredStudent[] = [
  {
    name: "تالا ماجد فالح البكيري المالكي",
    achievement: "موهبة استثنائية",
    standout: true,
    certificate: "certificates/tala-certificate.jpg",
  },
  {
    name: "ريمان حسين عبد الله",
    achievement: "موهبة",
    certificate: "certificates/reyman-certificate.jpg",
  },
];
