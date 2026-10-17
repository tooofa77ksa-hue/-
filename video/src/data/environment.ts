/**
 * بيانات مقطع "البيئة الخارجية" (قبل/بعد) - أربعة عناصر أرسلتها المستخدمة
 * مباشرة كصور حقيقية غير معدَّلة (public/environment/*)، بنفس الترتيب الذي
 * أملته: البيئة الخارجية (شاملة موقف ذوي الإعاقة)، دورة مياه ذوي الإعاقة،
 * الصالة الرياضية، معمل العلوم. صور "قبل" تُعرض كما هي بلا أي تحسين أو
 * فلترة (طلب صريح من المستخدمة أن تبقى بمظهرها الطبيعي)، وصور "بعد" كذلك
 * بلا أي تعديل - الفرق بينهما هو الإنجاز الحقيقي نفسه فقط.
 */
export type EnvironmentItem = {
  title: string;
  before: string;
  after: string;
};

export const environmentItems: EnvironmentItem[] = [
  {
    title: "البيئة الخارجية",
    before: "environment/exterior-before.jpg",
    after: "environment/exterior-after.png",
  },
  {
    title: "دورة مياه ذوي الإعاقة",
    before: "environment/restroom-before.jpg",
    after: "environment/restroom-after.jpg",
  },
  {
    title: "الصالة الرياضية",
    before: "environment/gym-before.png",
    after: "environment/gym-after.png",
  },
  {
    title: "معمل العلوم",
    before: "environment/lab-before.png",
    after: "environment/lab-after.png",
  },
];
