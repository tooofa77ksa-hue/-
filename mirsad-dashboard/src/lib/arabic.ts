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
  // «ال» التعريف تُنزع بعد الوصل لا قبله: «العسيري» و«عسيري» أسرة
  // واحدة، ولو نُزعت قبله لصار «عبد الله» ← «عبد» + «له»
  return out.map((t) => (t.startsWith('ال') && t.length >= 5 ? t.slice(2) : t))
}

/**
 * فكّ الكلمة الملتصقة إذا كان فكّها يوافق الطرف الآخر.
 *
 * طالبة كتبت اسمها «سماعبدالله العلوي» بلا مسافة بين «سما» و«عبدالله»،
 * واسمها في الكشف «سما عبدالله بن عتيق العلوي». فلا الكلمة تساوي
 * «سما» ولا «عبدالله»، ولا يلتقيان. فإن كانت الكلمة تبدأ بكلمةٍ عند
 * الطرف الآخر وبقيّتها كلمةٌ عنده أيضًا، فهي كلمتان التصقتا.
 *
 * والشرط مزدوج عمدًا — الصدر والبقيّة كلاهما عند الطرف الآخر — كي لا
 * تُفكّ كلمةٌ بمجرّد أنها تبدأ بحروف اسمٍ آخر.
 */
function unglue(tokens: string[], other: string[]): string[] {
  const out: string[] = []
  for (const token of tokens) {
    if (token.length >= 6 && !other.includes(token)) {
      const head = other.find((o) => o.length >= 2 && token.startsWith(o)
        && other.includes(token.slice(o.length)))
      if (head) { out.push(head, token.slice(head.length)); continue }
    }
    out.push(token)
  }
  return out
}


/**
 * هيكل الاسم الصامت — جسرٌ بين الحرف العربي واللاتيني.
 *
 * في الكشوف أسماء مكتوبة بالإنجليزية، والطالبة تكتب اسمها بالعربية
 * في القياس. فلا يلتقيان حرفًا بحرف وهما اسم واحد:
 * «SEBA HASSAN ABDALLAH» و«صبا حسن عبدالله».
 *
 * فيُردّ كلٌّ منهما إلى هيكله الصامت: تُنقل الحروف العربية إلى ما
 * يقابلها لاتينيًّا، ثم تُطرح الحركات (a e i o u) ويُدمج المكرّر.
 * فيصير الاسمان «sb hsn bdllh» كلاهما.
 *
 * وهو تقريبٌ لا تحقيق: غايته أن يُرشَّح الاسمان للإدارة فتنظر،
 * لا أن يُدمجا تلقائيًّا.
 */
const TO_LATIN: Record<string, string> = {
  ا: 'a', أ: 'a', إ: 'a', آ: 'a', ب: 'b', ت: 't', ث: 't', ج: 'j', ح: 'h', خ: 'k',
  د: 'd', ذ: 'd', ر: 'r', ز: 'z', س: 's', ش: 's', ص: 's', ض: 'd', ط: 't', ظ: 'z',
  ع: '', غ: 'g', ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'h', ة: 'h',
  و: 'w', ي: 'y', ى: 'y', ئ: 'y', ؤ: 'w', ء: '',
}

const VOWELS = /[aeiou]/g

/** هل في النص حرف لاتيني؟ */
export function isLatinScript(text: string): boolean {
  return /[A-Za-z]{2,}/.test(text ?? '')
}

export function consonantKey(name: string): string {
  const letters = [...(name ?? '').toLowerCase()]
    .map((ch) => (TO_LATIN[ch] !== undefined ? TO_LATIN[ch] : ch))
    .join('')
  return letters
    .replace(/[^a-z\s]/g, ' ')
    .replace(VOWELS, '')
    // الواو والياء في وسط الكلمة حرفا مدٍّ لا صامتان: «كونغرات» تُكتب
    // «KONGRAT» بلا واو. وأوّل الكلمة يبقى، فهو صامت: «وفاء»، «يارا»
    .replace(/(?<=\S)[wy]/g, '')
    .replace(/(.)\1+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * هل الاسمان واحد وإن اختلف حرفهما؟
 *
 * لا يُسأل عنه إلا حين يختلف الخطّان، فلا يُضعف المقارنة العربية.
 */
export function isTransliterationOf(a: string, b: string): boolean {
  if (isLatinScript(a) === isLatinScript(b)) return false
  const x = consonantKey(a).split(' ').filter(Boolean)
  const y = consonantKey(b).split(' ').filter(Boolean)
  if (x.length < 2 || y.length < 2) return false
  if (x[0] !== y[0]) return false
  const shared = y.filter((t) => x.includes(t)).length
  return shared >= Math.min(x.length, y.length)
}

/** هل يحتمل أن يكون الاسمان لشخص واحد؟ للمساعدة فقط، لا للدمج التلقائي. */
export function isNameCandidate(a: string, b: string): boolean {
  if (isTransliterationOf(a, b)) return true
  const ax = coreTokens(a)
  const by = coreTokens(b)
  const x = unglue(ax, by)
  const y = unglue(by, x)
  if (!x.length || !y.length || x[0] !== y[0]) return false
  const sx = new Set(x)
  const sy = new Set(y)
  if ([...sx].every((t) => sy.has(t)) || [...sy].every((t) => sx.has(t))) return true
  return x.length >= 2 && y.length >= 2 && x[x.length - 1] === y[y.length - 1]
}
