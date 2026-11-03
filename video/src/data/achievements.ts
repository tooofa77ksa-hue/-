/**
 * بيانات مقطع "منجزات المدرسة" (نسخة مُعاد بناؤها بالكامل بأربعة أقسام:
 * منجزات المدرسة، مسابقة قادمون، منجزات المعلمات، الموهوبات). كل نص/اسم/
 * سنة هنا إمّا أملاه المستخدم مباشرة في الطلب، أو مقروء حرفيًا من صور
 * الشهادات الأصلية المرفوعة (public/achievements/*) - لا رقم أو اسم أو
 * سنة تم اختراعها. الشهادات نفسها تُعرض كصور كما هي، بلا أي تعديل أو
 * إعادة توليد.
 */

export type SchoolAchievement = {
  image: string;
  caption: string;
};

/** الترتيب مطابق تمامًا لترتيب طلب المستخدم (1-6). */
export const schoolAchievements: SchoolAchievement[] = [
  {
    image: "achievements/school-01-middle-east-expo-teacher-day.jpg",
    caption: "المساهمة في معرض الشرق الأوسط للتعليم والتدريب – يوم المعلم",
  },
  {
    image: "achievements/school-02-national-day-94.jpg",
    caption: "مشاركة مميزة في تفعيل اليوم الوطني",
  },
  {
    image: "achievements/school-03-nawabigh-1445.jpg",
    caption: "مبادرة نوابغ المستقبل – 1445هـ",
  },
  {
    image: "achievements/school-04-middle-east-expo-1446.jpg",
    caption: "المشاركة في معرض الشرق الأوسط للتعليم والتدريب – 1446هـ",
  },
  {
    image: "achievements/school-05-design-thinking-workshop.jpg",
    caption: "ورشة التفكير التصميمي – 1447هـ",
  },
  {
    image: "achievements/school-06-national-day-95-painting.png",
    caption: "إنجاح معرض مسابقة أجمل لوحة – اليوم الوطني السعودي 95",
  },
];

export type CompetitionRank = {
  rank: "الأول" | "الثاني" | "الثالث";
  grade: string;
  year: string;
  standout?: boolean;
};

export const competitionName = "مسابقة قادمون";

/** بيانات ونتائج معتمدة سابقًا في المشروع - لم تُغيَّر المراكز أو الأعوام. */
export const competitionRanks: CompetitionRank[] = [
  { rank: "الثالث", grade: "الصف السادس", year: "1446 هـ" },
  { rank: "الأول", grade: "الصف الرابع", year: "1447 هـ", standout: true },
  { rank: "الثاني", grade: "الصف الخامس", year: "1447 هـ" },
  { rank: "الثالث", grade: "الصف الثالث", year: "1447 هـ" },
];

export type TeacherAchievement = {
  name: string;
  achievement: string;
  image: string;
};

/** الترتيب مطابق تمامًا لترتيب طلب المستخدم (حنان آل عوض، فوزية الحربي، حنان العمري). */
export const teacherAchievements: TeacherAchievement[] = [
  {
    name: "حنان آل عوض",
    achievement: "المعلم المتميز",
    image: "achievements/teacher-hanan-alawad.jpg",
  },
  {
    name: "فوزية الحربي",
    achievement: "المعلم المتميز",
    image: "achievements/teacher-fawzia-alharbi.jpg",
  },
  {
    name: "حنان العمري",
    achievement: "مشاركة فاعلة في أسبوع الفضاء العالمي 2025",
    image: "achievements/teacher-hanan-alomari.jpg",
  },
];

export type HonoredStudent = {
  /** الاسم الرباعي الكامل كما هو مطبوع على الشهادة الأصلية - يُستخدم فقط كمرجع، لم يعد يُعرض حرفيًا على الشاشة في هذه النسخة. */
  name: string;
  /** اسم مختصر للعرض على الشاشة وللسرد الصوتي، بنفس صياغة طلب المستخدم الأخير. */
  shortName: string;
  achievement: string;
  standout?: boolean;
  certificate: string;
};

export const honoredStudents: HonoredStudent[] = [
  {
    name: "تالا ماجد فالح البكيري المالكي",
    shortName: "تالا المالكي",
    achievement: "موهبة استثنائية",
    standout: true,
    certificate: "certificates/tala-certificate.jpg",
  },
  {
    name: "ريمان حسين عبد الله",
    shortName: "ريمان",
    achievement: "موهبة",
    certificate: "certificates/reyman-certificate.jpg",
  },
];
