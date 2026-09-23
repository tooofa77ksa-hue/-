/**
 * الآراء المتشابهة.
 *
 * عشرون طالبة تكتب عن دورات المياه بعشرين عبارة مختلفة، والمشكلة
 * واحدة والإجراء واحد. لو ربطت الإدارة كل رأي بإجراء مستقل لقرأت
 * الوزارة عشرين مشكلة، ولضاع أن هذه هي الشكوى الأكثر تكرارًا.
 *
 * فهذا الملف يقترح — ولا يقرّر: يرشّح الآراء التي تشترك في كلماتها
 * الدالّة، وتبقى الإدارة هي التي تؤكّد. لا يُدمج رأيٌ تلقائيًا، ولا
 * يُحرَّر نص طالبة قط؛ التطبيع للمقارنة وحدها.
 */
import { normalizeArabic } from './arabic'
import type { Suggestion } from '../domain/types'

/**
 * كلمات لا تدلّ على موضوع.
 *
 * وجودها يجعل «لا يوجد شيء» و«لا أريد شيئًا» متطابقين، وهما لا
 * يتحدثان عن شيء أصلًا. فتُطرح قبل المقارنة.
 */
const STOP = new Set([
  'في', 'من', 'الى', 'على', 'عن', 'مع', 'او', 'ثم', 'حتي', 'اذا', 'ان', 'انه',
  'لا', 'ما', 'لم', 'لن', 'قد', 'كل', 'بعض', 'غير', 'هذا', 'هذه', 'ذلك', 'تلك',
  'التي', 'الذي', 'الذين', 'هو', 'هي', 'هم', 'هن', 'نحن', 'انا', 'انت', 'يا',
  'كان', 'يكون', 'تكون', 'يوجد', 'توجد', 'اريد', 'نريد', 'ارجو', 'نرجو', 'ياريت',
  'لو', 'ليت', 'عشان', 'علشان', 'كي', 'كيف', 'جدا', 'ايضا', 'فقط', 'بس', 'يعني',
  'شي', 'شيء', 'اشياء', 'كثير', 'قليل', 'مره', 'مرات', 'كذا', 'هكذا', 'اي',
  'اقتراح', 'اقتراحات', 'مقترح', 'راي', 'ارا', 'والله', 'الله', 'عند', 'عندنا',
])

/** سوابق تُنزع ليلتقي «الحمامات» و«بالحمامات» و«والحمامات». */
const PREFIX = /^(وال|بال|كال|فال|لل|ال|و|ب|ف|ل)(?=.{3,})/

/** لواحق الجمع والإضافة: «دورات» و«دوره»، «صفنا» و«صف». */
const SUFFIX = /(هما|كما|هن|هم|ها|كم|نا|ه|ي|ات|ان|ون|ين|ه)$/

/**
 * جذع تقريبي للكلمة.
 *
 * ليس تحليلًا صرفيًا: الغاية أن تلتقي صيغ الكلمة الواحدة في مفتاح
 * واحد. وما أخطأ منه لا يضرّ — أسوأ أثره أن يفوت اقتراحٌ تراه
 * الإدارة بعينها في القائمة.
 */
function stem(word: string): string {
  const body = word.replace(PREFIX, '')
  const base = body.length >= 5 ? body.replace(SUFFIX, '') : body
  return base.length >= 2 ? base : body
}

/**
 * الكلمات الدالّة في نصّ رأي: جذعُها للمقارنة، وصورتُها كما كتبتها
 * الطالبة للعرض.
 *
 * فالمقارنة تحتاج «نظاف» ليلتقي «نظافة» و«النظافه»، والعرض يحتاج
 * «نظافة» لأن «نظاف» ليست كلمة تُقرأ في تقرير يرفع إلى الوزارة.
 */
