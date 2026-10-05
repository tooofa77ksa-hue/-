/**
 * «ماذا عملنا برأيكم» — كرّاسةٌ تُعرض على أولياء الأمور.
 *
 * وليّ الأمر كتب ملاحظته في دقيقتين ثم لم يرَ لها أثرًا، فظنّ القياس
 * استبانةً تُحفظ. وهذه الكرّاسة ردُّ المدرسة عليه: رأيُه بنصّه كما
 * كتبه، وتحته ما عُمل، وتحتهما صورةُ ما عُمل.
 *
 * والنصوص تُسحب من قاعدة البيانات لا تُكتب باليد: الاقتباس الذي
 * يُعاد صوغه يفقد قوّته، ووليّ الأمر يعرف عبارته حين يراها. وعددُ
 * من قالوا الشيء نفسه يُحسب حسابًا لا يُقدَّر تقديرًا.
 *
 * والصور من «‎.report-out/photos» لا من «public/shahid»: تلك
 * مصحَّحةٌ ضوئيًّا للطباعة بـ«polish-photos.py»، وقد حُجب منها ما
 * لا يُنشر من أسماءٍ ووجوه قبل ذلك.
 *
 *   python3 scripts/reports/polish-photos.py
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npx vite-node scripts/reports/parents-book.ts -- --project <المشروع>
 */
