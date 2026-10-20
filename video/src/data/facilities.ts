/**
 * بيانات شريحة "المرافق والتجهيزات" - قائمة ثابتة أملاها المستخدم مباشرة في
 * الطلب نفسه (وليست مستخرجة من ملف PDF)، فلا حاجة لتحقق مقابل مصدر خارجي؛
 * منسوخة هنا حرفيًا بنفس الترتيب والصياغة والأعداد المعطاة.
 */
export type FacilityNode = {
  label: string;
  count: number;
  note?: string;
};

export const facilitiesRoot: FacilityNode = { label: "مكتب مديرة المدرسة", count: 1 };

/** الترتيب مطابق لقسم "الترتيب" في الطلب (العناصر 2-12)، مقسّم بصريًا لصفين. */
export const facilitiesRow1: FacilityNode[] = [
  { label: "مكتب الوكيلة لشؤون الطالبات", count: 1 },
  { label: "مكاتب الإداريات", count: 2 },
  { label: "مكتب التوجيه الطلابي", count: 1 },
  { label: "غرف المعلمات", count: 3 },
  { label: "العيادة المدرسية", count: 1 },
  { label: "معمل العلوم", count: 1 },
];

export const facilitiesRow2: FacilityNode[] = [
  { label: "الصالة الرياضية", count: 1 },
  { label: "غرفة الأرشيف", count: 1 },
  { label: "الساحة المدرسية", count: 1 },
  { label: "المقصف المدرسي", count: 1 },
  { label: "دورات المياه", count: 7, note: "منها 1 مهيأة لذوي الإعاقة" },
];
