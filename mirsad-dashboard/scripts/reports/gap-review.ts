/**
 * مراجعة القياس — ما يحتاج تعبئةً وما يحتاج شاهدًا.
 *
 * ورقةٌ واحدة تُقرأ قبل دخول اللجنة: أضعف بنود القياس بأرقامها،
 * ونقد أولياء الأمور بنصّه مجموعًا في محاوره، وأمام كل محورٍ شاهدُه
 * إن كان في المنصّة، أو اسمُ الشاهد المطلوب إن لم يكن.
 *
 * وأرقامها تُسحب من قاعدة البيانات لا تُكتب باليد: العدد يتغيّر كلما
 * وصلت استجابة، والورقةُ التي تُسلَّم للجنة بعددٍ قديم تُسقط ما بعده.
 *
 * والربط بين السؤال وشاهده قرارٌ لا يُستخرج من البيانات، فهو مكتوبٌ
 * هنا جدولًا صريحًا: كل شاهدٍ معلَّمٌ بأنه حاضرٌ أو مطلوب، كي تُقرأ
 * الورقة قائمةَ تسليمٍ لا تقريرَ حالة.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npx vite-node scripts/reports/gap-review.ts -- --project <المشروع>
 *
 *   # من نسخة محفوظة بدل الشبكة
 *   … --from snapshot.json --out .report-out/مراجعة-القياس-1448.pdf
 */