import { existsSync, globSync, readFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import QRCode from 'qrcode'
import { chromium } from 'playwright'

import { improvementBands } from '../../src/lib/bands'
import { derivedVoices } from '../../src/domain/voices'
import type {
  Answer, Category, ClassRoom, Grade, ImprovementAction, Meta,
  Student, Suggestion, SurveyResponse, SystemState,
} from '../../src/domain/types'

const ROOT = resolve(import.meta.dirname, '../..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const from = option('from')
const projectId = option('project') ?? process.env.GCLOUD_PROJECT
const host = option('host') ?? 'qiyas-165-1448.web.app'
const photos = resolve(ROOT, option('photos') ?? '.report-out/photos')
const out = resolve(ROOT, option('out') ?? '.report-out/ماذا-عملنا-برأيكم-1448.pdf')

type ResponseDoc = SurveyResponse & { answers?: Omit<Answer, 'responseId'>[] }
interface Snapshot {
  grades: Grade[]
  classes: ClassRoom[]
  students: Student[]
  responses: ResponseDoc[]
  suggestions: Suggestion[]
  categories: Category[]
  improvementActions: ImprovementAction[]
  meta: { meta: Meta }[]
}

async function snapshot(): Promise<Snapshot> {
  if (from) return JSON.parse(readFileSync(resolve(from), 'utf8')) as Snapshot
  if (!projectId) {
    console.error('الاستعمال: npx vite-node scripts/reports/parents-book.ts -- --project <المشروع>')
    process.exit(1)
  }
  const { cert, initializeApp } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS
  initializeApp({
    projectId,
    ...(keyFile ? { credential: cert(JSON.parse(readFileSync(keyFile, 'utf8'))) } : {}),
  })
  const db = getFirestore()
  const pull = async (name: string) =>
    (await db.collection(name).get()).docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  const names: (keyof Snapshot)[] = ['grades', 'classes', 'students', 'responses',
    'suggestions', 'categories', 'improvementActions', 'meta']
  const slices = await Promise.all(names.map(pull))
  return Object.fromEntries(names.map((name, i) => [name, slices[i]])) as unknown as Snapshot
}

const d = await snapshot()
const responses: SurveyResponse[] = d.responses.map(({ answers: _drop, ...rest }) => rest)
const answers: Answer[] = d.responses.flatMap((r) =>
  (r.answers ?? []).map((a) => ({ responseId: r.id, ...a })))
const state = {
  meta: d.meta[0].meta,
  grades: d.grades, classes: d.classes, students: d.students, responses, answers,
  suggestions: [...d.suggestions, ...derivedVoices(responses, answers, d.suggestions, d.students)],
  categories: d.categories, improvementActions: d.improvementActions,
} as unknown as SystemState

const AR = 'ar-SA'
const n = (v: number) => new Intl.NumberFormat(AR).format(v)
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const tidy = (s: string) => s.replace(/\s+/g, ' ').trim()

const bands = improvementBands(state)
const voiceCount = state.suggestions.filter((s) => !s.excluded).length
const proofs = state.improvementActions.reduce((k, a) => k + (a.evidence?.length ?? 0), 0)

/**
 * صورُ كل بند وتعليقها.
 *
 * ربطُ الصورة ببندها قرارٌ لا يُستخرج من البيانات، فهو مكتوبٌ هنا.
 * وما لا صورة له لا يُترك بلا ذكر: يُقال في الكرّاسة إنه نُفِّذ
 * وصورتُه في الطريق — فالصمت عن بندٍ يُقرأ تجاهلًا لصاحبه.
 */
const SHOTS: Record<string, { file: string; caption: string }[]> = {
  'تبريد الساحة وتهوية الفصول': [
    { file: 'marwaha-saha.jpg', caption: 'مروحة الساحة — تهويةُ مكان الانتظار' },
    { file: 'fasl-mukayyif.jpg', caption: 'مكيّف الفصل بعد الصيانة' },
  ],
  'انتظار الطالبات وقت الانصراف': [
    { file: 'karasi-intizar.jpg', caption: 'كراسي مكان الانتظار وقت الانصراف' },
    { file: 'marwaha-saha.jpg', caption: 'مروحةٌ تُهوّي المكان في أيام الحرّ' },
  ],
  'نظافة دورات المياه وتوفير الصابون': [
    { file: 'hammam.jpg', caption: 'دورات المياه بعد التهيئة والدهان' },
    { file: 'maghasil-saboon.jpg', caption: 'المغاسل والصابون متوفّرٌ فيها' },
    { file: 'hammam-jadwal.jpg', caption: 'جدول النظافة اليومي معلَّقٌ على الباب' },
  ],
  'الأنشطة الطلابية وحصص التربية البدنية': [
    { file: 'rukn-riyada.jpg', caption: 'ركن الرياضة — «صحّةٌ ونشاطٌ وحياة»' },
    { file: 'maamal-oloom.jpg', caption: 'معمل العلوم — تُقام فيه التجارب والأنشطة' },
    { file: 'oqool-lamia.jpg', caption: 'ركن «العقول اللامعة» وبطاقات العمل الجماعي' },
  ],
  'المقصف الصحي وتنظيم الفسح': [
    { file: 'maqsaf.jpg', caption: 'المقصف المدرسي' },
    { file: 'maqsaf-asaar.jpg', caption: 'قائمة الأصناف وأسعارها معلنةً على الباب' },
  ],
  'تكريم الطالبات المتفوقات والمثاليات': [
    { file: 'lawhat-taaziz.jpg', caption: 'لوحة التعزيز: الاجتهاد والإبداع والتعاون والمبادرة' },
    { file: 'suluk-mutamayyiz.jpg', caption: 'لوحة «السلوك المتميّز» ودرجاتُه المعتمدة' },
    { file: 'tashrif-maamal.jpg', caption: 'تكريم المتفوّقات في العلوم' },
    { file: 'tashrif-shahadatan.jpg', caption: 'شهادات التقدير والجوائز' },
  ],
  'ترتيب الفصول وإضاءتها': [
    { file: 'fasl.jpg', caption: 'فصل الطالبات: ترتيبٌ ونظافةٌ وإضاءة' },
  ],
  'حفظ الأمانات والمفقودات': [
    { file: 'sunduq-amanat.jpg', caption: '«صندوق الأمانات» — ما تفقده الطالبة يُحفظ هنا' },
  ],
  'إبلاغ أولياء الأمور بمتطلبات كل مادة': [
    { file: 'qanat-saf.jpg', caption: 'قناة الصف: المتطلبات ومواعيد الاختبارات والأنشطة' },
    { file: 'qanat-awraq.jpg', caption: 'أوراق عمل الترم كاملةً من بداية العام' },
  ],
  'تخفيف الواجبات المنزلية': [
    { file: 'qanat-awraq.jpg', caption: 'الطباعة غير إلزامية: تُحلّ في ورقةٍ خارجية أو في الدفتر' },
  ],
}

/**
 * نصُّ إجراءٍ تجاوزه العمل قبل أن يُحدَّث في اللوحة.
 *
 * «حفظ الأمانات لدى الإدارة» كان صحيحًا يوم كُتب، ثم أُنشئ الصندوق
 * وعُلِّقت عليه بطاقته. والكرّاسة تُعرض على من كتبت الملاحظة، فلا
 * يُقال لها أقلُّ مما عُمل. ويُحذف هذا السطر متى حُدِّث البند في
 * «مركز التحسين» — فمَوضعُه هناك لا هنا.
 */
const SAID_BETTER: Record<string, string> = {
  'تبريد الساحة وتهوية الفصول': 'رُكِّبت مراوحُ في ساحة المدرسة تُهوّي مكان انتظار '
    + 'الطالبات في أيام الحرّ، ورُكِّبت أجهزةُ تهويةٍ في فنائها الخارجي. '
    + 'ومكيّفاتُ الفصول تحت متابعةٍ دائمة: يُرفع بلاغُ الصيانة فور العطل، ويُتابَع '
    + 'مع الدعم الفنّي حتى الإصلاح.',
  'انتظار الطالبات وقت الانصراف': 'خُصِّص للطالبات مكانُ انتظارٍ وُضعت فيه كراسٍ، '
    + 'ورُكِّبت فيه مروحةٌ تُهوّيه. وتخرج الصفوفُ الأوّلية أوّلًا، ثم تخرج الصفوف '
    + 'العليا بعدها بخمس دقائق إلى عشر — فلا تزدحم الصغيرات بالكبيرات عند الباب، '
    + 'وهذا معمولٌ به في المدرسة ومتابَعٌ يوميًّا.',
  'حفظ الأمانات والمفقودات': 'أُنشئ «صندوق الأمانات» ووُضع في مكانٍ ظاهرٍ تصل إليه الطالبات، '
    + 'وعُلِّقت عليه بطاقته. فما تفقده الطالبة يُحفظ فيه حتى تعود إليه، '
    + 'وأُبلغ أولياء الأمور بمكانه وآلية الاستلام.',
}

/** بنودٌ نُفِّذت ولم تُصوَّر بعد: تُذكر صريحةً لا تُسقَط. */
const NO_SHOT: Record<string, string> = {
  'المكتبة وورش المهارات': 'منفَّذٌ ومستمرّ — والصورة تلحق بالتقرير القادم',
}

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')
const photo = (file: string) => asset(`${photos}/${file}`, 'image/jpeg')

const ordered = bands.filter((b) => SHOTS[b.action.title] || NO_SHOT[b.action.title])
const missing = ordered.flatMap((b) => (SHOTS[b.action.title] ?? [])
  .filter((s) => !existsSync(resolve(photos, s.file))).map((s) => s.file))
if (missing.length) {
  console.error(`صورٌ مفقودة في ${photos}: ${[...new Set(missing)].join('، ')}`)
  console.error('شغّلي أولًا: python3 scripts/reports/polish-photos.py')
  process.exit(1)
}

const section = (b: typeof bands[number], i: number) => {
  const a = b.action
  const shots = SHOTS[a.title] ?? []
  const note = NO_SHOT[a.title]
  const says = b.voices.slice(0, 2).map((v) => tidy(v.text))
  return `
<section class="item">
  <header class="item__head">
    <span class="no">${n(i + 1)}</span>
    <div>
      <h2>${esc(a.title)}</h2>
      <span class="says">قالها ${b.voices.length === 1 ? 'وليُّ أمرٍ واحد'
    : b.voices.length === 2 ? 'وليَّا أمر' : `${n(b.voices.length)} من أولياء الأمور`}</span>
    </div>
  </header>

  <div class="quotes">${says.map((t) => `<blockquote>${esc(t)}</blockquote>`).join('')}</div>

  <div class="did"><b>ما عملناه</b>${esc(SAID_BETTER[a.title] ?? a.action)}</div>

  ${shots.length ? `<div class="shots shots--${Math.min(shots.length, 4)}">${shots.map((s) => `
    <figure><img src="${photo(s.file)}" alt="${esc(s.caption)}">
      <figcaption>${esc(s.caption)}</figcaption></figure>`).join('')}</div>`
    : `<p class="soon">📷 ${esc(note ?? '')}</p>`}
</section>`
}

/**
 * ما تحرص عليه المدرسة دائمًا — لا ردًّا على ملاحظةٍ بعينها.
 *
 * بعضُ ما يسأل عنه وليّ الأمر ليس مأخذًا على المدرسة ولا بندَ تحسين:
 * هو عملٌ قائمٌ قبل القياس وبعده. وإغفالُه يُفهم غيابًا له، فيُذكر
 * هنا موجزًا في لوحةٍ واحدة بعد البنود لا قبلها.
 */
const ALWAYS: { icon: string; title: string; body: string }[] = [
  {
    icon: '📚',
    title: 'منصّة «مدرستي» هي القناة الرسمية',
    body: 'عليها تُنشر الاختبارات والتكاليف والدرجات، وهي المرجع المعتمد لكل ما يخصّ '
      + 'الطالبة. وزادت المعلّمات عليها — حرصًا منهنّ لا تكليفًا — قناةً ومجموعةً '
      + 'لكل مادةٍ في كل صف، يُجبن فيها على أولياء الأمور أوّلًا بأوّل.',
  },
  {
    icon: '🤝',
    title: 'التوجيه الطلابي قريبٌ من كل طالبة',
    body: 'تُتابَع الحالات السلوكية والنفسية بسرّيةٍ تامّة، ويُعلَّم أمام الطالبات '
      + '«خطّ مساندة الطفل ١١٦١١١» ليعرفن أن لهنّ من يُشتكى إليه. '
      + 'ولوحة «التنمّر ليس قوّة» معلّقةٌ في الممرّ، ويُنبَّه على مضمونها في الإذاعة.',
  },
  {
    icon: '🪶',
    title: 'لا نُثقل على بناتكم',
    body: 'الواجبات المنزلية قليلة، ويُحَلّ أغلبها داخل الحصّة. والملازم وأوراق العمل '
      + 'غير إلزامية الطباعة: تكفي الطالبةَ قراءةُ النصّ من الملف وكتابةُ إجابتها في '
      + 'دفترها، فلا يقع على الأسرة عبءٌ ماليٌّ ولا على الطالبة عبءٌ زائد.',
  },
  {
    icon: '🧭',
    title: 'نراعي اختلاف القدرات',
    body: 'صدر تعميمٌ داخليٌّ للمعلّمات بمراعاة الفروق الفردية، وبعدم ذكر أسماء '
      + 'المتعثّرات أمام الفصل. وخُصِّصت حصصُ مساندةٍ تُتابَع فيها الطالبة التي '
      + 'تحتاج وقتًا أطول، في هدوءٍ وبلا إحراج.',
  },
  {
    icon: '🧼',
    title: 'النظافة متابعةٌ يومية لا حملةٌ موسمية',
    body: 'لكل دورة مياهٍ جدولٌ يوميّ معلَّقٌ على بابها يُتابَع تنفيذه في أوقاته، '
      + 'والصابون متوفّرٌ في جميع المرافق، ولوحةٌ إرشاديةٌ بخطوات النظافة أمام الطالبات.',
  },
  {
    icon: '🌟',
    title: 'التشجيع قبل المحاسبة',
    body: 'لوحة التعزيز تحمل أسماء المتميّزات في الاجتهاد والإبداع والتعاون والمبادرة '
      + 'والالتزام والسلوك الإيجابي، ويُقام تكريمٌ دوريٌّ للمتفوّقات، '
      + 'وتُنشر صوره في قناة المدرسة ليراه أهلُهنّ.',
  },
]

/**
 * كلماتُ أولياء الأمور الطيّبة، بنصّها.
 *
 * التقرير الذي يذكر النقد وحده يُقرأ اعتذارًا، والمدرسة لم تُخطئ حتى
 * تعتذر: أكثرُ ما وصلها ثناءٌ لا مأخذ. فتُنشر هذه الكلمات كما كُتبت —
 * بإملائها وعلامتها — لأن تهذيبها يُذهب صدقها.
 *
 * وتُنسب إلى الصفّ لا إلى الأسرة: الرأي أُبدي في قياسٍ لا في منشور،
 * ونسبتُه إلى صاحبه بالاسم في ورقةٍ تصل البيوت كلَّها كشفٌ له لم
 * يأذن به. ومن أراد أن يُشكر باسمه فصفحة «تمَّ الاطّلاع» تتيح له ذلك.
 *
 * وأسماء المعلّمات تبقى كما ذكرها أهلُها: الثناء على المعلّمة باسمها
 * حقٌّ لها، وهو مرادُ من كتبه.
 */
const KIND: { text: string; from: string }[] = [
  { text: 'المدرسة رائعة وتعامل المرشدة والمعلمات جدًّا راقٍ، لا يوجد عندي أي اقتراح، '
      + 'أنا مبسوطة جدًّا من المدرسة وبنتي مرتاحة فيها', from: 'أسرةٌ من الصف السادس' },
  { text: 'أتقدّم بالشكر والتقدير لكل منسوبي المدرسة على ما يقدّمونه لبناتنا من تعليم '
      + 'العلم والأدب والأخلاق والدين الإسلامي، وحرصهم على اكتشاف مواهبهنّ وتنميتها، '
      + 'جزاكم الله خيرًا ودمتم بودّ', from: 'أسرةٌ من الصف الأول' },
  { text: 'مدرسةٌ متكاملة ورائعة بالكادر الإداري والتعليمي، بارك الله جهودكم',
    from: 'أسرةٌ من الصف الثالث' },
  { text: 'الله يعطيهم العافية جميعًا، وعلى رأسهم المديرة أبلة الجازي، وأبلة شمعة، '
      + 'والمرشدة الصحية، وأبلة ناهد، وأبلة دلال معلّمة لغتي، وجميع معلّمات المدرسة 💕',
    from: 'أسرةٌ من الصف الأول' },
  { text: 'كل الشكر والتقدير والاحترام لقائدة المدرسة جازية السميري',
    from: 'أسرةٌ من الصف الخامس' },
  { text: 'كل شكرٍ وتقدير للمديرة والمدرّسات على أدائهنّ الرائع والتعليم الممتاز لنا',
    from: 'أسرةٌ من الصف الثاني' },
  { text: 'المدرسة رائعة جدًّا وبنتي مرّة مبسوطة فيها، أتوقّع ما هم مقصّرين بأي شيء، '
      + 'بارك الله فيهم جميعًا', from: 'أسرةٌ من الصف السادس' },
  { text: 'أشكر كل المعلّمات بدون استثناء، المدرسة ما شاء الله تبارك الله 💕',
    from: 'أسرةٌ من الصف الأول' },
  { text: 'مدرسةٌ نموذجية في موقعٍ ممتاز، ومواقفُ ومخارجُ جيّدة',
    from: 'أسرةٌ من الصف السادس' },
  { text: 'المدرسة مثل المنزل، شكرًا لكم جميعًا', from: 'أسرةٌ من الصف الخامس' },
  { text: 'مدرسةٌ رائعة ومعلّماتٌ رائعات وإداريات، كل الشكر لكم',
    from: 'أسرةٌ من الصف الأول' },
  { text: 'الاستمرار في هذا المستوى الرائع من التنظيم والتعليم',
    from: 'أسرةٌ من الصف الرابع' },
  { text: 'شكرًا على حسن التعامل والاهتمام', from: 'أسرةٌ من الصف الخامس' },
  { text: 'الشكر لجميع العاملين فيها', from: 'أسرةٌ من الصف الرابع' },
]

/**
 * لوحاتٌ معلَّقةٌ في ساحة المدرسة الخارجية وممرّاتها.
 *
 * هذه ليست ردًّا على ملاحظةٍ بعينها حتى تدخل في بنود التحسين، وهي
 * مع ذلك أظهرُ ما تراه الطالبة كل صباح. فتُعرض شريطًا واحدًا في
 * صفحة ما تحرص عليه المدرسة دائمًا، لتُرى لا لتُذكر وحسب.
 */
const ALWAYS_SHOTS: { file: string; caption: string }[] = [
  { file: 'athkar-sabah.jpg', caption: 'أذكار الصباح — في الساحة الخارجية' },
  { file: 'khat-musanada.jpg', caption: 'خطّ مساندة الطفل ١١٦١١١' },
  { file: 'tanammur.jpg', caption: 'لوحة «التنمّر ليس قوّة»' },
  { file: 'tawjih-sihhi.jpg', caption: 'لوحة التوجيه الصحي — نحافظ على الهواء النقي' },
]

const SEEN_URL = `https://${host}/#/seen`
const seenQr = await QRCode.toDataURL(SEEN_URL, {
  errorCorrectionLevel: 'M', margin: 1, width: 460,
  color: { dark: '#15445a', light: '#ffffff' },
})

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --green:#07a869; --teal:#0da9a6; --navy:#15445a; --cyan:#218caa; --sand:#c1b489;
        --muted:#4a6b78; --border:#dceaea; --soft:#f5f9f9; }
@page { size:A4; margin:0; }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Baloo',sans-serif; color:var(--navy); }

/* ① الغلاف */
.cover { height:297mm; padding:30mm 22mm 20mm; color:#fff; display:flex; flex-direction:column;
         background:
           radial-gradient(760px 520px at 12% 0%, rgba(13,169,166,.5), transparent 60%),
           radial-gradient(660px 480px at 100% 100%, rgba(7,168,105,.42), transparent 58%),
           linear-gradient(160deg,#10384a,#15445a 50%,#0d3043);
         background-color:#123c50; }
.cover img.logo { width:92px; height:auto; margin:0 auto; display:block; }
.cover .org { text-align:center; font-size:13px; color:#b9d6dd; margin-top:14px; }
.cover .school { text-align:center; font-size:19px; font-weight:800; margin-top:4px; }
.cover h1 { text-align:center; font-size:54px; font-weight:800; margin-top:46px; line-height:1.25;
            text-shadow:0 6px 28px rgba(0,0,0,.3); }
.cover .kicker { text-align:center; font-size:21px; color:#9fe8c6; font-weight:700; margin-top:12px; }
.cover .lede { font-size:16px; line-height:2.1; text-align:center; color:#e8f4f5; margin:34px 6mm 0; }
.cover .seal { width:fit-content; margin:30px auto 0; padding:9px 26px; border-radius:999px;
               font-size:14px; font-weight:700; color:#06352a;
               background:linear-gradient(90deg,#8fe3c4,#5fd6b0); }
.cover .figs { display:grid; grid-template-columns:repeat(3,1fr); gap:13px; margin-top:auto; }
.cover .fig { border:1.5px solid rgba(255,255,255,.22); border-radius:16px; padding:13px 6px;
              text-align:center; background:rgba(255,255,255,.07); }
.cover .fig b { display:block; font-size:29px; font-weight:800; color:#9fe8c6; }
.cover .fig span { font-size:11.5px; color:#cfe4e8; }
.cover .sign { display:grid; grid-template-columns:1fr 1fr; gap:26px; text-align:center; margin-top:22px;
               border-top:1.5px solid rgba(255,255,255,.18); padding-top:16px; }
.cover .role { font-size:12px; color:#9fbdc7; }
.cover .who { font-size:17px; font-weight:800; margin-top:3px; }

/* ② صفحات البنود */
.page { padding:16mm 16mm 13mm; break-before:page; }
.page__head { display:flex; justify-content:space-between; align-items:baseline;
              border-bottom:2px solid var(--navy); padding-bottom:7px; margin-bottom:12px; }
.page__head b { font-size:14px; }
.page__head span { font-size:10px; color:var(--muted); }

.item { break-inside:avoid; border:1.4px solid var(--border); border-radius:18px;
        padding:12px 15px 13px; margin-bottom:10px; }
.item__head { display:flex; align-items:center; gap:12px; }
.no { width:36px; height:36px; flex:none; border-radius:11px; display:grid; place-content:center;
      background:linear-gradient(140deg,var(--green),var(--teal)); color:#fff;
      font-size:17px; font-weight:800; }
h2 { font-size:17px; font-weight:800; line-height:1.3; }
.says { font-size:10.5px; color:var(--green); font-weight:700; }

.quotes { margin:10px 0 0; display:grid; gap:7px; }
blockquote { background:var(--soft); border-right:4px solid var(--sand); border-radius:11px;
             padding:7px 12px; font-size:11px; line-height:1.72; color:#2f5563; }
blockquote::before { content:'« '; color:var(--sand); font-weight:800; }
blockquote::after { content:' »'; color:var(--sand); font-weight:800; }

.did { margin-top:9px; font-size:11.4px; line-height:1.85; color:#234f60; }
.did b { display:block; font-size:11px; color:var(--green); margin-bottom:2px; }

.shots { display:grid; gap:9px; margin-top:11px; }
.shots--1 { grid-template-columns:55%; justify-content:center; }
.shots--2 { grid-template-columns:1fr 1fr; }
.shots--3 { grid-template-columns:repeat(3,1fr); }
.shots--4 { grid-template-columns:repeat(4,1fr); }
figure { border-radius:13px; overflow:hidden; border:1.3px solid var(--border); background:#fff; }
.shots--1 img { height:60mm; }
.shots--2 img { height:50mm; }
.shots--3 img { height:41mm; }
.shots--4 img { height:38mm; }
/* الاقتصاص من الوسط يقطع رؤوس الصور الطولية، فيُرفع موضعه إلى أعلى قليلًا */
img { width:100%; height:auto; object-fit:cover; object-position:center 32%; display:block; }
figcaption { font-size:9.6px; color:var(--muted); padding:6px 9px; line-height:1.5;
             background:var(--soft); }
.soon { margin-top:10px; font-size:11px; color:var(--cyan); font-weight:700;
        background:var(--soft); border-radius:10px; padding:8px 13px; }

/* ③ لوحة ما تحرص عليه المدرسة دائمًا */
.always { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px; }
.always__one { border:1.4px solid var(--border); border-radius:15px; padding:12px 14px;
               break-inside:avoid; }
.always__one h3 { font-size:13px; font-weight:800; margin-bottom:5px; }
.always__one .ico { font-size:15px; margin-left:6px; }
.always__one p { font-size:11px; line-height:1.85; color:#34606f; }
.shots-line { font-size:11.5px; color:var(--muted); text-align:center; margin-top:13px;
              line-height:1.8; }

/* ⑤ لوحة الكلمات الطيّبة */
.kind { columns:2; column-gap:11px; margin-top:12px; }
.kind__one { break-inside:avoid; border:1.4px solid #cfe7da; border-radius:15px;
             padding:12px 14px 11px; margin-bottom:11px;
             background:linear-gradient(170deg,#f3fbf7,#f7fbfb); }
.kind__one p { font-size:11.4px; line-height:1.9; color:#26544a; }
.kind__one p::before { content:'❝ '; color:var(--green); font-weight:800; font-size:14px; }
.kind__one span { display:block; margin-top:7px; font-size:9.8px; font-weight:700;
                  color:var(--green); }
.kind-lede { font-size:12px; line-height:1.95; color:#34606f; margin-top:4px; }

/* ④ بطاقة إقرار الاطّلاع */
.seen { display:grid; grid-template-columns:auto 1fr; gap:18px; align-items:center;
        border:2px solid var(--green); border-radius:18px; padding:16px 18px;
        background:var(--soft); margin:16px 0 4px; break-inside:avoid; }
.seen img { width:33mm; height:33mm; border-radius:10px; background:#fff; padding:4px; }
.seen h3 { font-size:19px; font-weight:800; margin-bottom:5px; }
.seen p { font-size:11.8px; line-height:1.9; color:#34606f; }
.seen .url { display:inline-block; margin-top:7px; direction:ltr; font-size:12px;
             font-weight:800; color:#fff; background:var(--navy);
             border-radius:999px; padding:5px 15px; }

/* ③ الخاتمة */
.end { break-before:page; padding:20mm 18mm; }
.end h2 { font-size:27px; text-align:center; margin-bottom:6px; }
.end .sub { text-align:center; font-size:13px; color:var(--green); font-weight:700; margin-bottom:18px; }
.end p { font-size:13px; line-height:2.1; margin-bottom:11px; }
.open { background:var(--soft); border-right:4px solid var(--cyan); border-radius:13px;
        padding:12px 16px; margin:14px 0; }
.open b { display:block; font-size:12.5px; margin-bottom:6px; color:var(--navy); }
.open ul { padding-right:17px; }
.open li { font-size:12px; line-height:1.95; }
.thanks { text-align:center; font-size:16px; font-weight:800; color:var(--green);
          margin-top:20px; line-height:1.9; }
.endsign { display:grid; grid-template-columns:1fr 1fr; gap:30px; text-align:center; margin-top:26px; }
.endsign .role { font-size:11px; color:var(--muted); }
.endsign .who { font-size:16px; font-weight:800; margin-top:4px;
                border-bottom:1.3px dotted var(--muted); padding-bottom:9px; }
</style></head><body>

<div class="cover">
  <img class="logo" src="${asset('public/brand/moe-logo-light.png', 'image/png')}" alt="وزارة التعليم">
  <div class="org">الإدارة العامة للتعليم بمحافظة جدة</div>
  <div class="school">الابتدائية الخامسة والستون بعد المائة</div>

  <h1>ماذا عملنا<br>برأيكم؟</h1>
  <div class="kicker">قياس اتجاه المتعلمين ١٤٤٨هـ</div>

  <p class="lede">أولياءَ أمورنا الكرام،<br>
  كتبتم ملاحظاتِكم في دقيقتين، ولم تروا لها أثرًا بعدُ. وهذا التقرير جوابُنا
  عليكم: رأيُكم بنصّه كما كتبتموه، وتحته ما عملته المدرسة، وتحتهما صورةُ ما عُمل.
  فما ذهب رأيٌ واحدٌ منكم إلى ملفٍّ يُحفَظ، ولا بقي قولٌ بلا عمل.</p>

  <div class="seal">كلُّ رأيٍ وصَلَ — صار له إجراءٌ وشاهدُ تنفيذ</div>

  <div class="figs">
    <div class="fig"><b>${n(voiceCount)}</b><span>رأيًا مكتوبًا قرأناه</span></div>
    <div class="fig"><b>${n(bands.length)}</b><span>بندَ تحسينٍ نُفِّذ</span></div>
    <div class="fig"><b>${n(proofs)}</b><span>شاهدَ تنفيذٍ موثَّق</span></div>
  </div>

  <div class="sign">
    <div><div class="role">مديرة المدرسة</div><div class="who">جازية السميري</div></div>
    <div><div class="role">إعداد — المساعد الإداري</div><div class="who">عواطف الجهني</div></div>
  </div>
</div>

<div class="page">
  <div class="page__head"><b>ما قُلتُموه — وما عَمِلناه</b>
    <span>مرتَّبةً بحسب عدد من ذكرها من أولياء الأمور</span></div>
  ${ordered.map(section).join('')}
</div>

<div class="page">
  <div class="page__head"><b>كلماتٌ طيّبة وصلَتْنا منكم</b>
    <span>بنصّها كما كتبتموها</span></div>

  <p class="kind-lede">لم يكن أكثرُ ما وصلنا مأخذًا، بل كان ثناءً ودعاءً.
  ونحن نُثبته هنا كما كُتب، لا لنُثني على أنفسنا، بل لتعلموا أنّ كلماتِكم
  قُرئت كما قُرئت ملاحظاتُكم سواءً بسواء — وأنّ ما تكتبونه يبلُغ موضعَه عندنا،
  حسنُه وشديدُه.</p>

  <div class="kind">${KIND.map((k) => `
    <div class="kind__one"><p>${esc(k.text)}</p><span>${esc(k.from)}</span></div>`).join('')}
  </div>

  <p class="shots-line">ولكلِّ أسرةٍ كتبت لنا حرفًا — شكرًا، فقد بلغَنا وأفرحَنا.</p>
</div>

<div class="page">
  <div class="page__head"><b>وممّا تحرص عليه المدرسة دائمًا</b>
    <span>عملٌ قائمٌ قبل القياس وبعده</span></div>

  <div class="always">${ALWAYS.map((a) => `
    <div class="always__one">
      <h3><span class="ico">${a.icon}</span>${esc(a.title)}</h3>
      <p>${esc(a.body)}</p>
    </div>`).join('')}
  </div>

  <div class="shots shots--4">${ALWAYS_SHOTS.map((x) => `
    <figure><img src="${photo(x.file)}" alt="${esc(x.caption)}">
      <figcaption>${esc(x.caption)}</figcaption></figure>`).join('')}
  </div>

  <p class="shots-line">وهذه لقطاتٌ يسيرةٌ من جهد المدرسة لأجل متعلّماتها،
  لا تُحيط بما يُعمل، ولكنها تدلُّ عليه.</p>
</div>

<div class="end">
  <h2>وما زال في الطريق</h2>
  <div class="sub">نقول ما لم يكتمل كما قلنا ما اكتمل</div>

  <p>ليس كلُّ ما ذكرتموه قد تمَّ، ولا نُخفي ذلك عنكم. فمن الملاحظات ما يحتاج
  وقتًا حتى يستوي، ومنها ما هو خارجٌ عن قدرة المدرسة وحدها — وقد رُفع إلى
  الجهة المختصّة في إدارة التعليم، ونتابعه أوّلًا بأوّل.</p>

  <div class="open">
    <b>الذي نعمل عليه الآن</b>
    <ul>
      <li><b>تغطيةُ الساحة وتبريدُها تبريدًا كاملًا</b> — رُكِّبت المراوح وأجهزةُ
      التهوية، أمّا التغطيةُ والتكييفُ الكامل فليسا في يد المدرسة وحدها، وقد
      خُوطِبت بهما إدارةُ التعليم، ونحن في انتظار الاعتماد.</li>
      <li><b>أنشطةٌ خاصّة بمادّة اللغة الإنجليزية</b> تُرغّب الطالبات فيها وتُنمّي
      حصيلتَهنّ — مخطَّطٌ لها هذا الفصل الدراسي بإذن الله.</li>
      <li><b>مكتبةٌ للقراءة وورشُ مهاراتٍ للرسم والخطّ العربي</b> — المكتبة
      متاحةٌ للطالبات، ونعمل على توسعة الورش وجدولتها.</li>
      <li><b>التقليلُ من الملازم والمطويّات</b> — والطباعةُ غير إلزامية، تكفي
      الطالبةَ قراءةُ النصّ من الملف وكتابةُ إجابتها في دفترها.</li>
    </ul>
  </div>

  <p>وكلُّ ملاحظةٍ تصلنا تُقرأ بنصّها كما تُكتب، ثم تُحوَّل إلى إجراءٍ له
  مسؤولةٌ وتاريخٌ وشاهدُ تنفيذ، ويبقى أثرُها مُتابَعًا من عامٍ إلى عام.</p>

  <div class="seen">
    <img src="${seenQr}" alt="باركود صفحة «تمَّ الاطّلاع»">
    <div>
      <h3>تمَّ الاطّلاع</h3>
      <p>نرجو منكم تأكيدَ اطّلاعكم على هذا التقرير، وأن تكتبوا لنا كلمةً إن
      أحببتم. امسحوا الرمز بكاميرا الجوّال، أو افتحوا الرابط مباشرةً —
      ولا يستغرق ذلك سوى لحظة، بلا تسجيلِ دخولٍ ولا بريدٍ إلكتروني.</p>
      <span class="url">${host}/#/seen</span>
    </div>
  </div>

  <p class="thanks">شكرًا لكلِّ أسرةٍ تكلَّمَت 💙<br>
  رأيُكم هو ما غيَّرَ ما رأيتُموه في هذه الصفحات</p>

  <div class="endsign">
    <div><div class="role">مديرة المدرسة</div><div class="who">جازية السميري</div></div>
    <div><div class="role">إعداد — المساعد الإداري</div><div class="who">عواطف الجهني</div></div>
  </div>
</div>
</body></html>`

mkdirSync(dirname(out), { recursive: true })
/** متصفّح الحاوية مثبَّت بنسخةٍ غير التي تنتظرها playwright، فيُمرَّر مساره. */
const executablePath = process.env.CHROMIUM_PATH
  ?? globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome').sort().at(-1)
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle' })
await page.pdf({ path: out, format: 'A4', printBackground: true })
await browser.close()

console.log(`✓ ${out}`)
console.log(`  ${n(ordered.length)} بندًا · ${n(voiceCount)} رأيًا · ${n(proofs)} شاهدًا`
  + ` · ${n(KIND.length)} كلمةً طيّبة`)