export function contentPairs(text: string): { key: string; word: string }[] {
  const seen = new Map<string, string>()
  // يُمشى على كلمات النصّ الأصلي كي تُحفظ صورتها («نظافة» بتاء مربوطة)،
  // ويُطبَّع كلٌّ منها على حدة لاستخراج مفتاح المقارنة
  for (const original of text.split(/[\s.،؛:()[\]{}«»"'\-_/\\]+/)) {
    const normal = normalizeArabic(original)
    if (!normal || normal.includes(' ') || normal.length < 2 || STOP.has(normal)) continue
    const key = stem(normal)
    if (key.length < 2 || STOP.has(key) || seen.has(key)) continue
    seen.set(key, original)
  }
  return [...seen.entries()].map(([key, word]) => ({ key, word }))
}

/** الكلمات الدالّة في نصّ رأي، بلا تكرار. */
export function contentTokens(text: string): string[] {
  return contentPairs(text).map((p) => p.key)
}

/**
 * معامل دايس بين مجموعتي كلمات: ضِعف المشترك على مجموع الحجمين.
 *
 * فُضِّل على «عدد المشترك» وحده لأن رأيًا طويلًا يشترك مصادفةً مع كل
 * شيء، وعلى «جاكار» لأنه أرحم باختلاف الطول: «الحمامات وسخة» و«نرجو
 * الاهتمام بنظافة دورات المياه» يستحقّان أن يلتقيا.
 */
export function similarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const set = new Set(b)
  let shared = 0
  for (const token of a) if (set.has(token)) shared += 1
  return (2 * shared) / (a.length + b.length)
}

/** أقلّ تشابه يُعرض اقتراحًا — عُوير على آراء القياس الفعلية. */
export const SIMILAR_THRESHOLD = 0.34

/**
 * أقلّ عدد كلمات دالّة حتى يُقارَن الرأي أصلًا.
 *
 * «لا يوجد» و«لا شيء» و«لا اقتراح» تتشابه تمامًا بعد التطبيع، وليست
 * موضوعًا يُتَّخذ عليه إجراء. فما نقص عن كلمتين دالّتين لا يُرشَّح
 * ولا يُرشَّح له.
 */
const MIN_TOKENS = 2

export interface SimilarVoice {
  voice: Suggestion
  score: number
  /** الكلمات التي جمعت الرأيين — تُعرض للإدارة كي ترى سبب الترشيح. */
  shared: string[]
}

/**
 * آراء تشبه رأيًا بعينه، من الأقرب إلى الأبعد.
 *
 * تُستبعد الآراء المرتبطة بإجراء: لها جوابها، وضمّها هنا يوهم الإدارة
 * أن عليها ربطها من جديد.
 */
export function similarTo(
  target: Suggestion,
  pool: Suggestion[],
  minimum = SIMILAR_THRESHOLD,
): SimilarVoice[] {
  const mine = contentTokens(target.text)
  if (mine.length < MIN_TOKENS) return []
  const set = new Set(mine)

  const out: SimilarVoice[] = []
  for (const other of pool) {
    if (other.id === target.id) continue
    const pairs = contentPairs(other.text)
    if (pairs.length < MIN_TOKENS) continue
    const score = similarity(mine, pairs.map((p) => p.key))
    if (score < minimum) continue
    // تُعرض الكلمة كما كتبتها الطالبة لا كجذعها
    out.push({ voice: other, score, shared: pairs.filter((p) => set.has(p.key)).map((p) => p.word) })
  }
  return out.sort((a, b) => b.score - a.score || a.voice.id.localeCompare(b.voice.id))
}

/**
 * تجميع كل الآراء في عناقيد متشابهة — للتقرير لا للشاشة.
 *
 * عنقود واحد لكل موضوع متكرّر، ورأس العنقود أكثرها كلماتٍ دالّة لأنه
 * أوضحها عبارةً. والعناقيد مرتّبة بالحجم: أكثر ما تكرّر أولًا، وهو
 * أول ما تسأل عنه الوزارة.
 */
/**
 * أوضح صورة كُتبت بها الكلمة.
 *
 * تُقدَّم الصورة الخالية من حرف جرٍّ ملتصق: «نظافة» أولى من «بنظافة»،
 * و«الساحة» أولى من «للساحة» — لأن هذا عنوانُ موضوعٍ يُقرأ في تقرير،
 * لا مفتاحُ مقارنة.
 */
function pickForm(byForm: Map<string, number> | undefined, fallback: string): string {
  const options = [...(byForm ?? new Map<string, number>()).entries()]
  if (options.length === 0) return fallback
  const bare = (word: string) => (PREFIX.test(word) ? 0 : 1)
  options.sort((a, b) => bare(b[0]) - bare(a[0]) || b[1] - a[1] || b[0].length - a[0].length)
  return options[0][0]
}

export interface VoiceCluster {
  head: Suggestion
  members: Suggestion[]
  /** الكلمات المشتركة بين أغلب أعضاء العنقود. */
  keywords: string[]
}

export function clusterVoices(
  voices: Suggestion[],
  minimum = SIMILAR_THRESHOLD,
): VoiceCluster[] {
  const eligible = voices
    .map((v) => ({ voice: v, tokens: contentTokens(v.text) }))
    .filter((v) => v.tokens.length >= MIN_TOKENS)
    .sort((a, b) => b.tokens.length - a.tokens.length || a.voice.id.localeCompare(b.voice.id))

  const taken = new Set<string>()
  const clusters: VoiceCluster[] = []

  for (const seed of eligible) {
    if (taken.has(seed.voice.id)) continue
    taken.add(seed.voice.id)
    const members = [seed.voice]
    const tally = new Map<string, number>()
    /** أشهر صورة كُتبت بها كل كلمة بين أعضاء العنقود. */
    const forms = new Map<string, Map<string, number>>()
    const absorb = (voice: { key: string; word: string }[]) => {
      for (const { key, word } of voice) {
        tally.set(key, (tally.get(key) ?? 0) + 1)
        const byForm = forms.get(key) ?? new Map<string, number>()
        byForm.set(word, (byForm.get(word) ?? 0) + 1)
        forms.set(key, byForm)
      }
    }
    absorb(contentPairs(seed.voice.text))

    for (const candidate of eligible) {
      if (taken.has(candidate.voice.id)) continue
      if (similarity(seed.tokens, candidate.tokens) < minimum) continue
      taken.add(candidate.voice.id)
      members.push(candidate.voice)
      absorb(contentPairs(candidate.voice.text))
    }

    if (members.length < 2) continue
    const keywords = [...tally.entries()]
      .filter(([, n]) => n > members.length / 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key]) => pickForm(forms.get(key), key))
    clusters.push({ head: seed.voice, members, keywords })
  }

  return clusters.sort((a, b) => b.members.length - a.members.length)
}
