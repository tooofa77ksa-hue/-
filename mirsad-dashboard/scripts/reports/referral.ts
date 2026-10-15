/**
 * «إحالة إلى الموجّهة الطلابية» — ورقةٌ مُهوَّاة تُسلَّم باليد.
 *
 * الإحالة صادرةٌ عن المنصّة لا عن شخص: تُنسب إلى «قياس اتجاه المتعلمين»
 * ولا يُذكر فيها اسم من رفعها. فالموجّهة تقرأ ما قاله وليُّ الأمر، لا من
 * نقله إليها، وبقاءُ الناقل خارج الورقة يُبقي الحديث على الواقعة.
 *
 * وما لم تُفصح عنه الاستمارة لا يُخترع هنا: خانتا «وليّ الأمر» و«المعلمة»
 * تُطبعان ظاهرتَين موسومتَين بأنّ أحدًا لم يُسمِّهما، لأنّ ملءَ خانةٍ
 * بالظنّ في ورقةٍ تُبنى عليها مقابلةٌ مع معلّمة ظلمٌ لا يُحتمل.
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

/** خانةٌ في بطاقة الحالة: اسمها، وقيمتها، وهل القيمة معلومة. */
interface Field { label: string; value: string; known: boolean }

const CASE1: Field[] = [
  { label: 'الصف', value: 'الثالث الابتدائي / ٢', known: true },
  { label: 'تاريخ الورود', value: `٤ جمادى الأولى ${iso('1448')}هـ — ${iso('15')} أكتوبر`, known: true },
  { label: 'اسم وليّ الأمر', value: 'لم يُفصح عنه في الاستمارة', known: false },
  { label: 'اسم المعلمة', value: 'لم يرد في نصّ وليّ الأمر إطلاقًا', known: false },
  { label: 'اسم الطالبة', value: 'لم يُذكر — والاستمارة لا تطلبه', known: false },
  { label: 'المادة', value: 'لم تُذكر', known: false },
]

const CASE2: Field[] = [
  { label: 'الصف', value: 'الخامس الابتدائي / ٢', known: true },
  { label: 'تاريخ الورود', value: `٣ جمادى الأولى ${iso('1448')}هـ — ${iso('14')} أكتوبر`, known: true },
  { label: 'اسم وليّ الأمر', value: 'لم يُفصح عنه في الاستمارة', known: false },
  { label: 'اسم المعلمة', value: 'لم يرد — والنصّ شكرٌ للجميع بلا استثناء', known: false },
]

const TEXT1 = `الله يعطيكم العافية على كل مجهود تبذلونه لراحة الطالبات او آداء الرسالة التعليمية. مقدره اهتمامكم وسهولة الوصول لكم عند الحاجة. اتمنى زيادة تحفيز الطالبات ودعمهم نفسياً بالايجابيات. مرحلة ثالث بدأ الجد اكثر وصعبت او كثرت المعلومات والمهام اللي ينجزونها وهم لسى ماتعودوا، ابسط شي يقدم لهم انو مايجيها احباط. بس كلمة من معلمة زي كلمة «انتي مهمله» اذا ماعرفت تجاوب مو معناته انها مهمله. انا الصراحة شفتها اثرت ف بنتي وعورت قلبي لمن تبكي مرتين ف يومها لمن تحكيني انها كرهت المادة وماعندها ثقة بنفسها انها تحصل على الدرجة الكاملة مع انها مهتمة ومنضبطة فالمدرسة`

const TEXT2 = `اشكركم فرداً فرداً ع جهودكم، وكل معلمه لها اسلوبها وطريقتها الخاصه اشكرهم عليها. اريد فقط كلمات التشجيع لانها تحفز الطالبه للاجتهاد والتقدم، ونتجنب الكلمات المحبطه للطالبه. ع سبيل المثال بنتي من النوع اللي تحب الثناء والتشجيع ومستعده تسوي كل شي من مذاكره واجتهاد مقابل انها تتشجع وتنقل لها كلمات جميله وثناء، وهذا الشي مهم لنفسيه الطالب. واشكركم جميعاً بلا استثناء 🤍`

/** ما ذكره وليُّ الأمر صراحةً — تُعرض كما قالها لا كما نقرؤها. */
const SIGNS: [string, string][] = [
  ['😢', 'بكاءٌ مرّتين في يومٍ دراسيٍّ واحد'],
  ['📕', 'تعبيرُها عن كُرهٍ للمادة'],
  ['📉', 'تراجعُ ثقتها بقدرتها على الدرجة الكاملة'],
  ['🗣️', 'وصفُها — بحسب روايتها لوالدتها — بـ«انتي مهمله»'],
  ['✅', 'ووصفُ وليّ الأمر لها بأنها «مهتمة ومنضبطة فالمدرسة»'],
]

