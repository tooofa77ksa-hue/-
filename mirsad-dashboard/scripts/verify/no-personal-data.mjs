/**
 * حارس النشر: يرفض نسخة بناء تحتوي بيانات شخصية.
 *
 * يأخذ الأسماء الحقيقية من src/data/school-data.json ويبحث عنها في كل
 * ملف داخل dist/. إن وُجد اسم واحد، فشل الفحص ولم تُنشر النسخة.
 *
 * لا يطبع هذا الملف اسمًا قط — يطبع العدد والملف فقط، لأن سجلّات
 * البناء نفسها قد تُقرأ من غير مخوَّل.
 *
 *   node scripts/verify/no-personal-data.mjs [dist]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const distDir = resolve(root, process.argv[2] ?? 'dist')
const dataFile = join(root, 'src', 'data', 'school-data.json')

let school
try {
  school = JSON.parse(readFileSync(dataFile, 'utf8'))
} catch {
  console.log('ℹ لا يوجد ملف بيانات مدرسة على هذا الجهاز — لا شيء يمكن تسريبه.')
  process.exit(0)
}

/**
 * كل نصّ شخصي: أسماء الطالبات، والأسماء كما كُتبت في الاستجابات، والآراء.
 *
 * تُستبعد النصوص القصيرة جدًا (مثل «()» التي كتبتها إحداهن مكان اسمها):
 * ليست معرِّفة لأحد، ووجودها العَرَضي في ملف خط أو صورة يُغرق الفحص
 * بإنذارات كاذبة فيفقد معناه.
 */
const LETTERS = /[\u0600-\u06FFA-Za-z]/g
const identifying = (text) => {
  const value = text?.trim() ?? ''
  return value.length >= 6 && (value.match(LETTERS)?.length ?? 0) >= 4 ? value : null
}

/**
 * الأسماء ممنوعة في كل ملف، والآراء ممنوعة إلا فيما نشرته المدرسة عمدًا.
 *
 * اسمُ طالبة لا يخرج إلى الشبكة في أي حال. أمّا نصُّ الرأي فقد تختار
 * المدرسة نشر بعضه — كلمات الثناء في صفحة الشكر، وما عُمل ردًّا على
 * الملاحظات — وهو قرارٌ تتّخذه عن علمٍ لا تسريبٌ عارض.
 *
 * فيُفصل الفحصان: ما تحت «data/» يُفحص بحثًا عن الأسماء وحدها، لأن
 * ملفّاته لا تُكتب إلا بأمرٍ صريح يحمل «‎--publish». وما سواه يُفحص
 * بحثًا عن الاثنين معًا.
 */
const names = new Set()
const voices = new Set()
for (const s of school.students ?? []) { const v = identifying(s.name); if (v) names.add(v) }
for (const r of school.responses ?? []) { const v = identifying(r.rawName); if (v) names.add(v) }
for (const g of school.suggestions ?? []) { const v = identifying(g.text); if (v?.length > 12) voices.add(v) }

/** ملفّاتُ النشر المقصود: الأسماء فيها ممنوعة، والآراء مسموحة. */
const PUBLISHED = /^data[/\\]/

if (names.size === 0 && voices.size === 0) {
  console.log('ℹ ملف البيانات لا يحتوي نصوصًا شخصية.')
  process.exit(0)
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

let files
try {
  files = walk(distDir)
} catch {
  console.error(`✗ لا يوجد مجلد بناء عند ${distDir} — نفّذي npm run build أولًا.`)
  process.exit(1)
}

const offenders = new Map()
let published = 0
for (const file of files) {
  const relative = file.slice(distDir.length + 1)
  const openly = PUBLISHED.test(relative)
  if (openly) published += 1
  const text = readFileSync(file, 'latin1') + '\n' + readFileSync(file, 'utf8')
  let hits = 0
  for (const secret of names) if (text.includes(secret)) hits += 1
  if (!openly) for (const secret of voices) if (text.includes(secret)) hits += 1
  if (hits > 0) offenders.set(relative, hits)
}

console.log(`فُحص ${files.length} ملفًا في ${distDir}`
  + ` بحثًا عن ${names.size} اسمًا و${voices.size} رأيًا.`)
if (published > 0) {
  console.log(`  (${published} ملفًا تحت «data/» نشرته المدرسة عمدًا:`
    + ' فُحص بحثًا عن الأسماء وحدها.)')
}

if (offenders.size > 0) {
  console.error('\n✗ النسخة تكشف بيانات شخصية — النشر ممنوع.')
  for (const [file, hits] of offenders) console.error(`   ${file}: ${hits} تطابقًا`)
  console.error('\nتأكّدي أن متغيّر VITE_MIRSAD_FIREBASE_PROJECT_ID مضبوط عند البناء،')
  console.error('فهو ما يجعل البناء يستبعد بيانات المدرسة من ملفات المتصفّح.')
  process.exit(1)
}

console.log('✓ لا اسمَ طالبةٍ في النسخة، ولا رأيَ خارج ما نُشر عمدًا. النشر آمن من هذه الجهة.')
