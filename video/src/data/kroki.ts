/**
 * صفحات كروكي توزيع مرافق المدرسة - مصدرها ملف PDF أرسله المستخدم
 * ("...165...pdf")، مستخدمة كما هي (صور مقصوصة من الصفحات الأصلية بلا أي
 * تعديل على المخطط نفسه) - يضمن هذا عدم تغيير أي غرفة أو ممر أو مدخل أو
 * سلّم، تمامًا كما اشترط المستخدم. الترتيب مطابق لترتيب صفحات الملف
 * ولتسلسل السرد الصوتي.
 */
export type KrokiPage = { image: string; label: string };

export const krokiPages: KrokiPage[] = [
  { image: "kroki/floor-1.png", label: "الموقع الخارجي" },
  { image: "kroki/floor-2.png", label: "الدور الأرضي" },
  { image: "kroki/floor-3.png", label: "الدور الأول" },
  { image: "kroki/floor-4.png", label: "الدور الثاني" },
  { image: "kroki/floor-5.png", label: "الفناء والمرافق" },
  { image: "kroki/floor-6.png", label: "البدروم" },
];
