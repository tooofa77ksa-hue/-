/**
 * «ماذا قال أولياء الأمور عنكنّ» — ورقةٌ تُرسل لمجموعة المنسوبات.
 *
 * بلا اسمِ معلّمةٍ واحدة. فالأهالي سمَّوا بعضهنّ ولم يُسمُّوا بعضًا،
 * ونشرُ الأسماء في مجموعةٍ يجعل من غابَ اسمُها تظنّ أنها لم تُشكر.
 * فما ورد فيه اسمٌ يُنقل هنا منزوعَ الاسم بنقاطٍ ظاهرة، ويُسلَّم
 * كاملًا لصاحبته على حدة.
 *
 *   npx vite-node scripts/reports/praise-board.ts
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
const out = resolve(ROOT, option('out') ?? '.report-out/ثناء-أولياء-الأمور-للمنسوبات.pdf')

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')

const iso = (t: string) => `⁦${t}⁩`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
/** أرقامٌ هنديةٌ كالتي في بقية الورقة، لا لاتينيةٌ تشذّ عنها. */
const ar = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])

interface Quote { icon: string; text: string; note?: string }
interface Part { icon: string; title: string; tone: 'a' | 'b' | 'c' | 'd'; quotes: Quote[] }

const PARTS: Part[] = [
  {
    icon: '🏫', title: 'عن المدرسة كلّها', tone: 'a',
    quotes: [
      { icon: '🌷', text: 'اشكر جميع منسوبي المدرسه من مديره واداريات ومعلمات على حرصهم واهتمامهم الدايم وحفظ الامانة التي بين ايديهن... درست لي بنتين وتخرجن، وكنت حريصه على ان تكمل في هذه المدرسه لمى عرفت عن منسوباتها بالاخلاق العاليه وايصال الماده التعليميه بكل حرص. فجزاكم الله خيراً، والى الامام، ونحن معكم يداً بيد لانجاح هذا الصرح التعليمي.' },
      { icon: '🤍', text: 'إلى إدارة مدرستنا الغالية ومعلمتنا الفاضلة، شكرًا من القلب لكل ما تقدمونه من عطاء واهتمام، ولكل أثر جميل تتركونه في نفوس بناتنا. وجودكم وحرصكم يصنعان فرقًا لا يُنسى، فلكم منا كل الحب والتقدير والامتنان.' },
      { icon: '💚', text: 'اقدم كل الشكر والتقدير للاداره والمعلمات الرائعين. نظام وحرص واهتمام بالطالبات. فخوره والله ان بناتي يدرسو في هذي المدرسه الجميله.' },
      { icon: '🩵', text: 'ثاني بنت لي فالمدرسة، وكل شخص يسألني عن المدرسة اثني عليها: ادارة ومعلمات متعاونات. اشكركم من قلبي على حرصكم واهتمامكم.' },
      { icon: '🌼', text: 'مدرسة رائعة بروعة طاقمها... الله يسعدكم سعادة الدنيا والاخرة.' },
      { icon: '✨', text: 'جميعكم صفوة مخلصة موفقة.' },
    ],
  },
  {
    icon: '📚', title: 'عن المعلّمات', tone: 'b',
    quotes: [
      { icon: '🌸', text: 'شكراً لأنكن لم تكنّ مجرد ملقنات للدروس، بل كنتنّ أمهات مربيات زرعتن الشغف وحب التعلم في قلب ابنتي. بارك الله في أيديكن وجهودكن.' },
      { icon: '💐', text: 'معلماتنا الفاضلات.. منارات العلم والتربية في الابتدائية ١٦٥. إلى كل معلمةٍ تعطي بلا حدود، وتزرع في قلب ابنتي أثرًا لا يمحوه الزمن. تعجز الكلمات عن شكركنّ جميعاً على عطائكنّ المستمر وصبركنّ الدائم. أنتنّ الشموع التي تضيء طريق المستقبل لابنتي، وحين يصلكنّ ثناؤنا فاعلمنَ أن تعبكنّ مقدّر ومحفوظ في قلوبنا قبل كلماتنا.' },
      { icon: '💗', text: 'شكرًا لأنكِ معلمة تُعلّم بحب، وتترك أثرًا يفوق حدود الكلمات. قد تمرّ الأيام وتُنسى بعض الكلمات، لكن المواقف الجميلة تبقى محفورة في الذاكرة.' },
      { icon: '🌻', text: 'شكراً لكل من تعبت لأجل أن تصل المعلومة لابنتي.' },
      { icon: '🕊️', text: 'أنتِ شمعة تضيء لنا طريق المستقبل، وأنتِ من تصنعين الأجيال وتغرسين فينا الأمل والطموح. شكرًا يا معلمتي، فأنتِ فخرٌ لنا، وأثركِ الجميل سيبقى في قلوبنا دائمًا.', note: 'كتبتها طالبة في الثاني الابتدائي بيدها' },
    ],
  },
  {
    icon: '🗂️', title: 'عن الإداريات والإشراف', tone: 'c',
    quotes: [
      { icon: '🌷', text: 'شكراً لكنَّ أيتها الإداريات الرائعات على جهودكن الدؤوبة وروحكن الإيجابية التي تضفي الراحة والطمأنينة على قلوب الأمهات والطالبات. أنتنّ شريك أساسي في كل نجاح تحققه ابنتي.' },
      { icon: '🌸', text: 'بصراحه كل مااشوفهنّ البسمه ماتفارقهنّ. روحهنّ الحلوة. الله يسعدهنّ وين مايكنّ. كل الشكر والتقدير على احتوائهنّ وحرصهنّ على الطالبات.' },
      { icon: '💙', text: 'كل الشكر والتقدير لجهودٍ كبيرة في إدارة المدرسة بحكمة واقتدار. وحرصٌ مستمر على توفير بيئة تعليمية محفزة وآمنة ينعكس بوضوح على سعادة ابنتي وتطورها المستمر.' },
    ],
  },
  {
    icon: '💌', title: 'كلمات قصيرة وصلت كما هي', tone: 'd',
    quotes: [
      { icon: '🌹', text: 'أحب اشكر كل المعلمات والاداريات. بارك الله فيكم وجزاكم الله خيرا.' },
      { icon: '💙', text: 'المدرسه رائعه، والمعلمات متعاونات، والاداره لامثيل لها. شكرا لكم.' },
      { icon: '🌷', text: 'مدرسه جميله بقياده اعظم واجمل مديره.' },
      { icon: '🤍', text: 'اشكر مديرة المدرسه والمعلمات الفضلات على كل شيء جميل قدمتموه لي بناتنا. شكرا لكم من كل قلبي.' },
      { icon: '🌼', text: 'لكم جزيل الشكر والتقدير والاحترام على كل شيء جميل قدمتموه.' },
      { icon: '✨', text: 'الله يسعدكم سعادة الدنيا والاخرة، شكرا على إخلاصكم.' },
      { icon: '💐', text: 'أتقدم إليكم بخالص الشكر والتقدير على كل ما قدمتموه.' },
    ],
  },
]

