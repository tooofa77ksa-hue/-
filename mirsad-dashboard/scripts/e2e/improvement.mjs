/**
 * تجربة الطريق من رأي الطالبة إلى إجراء التحسين.
 *
 * الغرض إثبات أن الإدارة تصل من الرأي إلى الإجراء بضغطة، وأن نص
 * الطالبة يُنقل كما هو ويبقى شاهدًا على الإجراء — لا أن الزر موجود.
 */
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const dist = join(root, 'dist')
const out = join(root, '.e2e-out', 'improvement')
mkdirSync(out, { recursive: true })
const PORT = 5183

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

const CHROME = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome']
  .filter(Boolean).find((p) => existsSync(p))
const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {})

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://127.0.0.1:${PORT}/#/admin`, { waitUntil: 'domcontentloaded' })
  const gate = page.locator('button:has-text("دخول")')
  await gate.first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {})
  if (await gate.count()) await gate.first().click()
  await page.waitForSelector('.admin-nav', { timeout: 25000 })

  console.log('\n١) اللوح يُفتح تحت الرأي')
  await page.goto(`http://127.0.0.1:${PORT}/#/admin/voice`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.voice', { timeout: 20000 })

  // رأي ذو نصّ فعليّ: في البيانات آراء من نقاط فقط ولا تصلح للتمييز
  const texts = await page.locator('.voice__text').allInnerTexts()
  const index = texts.findIndex((t) => t.trim().replace(/[.\s]/g, '').length >= 12)
  check('يوجد رأي بنصّ فعليّ', index >= 0)
  const voice = page.locator('.voice').nth(index)
  const text = (await voice.locator('.voice__text').innerText()).trim()

  check('اللوح مغلق حتى يُطلب', await voice.locator('.improve').count() === 0)
  await voice.getByRole('button', { name: /لوح التحسين/ }).click()
  await voice.locator('.improve').waitFor({ timeout: 10000 })
  check('اللوح يُفتح تحت الرأي نفسه بلا انتقال',
    page.url().includes('/admin/voice'))

  console.log('\n٢) إنشاء إجراء بشاهده')
  await voice.locator('.choice').nth(1).click()
  await voice.locator('.mini input').first().fill('تجربة آلية: تنظيم الخروج')
  await voice.locator('.mini input').nth(1).fill('أ. تجربة')
  await voice.locator('textarea.input').fill('نظّمت المدرسة خروج الصفوف الأولية قبل الكبار')
  const proof = voice.locator('.mini').last().locator('input')
  await proof.first().fill('صور التنفيذ')
  await proof.nth(1).fill('https://example.test/evidence')
  await voice.getByRole('button', { name: 'حفظ الإجراء' }).click()

  console.log('\n٣) ردّ المدرسة يظهر تحت الرأي')
  await voice.getByRole('button', { name: /إجراء المدرسة/ }).click()
  await voice.locator('.done').waitFor({ timeout: 10000 })
  const done = await voice.locator('.done').innerText()
  check('عنوان الإجراء تحت الرأي', done.includes('تجربة آلية: تنظيم الخروج'))
  check('وما فعلته المدرسة', done.includes('نظّمت المدرسة خروج الصفوف'))
  check('والمسؤولة', done.includes('أ. تجربة'))

  const qr = voice.locator('.proof__qr')
  await qr.waitFor({ timeout: 10000 })
  check('الشاهد صار باركودًا', (await qr.getAttribute('src'))?.startsWith('data:image/png') === true)
  // الباركود ملوّن لا أسود
  const tone = await qr.evaluate((img) => {
    const c = document.createElement('canvas')
    c.width = img.naturalWidth; c.height = img.naturalHeight
    const x = c.getContext('2d'); x.drawImage(img, 0, 0)
    const d = x.getImageData(0, 0, c.width, c.height).data
    const tally = new Map()
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) continue
      const k = `${d[i]},${d[i + 1]},${d[i + 2]}`
      tally.set(k, (tally.get(k) ?? 0) + 1)
    }
    return [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  })
  check('والباركود ملوّن لا أسود', tone !== '0,0,0' && tone.length > 0, tone)
  check('والرابط مكتوب تحته للمراجعة', done.includes('example.test'))
  await page.screenshot({ path: join(out, 'panel-done.png') })

  console.log('\n٤) رأي آخر يُربط بالإجراء نفسه لا بإجراء جديد')
  const second = texts.findIndex((t, i) => i !== index && t.trim().replace(/[.\s]/g, '').length >= 12)
  const other = page.locator('.voice').nth(second)
  await other.getByRole('button', { name: /لوح التحسين/ }).click()
  await other.locator('.improve').waitFor({ timeout: 10000 })
  // القائمة الأولى وحدها هي قائمة الإجراءات؛ ما بعدها تصنيف وأولوية وحالة
  const picker = other.locator('.choice').first().locator('select')
  const options = await picker.locator('option').allInnerTexts()
  check('الإجراء القائم معروض للربط',
    options.some((o) => o.includes('تجربة آلية: تنظيم الخروج')), `${options.length} خيارًا`)
  const label = options.find((o) => o.includes('تجربة آلية: تنظيم الخروج'))
  await picker.selectOption({ label })
  await other.getByRole('button', { name: 'اربطي' }).click()
  await other.locator('.improve').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {})

  await other.getByRole('button', { name: /إجراء المدرسة/ }).click()
  await other.locator('.done').waitFor({ timeout: 10000 })
  check('الرأي الثاني يعرض الإجراء نفسه',
    (await other.locator('.done__title').innerText()).includes('تجربة آلية: تنظيم الخروج'))
  check('ويقول إنه مشترك مع رأي آخر',
    (await other.locator('.improve__shared').innerText()).includes('1'))

  const actions = await page.evaluate(() => {
    const raw = window.localStorage.getItem('qiyas.state.v1')
    return raw ? JSON.parse(raw).improvementActions.length : -1
  })
  check('ولم يُنشأ إجراء ثانٍ للمشكلة نفسها', actions === 1, `${actions} إجراء`)
  await page.screenshot({ path: join(out, 'panel-shared.png') })

} finally {
  await browser.close()
  server.close()
}

const failed = checks.filter((ok) => !ok).length
console.log(`\nمن الرأي إلى التحسين: ${checks.length - failed}/${checks.length} تحققًا`)
console.log(`لقطات الشاشة: ${out}`)
process.exit(failed ? 1 : 0)
