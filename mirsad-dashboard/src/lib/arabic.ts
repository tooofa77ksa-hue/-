/** تطبيع النص العربي للمقارنة والبحث فقط — النص الأصلي يبقى كما هو دائمًا. */

const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g
const PUNCT = /[()[\]{}«»"'.،؛:\-_/\\]/g

export function normalizeArabic(value: string): string {
  if (!value) return ''
  return value
    .normalize('NFKC')
    .replace(TASHKEEL, '')
    .replace(/ـ/g, '')
    .replace(PUNCT, ' ')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const FILLERS = new Set(['بن', 'بنت', 'ال', 'عبد'])

export function coreTokens(name: string): string[] {
  return normalizeArabic(name).split(' ').filter((t) => t && !FILLERS.has(t))
}

/** هل يحتمل أن يكون الاسمان لشخص واحد؟ للمساعدة فقط، لا للدمج التلقائي. */
export function isNameCandidate(a: string, b: string): boolean {
  const x = coreTokens(a)
  const y = coreTokens(b)
  if (!x.length || !y.length || x[0] !== y[0]) return false
  const sx = new Set(x)
  const sy = new Set(y)
  if ([...sx].every((t) => sy.has(t)) || [...sy].every((t) => sx.has(t))) return true
  return x.length >= 2 && y.length >= 2 && x[x.length - 1] === y[y.length - 1]
}
