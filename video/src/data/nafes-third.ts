import type { NafesCardData } from "./types";

/**
 * بيانات بطاقة نافس - الصف الثالث الابتدائي
 * مصدر البيانات: public/assets/nafes/nafes-third-source.pdf (بطاقة نافس الرسمية،
 * منصة se.etec.gov.sa، العام الدراسي 1447هـ). جميع الأرقام هنا منقولة حرفيًا
 * دون أي تعديل أو تقريب أو اختراع. عدّلي هذا الملف فقط عند تحديث البطاقة
 * الرسمية - لا تُعدَّل المكوّنات البصرية لتغيير الأرقام.
 */
export const nafesThird: NafesCardData = {
  grade: "third",
  sourcePdf: "/assets/nafes/nafes-third-source.pdf",
  meta: {
    ministryNumber: "S-34225",
    schoolName: "الابتدائية الخامسة والستون بعد المائة",
    schoolGender: "بنات",
    educationAdministration: "الإدارة العامة للتعليم بمحافظة جدة",
    region: "مكة المكرمة",
    stage: "المرحلة الابتدائية",
    grade: "ثالث ابتدائي",
    academicYear: "1447هـ",
    totalStudents: 49,
    testedStudents: 48,
  },
  headline: {
    label: "نسبة الطلبة الذين اجتازوا الحد الأدنى للإتقان في المجالين معًا",
    points: [
      { year: 2023, value: 44.7 },
      { year: 2025, value: 22.4 },
      { year: 2026, value: 27.1 },
    ],
    latestChange: 4.7,
  },
  subjects: [
    {
      key: "math",
      label: "الرياضيات",
      latestChangeProficiency: 21.5,
      latestChangeAvgScore: 3.06,
      referenceIndicator: [
        { year: 2023, value: 29 },
        { year: 2026, value: 44 },
        { year: 2030, value: 78 },
      ],
    },
    {
      key: "reading",
      label: "القراءة",
      latestChangeProficiency: -21.8,
      latestChangeAvgScore: -3.85,
      referenceIndicator: [
        { year: 2023, value: 30 },
        { year: 2026, value: 45 },
        { year: 2030, value: 78 },
      ],
    },
  ],
  notes:
    "تتضمن البطاقة الرسمية أيضًا توزيع مستويات الأداء ومقارنات المدرسة/إدارة " +
    "التعليم/المملكة لكل مجال فرعي في الرياضيات والقراءة - راجعي sourcePdf لإضافتها لاحقًا بدقة.",
};
