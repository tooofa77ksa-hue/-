/**
 * تجربة لوحة الإدارة على شاشة لابتوب.
 *
 * الغرض إثبات أن اللوحة تملأ الشاشة فعلًا وتقرأ أرقامها الصحيحة —
 * لا مجرد أن العناصر موجودة في شجرة الصفحة.
 *
 *   node scripts/e2e/dashboard.mjs
 */
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const dist = join(root, 'dist')
const out = join(root, '.e2e-out', 'dashboard')
mkdirSync(out, { recursive: true })
const PORT = 5194

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
  checks.push(ok)
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const CHROME = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
].filter(Boolean).find((p) => existsSync(p))

const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {})
const LAPTOP = { width: 1440, height: 900 }

try {
  const ctx = await browser.newContext({ viewport: LAPTOP, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  await page.goto(`http://127.0.0.1:${PORT}/#/admin`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const gate = page.locator('button:has-text("دخول")')
  if (await gate.count()) await gate.first().click()
  await page.waitForSelector('.hero', { timeout: 25000 })

  // ═════ ١) اللوحة تملأ الشاشة ═════
  console.log('\n١) اتساع اللوحة على شاشة اللابتوب')
  const width = await page.locator('.main').evaluate((el) => el.getBoundingClientRect().width)
  check('اللوحة تملأ عرض الشاشة', width > LAPTOP.width * 0.94,
    `${Math.round(width)} من ${LAPTOP.width} بكسل`)

  const noScrollX = await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1)
  check('لا تمرير أفقي', noScrollX)

  // الصدر والمسطرة يُرَيان دون تمرير: هما أول ما تنظر إليه الإدارة
  const stripTop = await page.locator('.strip').evaluate((el) => el.getBoundingClientRect().top)
  check('الصدر ومسطرة الصفوف في الشاشة الأولى', stripTop < LAPTOP.height,
    `المسطرة تبدأ عند ${Math.round(stripTop)} بكسل`)

  // ═════ ٢) الصدر ═════
  console.log('\n٢) صدر اللوحة')
  const value = (await page.locator('.hero__value strong').innerText()).trim()
  check('المؤشر معروض برقمه', /[٠-٩]/.test(value), value)
  check('أعداد القياس داخل الصدر', await page.locator('.hero__count').count() === 4)

  const fill = await page.locator('.hero__fill').evaluate((el) => el.style.width)
  check('المسطرة مملوءة بنسبة المؤشر من مداها', /^\d/.test(fill), fill)

  const basis = await page.locator('.hero__basis').innerText()
  check('قاعدة الحساب مكتوبة تحت الرقم', basis.includes('إجابة'), basis.slice(0, 60) + '…')

  // النسبة مئوية لا كسرية: «٩٣٫٢٪» لا «٠٫٩٪»
  const rate = basis.match(/([٠-٩][٠-٩٫]*)٪/)?.[1] ?? ''
  const latin = Number(rate.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace('٫', '.'))
  check('نسبة من أجابت مئوية لا كسرية', latin > 1, `${rate}٪`)

  // ═════ ٣) مسطرة الصفوف ═════
  console.log('\n٣) الصفوف على مسطرة القياس')
  const cells = await page.locator('.strip__cell').count()
  check('لكل صف خانته على المسطرة', cells === 6, `${cells} صفوف`)

  const row = await page.locator('.strip__cell').first().evaluate((el) => el.getBoundingClientRect().top)
  const last = await page.locator('.strip__cell').last().evaluate((el) => el.getBoundingClientRect().top)
  check('الصفوف الستة في صف واحد بعرض الصفحة', Math.abs(row - last) < 2)

  const deltas = await page.locator('.reading__delta').allInnerTexts()
  check('لكل صف فارقه عن مؤشر المدرسة', deltas.length === 6, deltas.join(' · '))
  check('الفوارق موقّعة بإشارتها', deltas.some((d) => d.includes('+')) && deltas.some((d) => d.includes('−')))

  // اللون يقول ما يقوله الرقم: الأعلى من مؤشر المدرسة وحدها الفيروزية
  const agree = await page.locator('.reading').evaluateAll((els) => els.every((el) => {
    const delta = el.querySelector('.reading__delta')
    const bar = el.querySelector('.reading__bar')
    if (!delta || !bar) return true
    return delta.classList.contains('is-above') === bar.classList.contains('is-above')
  }))
  check('لون الشريط يوافق إشارة الفارق', agree)

  await page.screenshot({ path: join(out, 'laptop.png') })

  // ═════ ٤) السمة الداكنة ═════
  console.log('\n٤) السمة الداكنة')
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  await page.waitForTimeout(400)
  const readable = await page.locator('.reading__value').first().evaluate((el) => {
    const color = getComputedStyle(el).color
    const bg = getComputedStyle(el.closest('.strip')).backgroundColor
    const lum = (c) => {
      const [r, g, b] = c.match(/\d+/g).map((n) => Number(n) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const a = lum(color)
    const b2 = lum(bg)
    return (Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05)
  })
  check('أرقام الصفوف مقروءة على الخلفية الداكنة', readable >= 4.5, `${readable.toFixed(1)}:1`)
  await page.screenshot({ path: join(out, 'laptop-dark.png') })

  await ctx.close()

  // ═════ ٥) الشاشة الصغيرة ═════
  console.log('\n٥) شاشة صغيرة')
  const small = await browser.newContext({ viewport: { width: 820, height: 900 } })
  const narrow = await small.newPage()
  await narrow.goto(`http://127.0.0.1:${PORT}/#/admin`, { waitUntil: 'domcontentloaded' })
  await narrow.waitForTimeout(1200)
  const gate2 = narrow.locator('button:has-text("دخول")')
  if (await gate2.count()) await gate2.first().click()
  await narrow.waitForSelector('.hero', { timeout: 25000 })
  check('لا تمرير أفقي على شاشة ضيّقة', await narrow.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1))
  const stacked = await narrow.locator('.hero').evaluate((el) =>
    getComputedStyle(el).gridTemplateColumns.split(' ').length === 1)
  check('الصدر ينطوي عمودًا واحدًا على الضيّق', stacked)
  await narrow.screenshot({ path: join(out, 'narrow.png') })
  await small.close()
} finally {
  await browser.close()
  server.close()
}

const failed = checks.filter((ok) => !ok).length
console.log(`\nلوحة الإدارة: ${checks.length - failed}/${checks.length} تحققًا`)
console.log(`لقطات الشاشة: ${out}`)
process.exit(failed ? 1 : 0)
