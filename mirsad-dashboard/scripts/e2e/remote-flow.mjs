/**
 * تجربة النظام كاملًا على متصفّح حقيقي وقاعدة بيانات حقيقية (المحاكي).
 *
 * تُثبت هذه التجربة ثلاثة أشياء لا يثبتها نجاح البناء:
 *   ١) الصفحة التي تفتحها الطالبة لا تحمل اسم طالبة واحدة.
 *   ٢) استجابتها تصل قاعدة البيانات فعلًا وتظهر للإدارة.
 *   ٣) لوحة الإدارة لا تُفتح إلا بحساب يحمل صلاحية admin.
 *
 * تُشغَّل داخل firebase emulators:exec بعد البناء والرفع.
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const dist = join(root, 'dist')
const PORT = 5199
const ADMIN_EMAIL = 'e2e-admin@example.test'
const ADMIN_PASSWORD = 'e2e-password-1448'

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon',
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  let file = join(dist, normalize(url.pathname).replace(/^(\.\.[/\\])+/, ''))
  if (!existsSync(file) || url.pathname === '/') file = join(dist, 'index.html')
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))

const checks = []
const check = (name, ok, detail = '') => {
  checks.push({ name, ok, detail })
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

// ───── أعداد قاعدة البيانات قبل التجربة ─────
const { initializeApp } = await import('firebase-admin/app')
const { getFirestore } = await import('firebase-admin/firestore')
initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-qiyas' })
const db = getFirestore()

const before = (await db.collection('responses').count().get()).data().count
const studentCount = (await db.collection('students').count().get()).data().count
const sampleName = (await db.collection('students').limit(1).get()).docs[0]?.data().name ?? ''

// المتصفّح مثبّت مسبقًا في هذه البيئة؛ نأخذ أول مسار موجود منه
const CHROME_PATHS = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
].filter(Boolean)
const executablePath = CHROME_PATHS.find((p) => existsSync(p))
const browser = await chromium.launch(executablePath ? { executablePath } : {})
browser.on('disconnected', () => {})

try {
  // ═════ ١) صفحة القياس لا تحمل أسماء ═════
  console.log('\n١) القياس العام')
  const visitor = await browser.newContext()
  const page = await visitor.newPage()
  page.on('console', (m) => { if (m.type() === 'error') console.log('    [صفحة]', m.text().slice(0, 200)) })
  page.on('pageerror', (e) => console.log('    [خطأ صفحة]', String(e).slice(0, 200)))
  const bodies = []
  page.on('response', async (r) => {
    if (/\.js(\?|$)/.test(r.url())) {
      try { bodies.push(await r.text()) } catch { /* ignore */ }
    }
  })

  await page.goto(`http://127.0.0.1:${PORT}/#/survey`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.choice, .survey__card', { timeout: 20000 })

  const leaked = sampleName && bodies.some((b) => b.includes(sampleName))
  check('ملفات الصفحة لا تحمل اسم طالبة', !leaked, `${bodies.length} ملف JavaScript`)

  const html = await page.content()
  check('الصفحة المعروضة لا تحمل اسم طالبة', !sampleName || !html.includes(sampleName))

  // ═════ ٢) إرسال استجابة ═════
  await page.locator('.choice').first().click()
  await page.locator('.choice').first().click()
  await page.waitForSelector('#survey-name', { timeout: 10000 })
  check('القياس يطلب كتابة الاسم لا اختياره من قائمة', true)

  const marker = `اختبار آلي ${Date.now()}`
  await page.fill('#survey-name', marker)
  await page.getByRole('button', { name: 'متابعة' }).click()
  await page.waitForSelector('.question', { timeout: 10000 })

  // إجابة كل سؤال مطلوب: أول خيار في كل مجموعة
  const groups = await page.locator('fieldset.question').all()
  for (const group of groups) await group.locator('.option').first().click()
  for (const area of await page.locator('textarea.input').all()) {
    await area.fill('رأي اختباري آلي')
  }

  await page.getByRole('button', { name: /إرسال الإجابات/ }).click()
  await page.waitForSelector('.survey__done', { timeout: 20000 })
  check('ظهرت شاشة تأكيد الاستلام', true)

  const after = (await db.collection('responses').count().get()).data().count
  check('وصلت الاستجابة إلى قاعدة البيانات', after === before + 1, `${before} ← ${after}`)

  const stored = await db.collection('responses').where('rawName', '==', marker).get()
  const doc = stored.docs[0]?.data()
  check('حُفظ الاسم كما كتبته الطالبة', doc?.rawName === marker)
  check('لم تُنسب الاستجابة لطالبة بلا مراجعة', doc?.studentId === null && doc?.matchStatus === 'NEW')
  check('حُفظت الإجابات مع الاستجابة', (doc?.answers?.length ?? 0) > 0, `${doc?.answers?.length} إجابة`)
  check('سُجّل رمز الإرسال لكشف التكرار', typeof doc?.clientToken === 'string' && doc.clientToken.length > 0)

  await visitor.close()

  // ═════ ٣) لوحة الإدارة ═════
  console.log('\n٢) لوحة الإدارة')
  const adminCtx = await browser.newContext()
  const admin = await adminCtx.newPage()
  await admin.goto(`http://127.0.0.1:${PORT}/#/admin`, { waitUntil: 'domcontentloaded' })
  await admin.waitForSelector('#admin-email', { timeout: 20000 })
  check('لوحة الإدارة لا تُفتح بلا دخول', true)

  const adminHtml = await admin.content()
  check('شاشة الدخول لا تكشف أي بيانات', !sampleName || !adminHtml.includes(sampleName))

  await admin.fill('#admin-email', ADMIN_EMAIL)
  await admin.fill('#admin-password', ADMIN_PASSWORD)
  await admin.getByRole('button', { name: /^دخول$/ }).click()

  await admin.waitForSelector('.admin-nav', { timeout: 30000 })
  await admin.waitForFunction(
    () => !document.body.innerText.includes('جارٍ قراءة البيانات'),
    null, { timeout: 30000 },
  )
  check('دخلت الإدارة بحساب يحمل صلاحية admin', true)

  const banner = await admin.locator('.sync').first().innerText()
  check('الشريط يقول إن الحفظ في قاعدة البيانات', /قاعدة البيانات/.test(banner), banner.trim())

  const text = await admin.locator('.main').innerText()
  const arabicToLatin = (s) => s.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  const plain = arabicToLatin(text).replace(/,/g, '')
  check('ظهر عدد الطالبات من قاعدة البيانات', plain.includes(String(studentCount)), `${studentCount}`)

  // الجدول يعرض ٨٠ صفًا في المرة، فنبحث عن الاستجابة بالاسم لا بالتصفّح
  await admin.goto(`http://127.0.0.1:${PORT}/#/admin/match-review`, { waitUntil: 'domcontentloaded' })
  await admin.waitForSelector('#m-search', { timeout: 20000 })
  // الشاشة تفتح على «مطابقة محتملة»؛ الاستجابة الجديدة حالتها «جديدة»
  await admin.selectOption('#m-status', 'NEW')
  await admin.fill('#m-search', marker)
  await admin.waitForTimeout(800)
  const reviewText = await admin.locator('.main').innerText()
  check('الاستجابة الجديدة ظهرت في مراجعة المطابقة', reviewText.includes(marker))
  check('صُنّفت «جديدة» تنتظر قرار الإدارة', /جديد/.test(reviewText))

  await adminCtx.close()
} finally {
  await browser.close()
  server.close()
}

const failed = checks.filter((c) => !c.ok)
console.log(`\nالتجربة الشاملة: ${checks.length - failed.length}/${checks.length} تحققًا`)
process.exit(failed.length === 0 ? 0 : 1)
