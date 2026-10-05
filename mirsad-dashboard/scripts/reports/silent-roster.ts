/**
 * كشف من لم يصل صوتها — ثلاث درجاتٍ لا درجتان.
 *
 * «لم تشارك» و«شاركت ولم تكتب شيئًا» حالتان مختلفتان، ويخلط بينهما
 * كشفٌ واحد فيُلاحَق أهلُ من شاركت كأنها غائبة. فهنّ هنا ثلاثٌ:
 * من لا أثر لها في القياس، ومن وصلت استجابتُها وخانةُ الاقتراح
 * فارغة، ومن كتبت فيها نفيًا («لا يوجد») — وهذه شاركت وأجابت،
 * فلا تُلاحَق.
 *
 * ويُكتب مع كل اسمٍ سندُ نسبته: «مؤكَّدة» إن ربطتها الإدارة بيدها،
 * و«بانتظار التأكيد» إن كان الربط ترشيحًا لم يُقَرّ بعد. والفرق
 * ليس تفصيلًا: من لم يُؤكَّد ربطُها قد يكون رأيُها واصلًا تحت اسمٍ
 * كُتب بصورةٍ أخرى، فنفيُ الكتابة عنها ظنٌّ لا يقين — ويُحسم
 * بتأكيد المطابقة في اللوحة لا بمطالبة أسرتها.
 *
 * والكشف يحمل أسماء طالبات، فمخرجه في «.report-out» وحدها — خارج
 * المستودع، لا يُرفع ولا يُنشر.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npx vite-node scripts/reports/silent-roster.ts -- --project <المشروع>
 */
import { globSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { chromium } from 'playwright'

import { nameFit } from '../../src/lib/attendance'
import { normalizeArabic } from '../../src/lib/arabic'
import { orderedClasses } from '../../src/lib/labels'
import { derivedVoices } from '../../src/domain/voices'
import type {
  Answer, ClassRoom, Grade, Id, Student, Suggestion, SurveyResponse,
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
const out = resolve(ROOT, option('out') ?? '.report-out/كشف-من-لم-يصل-صوتها-1448.pdf')
const txtOut = resolve(ROOT, option('txt') ?? '.report-out/كشف-من-لم-تشارك-1448.txt')

type ResponseDoc = SurveyResponse & { answers?: Omit<Answer, 'responseId'>[] }
interface Snapshot {
  grades: Grade[]
  classes: ClassRoom[]
  students: Student[]
  responses: ResponseDoc[]
  suggestions: Suggestion[]
}

async function snapshot(): Promise<Snapshot> {
  if (from) return JSON.parse(readFileSync(resolve(from), 'utf8')) as Snapshot
  if (!projectId) {
    console.error('الاستعمال: npx vite-node scripts/reports/silent-roster.ts -- --project <المشروع>')
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
  const names: (keyof Snapshot)[] = ['grades', 'classes', 'students', 'responses', 'suggestions']
  const slices = await Promise.all(names.map(pull))
  return Object.fromEntries(names.map((name, i) => [name, slices[i]])) as unknown as Snapshot
}

const d = await snapshot()
const responses: SurveyResponse[] = d.responses.map(({ answers: _drop, ...rest }) => rest)
const answers: Answer[] = d.responses.flatMap((r) =>
  (r.answers ?? []).map((a) => ({ responseId: r.id, ...a })))
const active = d.students.filter((s) => s.status === 'active')

/**
 * الأثر مع سنده: الاستجابة التي جاء منها، لا نوعه وحده.
 *
 * وهو تَتبُّعُ «attendance» نفسه بدرجاته الثلاث، غير أنه يحتفظ
 * بمعرّف الاستجابة كي يُقرأ نصُّ خانة الاقتراح فيها. ولو اكتُفي
 * بالخريطة الجاهزة لعُرف أن للطالبة أثرًا ولم يُعرف أين كتبت.
 */
type Trace = 'confirmed' | 'candidate' | 'name'
const link = new Map<Id, { kind: Trace; ids: Id[] }>()
const put = (sid: Id, kind: Trace, rid: Id) => {
  const cur = link.get(sid)
  if (!cur) link.set(sid, { kind, ids: [rid] })
  else if (cur.kind === kind) cur.ids.push(rid)
}

const pending: SurveyResponse[] = []
for (const r of responses) {
  if (r.studentId) { put(r.studentId, 'confirmed', r.id); continue }
  for (const id of r.candidateStudentIds ?? []) if (!link.has(id)) put(id, 'candidate', r.id)
  pending.push(r)
}
for (const r of pending) {
  const raw = (r.rawName ?? '').trim()
  if (!raw) continue
  let best: { student: Student; fit: number } | null = null
  for (const student of active) {
    const fit = nameFit(student.name, raw)
    if (fit > 0 && (!best || fit > best.fit)) best = { student, fit }
  }
  if (best && !link.has(best.student.id)) put(best.student.id, 'name', r.id)
}

/** نصّ خانة الاقتراح: المستورد في مجموعة الآراء، والقادم من الرابط داخل إجابته. */
const voices = [...d.suggestions, ...derivedVoices(responses, answers, d.suggestions, d.students)]
const said = new Map<Id, string>()
for (const v of voices) {
  const t = v.text?.trim()
  if (!t) continue
  said.set(v.responseId, said.has(v.responseId) ? `${said.get(v.responseId)} | ${t}` : t)
}

/**
 * نفيٌ لا رأي: «لا يوجد» وأخواتها.
 * وهي مشاركةٌ تامّة — سُئلت الأسرة فأجابت بأن لا ملاحظة لها — فلا
 * تُعدّ في المتروك، وتُفرد في عمودٍ ثالث كي لا تُلاحَق بالخطأ.
 */
const bare = (t: string) => normalizeArabic(t).replace(/[^؀-ۿa-zA-Z0-9]+/g, '')
const NIL = /^(لايوجد|لا|لاشي|لاشيء|ولاشي|لايوجداياقتراح|لايوجدشي|لاينقصشئفيها|كلشيمتووفر|0+|0+)$/u

type Kind = 'none' | 'blank' | 'nil' | 'wrote'
interface Row { student: Student; kind: Kind; trace: Trace | null }
const rows: Row[] = active.map((student) => {
  const l = link.get(student.id)
  if (!l) return { student, kind: 'none', trace: null }
  const text = l.ids.map((i) => said.get(i) ?? '').filter(Boolean).join(' | ')
  const kind: Kind = !text ? 'blank' : NIL.test(bare(text)) ? 'nil' : 'wrote'
  return { student, kind, trace: l.kind }
})

/** أرقام لاتينية (0 1 2 3) في كل المطبوعات، كما في الشاشات — بطلب المدرسة. */
const AR = 'ar-SA-u-nu-latn'
/**
 * الأرقام اللاتينية داخل سطرٍ عربي تُعزل بـU+2066/U+2069.
 *
 * العلامات المحايدة حول الرقم (% و− و/) لا تنتمي إليه، فتأخذ اتجاه
 * الجملة وتقفز إلى طرفها الخطأ: «%96.3» بدل «96.3%». والعازلان لا
 * يُرسمان، ويعملان في HTML وفي النص المستخرج من PDF سواء.
 */
const iso = (t: string) => `\u2066${t}\u2069`
const n = (v: number) => iso(new Intl.NumberFormat(AR).format(v))
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const byName = (a: Row, b: Row) => a.student.name.localeCompare(b.student.name, 'ar')

const count = (k: Kind) => rows.filter((r) => r.kind === k).length
const unsure = rows.filter((r) => r.kind === 'blank' && r.trace !== 'confirmed').length
const sure = count('blank') - unsure

const rooms = orderedClasses(d.grades, d.classes).map(({ room, grade }) => {
  const mine = rows.filter((r) => r.student.classId === room.id)
  return {
    room,
    label: `${grade?.name ?? ''} / فصل ${/^\d+$/.test(String(room.name)) ? n(Number(room.name)) : room.name}`,
    none: mine.filter((r) => r.kind === 'none').sort(byName),
    blank: mine.filter((r) => r.kind === 'blank').sort(byName),
    nil: mine.filter((r) => r.kind === 'nil').sort(byName),
    wrote: mine.filter((r) => r.kind === 'wrote').length,
  }
})

// ① نصٌّ للّصق: من لم تشارك وحدهن، ومعهنّ رابط الفصل.
const RULE = '─'.repeat(44)
const text = [
  `كشف من لم تصل استجابة أسرتها — ${n(count('none'))} طالبة`,
  `قياس اتجاه المتعلمين 1448هـ · الابتدائية الخامسة والستون بعد المائة`,
  '',
  ...rooms.filter((r) => r.none.length).flatMap((r) => [
    RULE,
    `${r.label} — ${n(r.none.length)}`,
    `https://${host}/#/survey/${r.room.id}`,
    ...r.none.map((x) => `• ${x.student.name}`),
    '',
  ]),
].join('\n')

const asset = (path: string, mime: string) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, path)).toString('base64')}`
const font = (file: string) => asset(`public/fonts/${file}`, 'font/woff2')

/** «م» مؤكَّدة الربط، و«ت» بانتظار تأكيد المطابقة. */
const mark = (r: Row) => r.trace === 'confirmed'
  ? '<span class="tag tag--sure">م</span>'
  : '<span class="tag tag--wait">ت</span>'

const roomBlock = (r: typeof rooms[number]) => `
<section class="room">
  <h3>${esc(r.label)}
    <span class="tally">كتبن ${n(r.wrote)} · «لا يوجد» ${n(r.nil.length)} ·
      بلا كلمة ${n(r.blank.length)} · لم تشارك ${n(r.none.length)}</span></h3>
  <div class="cols">
    <div class="col col--none"><h4>لم تشارك <b>${n(r.none.length)}</b></h4>
      ${r.none.length ? `<ol>${r.none.map((x) => `<li>${esc(x.student.name)}</li>`).join('')}</ol>`
    : '<p class="done">اكتمل الفصل</p>'}</div>
    <div class="col col--blank"><h4>شاركت ولم تكتب شيئًا <b>${n(r.blank.length)}</b></h4>
      ${r.blank.length ? `<ol>${r.blank.map((x) => `<li>${esc(x.student.name)} ${mark(x)}</li>`).join('')}</ol>`
    : '<p class="done">كلهن كتبن</p>'}</div>
    <div class="col col--nil"><h4>كتبت «لا يوجد» <b>${n(r.nil.length)}</b></h4>
      ${r.nil.length ? `<ol>${r.nil.map((x) => `<li>${esc(x.student.name)}</li>`).join('')}</ol>`
    : '<p class="done">—</p>'}</div>
  </div>
