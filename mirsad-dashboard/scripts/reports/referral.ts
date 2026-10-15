/**
 * «إحالة إلى الموجّهة الطلابية» — ورقةٌ مُهوَّاة تُسلَّم باليد.
 *
 * الإحالة صادرةٌ عن المنصّة لا عن شخص: تُنسب إلى «قياس اتجاه المتعلمين»
 * ولا يُذكر فيها اسم من رفعها. فالموجّهة تقرأ ما قاله صاحب الرأي، لا من
 * نقله إليها، وبقاءُ الناقل خارج الورقة يُبقي الحديث على الواقعة.
 *
 * وتغطّي الجولتين معًا — استبيانَ الطالبات وأولياء الأمور من أوّل إرسال،
 * وإقراراتِ الاطّلاع إلى اليوم — لأنّ ما يخصّ الإرشاد الطلابي لا يُعرف
 * بالدفعة الأخيرة وحدها: أخطرُ ما ورد جاء في الجولة الأولى.
 *
 * والأسماء تُقرأ من بيانات المدرسة وقت التوليد ولا تُكتب في هذا الملف:
 * فالملفّ يُرفع إلى مستودعٍ عامّ، والبياناتُ لا تُرفع. فمن أفصح عن اسمه
 * ظهر اسمه في الورقة — والموجّهة تحتاجه لتتكلّم — ومن لم يُفصح بقيت
 * خانتُه ظاهرةً موسومةً بأنّه لم يُفصح، لأنّ ملءَ خانةٍ بالظنّ في ورقةٍ
 * تُبنى عليها مقابلةٌ مع معلّمة أو استدعاءُ طالبة ظلمٌ لا يُحتمل.
 *
 * ومطابقةُ الاسم على الكشف الرسمي تُعلَن بدرجتها: مؤكّدةً أو محتملةً،
 * ولا تُقدَّم المحتملةُ على أنها يقين.
 *
 * ولا يدخلها كلُّ ما ورد: المرافقُ والصيانةُ والتكييفُ والنظافةُ وطلباتُ
 * الجدولة شأنٌ إداريّ، ووضعُها هنا يُغرق ما يخصّ الإرشاد فيما لا يخصّه.
 *
 *   npx vite-node scripts/reports/referral.ts
 */
