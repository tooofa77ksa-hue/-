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

/**
 * أدوات النسب: تُطرح لأن «محمد بن سلمان» و«محمد سلمان» شخص واحد.
 */
const LINEAGE = new Set(['بن', 'ابن', 'بنت'])

/**
 * صدور الأسماء المركّبة: تُلحَق بما بعدها لا تُطرح.
 *
 * «أبو مسعود» و«أبومسعود» اسم واحد كُتب بمسافة مرة وبغيرها مرة،
 * وكذلك «عبد الله» و«عبدالله». فطرحُ الصدر يُبقي «مسعود» أمام
 * «أبومسعود» فلا يلتقيان، ووصلُه يجعلهما مفتاحًا واحدًا.
 *
 * وهذا ليس تجميلًا: طالبة كتبت اسمها «سلمى يحيى أبو مسعود» واسمها
 * في الكشف «سلمى يحيى محمد أبومسعود» لم يُرشَّح لها اسمٌ إطلاقًا،
 * فظهرت في كشف غير المشاركات وهي قد شاركت.
 */
const COMPOUND = new Set(['عبد', 'ابو', 'ابي', 'ام', 'ال', 'ذو', 'ذي', 'بو'])

export function coreTokens(name: string): string[] {
  const raw = normalizeArabic(name).split(' ').filter(Boolean)
  const out: string[] = []
  for (let i = 0; i < raw.length; i += 1) {
    const token = raw[i]
    if (LINEAGE.has(token)) continue
    if (COMPOUND.has(token) && i + 1 < raw.length && !LINEAGE.has(raw[i + 1])) {
      out.push(token + raw[i + 1])
      i += 1
      continue
    }
    out.push(token)
  }
  return out
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