/** ما لا يُرى من العمل — يُسمَّى هنا لأنّ الأهالي رأوا أثره ولم يروه. */
const UNSEEN = [
  'من صباحٍ وقفتِ فيه وأنتِ متعبة،',
  'ومن حصةٍ أعدتِ شرحها مرّة ثانية وثالثة،',
  'ومن طالبةٍ احتويتِها حين لم يرَ أحدٌ ذلك،',
  'ومن ورقةٍ صحّحتِها بعد الدوام،',
  'ومن بابٍ فتحتِه لأمٍّ قلقة فطمأنتِها.',
]

const quote = (q: Quote) => `
<li>
  <span class="q__i">${q.icon}</span>
  <span class="q__t">«${esc(q.text)}»${q.note ? `<em>— ${esc(q.note)}</em>` : ''}</span>
</li>`

const part = (p: Part) => `
<section class="part part--${p.tone}">
  <h2><span>${p.icon}</span>${esc(p.title)}<i>${ar(p.quotes.length)}</i></h2>
  <ul>${p.quotes.map(quote).join('')}</ul>
</section>`

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --green:#07a869; --teal:#0da9a6; --navy:#15445a; --sand:#c1b489;
        --rose:#d4718a; --violet:#8a6fb0; --muted:#4a6b78; --border:#d6e4e5; --soft:#f4f8f8; }
@page { size:A4 portrait; margin:0; }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Baloo',sans-serif; color:var(--navy); }
.sheet { padding:9mm 12mm 8mm; }
.sheet + .sheet { page-break-before:always; }

.head { text-align:center; border-bottom:2px solid var(--navy); padding-bottom:7px; }
.head img { height:38px; }
.head .org { font-size:10.5px; color:var(--muted); margin-top:6px; }
.head .school { font-size:13.5px; font-weight:800; margin-top:3px; }

h1 { text-align:center; font-size:23px; font-weight:800; margin-top:10px; line-height:1.35; }
h1 small { display:block; font-size:12px; font-weight:700; color:var(--green); margin-top:4px; }

