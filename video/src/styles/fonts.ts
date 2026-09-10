import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const arabicFontFamily = "Tajawal";

/**
 * تحميل خط Tajawal من ملفات محلية (public/assets/fonts/tajawal) بدل جلبه
 * من شبكة Google Fonts وقت الرندر - بيئات الرندر المعزولة (بلا وصول شبكي،
 * أو خلف بروكسي بشهادة غير موثوقة لدى Chromium) تفشل في تحميل الخط عبر
 * @remotion/google-fonts لأنه يجلب الملفات فعليًا في كل مرة. الملفات هنا
 * محفوظة في المستودع نفسه فتعمل دون أي اتصال إطلاقًا في أي بيئة رندر.
 * راجعي public/assets/fonts/README.md لاستبدال هذه الملفات بخط الهوية
 * الرسمي "Helvetica Neue W23 for SKY" عند توفره.
 */
const weights: Array<{ weight: string; file: string }> = [
  { weight: "400", file: "tajawal-400.woff2" },
  { weight: "500", file: "tajawal-500.woff2" },
  { weight: "700", file: "tajawal-700.woff2" },
  { weight: "800", file: "tajawal-800.woff2" },
  { weight: "900", file: "tajawal-900.woff2" },
];

let loaded: Promise<void> | null = null;

export function ensureArabicFontLoaded(): Promise<void> {
  if (!loaded) {
    loaded = Promise.all(
      weights.map(({ weight, file }) =>
        loadFont({
          family: arabicFontFamily,
          url: staticFile(`fonts/tajawal/${file}`),
          weight,
          style: "normal",
          format: "woff2",
        }),
      ),
    ).then(() => undefined);
  }
  return loaded;
}
