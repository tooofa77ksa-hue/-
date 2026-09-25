/**
 * بيانات بطاقة نافس - الصف الثالث الابتدائي
 * -----------------------------------------------------------------
 * مصدر البيانات: video/reference/grade3-nafs-card.pdf (المرجع الثابت الأصلي).
 * كل رقم هنا تم التحقق منه بصريًا مقابل صفحات PDF المُصدَّرة في
 * video/reference/grade3-pages/*.png قبل استخدامه في أي رسم متحرك.
 * لا تُعدَّل أي قيمة هنا إلا بعد إعادة التحقق من PDF الأصلي.
 *
 * ملاحظة نطاق: في مخططي "نسبة الطلبة الذين اجتازوا الحد الأدنى
 * للإتقان" (الرياضيات والقراءة)، تتداخل تسمية نقطة "إدارة التعليم"
 * لعام 2025 (رياضيات) وعام 2026 (قراءة) خلف تسمية "المدرسة" في
 * ملف PDF نفسه، بحيث لا يمكن قراءتها بثقة حتى من المستند الأصلي.
 * لذلك اقتصر هذان المخططان على خط "المدرسة" فقط، وهو الرقم صاحب
 * مؤشر التغيّر المعلن أصلًا (+21.5 / -19.7). خطوط "إدارة التعليم"
 * و"المملكة" مُدرجة كاملة وبثقة تامة في مخططي "متوسط درجة الطلبة".
 */

export const schoolInfo = {
  ministryNumber: "S-34225",
  schoolName: "الابتدائية الخامسة والستون بعد المائة",
  schoolGender: "بنات",
  educationAdmin: "الإدارة العامة للتعليم بمحافظة جدة",
  region: "مكة المكرمة",
  stage: "المرحلة الابتدائية",
  grade: "ثالث ابتدائي",
  academicYear: "1447 هـ",
  totalStudents: 49,
  testedStudents: 48,
} as const;

export type YearPoint = { year: 2023 | 2025 | 2026; value: number };

// بطاقة نافس - نسبة الاجتياز في المجالين معًا (الصفحة 1)
export const headline = {
  title: "نسبة الطلبة الذين اجتازوا الحد الأدنى للإتقان في المجالين معًا",
  change: 4.7,
  series: [
    { year: 2023, value: 44.7 },
    { year: 2025, value: 22.4 },
    { year: 2026, value: 27.1 },
  ] satisfies YearPoint[],
};

const threeWay = (school: number, admin: number, kingdom: number) => ({
  school,
  admin,
  kingdom,
});

export const math = {
  // توزيع الطلبة على مستويات الأداء (الصفحة 2)
  distribution: {
    veryLow: 22.9,
    low: 25.0,
    medium: 29.2,
    high: 22.9,
  },
  // متوسط درجة الطلبة (الصفحة 2) - المدرسة/إدارة التعليم/المملكة كلها واضحة بلا أي تداخل
  averageScore: {
    change: 3.06,
    series: [
      { year: 2023, ...threeWay(62.14, 59.71, 58.65) },
      { year: 2025, ...threeWay(60.01, 59.61, 57.55) },
      { year: 2026, ...threeWay(63.07, 60.74, 58.72) },
    ],
  },
  // نسبة الاجتياز للحد الأدنى للإتقان (الصفحة 2) - خط المدرسة فقط (انظر ملاحظة النطاق أعلاه)
  proficiency: {
    title: "نسبة الطلبة الذين اجتازوا الحد الأدنى للإتقان",
    change: 21.5,
    series: [
      { year: 2023, value: 48.9 },
      { year: 2025, value: 30.6 },
      { year: 2026, value: 52.1 },
    ] satisfies YearPoint[],
  },
};

export const reading = {
  // توزيع الطلبة على مستويات الأداء (الصفحة 4)
  distribution: {
    veryLow: 29.2,
    low: 39.6,
    medium: 14.6,
    high: 16.7,
  },
  // متوسط درجة الطلبة (الصفحة 4) - المدرسة/إدارة التعليم/المملكة كلها واضحة بلا أي تداخل
  averageScore: {
    change: -3.85,
    series: [
      { year: 2023, ...threeWay(69.31, 62.34, 61.31) },
      { year: 2025, ...threeWay(66.86, 61.71, 59.56) },
      { year: 2026, ...threeWay(63.01, 60.65, 58.83) },
    ],
  },
  // نسبة الاجتياز للحد الأدنى للإتقان (الصفحة 4) - خط المدرسة فقط (انظر ملاحظة النطاق أعلاه)
  proficiency: {
    title: "نسبة الطلبة الذين اجتازوا الحد الأدنى للإتقان",
    change: -19.7,
    series: [
      { year: 2023, value: 63.8 },
      { year: 2025, value: 53.1 },
      { year: 2026, value: 31.3 },
    ] satisfies YearPoint[],
  },
};

export const performanceLevelLabels = {
  veryLow: "منخفض جدًا",
  low: "منخفض",
  medium: "متوسط",
  high: "مرتفع",
} as const;

export const performanceLevelColors = {
  veryLow: "#a13a3a",
  low: "#e8c33d",
  medium: "#a7ddc4",
  high: "#0f8f5f",
} as const;

export const entityLabels = {
  school: "المدرسة",
  admin: "إدارة التعليم",
  kingdom: "المملكة",
} as const;
