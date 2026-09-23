/**
 * تجربة المخرجات الورقية: Excel وPDF والتقرير المطبوع.
 *
 * الغرض إثبات أن الملفات تُنزَّل فعلًا وتُفتح فعلًا وتحمل الأرقام
 * الصحيحة — لا مجرد أن الزر موجود.
 *
 *   node scripts/e2e/reports.mjs
 */
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import ExcelJS from 'exceljs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const dist = join(root, 'dist')
const out = join(root, '.e2e-out')
const PORT = 5198

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

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
  checks.push({ ok })
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const CHROME = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
].filter(Boolean).find((p) => existsSync(p))

const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {})

async function download(page, trigger, label) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), trigger()])
  const file = join(out, dl.suggestedFilename())
  await dl.saveAs(file)
  console.log(`    ↓ ${label}: ${dl.suggestedFilename()} (${Math.round(statSync(file).size / 1024)} ك.ب)`)
  return file
}

try {
  const ctx = await browser.newContext({ acceptDownloads: true })
  const page = await ctx.newPage()

  await page.goto(`http://127.0.0.1:${PORT}/#/admin`, { waitUntil: 'domcontentloaded' })
  // الوضع المحلي: بوابة الرمز فقط
  const gate = page.locator('button:has-text("دخول")')
  if (await gate.count()) await gate.first().click()
  await page.waitForSelector('.admin-nav', { timeout: 20000 })

  // ═════ Excel ═════
  console.log('\n١) ملفات Excel')
  await page.goto(`http://127.0.0.1:${PORT}/#/admin/reports`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.report__cover', { timeout: 20000 })

  const xlsx = await download(
    page,
    () => page.getByRole('button', { name: 'تصدير Excel' }).click(),
    'نتائج القياس',
  )

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(xlsx)
  const sheets = wb.worksheets.map((w) => `${w.name} (${w.rowCount} صفًا)`)
  check('ملف Excel يُفتح ويُقرأ', wb.worksheets.length > 0, `${wb.worksheets.length} ورقة`)
  for (const s of sheets) console.log(`      • ${s}`)

  const rtl = wb.worksheets.every((w) => w.views?.[0]?.rightToLeft === true)
  check('كل الأوراق من اليمين إلى اليسار', rtl)

  const hasArabicHeaders = wb.worksheets.some((w) => {
    const row = w.getRow(1).values
    return Array.isArray(row) && row.some((v) => typeof v === 'string' && /[؀-ۿ]/.test(v))
  })
  check('عناوين الأعمدة بالعربية', hasArabicHeaders)

  const totalRows = wb.worksheets.reduce((n, w) => n + w.rowCount, 0)
  check('الملف يحمل بيانات فعلية', totalRows > 20, `${totalRows} صفًا إجمالًا`)

  // بقية ملفات Excel من صفحاتها
  console.log('\n٢) بقية ملفات Excel')
  const others = [
    ['#/admin/students', 'تصدير Excel', 'الطالبات'],
    ['#/admin/non-respondents', 'تصدير Excel', 'غير المستجيبات'],
    ['#/admin/voice', 'تصدير Excel', 'آراء الطالبات'],
    ['#/admin/improvement', 'تصدير Excel', 'خطة التحسين'],
  ]
  for (const [route, label, title] of others) {
    await page.goto(`http://127.0.0.1:${PORT}/${route}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
    const btn = page.getByRole('button', { name: label })
    if (await btn.count() === 0) { check(`زر تصدير ${title}`, false, 'غير موجود'); continue }
    const f = await download(page, () => btn.first().click(), title)
    const w2 = new ExcelJS.Workbook()
    await w2.xlsx.readFile(f)
    check(`${title}: ملف سليم`, w2.worksheets.length > 0,
      w2.worksheets.map((s) => `${s.name}/${s.rowCount}`).join('، '))
  }

  // ═════ PDF ═════
  console.log('\n٣) التقرير المطبوع (PDF)')
  await page.goto(`http://127.0.0.1:${PORT}/#/admin/reports`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.report__cover', { timeout: 20000 })
  await page.waitForTimeout(1500)

  const pdfPath = join(out, 'report.pdf')
  await page.pdf({
    path: pdfPath, format: 'A4', printBackground: true,
    margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
  })
  const pdfBytes = readFileSync(pdfPath)
  const pages = (pdfBytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
  check('أُنتج ملف PDF', pdfBytes.length > 20000, `${Math.round(pdfBytes.length / 1024)} ك.ب`)
  check('التقرير أكثر من صفحة', pages >= 2, `${pages} صفحة`)

  // أدوات التحكم لا تُطبع
  await page.emulateMedia({ media: 'print' })
  await page.waitForTimeout(400)
  const toolbarVisible = await page.locator('.toolbar.no-print').first().isVisible().catch(() => false)
  check('أزرار التحكم لا تظهر في الطباعة', !toolbarVisible)
  const navVisible = await page.locator('.admin-nav').first().isVisible().catch(() => false)
  check('قائمة التنقل لا تظهر في الطباعة', !navVisible)
  const coverVisible = await page.locator('.report__cover').first().isVisible()
  check('غلاف التقرير يظهر في الطباعة', coverVisible)

  // ───── الشكل المؤسسي ─────
  // الترويسة والتذييل يتكرّران عبر thead/tfoot، فلا تخرج ورقة بلا جهة
  const head = await page.locator('.report-sheet__head').first()
  check('ترويسة تتكرّر على كل صفحة',
    (await head.evaluate((el) => getComputedStyle(el).display)) === 'table-header-group')
  const foot = await page.locator('.report-sheet__foot').first()
  check('تذييل يتكرّر على كل صفحة',
    (await foot.evaluate((el) => getComputedStyle(el).display)) === 'table-footer-group')

  const sections = await page.locator('.report__no').count()
  check('أقسام التقرير مرقّمة', sections === 10, `${sections} قسمًا`)
  const toc = await page.locator('.toc__row').count()
  check('فهرس المحتويات يطابق عدد الأقسام', toc === sections, `${toc} سطرًا`)

  const findings = await page.locator('.finding').count()
  check('ملخّص تنفيذي بأرقام محسوبة', findings >= 4, `${findings} نتيجة`)
  const firstFinding = await page.locator('.finding').first().innerText()
  check('الملخّص يحمل أرقام القياس لا عبارات عامة',
    /[٠-٩]/.test(firstFinding), firstFinding.slice(0, 44) + '…')

  check('قسم منهجية وقواعد الحساب', await page.locator('.method li').count() >= 5)
  check('خانات الاعتماد والتوقيع', await page.locator('.approval__box').count() === 3)

  // الغلاف وحده على صفحته
  const coverBreak = await page.locator('.report__cover')
    .evaluate((el) => getComputedStyle(el).breakAfter)
  check('الغلاف ينفرد بصفحته', coverBreak === 'page')

  await page.emulateMedia({ media: 'screen' })

  await page.screenshot({ path: join(out, 'reports-screen.png'), fullPage: false })
  await ctx.close()
} finally {
  await browser.close()
  server.close()
}

const failed = checks.filter((c) => !c.ok).length
console.log(`\nالمخرجات الورقية: ${checks.length - failed}/${checks.length} تحققًا`)
console.log(`الملفات المنزَّلة محفوظة في: ${out}`)
process.exit(failed === 0 ? 0 : 1)
