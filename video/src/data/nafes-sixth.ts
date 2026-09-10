import type { NafesCardData } from "./types";

/**
 * بيانات بطاقة نافس - الصف السادس الابتدائي
 * مصدر البيانات: public/assets/nafes/nafes-sixth-source.pdf (بطاقة نافس الرسمية،
 * منصة se.etec.gov.sa، العام الدراسي 1447هـ). جميع الأرقام هنا منقولة حرفيًا
 * دون أي تعديل أو تقريب أو اختراع.
 */
export const nafesSixth: NafesCardData = {
  grade: "sixth",
  sourcePdf: "/assets/nafes/nafes-sixth-source.pdf",
  meta: {
    ministryNumber: "S-34225",
    schoolName: "الابتدائية الخامسة والستون بعد المائة",
    schoolGender: "بنات",
    educationAdministration: "الإدارة العامة للتعليم بمحافظة جدة",
    region: "مكة المكرمة",
    stage: "المرحلة الابتدائية",
    grade: "سادس ابتدائي",
    academicYear: "1447هـ",
    totalStudents: 47,
    testedStudents: 47,
  },
  headline: {
    label: "نسبة الطلبة الذين اجتازوا الحد الأدنى للإتقان في المجالات الثلاثة معًا",
    points: [
      { year: 2023, value: 12.5 },
      { year: 2025, value: 62.8 },
      { year: 2026, value: 55.3 },
    ],
    latestChange: -7.5,
  },
  subjects: [
    {
      key: "science",
      label: "العلوم",
      latestChangeProficiency: 8,
      latestChangeAvgScore: 0.92,
      referenceIndicator: [
        { year: 2023, value: 40 },
        { year: 2026, value: 54 },
        { year: 2030, value: 85 },
      ],
    },
    {
      key: "reading",
      label: "القراءة",
      latestChangeProficiency: -19.7,
      latestChangeAvgScore: -7.54,
      referenceIndicator: [
        { year: 2023, value: 36 },
        { year: 2026, value: 50 },
        { year: 2030, value: 82 },
      ],
    },
    {
      key: "math",
      label: "الرياضيات",
      latestChangeProficiency: 8.6,
      latestChangeAvgScore: -1.24,
      referenceIndicator: [
        { year: 2023, value: 33 },
        { year: 2026, value: 48 },
        { year: 2030, value: 80 },
      ],
    },
  ],
  notes:
    "تتضمن البطاقة الرسمية أيضًا توزيع مستويات الأداء ومقارنات المدرسة/إدارة " +
    "التعليم/المملكة لكل مجال فرعي في العلوم والقراءة والرياضيات - راجعي sourcePdf لإضافتها لاحقًا بدقة.",
};