import { globSync, readFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { chromium } from 'playwright'

import { analyzeAllQuestions, satisfactionIndex, suggestionsInScope } from '../../src/lib/analysis'
import { coverage, attendance } from '../../src/lib/attendance'
import { improvementBands } from '../../src/lib/bands'
import { orderedClasses } from '../../src/lib/labels'
import { derivedVoices } from '../../src/domain/voices'
import type {
  Answer, AnswerOption, Category, ClassRoom, Grade, ImprovementAction, Meta,
  Question, Student, Suggestion, SurveyResponse, SystemState,
} from '../../src/domain/types'

const ROOT = resolve(import.meta.dirname, '../..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const from = option('from')
const projectId = option('project') ?? process.env.GCLOUD_PROJECT
const out = resolve(ROOT, option('out') ?? '.report-out/مراجعة-القياس-1448.pdf')

/** مستند الاستجابة في Firestore يحمل إجاباته بداخله، لا في مجموعة مستقلة. */
type ResponseDoc = SurveyResponse & { answers?: Omit<Answer, 'responseId'>[] }

interface Snapshot {
  grades: Grade[]
  classes: ClassRoom[]
  students: Student[]
  responses: ResponseDoc[]
  questions: Question[]
  options: AnswerOption[]
  suggestions: Suggestion[]
  categories: Category[]
  improvementActions: ImprovementAction[]
  meta: { meta: Meta }[]
}

async function snapshot(): Promise<Snapshot> {
  if (from) return JSON.parse(readFileSync(resolve(from), 'utf8')) as Snapshot
  if (!projectId) {
    console.error('الاستعمال: npx vite-node scripts/reports/gap-review.ts -- --project <المشروع>')
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
    (await db.collection(name).get()).docs.map((d) => ({ id: d.id, ...d.data() }))
  const names: (keyof Snapshot)[] = ['grades', 'classes', 'students', 'responses', 'questions',
    'options', 'suggestions', 'categories', 'improvementActions', 'meta']
  const slices = await Promise.all(names.map(pull))
  return Object.fromEntries(names.map((name, i) => [name, slices[i]])) as unknown as Snapshot
}

const d = await snapshot()
/** الإجابات محفوظةٌ داخل مستند الاستجابة، كما تقرأها اللوحة. */
const responses: SurveyResponse[] = d.responses.map(({ answers: _drop, ...rest }) => rest)
const answers: Answer[] = d.responses.flatMap((r) =>
  (r.answers ?? []).map((a) => ({ responseId: r.id, ...a })))
const stored = d.suggestions
const state = {
  meta: d.meta[0].meta,
  grades: d.grades, classes: d.classes, students: d.students,
  questions: d.questions, options: d.options, responses, answers,
  suggestions: [...stored, ...derivedVoices(responses, answers, stored, d.students)],
  categories: d.categories, improvementActions: d.improvementActions,
} as unknown as SystemState

const AR = 'ar-SA'
const n = (v: number) => new Intl.NumberFormat(AR).format(v)
const f2 = (v: number) => new Intl.NumberFormat(AR, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
const p0 = (v: number) => `${new Intl.NumberFormat(AR, { maximumFractionDigits: 0 }).format(v)}٪`
const p1 = (v: number) => `${new Intl.NumberFormat(AR, { maximumFractionDigits: 1 }).format(v)}٪`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const cov = coverage(state, {})
const si = satisfactionIndex(state, {})
const { trace } = attendance(state)
const bands = improvementBands(state)
const voices = suggestionsInScope(state, {})
const proofs = state.improvementActions.reduce((k, a) => k + (a.evidence?.length ?? 0), 0)

/** اقتباسٌ مختصر: النقط الثلاث تقول إن بقيّة الكلام موجودة ولم تُحذف. */
const cut = (t: string, max: number) => {
  const one = t.replace(/\s+/g, ' ').trim()
  return one.length <= max ? one : `${one.slice(0, max).replace(/\s+\S*$/, '')}…`
}

/** نصّ السؤال كما في الاستبانة، منزوعَ الترقيم والشرطة البادئة. */
const clean = (t: string) => t.replace(/^\s*\d+\s*[-_.]?\s*/, '').replace(/\s*\.\s*$/, '').trim()

const rows = analyzeAllQuestions(state, {})
  .filter((a) => a.adjustedMean !== null)
  .sort((a, b) => (a.adjustedMean as number) - (b.adjustedMean as number))

/** عدد من اختارت أسوأ خيارٍ في السؤال، بعد مراعاة اتجاهه. */
const worst = (r: typeof rows[number]) => {
  const target = r.question.direction === 'reverse' ? state.meta.scale.max : state.meta.scale.min
  return r.counts.find((c) => c.score === target) ?? { count: 0, percent: 0 }
}

/**
 * شواهد كل بندٍ ضعيف: قرارٌ إداري لا يُستخرج من البيانات.
 * `have` حاضرٌ في المنصّة أو في يد المعدّة، و`need` مطلوبٌ اليوم.
 */
const GAPS: { id: string; why: string; have: string[]; need: string[] }[] = [
  {
    id: 'q06',
    why: 'أضعف بنود القياس كلّه. والجملة سلبية، فمن «وافقت تماماً» عليها تقول: لا تُراعى القدرات.',
    have: [
      'تعميم ١٩ سبتمبر: مراعاة الفروق الفردية وعدم ذكر أسماء المتعثرات أمام الفصل — وتاريخه قبل وصول القياس',
      'حصص الاحتياط والمساندة — تعميم مجموعة المعلمات',
      'أوراق عمل الترم كاملةً من بداية العام، والطباعة غير إلزامية — فلا يتعذّر عمل طالبة لعجز أسرتها عن الطباعة',
    ],
    need: [
      'كشف الطالبات المستهدفات بالخطة العلاجية هذا الفصل (بلا أسماء إن نُشر)',
      'صورة من جدول حصص المساندة معلَّقًا، أو محضر اجتماع المعلمات في الفروق الفردية',
    ],
  },
  {
    id: 'q19',
    why: 'ثاني أضعف بند، ويوافقه صوت ولية أمر في زيادة الأنشطة والتنبيه على التنمّر.',
    have: [
      'لوحة «التنمّر ليس قوة» معلَّقة في الممر',
      'لوحة السلوك المتميّز',
      'خط مساندة الطفل ١١٦١١١ معلَّقًا أمام الطالبات',
    ],
    need: [
      'محضر جلسة توعية سلوكية بتاريخها (أو صورة من الإذاعة المدرسية عن التنمّر)',
      'سجل الحالات السلوكية ومعالجتها — عدد الحالات ونتيجتها، بلا أسماء',
    ],
  },
  {
    id: 'q17',
    why: 'مخافة الإيذاء من الطالبات لا من المدرسة. وأقرب ما يطفئها تنظيمُ الازدحام ووجودُ مَن يُشتكى إليه.',
    have: [
      'تنظيم الفسحة فسحتين: الصفوف الصغرى وحدها والكبرى وحدها',
      'كراسي مكان الانتظار وقت الانصراف وتهويته بالمراوح',
      'خط مساندة الطفل ١١٦١١١',
    ],
    need: [
      'صورة تنظيم الانصراف: الصفوف الصغرى تخرج قبل الكبرى — وهو نصّ ما طلبته وليّتا أمر',
      'جدول المناوبة اليومية للمعلمات في الساحة',
    ],
  },
  {
    id: 'q13',
    why: 'المرافق موجودة، والسؤال عن تسخيرها للطالبات. فالشاهد صورةُ مرفقٍ يُستعمل لا مرفقٍ مغلق.',
    have: [
      'معمل العلوم — تُقام فيه التجارب والأنشطة',
      'ركن «العقول اللامعة» وبطاقات أدوار العمل الجماعي',
      'ركن الرياضة في الساحة',
    ],
    need: [
      'صورة من مصادر التعلّم أو المكتبة والطالبات فيها',
      'صورة من حصة التربية البدنية في الساحة أو الصالة',
    ],
  },
  {
    id: 'q07',
    why: 'بندٌ يقيس الرضا بالمدرسة نفسها، ويقابله «أحب مدرستي» ٢٫٨٨ و«أرغب في الانتقال» ٢٫٨٨ — فالصورة العامة سليمة، والنقص في إظهار ما يُفتخر به.',
    have: [
      'تكريم المتفوقات والمثاليات — منشورٌ في قناة المدرسة',
      'ترشيح الطالبات لبرنامج موهبة',
      'الإذاعة المدرسية وفعالياتها',
    ],
    need: ['صورة تكريمٍ أو مشاركةٍ خارجية حديثة بتاريخها'],
  },
  {
    id: 'q10',
    why: 'المواهب: ستّ استجابات لم توافق، ومعها صوتان لوليّي أمر في الاهتمام بالمواهب وتطوير الأنشطة.',
    have: [
      'ترشيح موهبة',
      'ركن الرياضة',
      'تكريم الفائزات في «اقرأ بطلاقة»',
    ],
    need: ['كشف الطالبات المرشَّحات للمواهب والأنشطة اللاصفّية هذا العام'],
  },
]

/** محاور نقد أولياء الأمور: اسمُ البند في المنصّة، وما بقي من شاهده. */
const NEED_BY_BAND: Record<string, string[]> = {
  'تبريد الساحة وتهوية الفصول': [
    'صورة المروحة في الساحة بعد التركيب، وصورة مكيّف الفصل',
    'صورة من خطاب مخاطبة إدارة التعليم بالصيانة أو بتغطية الساحة — فهذا نقدٌ لا تملكه المدرسة وحدها، وشاهدُه المخاطبة',
  ],
  'انتظار الطالبات وقت الانصراف': [
    'صورة الكراسي ومكان الانتظار — لا شاهد مسجَّلًا للبند حتى الآن',
    'صورة تنظيم الانصراف: الصغار قبل الكبار',
  ],
  'حفظ الأمانات والمفقودات': [
    'صورة «صندوق الأمانات» بعد تهيئته — لا شاهد مسجَّلًا للبند حتى الآن',
    'البطاقة المطبوعة المعلَّقة على الصندوق',
    'رسالة الواتساب المرسلة لأولياء الأمور عن المفقودات',
  ],
  'الأنشطة الطلابية وحصص التربية البدنية': [
    'صورة من حصة تربية بدنية أو مسابقة بين الفصول بتاريخها',
  ],
  'المقصف الصحي وتنظيم الفسح': ['صورة تنظيم الفسحتين (جدول الفسح معلَّقًا)'],
  'ترتيب الفصول وإضاءتها': ['صورة فصلٍ ثانٍ بعد الترتيب، ليكون الشاهد أكثر من فصل'],
  'المكتبة وورش المهارات': ['صورة من المكتبة أو ورشة مهارة داخل الفصل'],
  'تخفيف الواجبات المنزلية': ['تعميم تقليل الواجبات في مجموعة المعلمات'],
}

/** آراءٌ وصلت ولم تُربط ببندٍ بعد: تُقرأ هنا بنصّها حتى تُربط في اللوحة. */
const LOOSE: { theme: string; mark: string; said: string[]; need: string[] }[] = [
  {
    theme: 'الملازم والمطويات',
    said: [
      'الرجاء عدم مطالبتنا بالمطويات وكثرة الملازم لانها ترهق جهد الطالب والاهل',
      'الملازم مع الطالبات كل مادة ملزمه مرهق لطالبات و ولى الأمر',
    ],
    mark: 'يُنشأ لها بندٌ أو تُربط ببند «تخفيف الواجبات المنزلية»',
    need: [
      'تعميم مجموعة المعلمات بشأن الملازم — والطباعة غير إلزامية',
      'عبارة «تكفي قراءة النص من الملف وكتابة الإجابة في الدفتر» مكتوبةً في قناة الصف',
    ],
  },
  {
    theme: 'أنشطة اللغة الإنجليزية',
    said: [
      'اريد انشطه تخص ماده اللغه الانجليزيه وتطوير الطالبات فيها وترغيبهم فالماده',
      'تعليم اللغة الانجليزية يحتاج إلى متابعة وطرق للرقي بالمادة لابد من التركيز على ذلك ومتابعه الطالبات بحفظ الكلمات والقواعد الانجليزيه',
    ],
    mark: 'بندٌ جديد — ولا شاهد له اليوم',
    need: [
      'نشاطٌ واحد للغة الإنجليزية بتاريخه (مسابقة كلمات، لوحة فصل، إذاعة إنجليزية)',
      'أو يُسجَّل البند «مخطَّطٌ له» بتاريخ تنفيذٍ قادم — فالصدق في «لم يُنفَّذ بعد» أقوى من شاهدٍ مصنوع',
    ],
  },
  {
    theme: 'اختلاط الكبار بالصغار وقت الخروج',
    said: ['عند الخروج البنات مختلطات كبار مع صغيرات المفروض الصغار يطلعن قبل الكبار'],
    mark: 'يُربط ببند «انتظار الطالبات وقت الانصراف»',
    need: ['صورة الانصراف المنظَّم: الصفوف الصغرى تخرج أولًا'],
  },
  {
    theme: 'عبارات التشجيع والثناء',
    said: ['الكلمات المشجعه وعبارات الثناء والتحفيز تزيدهم فخراً وثقه وانجاز'],
    mark: 'يُربط ببند «تكريم الطالبات»',
    need: ['صورة لوحة التعزيز — بعد حجب أسماء الطالبات الظاهرة فيها'],
  },
]

const LOW = GAPS.map((g) => {
  const r = rows.find((x) => x.question.id === g.id)
  if (!r) throw new Error(`سؤالٌ غير موجود: ${g.id}`)
  return { ...g, r, bad: worst(r) }
})

const pending = orderedClasses(state.grades, state.classes)
  .map(({ room, grade }) => ({
    // رقم الفصل بالأرقام الهندية كبقيّة أرقام الورقة، لا «فصل 1»
    label: `${grade?.name ?? ''} / ${/^\d+$/.test(String(room.name)) ? n(Number(room.name)) : room.name}`,
    cover: coverage(state, { classId: room.id }),
    missing: state.students.filter((s) => s.classId === room.id && s.status === 'active' && !trace.has(s.id)).length,
  }))
  .filter((r) => r.missing > 0)

const noProof = state.improvementActions.filter((a) => !a.evidence?.length)
const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')

const bandRow = (b: typeof bands[number]) => {
  const a = b.action
  const need = NEED_BY_BAND[a.title] ?? []
  return `<tr>
    <td class="mid"><b>${n(b.voices.length)}</b></td>
    <td><b>${esc(a.title)}</b><div class="say">${b.voices.slice(0, 2)
      .map((v) => `«${esc(cut(v.text, 120))}»`).join(' · ')}</div></td>
    <td class="mid ${a.evidence?.length ? 'ok' : 'no'}">${a.evidence?.length ? n(a.evidence.length) : '٠'}</td>
    <td>${need.length ? `<ul>${need.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<span class="ok">مكتملٌ شاهدًا</span>'}</td>
  </tr>`
}

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family: 'Baloo'; src: url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight: 400 800; }
:root { --green:#07a869; --cyan:#218caa; --navy:#15445a; --muted:#4a6b78; --border:#d6e4e5;
        --red:#c0392b; --amber:#b9770e; --soft:#f4f8f8; }
@page { size: A4; margin: 12mm 10mm; }
* { box-sizing: border-box; }
body { margin:0; font-family:'Baloo',sans-serif; color:var(--navy); font-size:10px; }
h1 { font-size:21px; font-weight:800; margin:0 0 2px; text-align:center; }
.sub { text-align:center; font-size:11px; color:var(--green); font-weight:700; }
.org { text-align:center; font-size:9px; color:var(--muted); margin-top:3px;
       border-bottom:2px solid var(--navy); padding-bottom:7px; }
h2 { font-size:12.5px; font-weight:800; margin:11px 0 5px; padding-right:9px;
     border-right:4px solid var(--green); break-after:avoid; }
h2 .k { font-size:9.5px; color:var(--muted); font-weight:400; }
p { margin:0 0 6px; line-height:1.7; }
.figs { display:grid; grid-template-columns:repeat(6,1fr); gap:7px; margin:9px 0 0; }
.fig { border:1.3px solid var(--border); border-radius:10px; padding:6px 3px; text-align:center; }
.fig b { display:block; font-size:16px; font-weight:800; color:var(--green); }
.fig span { font-size:8.3px; color:var(--muted); }
table { width:100%; border-collapse:collapse; break-inside:auto; }
th { background:var(--navy); color:#fff; font-size:9px; font-weight:700; padding:4px 6px; text-align:right; }
td { border-bottom:1px solid var(--border); padding:4px 6px; vertical-align:top; font-size:9px; line-height:1.55; }
tr { break-inside:avoid; }
.mid { text-align:center; white-space:nowrap; }
.score { font-size:14px; font-weight:800; color:var(--red); }
.say { color:var(--muted); font-size:8.2px; margin-top:2px; line-height:1.5; }
ul { margin:0; padding-right:13px; }
li { margin-bottom:2px; }
.ok { color:var(--green); font-weight:700; }
.no { color:var(--red); font-weight:800; }
.hold { color:var(--amber); font-weight:700; }
.note { background:var(--soft); border-right:4px solid var(--cyan); border-radius:9px;
        padding:6px 11px; font-size:9px; line-height:1.65; }
.signs { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:13px; text-align:center;
         break-inside:avoid; }
.signs .role { font-size:9px; color:var(--muted); }
.signs .who { font-size:12px; font-weight:800; margin-top:3px; border-bottom:1.2px dotted var(--muted);
              padding-bottom:6px; }
</style></head><body>

<h1>مراجعة قياس اتجاه المتعلمين ١٤٤٨هـ</h1>
<div class="sub">ما يحتاج تعبئةً · وما يحتاج شاهدًا</div>
<div class="org">الإدارة العامة للتعليم بمحافظة جدة — الابتدائية الخامسة والستون بعد المائة</div>

<div class="figs">
  <div class="fig"><b>${n(cov.students)}</b><span>طالبة في الكشف</span></div>
  <div class="fig"><b>${n(cov.traced)}</b><span>وصل رأي أسرتها</span></div>
  <div class="fig"><b>${p1(cov.rate)}</b><span>نسبة التغطية</span></div>
  <div class="fig"><b>${f2(si.mean ?? 0)}</b><span>المؤشر من ${n(si.scaleMax)}</span></div>
  <div class="fig"><b>${n(voices.length)}</b><span>رأيًا مكتوبًا</span></div>
  <div class="fig"><b>${n(proofs)}</b><span>شاهد تنفيذ</span></div>
</div>

<h2>١) التعبئة الناقصة <span class="k">— ${n(cov.students - cov.traced)} أسرة في ${n(pending.length)} فصول</span></h2>
${pending.length ? `<table>
<tr><th>الفصل</th><th class="mid">وصل</th><th class="mid">الكشف</th><th class="mid">النسبة</th><th class="mid">الباقي</th></tr>
${pending.map((r) => `<tr><td><b>${esc(r.label)}</b></td><td class="mid">${n(r.cover.traced)}</td>
  <td class="mid">${n(r.cover.students)}</td><td class="mid">${p0(r.cover.rate)}</td>
  <td class="mid no">${n(r.missing)}</td></tr>`).join('')}
</table>` : '<p class="ok">اكتملت كل الفصول.</p>'}
<p class="note">الفصول المكتملة لا تُذكر في التذكير، والباقية تُرسل إليها رسالة واحدة تحمل أسماء
بناتهنّ ورابط الفصل. وأسماء من لم يصل رأي أسرتها في كشفٍ منفصل، لا في هذه الورقة.</p>

<h2>٢) أضعف بنود القياس <span class="k">— والشاهد الذي يردّ على كل بند</span></h2>
<table>
<tr><th class="mid">المتوسط</th><th>البند</th><th class="mid">لم توافق</th><th>الشاهد الحاضر</th><th>الشاهد المطلوب اليوم</th></tr>
${LOW.map((g) => `<tr>
  <td class="mid"><span class="score">${f2(g.r.adjustedMean as number)}</span>
    <div class="say">من ${n(si.scaleMax)}</div></td>
  <td><b>${esc(clean(g.r.question.text))}</b>
    <div class="say">${g.r.question.direction === 'reverse' ? 'سؤالٌ معكوس الاتجاه · ' : ''}${esc(g.why)}</div></td>
  <td class="mid no">${n(g.bad.count)}<div class="say">${p0(g.bad.percent)}</div></td>
  <td><ul>${g.have.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></td>
  <td><ul>${g.need.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></td>
</tr>`).join('')}
</table>

<h2>٣) نقد أولياء الأمور <span class="k">— ${n(bands.reduce((k, b) => k + b.voices.length, 0))} صوتًا مربوطًا ببنوده، مرتَّبةً بعدد ما تحتها</span></h2>
<table>
<tr><th class="mid">الأصوات</th><th>البند وما قالته الأسر</th><th class="mid">الشواهد</th><th>الشاهد المطلوب اليوم</th></tr>
${bands.map(bandRow).join('')}
</table>

<h2>٤) آراءٌ وصلت ولم تُربط ببند <span class="k">— تُربط بضغطة في «مركز مراجعة الآراء»</span></h2>
<table>
<tr><th>المحور ونصّ ما كُتب</th><th>ما يُعمل به</th><th>الشاهد المطلوب</th></tr>
${LOOSE.map((l) => `<tr><td><b>${esc(l.theme)}</b>
  <div class="say">${l.said.map((x) => `«${esc(x)}»`).join('<br>')}</div></td><td>${esc(l.mark)}</td>
  <td><ul>${l.need.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></td></tr>`).join('')}
</table>

<h2>٥) حقولٌ ناقصة في بنود التحسين <span class="k">— تُعبَّأ في اللوحة</span></h2>
<p>${noProof.length
  ? `<span class="no">${n(noProof.length)} بندًا بلا شاهدٍ مسجَّل:</span> ${noProof.map((a) => esc(a.title)).join(' · ')}.`
  : '<span class="ok">كل بندٍ له شاهد.</span>'}
  و<span class="hold">${n(state.improvementActions.length)} بندًا</span> بلا
  تاريخ بدايةٍ ولا تاريخ إنجازٍ ولا متابعةٍ لاحقة — واللجنة تسأل عن التاريخ قبل أن تسأل عن الصورة.</p>
<p class="note">يكفي في كل بند: تاريخ البداية (ولو تقريبيًّا بالشهر)، وتاريخ الإنجاز، وسطرٌ في
«المتابعة» يقول كيف يُتأكَّد أن الإجراء لم يتوقّف — مثل: «يُتابَع جدول النظافة أسبوعيًّا من الوكيلة».</p>

<div class="signs">
  <div><div class="role">مديرة المدرسة</div><div class="who">جازية السميري</div></div>
  <div><div class="role">إعداد · المساعد الإداري</div><div class="who">عواطف الجهني</div></div>
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
console.log(`  ${n(cov.students)} طالبة · ${p1(cov.rate)} · ${n(voices.length)} رأيًا · ${n(proofs)} شاهدًا`)
console.log(`  أضعف بند: ${f2(LOW[0].r.adjustedMean as number)} — ${clean(LOW[0].r.question.text)}`)
