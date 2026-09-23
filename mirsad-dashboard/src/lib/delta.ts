import { avg } from './format'

/**
 * الفارق عن مؤشر المدرسة بإشارته.
 *
 * الفروق هنا بالمئات (٢٫٧٢ إلى ٢٫٨٤)، وعلى مسطرة من ١ إلى ٣ تبدو
 * الأشرطة متطابقة. ولا يُقصّ المقياس ليبدو الفارق أكبر مما هو — ذلك
 * تهويل — بل يُكتب الفارق رقمًا إلى جانب الشريط الصادق.
 */
export function delta(mean: number, school: number): string {
  const d = mean - school
  if (Math.abs(d) < 0.005) return '='
  return `${d > 0 ? '+' : '−'}${avg(Math.abs(d))}`
}