const STEPS: [string, string][] = [
  ['مسحٌ إرشاديٌّ عام لطالبات الثالث / ٢',
   'دون الإشارة إلى هذه الورقة ولا إلى ورود شكوى، للوقوف على المؤشّرات أعلاه.'],
  ['تذكيرٌ عامٌّ بأسلوب الخطاب التحفيزي',
   'بصيغةٍ توعويةٍ جماعية، دون إشارةٍ إلى صفٍّ بعينه ولا إلى معلّمةٍ بعينها.'],
  ['متابعةُ الطالبة متى عُرفت',
   'عبر المرشدة الطلابية، وبما تراه الموجّهة مناسبًا من خطوات.'],
  ['حصرُ التداول',
   'لا تُدرج الحالة في أيّ مجموعةٍ أو ملفٍّ يُرسل للمعلمات.'],
]

const field = (f: Field) => `
<div class="f${f.known ? '' : ' f--unknown'}">
  <span class="f__k">${esc(f.label)}</span>
  <span class="f__v">${esc(f.value)}</span>
</div>`

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --green:#07a869; --teal:#0da9a6; --navy:#15445a; --sand:#c1b489;
        --amber:#c97a16; --amber-soft:#fff7ec; --rose:#b5485c;
        --muted:#4a6b78; --border:#d6e4e5; --soft:#f4f8f8; }
@page { size:A4 portrait; margin:0; }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Baloo',sans-serif; color:var(--navy); }
.sheet { padding:9mm 12mm 8mm; }
.sheet + .sheet { page-break-before:always; }

.runhead { display:flex; align-items:center; gap:9px; padding-bottom:7px; margin-bottom:11px;
           border-bottom:1.6px solid var(--border); }
.runhead img { height:22px; opacity:.9; }
.runhead span { font-size:10.5px; font-weight:800; color:var(--navy); }
.runhead em { margin-right:auto; font-style:normal; font-size:9.6px; color:var(--muted); }
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

.case { margin-top:11px; border:1.8px solid var(--border); border-radius:16px;
        overflow:hidden; break-inside:avoid; }
.case--main { border-color:var(--amber); border-width:2.2px; }
.case__top { display:flex; align-items:center; gap:9px; padding:8px 13px;
             background:var(--soft); border-bottom:1.4px solid var(--border); }