.lede { margin-top:9px; border:2px solid var(--teal); border-radius:15px; padding:10px 14px;
        background:linear-gradient(170deg,#f0fafa,#f6fbfb); text-align:center; }
.lede p { font-size:10.8px; line-height:1.8; color:#34606f; }
.lede p + p { margin-top:5px; }
.lede b { color:var(--navy); font-weight:800; }

.part { margin-top:10px; border:1.6px solid var(--border); border-radius:16px;
        padding:9px 13px 10px; break-inside:avoid; }
.part--a { border-color:#bfe7d6; background:linear-gradient(170deg,#f4fcf8,#fafdfc); }
.part--b { border-color:#bfe5e7; background:linear-gradient(170deg,#f2fafb,#fafdfd); }
.part--c { border-color:#dcd1ea; background:linear-gradient(170deg,#f8f5fc,#fcfbfe); }
.part--d { border-color:#f0d3dc; background:linear-gradient(170deg,#fdf6f8,#fefbfc); }

h2 { display:flex; align-items:center; gap:8px; font-size:14.5px; font-weight:800;
     padding-bottom:7px; border-bottom:1.4px dotted var(--border); }
h2 span { font-size:16px; }
h2 i { margin-right:auto; font-style:normal; font-size:10px; font-weight:800; color:#fff;
       background:var(--muted); border-radius:999px; padding:2px 10px; }
.part--a h2 i { background:var(--green); }
.part--b h2 i { background:var(--teal); }
.part--c h2 i { background:var(--violet); }
.part--d h2 i { background:var(--rose); }

ul { list-style:none; margin-top:8px; display:grid; gap:6px; }
li { display:grid; grid-template-columns:17px 1fr; gap:8px; align-items:start;
     background:#fff; border:1.1px solid var(--border); border-radius:11px; padding:7px 11px; }
.q__i { font-size:12px; line-height:1.7; text-align:center; }
.q__t { font-size:10.6px; line-height:1.85; }
.q__t em { display:block; font-style:normal; font-size:9.4px; color:var(--muted); margin-top:3px; }

.close { margin-top:11px; border:2.2px solid var(--green); border-radius:16px; padding:11px 15px;
         background:linear-gradient(170deg,#f2fbf7,#f6fbfb); text-align:center; }
.close b { display:block; font-size:15px; font-weight:800; margin-bottom:7px; }
.close .lines { font-size:11px; line-height:2; color:#2d5c54; }
.close .seen { font-size:11.4px; font-weight:800; margin-top:8px; }
.close .all { font-size:11px; line-height:1.8; color:#2d5c54; margin-top:5px; }
.khamis { margin-top:10px; text-align:center; font-size:19px; font-weight:800; color:var(--green); }

.runhead { display:flex; align-items:center; gap:9px; padding-bottom:7px; margin-bottom:11px;
           border-bottom:1.6px solid var(--border); }
.runhead img { height:22px; opacity:.9; }
.runhead span { font-size:10.5px; font-weight:800; }
.runhead em { margin-right:auto; font-style:normal; font-size:9.6px; color:var(--muted); }
</style></head><body>

<div class="sheet">
  <header class="head">
    <img src="${asset('public/brand/moe-logo.png', 'image/png')}" alt="وزارة التعليم">
    <div class="org">الإدارة العامة للتعليم بمحافظة جدة</div>
    <div class="school">الابتدائية الخامسة والستون بعد المائة</div>
  </header>

  <h1>🌸 ماذا قال أولياء الأمور عنكنّ 🌸
    <small>من استطلاع «قياس اتجاه المتعلمين» — ${iso('1448')}هـ</small>
  </h1>

  <div class="lede">
    <p>فتحنا لأولياء الأمور بابَ الرأي ليقولوا ما عندهم بحرّية،
    فوصلتنا <b>٢٤ رسالة في يومين</b>. وهذه كلماتُهم كما وصلت:
    بلا تعديل، وبلا ترتيبِ أحدٍ على أحد. 🤍</p>
    <p>وقبل أن تقرأن — <b>ما جاء لم يكن لواحدةٍ دون أخرى. كان لكنَّ جميعًا:</b>
    للمعلّمة، وللإدارية، ولكلِّ يدٍ تعمل في هذا المبنى. 💙</p>
  </div>

  ${PARTS.slice(0, 2).map(part).join('')}
</div>

<div class="sheet">
  <div class="runhead">
    <img src="${asset('public/brand/moe-logo-light.png', 'image/png')}" alt="">
    <span>🌸 ماذا قال أولياء الأمور عنكنّ — ${iso('1448')}هـ</span>
    <em>الصفحة ٢ من ٢</em>
  </div>

  ${PARTS.slice(2).map(part).join('')}

  <section class="close">
    <b>💐 وأخيرًا — إلى كلِّ واحدةٍ منكنّ 💐</b>
    <div class="lines">جاءت هذه الكلمات<br>${UNSEEN.map(esc).join('<br>')}</div>
    <div class="seen">كلُّ هذا رآه الأهالي. وكتبوه. ووصلَنا. 🤍</div>
    <div class="all">وما بلغَنا منهم لم يكن لواحدةٍ دون أخرى — كان لكنَّ جميعًا.</div>
  </section>

  <div class="khamis">🌸 خميسكم ونيس 🌸</div>
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
