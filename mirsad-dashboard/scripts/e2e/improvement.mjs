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

  console.log('\n١) من صوت الطالبات')
  await page.goto(`http://127.0.0.1:${PORT}/#/admin/voice`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.voice', { timeout: 20000 })

  // رأي ذو نصّ فعليّ: في البيانات آراء من نقاط فقط، ولا تصلح للتمييز
  const texts = await page.locator('.voice__text').allInnerTexts()
  const index = texts.findIndex((t) => t.trim().replace(/[.\s]/g, '').length >= 12)
  check('يوجد رأي بنصّ فعليّ', index >= 0)
  const voice = page.locator('.voice').nth(index)
  const text = (await voice.locator('.voice__text').innerText()).trim()
  check('رأي الطالبة معروض بنصّه', text.length > 0, text.slice(0, 50) + '…')

  const start = voice.locator('a:has-text("أنشئي إجراء تحسين")')
  check('لكل رأي طريق مباشر إلى إجراء تحسين', await start.count() === 1)
  await start.click()

  console.log('\n٢) نموذج الإجراء')
  await page.waitForSelector('#ia-problem', { timeout: 20000 })
  const problem = await page.inputValue('#ia-problem')
  check('النموذج يُفتح ونصّ الرأي فيه', problem.trim() === text,
    problem.trim().slice(0, 50) + '…')

  await page.fill('#ia-title', 'تجربة آلية: إجراء على رأي طالبة')
  const doAction = page.locator('#ia-action')
  if (await doAction.count()) await doAction.fill('أجرت المدرسة كذا وكذا')
  await page.getByRole('button', { name: /^حفظ/ }).click()
  await page.waitForSelector('.action', { timeout: 20000 })

  console.log('\n٣) الإجراء يحمل شاهده')
  const card = page.locator('.action').first()
  check('الإجراء محفوظ ومعروض',
    (await card.innerText()).includes('تجربة آلية: إجراء على رأي طالبة'))
  const quoted = await card.locator('.action__voices blockquote').first().innerText()
  check('نصّ الطالبة شاهدٌ على الإجراء', quoted.replace(/[«»]/g, '').trim() === text,
    quoted.slice(0, 50) + '…')
  await page.screenshot({ path: join(out, 'action.png'), fullPage: false })

  console.log('\n٤) الرأي يعرف إجراءه')
  await page.goto(`http://127.0.0.1:${PORT}/#/admin/voice`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.voice', { timeout: 20000 })
  // الرأي نفسه لا أوّل ما في القائمة: ترتيبها يتغيّر بعد الربط
  const back = page.locator('.voice').filter({ hasText: text.slice(0, 30) }).first()
  await back.waitFor({ timeout: 20000 })
  check('الرأي صار مرتبطًا بإجراء',
    await back.locator('.chip--action').count() === 1,
    (await back.locator('.chip--action').innerText().catch(() => '')).slice(0, 44))
  check('ولا يعرض زرّ الإنشاء مرة ثانية',
    await back.locator('a:has-text("أنشئي إجراء تحسين")').count() === 0)
  await page.screenshot({ path: join(out, 'voice.png'), fullPage: false })
} finally {
  await browser.close()
  server.close()
}

const failed = checks.filter((ok) => !ok).length
console.log(`\nمن الرأي إلى التحسين: ${checks.length - failed}/${checks.length} تحققًا`)
console.log(`لقطات الشاشة: ${out}`)
process.exit(failed ? 1 : 0)