import { globSync, readFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '../..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const out = resolve(ROOT, option('out') ?? '.report-out/إحالة-الموجهة-الطلابية-1448.pdf')

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')

const iso = (t: string) => `⁦${t}⁩`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * اسمُ صاحب الرأي من بيانات المدرسة — إن كان أفصح عنه.
 *
 * يُبحث بالملفّ والسطر لا بالاسم، فهما ثابتان لا يتغيّران بتصحيح إملاء.
 * والملفُّ غيرُ مرفوعٍ إلى المستودع، فإن غاب رجعت الورقة إلى «لم يُفصح».
 */
interface Person { written: string; roster?: string; where?: string; certain: boolean }

interface Row { sourceFile?: string; sourceRow?: number }
interface Resp extends Row {
  rawName?: string | null; studentId?: string | null
  matchStatus?: string; candidateStudentIds?: string[] | null
}
interface Student { id: string; name: string; gradeId: string; classId?: string | null }
interface School {
  responses: Resp[]; students: Student[]
  grades: { id: string; name: string }[]; classes: { id: string; name: string }[]
}

const school: School | null = (() => {
  try {
    return JSON.parse(readFileSync(resolve(ROOT, 'src/data/school-data.json'), 'utf8')) as School
  } catch { return null }
})()

function lookupPerson(sourceFile: string, sourceRow: number): Person | null {
  if (!school) return null
  const r = school.responses.find((x) => x.sourceFile === sourceFile && x.sourceRow === sourceRow)
  if (!r?.rawName) return null
  const id = r.studentId ?? (r.candidateStudentIds?.length === 1 ? r.candidateStudentIds[0] : null)
  const st = id ? school.students.find((x) => x.id === id) : undefined
  const grade = st && school.grades.find((g) => g.id === st.gradeId)?.name
  const cls = st && school.classes.find((c) => c.id === st.classId)?.name
  return {
    written: r.rawName,
    roster: st?.name,
    where: grade ? `${grade}${cls ? ` / ${cls}` : ''}` : undefined,
    certain: r.matchStatus === 'MATCHED',
  }
}

/** خانةٌ في بطاقة الحالة: اسمها، وقيمتها، وهل القيمة معلومة. */
interface Field { label: string; value: string; known: boolean }
interface Case {
  no: string; title: string; tag: string; tone: 'hot' | 'warm'
  fields: Field[]; text: string; signs?: [string, string][]; warn?: string[]
  who?: Person | null
}

/** صاحبة الرأي في الحالة الأولى — أفصحت عن اسمها، فيُطلب من البيانات. */
const WHO1 = lookupPerson('responses-grade6.xlsx', 4)

const CASES: Case[] = [
  {
    no: 'الحالة ١', title: 'تنمُّرٌ وضربٌ بين الطالبات', tag: 'الأقدم — ولم تُعالَج بعد',
    tone: 'hot', who: WHO1,
    fields: [
      { label: 'المصدر', value: 'استبيان القياس — الجولة الأولى', known: true },
      { label: 'وقت الورود', value: `سبتمبر ${iso('2026')}م`, known: true },
      WHO1
        ? { label: 'الاسم في الاستمارة', value: WHO1.written, known: true }
        : { label: 'صاحب الرأي', value: 'لم يُفصح عنه', known: false },
      WHO1?.roster
        ? { label: 'الاسم في الكشف', value: WHO1.roster, known: true }
        : { label: 'اسم الطالبة', value: 'لم يُذكر', known: false },
      WHO1?.where
        ? { label: 'الصف والفصل', value: WHO1.where, known: true }
        : { label: 'الصف', value: 'السادس الابتدائي — والفصل لم يُحدَّد', known: false },
      { label: 'درجة المطابقة', value: WHO1?.certain ? 'مؤكّدة' : 'محتملة — تُراجَع على الكشف', known: !!WHO1?.certain },
    ],
    text: 'زيادة النشاطات الطلابيه والتفاعليه وتنبيه الطالبات باستمرار بعدم التلفظ بكلام غير لائق والتنمر بين الطالبات والضرب داخل الحصص بين الطالبات وردة فعل المعلمات',
    signs: [
      ['🗯️', 'تلفُّظٌ بكلامٍ غير لائق بين الطالبات'],
      ['⚠️', 'تنمُّرٌ بين الطالبات'],
      ['✋', 'ضربٌ بين الطالبات — <b>داخل الحصص</b>'],
      ['👀', 'وإشارةٌ إلى «ردّة فعل المعلمات» حيال ذلك'],
    ],
    warn: [
      'هذه أخطرُ ما ورد في الجولتين، وأقدمُه: ورد في الجولة الأولى ولم يُفرد له إجراءٌ حتى اليوم.',
      'الوقوع المذكور داخل الحصّة لا في الفسحة — أي في وقتٍ فيه إشراف، وهذا ما يستدعي النظر.',
      'لم تُسمَّ معلّمةٌ ولا طالبةٌ أخرى في النصّ — صاحبةُ الرأي وحدها معروفة. فالحديث يبدأ منها، لا بمساءلة أحد.',
    ],
  },
  {
    no: 'الحالة ٢', title: 'أثرٌ نفسيٌّ على طالبة', tag: 'تستدعي متابعةً إرشادية',
    tone: 'warm',
    fields: [
      { label: 'المصدر', value: 'إقرارات الاطّلاع — رأي وليّ الأمر', known: true },
      { label: 'الصف', value: 'الثالث الابتدائي / ٢', known: true },
      { label: 'وقت الورود', value: `٤ جمادى الأولى ${iso('1448')}هـ — ${iso('15')} أكتوبر`, known: true },
      { label: 'اسم وليّ الأمر', value: 'لم يُفصح عنه في الاستمارة', known: false },
      { label: 'اسم المعلمة', value: 'لم يرد في نصّ وليّ الأمر إطلاقًا', known: false },
      { label: 'اسم الطالبة والمادة', value: 'لم يُذكرا', known: false },
    ],
    text: 'الله يعطيكم العافية على كل مجهود تبذلونه لراحة الطالبات او آداء الرسالة التعليمية. مقدره اهتمامكم وسهولة الوصول لكم عند الحاجة. اتمنى زيادة تحفيز الطالبات ودعمهم نفسياً بالايجابيات. مرحلة ثالث بدأ الجد اكثر وصعبت او كثرت المعلومات والمهام اللي ينجزونها وهم لسى ماتعودوا، ابسط شي يقدم لهم انو مايجيها احباط. بس كلمة من معلمة زي كلمة «انتي مهمله» اذا ماعرفت تجاوب مو معناته انها مهمله. انا الصراحة شفتها اثرت ف بنتي وعورت قلبي لمن تبكي مرتين ف يومها لمن تحكيني انها كرهت المادة وماعندها ثقة بنفسها انها تحصل على الدرجة الكاملة مع انها مهتمة ومنضبطة فالمدرسة',
    signs: [
      ['😢', 'بكاءٌ مرّتين في يومٍ دراسيٍّ واحد'],
      ['📕', 'تعبيرُها عن كُرهٍ للمادة'],
      ['📉', 'تراجعُ ثقتها بقدرتها على الدرجة الكاملة'],
      ['🗣️', 'وصفُها — بحسب روايتها لوالدتها — بـ«انتي مهمله»'],
      ['✅', 'ووصفُ وليّ الأمر لها بأنها «مهتمة ومنضبطة فالمدرسة»'],
    ],
    warn: [
      'لم يُذكر اسمُ أيِّ معلّمةٍ في النصّ. ولا يصحّ توجيهُ الحديث إلى معلّمةٍ بعينها استنادًا إليه وحده.',
      'الرواية منقولةٌ عن الطالبة إلى والدتها ثم إلينا — فتُعامَل بوصفها بلاغًا يستوجب التحقّق، لا واقعةً ثابتة.',
      'بدأ وليُّ الأمر رسالته بالشكر على الجهد وسهولة الوصول للإدارة — فالمقصدُ تحسينٌ لا تصعيد.',
    ],
  },
]

/** مؤشّراتٌ تُقوّي الحالتين ولا تقوم وحدها — كلٌّ بمصدره ووقته وصاحبه. */
interface Support { where: string; when: string; text: string; who?: Person | null }

const SUPPORT: Support[] = [
  {
    where: 'الخامس الابتدائي / ٢', when: `إقرارات الاطّلاع — ${iso('14')} أكتوبر`,
    text: 'اريد فقط كلمات التشجيع لانها تحفز الطالبه للاجتهاد والتقدم، ونتجنب الكلمات المحبطه للطالبه... وهذا الشي مهم لنفسيه الطالب. واشكركم جميعاً بلا استثناء',
  },
  {
    where: 'الأول الابتدائي / ٢', when: `استبيان القياس — ${iso('16')} سبتمبر`,
    text: 'لو بنات الصف الاول يطلعن قبل الكبار عشان ما يتأذوا من البنات الكبار وما يكون فيه فوضى',
    who: lookupPerson('responses-grade1.xlsx', 3),
  },
]

const STEPS: [string, string][] = [
  ['مسحٌ إرشاديٌّ في السادس عن التنمُّر والضرب',
   'الحالة الأولى هي الأقدم والأخطر، وموضعُها داخل الحصص. تُقدَّم على ما سواها.'],
  ['مسحٌ إرشاديٌّ عام لطالبات الثالث / ٢',
   'دون الإشارة إلى هذه الورقة ولا إلى ورود شكوى، للوقوف على مؤشّرات الحالة الثانية.'],
  ['تذكيرٌ عامٌّ بأسلوب الخطاب التحفيزي',
   'بصيغةٍ توعويةٍ جماعية، دون إشارةٍ إلى صفٍّ بعينه ولا إلى معلّمةٍ بعينها.'],
  ['متابعةُ الطالبة متى عُرفت',
   'عبر المرشدة الطلابية، وبما تراه الموجّهة مناسبًا من خطوات.'],
  ['حصرُ التداول',
   'لا تُدرج أيُّ حالةٍ منها في مجموعةٍ أو ملفٍّ يُرسل للمعلمات.'],
]

/** ما رُوجع، وما خرج منه ولماذا — حتى يُعلم أنّ الفرز لم يكن بالدفعة الأخيرة. */
const SWEEP: [string, string, string][] = [
  ['١١٥', 'رأيًا في استبيان القياس', 'الجولة الأولى — سبتمبر'],
  ['٥٠', 'إقرارَ اطّلاعٍ من أولياء الأمور', 'ثلاث دفعات — إلى اليوم'],
  ['١٦٥', 'مجموعُ ما رُوجع', 'من أوّل إرسالٍ إلى الآن'],
  ['٤', 'ما يخصّ الإرشاد الطلابي', 'حالتان ومؤشّران'],
]

const field = (f: Field) => `
<div class="f${f.known ? '' : ' f--unknown'}">
  <span class="f__k">${esc(f.label)}</span>
  <span class="f__v">${esc(f.value)}</span>
</div>`

const caseCard = (c: Case) => `
<article class="case case--${c.tone}">
  <div class="case__top">
    <span class="case__no">${esc(c.no)}</span>
    <span class="case__t">${esc(c.title)}</span>
    <span class="case__tag">${esc(c.tag)}</span>
  </div>
  <div class="case__body">
    <div class="fields">${c.fields.map(field).join('')}</div>
    ${c.who ? `<div class="who">
      <span class="who__i">👤</span>
      <span>صاحبةُ الرأي أفصحت عن اسمها، فهي أوّلُ من يُتحدَّث إليه.
      ${c.who.roster && c.who.roster !== c.who.written
        ? `كُتب في الاستمارة <b>«${esc(c.who.written)}»</b>، ويقابله في الكشف الرسمي
           <b>«${esc(c.who.roster)}»</b>${c.who.certain
             ? ' — مطابقةٌ مؤكّدة.'
             : ' — وهو الوحيد الذي يقاربه في الكشف كلِّه، فالمطابقةُ محتملةٌ تُؤكَّد قبل الاستدعاء.'}`
        : `الاسم <b>«${esc(c.who.written)}»</b>.`}</span>
    </div>` : ''}
    <div class="quote">
      <div class="lbl">النصّ كاملًا وحرفيًّا — دون حذفٍ ولا تعديل</div>
      <p>«${esc(c.text)}»</p>
    </div>
    ${c.signs ? `<h2>ما ورد في النصّ صراحةً</h2>
    <div class="signs">${c.signs.map(([i, t]) => `
      <div class="sign"><span class="ico">${i}</span><span>${t}</span></div>`).join('')}
    </div>` : ''}
    ${c.warn ? `<div class="warn">
      <b>⚠️ قبل أيّ إجراء — ما يُقرأ أوّلًا</b>
      <ul>${c.warn.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
    </div>` : ''}
  </div>
</article>`

const runhead = (n: string) => `
<div class="runhead">
  <img src="${asset('public/brand/moe-logo-light.png', 'image/png')}" alt="">
  <span>إحالةٌ إلى الموجّهة الطلابية — بناءً على قياس اتجاه المتعلمين ${iso('1448')}هـ</span>
  <em>الصفحة ${n} من ٣</em>
</div>`

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --green:#07a869; --teal:#0da9a6; --navy:#15445a; --sand:#c1b489;
        --amber:#c97a16; --amber-soft:#fff7ec; --rose:#b5485c; --rose-soft:#fdf3f5;
        --muted:#4a6b78; --border:#d6e4e5; --soft:#f4f8f8; }
@page { size:A4 portrait; margin:0; }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Baloo',sans-serif; color:var(--navy); }
.sheet { padding:9mm 12mm 8mm; }
.sheet + .sheet { page-break-before:always; }

.head { text-align:center; border-bottom:2px solid var(--navy); padding-bottom:7px; }
.head img { height:38px; }
.head .org { font-size:10.5px; color:var(--muted); margin-top:6px; }
.head .school { font-size:13.5px; font-weight:800; margin-top:3px; }

.title { display:flex; align-items:center; justify-content:center; gap:10px; margin-top:10px; }
.title h1 { font-size:23px; font-weight:800; }
.seal { font-size:10.5px; font-weight:800; color:#fff; background:var(--rose);
        border-radius:999px; padding:4px 14px; }
.src { margin-top:9px; border:2px solid var(--teal); border-radius:14px; padding:9px 13px;
       background:linear-gradient(170deg,#f0fafa,#f6fbfb);
       display:grid; grid-template-columns:repeat(2,1fr); gap:5px 16px; }
.src div { font-size:10.6px; line-height:1.6; }
.src b { color:var(--navy); font-weight:800; }
.src span { color:var(--muted); }

.sweep { margin-top:9px; border:1.8px solid var(--border); border-radius:14px; padding:9px 13px;
         background:var(--soft); }
.sweep b.t { display:block; font-size:12px; font-weight:800; margin-bottom:7px; }
.sweep .nums { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.sweep .n { text-align:center; border:1.3px solid var(--border); border-radius:11px;
            padding:6px 4px; background:#fff; }
.sweep .n i { display:block; font-size:18px; font-weight:800; font-style:normal; color:var(--teal); }
.sweep .n u { display:block; text-decoration:none; font-size:9.8px; font-weight:800; margin-top:1px; }
.sweep .n span { display:block; font-size:9px; color:var(--muted); margin-top:1px; }
.sweep p { font-size:10.2px; line-height:1.7; color:var(--muted); margin-top:7px; }

.case { margin-top:10px; border:1.8px solid var(--border); border-radius:16px;
        overflow:hidden; break-inside:avoid; }
.case--hot { border-color:var(--rose); border-width:2.2px; }
.case--warm { border-color:var(--amber); border-width:2.2px; }
.case__top { display:flex; align-items:center; gap:9px; padding:8px 13px;
             background:var(--soft); border-bottom:1.4px solid var(--border); }
.case--hot .case__top { background:var(--rose-soft); border-bottom-color:#f0c9d1; }
.case--warm .case__top { background:var(--amber-soft); border-bottom-color:#f0d9b8; }
.case__no { font-size:11px; font-weight:800; color:#fff; background:var(--muted);
            border-radius:999px; padding:3px 12px; }
.case--hot .case__no { background:var(--rose); }
.case--warm .case__no { background:var(--amber); }
.case__t { font-size:15px; font-weight:800; }
.case__tag { margin-right:auto; font-size:10px; font-weight:700; color:var(--muted); }
.case__body { padding:10px 13px 11px; }

.fields { display:grid; grid-template-columns:repeat(2,1fr); gap:6px; }
.f { display:grid; grid-template-columns:auto 1fr; gap:8px; align-items:baseline;
     border:1.2px solid var(--border); border-radius:10px; padding:5px 10px; background:#fff; }
.f__k { font-size:10px; font-weight:800; color:var(--muted); white-space:nowrap; }
.f__v { font-size:11px; font-weight:700; }
.f--unknown { border-style:dashed; border-color:#e6cfb2; background:var(--amber-soft); }
.f--unknown .f__v { color:var(--amber); font-weight:800; }

.who { margin-top:8px; display:grid; grid-template-columns:18px 1fr; gap:8px;
       border:1.6px solid var(--teal); border-radius:11px; padding:7px 11px;
       background:linear-gradient(170deg,#f0fafa,#f6fbfb); }
.who__i { font-size:13px; text-align:center; }
.who span { font-size:10.4px; line-height:1.7; color:#34606f; }
.who b { color:var(--navy); font-weight:800; }
.quote { margin-top:9px; border-right:4px solid var(--teal); border-radius:0 12px 12px 0;
         background:var(--soft); padding:9px 13px; }
.quote .lbl { font-size:9.6px; font-weight:800; color:var(--muted); margin-bottom:4px; }
.quote p { font-size:11.2px; line-height:1.95; }
.case--hot .quote { border-right-color:var(--rose); background:var(--rose-soft); }
.case--warm .quote { border-right-color:var(--amber); background:var(--amber-soft); }

h2 { font-size:12.5px; font-weight:800; margin:10px 0 6px; padding-right:9px;
     border-right:4px solid var(--green); }
.signs { display:grid; gap:5px; }
.sign { display:grid; grid-template-columns:17px 1fr; gap:7px; align-items:baseline;
        border:1.2px solid var(--border); border-radius:9px; padding:5px 10px; background:#fff; }
.sign .ico { font-size:12px; text-align:center; }
.sign span { font-size:10.6px; line-height:1.6; }

.warn { margin-top:10px; border:2px solid var(--rose); border-radius:14px;
        padding:9px 13px; background:var(--rose-soft); }
.warn b { display:block; font-size:12.5px; margin-bottom:4px; }
.warn li { font-size:10.4px; line-height:1.72; color:#6d3f48; list-style:none;
           padding-right:14px; position:relative; margin-bottom:3px; }
.warn li::before { content:'◂'; position:absolute; right:0; color:var(--rose); font-weight:800; }

.steps { display:grid; gap:6px; counter-reset:s; }
.step { display:grid; grid-template-columns:20px 1fr; gap:8px;
        border:1.3px solid var(--border); border-right:3.5px solid var(--green);
        border-radius:11px; padding:6px 11px; background:#fff; }
.step::before { counter-increment:s; content:counter(s); font-size:10.5px; font-weight:800;
                color:#fff; background:var(--green); border-radius:50%; width:18px; height:18px;
                display:grid; place-items:center; }
.step b { display:block; font-size:11.6px; }
.step span { display:block; font-size:10px; line-height:1.65; color:var(--muted); margin-top:2px; }

.sup { display:grid; gap:6px; }
.sup .row { border:1.3px solid var(--border); border-right:3.5px solid var(--teal);
            border-radius:11px; padding:7px 11px; background:#fff; }
.sup .meta { display:flex; gap:9px; align-items:baseline; margin-bottom:3px; }
.sup .meta b { font-size:11.4px; }
.sup .meta em { font-style:normal; font-size:9.6px; color:var(--muted); }
.sup .meta u { margin-right:auto; text-decoration:none; font-size:9.6px; font-weight:800;
               color:#fff; background:var(--teal); border-radius:999px; padding:2px 10px; }
.sup .meta u.u--none { background:#fff; color:var(--amber); border:1px dashed #e6cfb2; }
.sup p { font-size:10.4px; line-height:1.8; }

.note { margin-top:10px; border:1.6px solid var(--border); border-radius:13px;
        padding:9px 13px; background:var(--soft); }
.note--find { border-color:var(--teal); border-width:1.8px;
              background:linear-gradient(170deg,#f0fafa,#f6fbfb); }
.note--find p b { display:inline; font-size:inherit; font-weight:800; color:var(--navy); margin:0; }
.note b { display:block; font-size:12px; margin-bottom:4px; }
.note p { font-size:10.4px; line-height:1.75; color:var(--muted); }

.ctx { margin-top:10px; border:2px solid var(--green); border-radius:14px; padding:10px 13px;
       background:linear-gradient(170deg,#f2fbf7,#f6fbfb); }
.ctx b { display:block; font-size:12.5px; margin-bottom:6px; }
.ctx p { font-size:10.4px; line-height:1.75; color:#2d5c54; }

.foot { margin-top:12px; padding-top:8px; border-top:1.5px dotted var(--muted);
        text-align:center; font-size:10px; line-height:1.7; color:var(--muted); }
.foot b { color:var(--navy); }

.runhead { display:flex; align-items:center; gap:9px; padding-bottom:7px; margin-bottom:11px;
           border-bottom:1.6px solid var(--border); }
.runhead img { height:22px; opacity:.9; }
.runhead span { font-size:10.5px; font-weight:800; color:var(--navy); }
.runhead em { margin-right:auto; font-style:normal; font-size:9.6px; color:var(--muted); }
</style></head><body>

<div class="sheet">
  <header class="head">
    <img src="${asset('public/brand/moe-logo.png', 'image/png')}" alt="وزارة التعليم">
    <div class="org">الإدارة العامة للتعليم بمحافظة جدة</div>
    <div class="school">الابتدائية الخامسة والستون بعد المائة</div>
  </header>

  <div class="title">
    <h1>إحالةٌ إلى الموجّهة الطلابية</h1>
    <span class="seal">سرّي</span>
  </div>

  <section class="src">
    <div><b>الإحالة بناءً على:</b> <span>قياس اتجاه المتعلمين ${iso('1448')}هـ</span></div>
    <div><b>المدى:</b> <span>من أوّل إرسالٍ إلى اليوم — الجولتان معًا</span></div>
    <div><b>تاريخ الإحالة:</b> <span>٤ جمادى الأولى ${iso('1448')}هـ — ${iso('15')} أكتوبر ${iso('2026')}م</span></div>
    <div><b>طريقة الاستمارة:</b> <span>تُتيح الكتابة دون الإفصاح عن الاسم</span></div>
  </section>

  <section class="sweep">
    <b class="t">🔁 ما رُوجع قبل هذه الإحالة</b>
    <div class="nums">${SWEEP.map(([n, t, s]) => `
      <div class="n"><i>${n}</i><u>${esc(t)}</u><span>${esc(s)}</span></div>`).join('')}
    </div>
    <p>فالفرز لم يكن بالدفعة الأخيرة وحدها. ورُوجعت الجولتان كلتاهما، فخرج منهما
    ما لا يخصّ الإرشاد الطلابي — المرافقُ والتكييفُ والنظافةُ والمقصفُ والمبنى
    وطلباتُ الجدولة — وبقي ما في هذه الورقة وحده.</p>
  </section>

  ${caseCard(CASES[0])}
</div>

<div class="sheet">
  ${runhead('٢')}
  ${caseCard(CASES[1])}

  <div class="note note--find">
    <b>🔎 كيف تُعرف الطالبة — ما تملكه الورقة وما لا تملكه</b>
    <p>الاستمارة لا تطلب اسمَ الطالبة ولا اسمَ صاحب الرأي، وهؤلاء اختاروا ألّا يُفصحوا.
    فالمعلوم في الحالة الأولى <b>الصفُّ السادس</b> وحده، وفي الثانية <b>الثالث الابتدائي / ٢</b>
    و<b>تاريخُ الورود</b>. وعلى ذلك وحده يُبنى ما بعدُ — بمسحٍ إرشاديٍّ عامٍّ لا بسؤالٍ مباشرٍ
    عن صاحب الشكوى، حتى لا تُستدلَّ الطالبةُ فتُحرَج، ولا تُستدلَّ المعلّمةُ فتُتَّهم قبل التحقّق.</p>
  </div>
</div>

<div class="sheet">
  ${runhead('٣')}

  <h2>المقترح للمعالجة — والقرار للموجّهة</h2>
  <div class="steps">${STEPS.map(([t, b]) => `
    <div class="step"><div><b>${esc(t)}</b><span>${esc(b)}</span></div></div>`).join('')}
  </div>

  <h2>مؤشّرات مُساندة — ليست شكاوى</h2>
  <div class="sup">${SUPPORT.map((p) => `
    <div class="row">
      <div class="meta"><b>${esc(p.where)}</b><em>${esc(p.when)}</em>${
        p.who ? `<u>👤 ${esc(p.who.roster ?? p.who.written)}</u>` : '<u class="u--none">بلا اسم</u>'}</div>
      <p>«${esc(p.text)}»</p>
    </div>`).join('')}
  </div>
  <div class="note">
    <b>لماذا أُرفقت</b>
    <p>ليست شكاوى، ولا تقوم واحدةٌ منها وحدها. وأُرفقت لأنّ الأولى تلتقي مع الحالة الثانية
    في أثر الكلمة على الطالبة، والثانية تلتقي مع الحالة الأولى في أمن الصغيرات بين الكبيرات.
    وهي من أصحاب رأيٍ مختلفين، وصفوفٍ مختلفة، وأوقاتٍ متباعدة — أي أنّ الأمرين ملاحظةٌ
    متكرّرة لا حادثةٌ فرديةٌ معزولة.</p>
  </div>

  <div class="note">
    <b>ما ليس من اختصاص هذه الإحالة</b>
    <p>خرج من الفرز — وهو الأكثر عددًا — كلُّ ما يخصّ المرافق: التكييفُ والتهويةُ ودوراتُ
    المياه والمقصفُ والمبنى والازدحام. وخرج كذلك طلبان تنظيميان يخصّان جدولةَ تسميع القرآن
    والتقييم في أثناء الاختبارات ومراعاةَ الضغط على طالبات السادس. وكلُّها شأنٌ إداريٌّ
    تعليميّ، يُحال إلى الإدارة ووكيلة الشؤون التعليمية على حدة.</p>
  </div>

  <section class="ctx">
    <b>إفادةٌ عامة للسياق</b>
    <p>ما رُوجع من أوّل إرسالٍ إلى اليوم ١٦٥ رأيًا وإقرارًا، أكثرُها ثناءٌ صريح على المدرسة
    ومنسوباتها، وأكثرُ ما بقي طلباتُ مرافقٍ وصيانة. فهذه الإحالة تُقرأ في سياق رضًا عام،
    لا في سياق تذمّر — ولذلك جاءت في أربعة مواضع لا أكثر.</p>
  </section>

  <p class="foot">
    صادرةٌ عن <b>منصّة قياس اتجاه المتعلمين ${iso('1448')}هـ</b> — الابتدائية الخامسة والستون بعد المائة.<br>
    النصوص منقولةٌ من الاستمارة حرفيًّا، وما لم تُفصح عنه الاستمارة تُرك ظاهرًا أنه لم يُفصح عنه.
  </p>
</div>

</body></html>`

mkdirSync(dirname(out), { recursive: true })
const executablePath = process.env.CHROMIUM_PATH
  ?? globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome').sort().at(-1)
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle' })
await page.pdf({ path: out, format: 'A4', printBackground: true })
await browser.close()

console.log(`✓ ${out}`)
