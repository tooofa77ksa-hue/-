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

import { misorderedNumbers } from './bidi.mjs'

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
  const gate = page.locator('button:has-text("دخول")')
  await gate.first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {})
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
  const stripTop = await page.locator('.strip').first().evaluate((el) => el.getBoundingClientRect().top)
  check('الصدر ومسطرة الصفوف في الشاشة الأولى', stripTop < LAPTOP.height,
    `المسطرة تبدأ عند ${Math.round(stripTop)} بكسل`)

  // ═════ ٢) الصدر ═════
  console.log('\n٢) صدر اللوحة')
  const value = (await page.locator('.hero__value strong').innerText()).trim()
  check('المؤشر معروض برقمه', /[0-9]/.test(value), value)
  check('الأرقام لاتينية لا عربية', !/[٠-٩]/.test(value), value)
  check('أعداد القياس داخل الصدر', await page.locator('.hero__count').count() === 4)

  const fill = await page.locator('.hero__fill').evaluate((el) => el.style.width)
  check('المسطرة مملوءة بنسبة المؤشر من مداها', /^\d/.test(fill), fill)

  const basis = await page.locator('.hero__basis').innerText()
  check('قاعدة الحساب مكتوبة تحت الرقم', basis.includes('إجابة'), basis.slice(0, 60) + '…')

  // النسبة مئوية لا كسرية: «٩٣٫٢٪» لا «٠٫٩٪»
  const rate = basis.match(/([0-9][0-9.]*)%/)?.[1] ?? ''
  check('نسبة من أجابت مئوية لا كسرية', Number(rate) > 1, `${rate}%`)
  check('علامة النسبة لاتينية', basis.includes('%') && !basis.includes('٪'))

  // ═════ ٣) مسطرة الصفوف ═════
  console.log('\n٣) الصفوف على مسطرة القياس')
  const cells = await page.locator('.strip').first().locator('.strip__cell').count()
  check('لكل صف خانته على المسطرة', cells === 6, `${cells} صفوف`)

  const gradeCells = page.locator('.strip').first().locator('.strip__cell')
  const row = await gradeCells.first().evaluate((el) => el.getBoundingClientRect().top)
  const last = await gradeCells.last().evaluate((el) => el.getBoundingClientRect().top)
  check('الصفوف الستة في صف واحد بعرض الصفحة', Math.abs(row - last) < 2)

  const deltas = await page.locator('.strip').first().locator('.reading__delta').allInnerTexts()
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

  // ═════ الفصول الاثنا عشر ═════
  console.log('\n٤) الفصول على مسطرة القياس')
  const strips = await page.locator('.strip').count()
  check('للصفوف مسطرة وللفصول مسطرة', strips === 2, `${strips} مسطرة`)

  const roomCells = await page.locator('.strip').nth(1).locator('.strip__cell').count()
  check('كل فصل على حدة', roomCells === 12, `${roomCells} فصلًا`)

  const roomNames = await page.locator('.strip').nth(1).locator('.reading__name').allInnerTexts()
  check('أسماء الفصول مختصرة كما تنطقها الإدارة',
    roomNames[0].startsWith('أولى') && roomNames[11].startsWith('سادسة'),
    roomNames.join(' · '))

  // الترتيب على رقم الصف لا على اسمه: الأبجدي يضع «الثالث» قبل «الثاني»
  const ORDER = ['أولى', 'أولى', 'ثانية', 'ثانية', 'ثالثة', 'ثالثة',
    'رابعة', 'رابعة', 'خامسة', 'خامسة', 'سادسة', 'سادسة']
  check('الترتيب من أولى 1 إلى سادسة 2',
    roomNames.every((n, i) => n.startsWith(ORDER[i])))

  // ═════ الأرقام لاتينية في كل الصفحة ═════
  // فحص على الصفحة كلها لا على عنصر: رقمٌ عربي واحد ينجو في زاوية
  // يكسر اتّساق اللوحة كلها أمام الوزارة.
  const strayDigits = async (target) => target.evaluate(() => {
    const found = new Set()
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const hit = n.nodeValue.match(/[\u0660-\u0669\u06F0-\u06F9]/g)
      if (hit) found.add(n.nodeValue.trim().slice(0, 40))
    }
    return [...found]
  })

  const stray = await strayDigits(page)
  check('لا رقم عربي في اللوحة كلها', stray.length === 0, stray.slice(0, 3).join(' | '))

  const jumbled = await misorderedNumbers(page)
  check('كل رقم يظهر بترتيبه لا مقلوبًا', jumbled.length === 0,
    jumbled.slice(0, 2).map((x) => `${x.kind}: «${x.part}» في «${x.text}»`).join(' | '))

  const dirOk = await page.evaluate(() =>
    document.documentElement.dir === 'rtl'
    || getComputedStyle(document.body).direction === 'rtl')
  check('الاتجاه من اليمين إلى اليسار كما هو', dirOk)

  await page.screenshot({ path: join(out, 'laptop.png') })

  // ═════ ٥) السمة الداكنة ═════
  console.log('\n٥) السمة الداكنة')
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

  // ═════ لوحة العرض ═════
  console.log('\n٦) لوحة العرض')
  await page.goto(`http://127.0.0.1:${PORT}/#/admin/display`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.show', { timeout: 25000 })
  await page.waitForTimeout(600)

  // شاشة عرض: تملأ الشاشة ولا تُمرَّر
  const fits = await page.evaluate(() =>
    document.documentElement.scrollHeight <= window.innerHeight + 2
    && document.documentElement.scrollWidth <= window.innerWidth + 2)
  check('لوحة العرض تملأ الشاشة بلا تمرير', fits)

  check('لا قوائم ولا أزرار تحرير في العرض',
    await page.locator('.admin-nav').count() === 0
    && await page.locator('.toolbar').count() === 0)
  check('مخرج واضح من العرض', await page.locator('.show__exit').isVisible())

  const big = (await page.locator('.show__big').innerText()).trim()
  check('المؤشر بارز في صدر العرض', /[0-9]/.test(big), big.replace(/\s+/g, ' '))

  // الأرقام نفسها في اللوحتين: لا نسخة ولا حساب ثانٍ
  const showRooms = await page.locator('.show__room-value').allInnerTexts()
  check('الفصول الاثنا عشر في العرض', showRooms.length === 12)

  const showIndex = big.split(/\s/)[0]
  check('رقم العرض هو رقم لوحة التعديل نفسه', showIndex === value, `${showIndex} = ${value}`)

  const strayShow = await strayDigits(page)
  check('لا رقم عربي في لوحة العرض', strayShow.length === 0, strayShow.slice(0, 3).join(' | '))

  const jumbledShow = await misorderedNumbers(page)
  check('أرقام لوحة العرض بترتيبها', jumbledShow.length === 0,
    jumbledShow.slice(0, 2).map((x) => `${x.kind}: «${x.part}»`).join(' | '))

  await page.screenshot({ path: join(out, 'display.png') })

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(out, 'display-dark.png') })
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))

  await ctx.close()

  // ═════ ٧) الشاشة الصغيرة ═════
  console.log('\n٧) شاشة صغيرة')
  const small = await browser.newContext({ viewport: { width: 820, height: 900 } })
  const narrow = await small.newPage()
  await narrow.goto(`http://127.0.0.1:${PORT}/#/admin`, { waitUntil: 'domcontentloaded' })
  const gate2 = narrow.locator('button:has-text("دخول")')
  await gate2.first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {})
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