</section>`

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face { font-family:'Baloo'; src:url('${font('BalooBhaijaan2-Variable.woff2')}') format('woff2'); font-weight:400 800; }
:root { --green:#07a869; --cyan:#218caa; --navy:#15445a; --muted:#4a6b78; --border:#d6e4e5;
        --red:#c0392b; --amber:#b9770e; --soft:#f4f8f8; }
@page { size:A4; margin:11mm 10mm; }
* { box-sizing:border-box; }
body { margin:0; font-family:'Baloo',sans-serif; color:var(--navy); font-size:10px; }
h1 { font-size:20px; font-weight:800; margin:0 0 2px; text-align:center; }
.sub { text-align:center; font-size:10.5px; color:var(--green); font-weight:700; }
.org { text-align:center; font-size:8.6px; color:var(--muted); margin-top:3px;
       border-bottom:2px solid var(--navy); padding-bottom:6px; }
.figs { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin:9px 0; }
.fig { border:1.3px solid var(--border); border-radius:10px; padding:6px 4px; text-align:center; }
.fig b { display:block; font-size:17px; font-weight:800; }
.fig span { font-size:8.4px; color:var(--muted); }
.fig--none b { color:var(--red); } .fig--blank b { color:var(--amber); }
.fig--nil b { color:var(--cyan); } .fig--wrote b { color:var(--green); }
.note { background:var(--soft); border-right:4px solid var(--cyan); border-radius:9px;
        padding:7px 11px; font-size:9px; line-height:1.7; margin:0 0 10px; }
.note b { color:var(--navy); }
.room { break-inside:avoid; margin-bottom:9px; }
h3 { font-size:11.5px; font-weight:800; margin:0 0 4px; padding:4px 9px; border-radius:7px;
     background:var(--navy); color:#fff; display:flex; justify-content:space-between; align-items:center; }
.tally { font-size:8.2px; font-weight:400; color:#bcd8de; }
.cols { display:grid; grid-template-columns:1fr 1.25fr 1fr; gap:7px; }
.col { border:1.2px solid var(--border); border-radius:9px; padding:5px 8px 6px; }
.col--none { border-color:#eab6ae; } .col--blank { border-color:#e6d2a4; }
h4 { font-size:8.8px; font-weight:700; color:var(--muted); margin:0 0 3px;
     border-bottom:1px dotted var(--border); padding-bottom:3px; }
h4 b { float:left; font-size:10px; }
.col--none h4 b { color:var(--red); } .col--blank h4 b { color:var(--amber); }
ol { margin:0; padding-right:15px; }
li { font-size:8.8px; line-height:1.62; }
.done { margin:2px 0 0; font-size:8.6px; color:var(--green); font-weight:700; }
.tag { font-size:7px; font-weight:700; border-radius:4px; padding:0 3px; margin-right:2px; }
.tag--sure { background:#d9f0e4; color:#07734c; }
.tag--wait { background:#f4e7c8; color:#8a5a08; }
.signs { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:12px; text-align:center;
         break-inside:avoid; }
.signs .role { font-size:8.6px; color:var(--muted); }
.signs .who { font-size:11.5px; font-weight:800; margin-top:3px;
              border-bottom:1.2px dotted var(--muted); padding-bottom:6px; }
</style></head><body>

<h1>كشف من لم يصل صوتها</h1>
<div class="sub">قياس اتجاه المتعلمين 1448هـ</div>
<div class="org">الإدارة العامة للتعليم بمحافظة جدة — الابتدائية الخامسة والستون بعد المائة</div>

<div class="figs">
  <div class="fig fig--none"><b>${n(count('none'))}</b><span>لم تشارك إطلاقًا</span></div>
  <div class="fig fig--blank"><b>${n(count('blank'))}</b><span>شاركت ولم تكتب شيئًا</span></div>
  <div class="fig fig--nil"><b>${n(count('nil'))}</b><span>كتبت «لا يوجد»</span></div>
  <div class="fig fig--wrote"><b>${n(count('wrote'))}</b><span>كتبت رأيًا</span></div>
</div>

<p class="note">
<b>«لم تشارك»</b> لا أثر لاستجابتها إطلاقًا — وهؤلاء وحدهن تُذكَّر أسرهن.
<b>«ولم تكتب شيئًا»</b> وصلت استجابتها وخانة الاقتراح فارغة.
<b>«لا يوجد»</b> شاركت وأجابت بأن لا ملاحظة لديها — فلا تُلاحَق.<br>
وأمام كل اسمٍ في العمود الأوسط سندُ نسبته: <span class="tag tag--sure">م</span> ربطٌ
أكّدته الإدارة (${n(sure)} طالبة)، و<span class="tag tag--wait">ت</span> ترشيحٌ لم يُؤكَّد بعد
(${n(unsure)} طالبة) — وهؤلاء قد يكون رأيُ أسرتها واصلًا باسمٍ كُتب بصورةٍ أخرى، فيُحسم
الأمر بزر «تأكيد الحالات ذات المرشّح الواحد» في مركز مراجعة المطابقة، لا بمطالبة الأسرة.
</p>

${rooms.map(roomBlock).join('')}

<div class="signs">
  <div><div class="role">مديرة المدرسة</div><div class="who">جازية السميري</div></div>
  <div><div class="role">إعداد · المساعد الإداري</div><div class="who">عواطف الجهني</div></div>
</div>
</body></html>`

mkdirSync(dirname(out), { recursive: true })
writeFileSync(txtOut, text, 'utf8')
/** متصفّح الحاوية مثبَّت بنسخةٍ غير التي تنتظرها playwright، فيُمرَّر مساره. */
const executablePath = process.env.CHROMIUM_PATH
  ?? globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome').sort().at(-1)
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle' })
await page.pdf({ path: out, format: 'A4', printBackground: true })
await browser.close()

console.log(`✓ ${out}`)
console.log(`✓ ${txtOut}`)
console.log(`  لم تشارك ${n(count('none'))} · بلا كلمة ${n(count('blank'))}`
  + ` (منها ${n(unsure)} بانتظار تأكيد المطابقة) · «لا يوجد» ${n(count('nil'))}`
  + ` · كتبت ${n(count('wrote'))}`)