.case--main .case__top { background:var(--amber-soft); border-bottom-color:#f0d9b8; }
.case__no { font-size:11px; font-weight:800; color:#fff; background:var(--muted);
            border-radius:999px; padding:3px 12px; }
.case--main .case__no { background:var(--amber); }
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

.quote { margin-top:9px; border-right:4px solid var(--teal); border-radius:0 12px 12px 0;
         background:var(--soft); padding:9px 13px; }
.quote .lbl { font-size:9.6px; font-weight:800; color:var(--muted); margin-bottom:4px; }
.quote p { font-size:11.2px; line-height:1.95; }
.case--main .quote { border-right-color:var(--amber); background:var(--amber-soft); }

h2 { font-size:12.5px; font-weight:800; margin:10px 0 6px; padding-right:9px;
     border-right:4px solid var(--green); }
.signs { display:grid; gap:5px; }
.sign { display:grid; grid-template-columns:17px 1fr; gap:7px; align-items:baseline;
        border:1.2px solid var(--border); border-radius:9px; padding:5px 10px; }
.sign .ico { font-size:12px; text-align:center; }
.sign span { font-size:10.6px; line-height:1.6; }

.warn { margin-top:10px; border:2px solid var(--rose); border-radius:14px;
        padding:9px 13px; background:#fdf4f5; }
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
.ctx .nums { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.ctx .n { text-align:center; border:1.3px solid #cdeadd; border-radius:11px;
          padding:6px 4px; background:#fff; }
.ctx .n i { display:block; font-size:19px; font-weight:800; font-style:normal; color:var(--green); }
.ctx .n span { display:block; font-size:9.6px; color:var(--muted); margin-top:2px; }
.ctx p { font-size:10.2px; line-height:1.7; color:#2d5c54; margin-top:7px; text-align:center; }

.foot { margin-top:12px; padding-top:8px; border-top:1.5px dotted var(--muted);
        text-align:center; font-size:10px; line-height:1.7; color:var(--muted); }
.foot b { color:var(--navy); }
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
    <div><b>موضع الرأي:</b> <span>باب رأي وليّ الأمر المفتوح</span></div>
    <div><b>تاريخ الإحالة:</b> <span>٤ جمادى الأولى ${iso('1448')}هـ — ${iso('15')} أكتوبر ${iso('2026')}م</span></div>
    <div><b>طريقة الاستمارة:</b> <span>تُتيح الكتابة دون الإفصاح عن الاسم</span></div>
  </section>

  <article class="case case--main">
    <div class="case__top">
      <span class="case__no">الحالة ١</span>
      <span class="case__t">أثرٌ نفسيٌّ على طالبة</span>
      <span class="case__tag">تستدعي متابعةً إرشادية</span>
    </div>
    <div class="case__body">
      <div class="fields">${CASE1.map(field).join('')}</div>

      <div class="quote">
        <div class="lbl">نصُّ وليّ الأمر كاملًا وحرفيًّا — دون حذفٍ ولا تعديل</div>
        <p>«${esc(TEXT1)}»</p>
      </div>

      <h2>ما ذكره وليُّ الأمر صراحةً</h2>
      <div class="signs">${SIGNS.map(([i, t]) => `
        <div class="sign"><span class="ico">${i}</span><span>${esc(t)}</span></div>`).join('')}
      </div>

      <div class="warn">
        <b>⚠️ قبل أيّ إجراء — ثلاثُ ملاحظاتٍ تُقرأ أولًا</b>
        <ul>
          <li>لم يُذكر اسمُ أيِّ معلّمةٍ في النصّ. ولا يصحّ توجيهُ الحديث إلى معلّمةٍ بعينها استنادًا إليه وحده.</li>
          <li>الرواية منقولةٌ عن الطالبة إلى والدتها ثم إلينا — فتُعامَل بوصفها بلاغًا يستوجب التحقّق، لا واقعةً ثابتة.</li>
          <li>بدأ وليُّ الأمر رسالته بالشكر على الجهد وسهولة الوصول للإدارة — فالمقصدُ تحسينٌ لا تصعيد.</li>
        </ul>
      </div>
    </div>
  </article>

  <div class="note note--find">
    <b>🔎 كيف تُعرف الطالبة — ما تملكه الورقة وما لا تملكه</b>
    <p>الاستمارة لا تطلب اسمَ الطالبة ولا اسمَ وليّ الأمر، وهذا وليُّ أمرٍ اختار ألّا يُفصح.
    فالمعلوم هنا اثنان لا ثالث لهما: <b>الصفُّ الثالث الابتدائي / ٢</b>، و<b>تاريخُ الورود</b>.
    وعليهما وحدهما يُبنى ما بعدُ — بمسحٍ إرشاديٍّ عامٍّ للصفّ لا بسؤالٍ مباشرٍ عن صاحبة الشكوى،
    حتى لا تُستدلَّ الطالبةُ فتُحرَج، ولا تُستدلَّ المعلّمةُ فتُتَّهم قبل التحقّق.</p>
  </div>
</div>

<div class="sheet">
  <div class="runhead">
    <img src="${asset('public/brand/moe-logo-light.png', 'image/png')}" alt="">
    <span>إحالةٌ إلى الموجّهة الطلابية — بناءً على قياس اتجاه المتعلمين ${iso('1448')}هـ</span>
    <em>الصفحة ٢ من ٢</em>
  </div>

  <h2>المقترح للمعالجة — والقرار للموجّهة</h2>
  <div class="steps">${STEPS.map(([t, b]) => `
    <div class="step"><div><b>${esc(t)}</b><span>${esc(b)}</span></div></div>`).join('')}
  </div>

  <article class="case">
    <div class="case__top">
      <span class="case__no">الحالة ٢</span>
      <span class="case__t">مؤشّرٌ مُساند</span>
      <span class="case__tag">ليست شكوى</span>
    </div>
    <div class="case__body">
      <div class="fields">${CASE2.map(field).join('')}</div>
      <div class="quote">
        <div class="lbl">نصُّ وليّ الأمر كاملًا وحرفيًّا</div>
        <p>«${esc(TEXT2)}»</p>
      </div>
      <div class="note">
        <b>لماذا أُرفقت هنا</b>
        <p>هذه ليست شكوى، بل طلبٌ وُجِّه بأسلوبٍ شاكر. وأُرفقت لأنها تلتقي مع الحالة الأولى
        في النقطة نفسها: أثرُ الكلمة على الطالبة. وهما من وليَّي أمرٍ مختلفَين، وصفَّين
        مختلفَين — الثالث / ٢ والخامس / ٢ — ويومَين مختلفَين؛ أي أنّ الأمر ملاحظةٌ متكرّرة،
        لا حادثةٌ فرديةٌ معزولة.</p>
      </div>
    </div>
  </article>

  <div class="note">
    <b>ما ليس من اختصاص هذه الإحالة</b>
    <p>ورد في اليومين طلبان تنظيميان يخصّان جدولة تسميع القرآن والتقييم في أثناء الاختبارات،
    ومراعاة الضغط على طالبات السادس. وهما شأنٌ إداريٌّ تعليميّ لا شأنٌ إرشاديّ،
    ويُحالان إلى وكيلة الشؤون التعليمية على حدة.</p>
  </div>

  <section class="ctx">
    <b>إفادةٌ عامة للسياق — حصادُ اليومين</b>
    <div class="nums">
      <div class="n"><i>٢٤</i><span>إقرارًا وردت</span></div>
      <div class="n"><i>١٩</i><span>ثناءٌ صريح</span></div>
      <div class="n"><i>٤</i><span>ملاحظات</span></div>
      <div class="n"><i>١</i><span>اطّلاعٌ بلا كلمة</span></div>
    </div>
    <p>فمن الملاحظات الأربع حالتان في هذه الورقة، واثنتان تنظيميتان.
    وتُقرأ هذه الإحالة في سياق رضًا عام، لا في سياق تذمّر.</p>
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
