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

  console.log('\n٥) الآراء المتشابهة تُربط دفعةً واحدة')
  await page.goto(`http://127.0.0.1:${PORT}/#/admin/voice`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.voice', { timeout: 20000 })
  const total = await page.locator('.voice').count()

  const repeat = page.locator('.repeat__row')
  const topics = await repeat.count()
  check('صفحة الآراء تعرض الموضوعات المتكرّرة', topics > 0, `${topics} موضوعًا`)
  check('  ولكل موضوع عدده ونموذج من نصّ الطالبات',
    (await repeat.first().locator('.repeat__count').innerText()).includes('رأيًا')
    && (await repeat.first().locator('.repeat__sample').innerText()).length > 8)
  await page.locator('.repeat').scrollIntoViewIfNeeded()
  await page.locator('.repeat').screenshot({ path: join(out, 'repeated.png') })

  // موضوع تكرّر في آراء القياس: تكييف الساحة
  await page.locator('#v-search').fill('تكييف')
  await page.waitForTimeout(600)
  // أوّل رأي عن التكييف لم يُربط بعد: الأوّلان رُبطا في الفقرتين السابقتين
  const hits = await page.locator('.voice').count()
  let seed = null
  for (let i = 0; i < hits; i += 1) {
    const candidate = page.locator('.voice').nth(i)
    if (await candidate.getByRole('button', { name: /لوح التحسين/ }).count()) {
      seed = candidate
      break
    }
  }
  check('يوجد رأي عن الموضوع لم يُربط بعد', seed !== null, `${hits} رأيًا في التصفية`)
  await seed.getByRole('button', { name: /لوح التحسين/ }).click()
  await seed.locator('.improve').waitFor({ timeout: 10000 })

  const akin = seed.locator('.akin')
  check('اللوح يرشّح آراءً تشبهه', await akin.count() === 1)
  const items = akin.locator('.akin__item')
  const many = await items.count()
  check('  الترشيح فيه أكثر من رأي', many >= 2, `${many} رأيًا`)
  check('  ولا يرشّح الآراء كلها — ترشيحٌ لا تفريغ', many < total / 3,
    `${many} من ${total}`)
  check('  ويبيّن الكلمة التي جمعتهما', (await items.first().locator('.akin__why').count()) === 1,
    (await items.first().locator('.akin__why').innerText()).trim())
  check('  ولا يُختار شيء تلقائيًا', await items.locator('input:checked').count() === 0)
  await akin.scrollIntoViewIfNeeded()
  await akin.screenshot({ path: join(out, 'akin.png') })

  await akin.getByRole('button', { name: 'اختاري الكل' }).click()
  check('  «اختاري الكل» تختارها جميعًا',
    await items.locator('input:checked').count() === many)

  await seed.locator('.choice').nth(1).click()
  await seed.locator('.mini input').first().fill('تجربة آلية: تبريد الساحة')
  const saveLabel = (await seed.getByRole('button', { name: /حفظ الإجراء/ }).innerText()).trim()
  check('  زرّ الحفظ يذكر عدد الآراء قبل الضغط',
    saveLabel.includes(String(many + 1)), saveLabel)
  await seed.getByRole('button', { name: /حفظ الإجراء/ }).click()
  await page.waitForTimeout(600)

  const after = await page.evaluate(() => {
    const raw = window.localStorage.getItem('qiyas.state.v1')
    const st = raw ? JSON.parse(raw) : { improvementActions: [] }
    const a = st.improvementActions.find((x) => x.title === 'تجربة آلية: تبريد الساحة')
    return { count: st.improvementActions.length, linked: a ? a.linkedSuggestionIds.length : 0 }
  })
  check('إجراء واحد يحمل الآراء كلها', after.linked === many + 1,
    `${after.linked} رأيًا في إجراء واحد`)
  check('ولم تُنشأ إجراءات بعدد الآراء', after.count === 2, `${after.count} إجراءين`)

  // وردّ المدرسة صار تحت كل رأي منها، لا تحت الأول وحده
  await page.locator('#v-search').fill('')
  await page.waitForTimeout(600)
  const answered = await page.locator('.voice .chip--linked').count()
  check('وحالة «مرتبط بإجراء» ظهرت على الآراء المضمومة',
    answered >= many + 1, `${answered} رأيًا`)
  await page.screenshot({ path: join(out, 'akin-done.png') })

  console.log('\n٦) أبواب الآراء: ما يحتاج عملًا وحده')
  await page.goto(`http://127.0.0.1:${PORT}/#/admin/voice`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.kinds', { timeout: 20000 })
  const tabs = await page.locator('.kind').count()
  check('ثلاثة أبواب للآراء', tabs === 3, `${tabs} بابًا`)

  const labels = await page.locator('.kind__t').allInnerTexts()
  check('  الأول «تحتاج تحسين» وهو المفتوح', labels[0].includes('تحتاج تحسين')
    && (await page.locator('.kind').first().getAttribute('aria-pressed')) === 'true')

  const plain = (t) => t.replace(/[\u2066-\u2069\u200e\u200f]/g, '')
  const counts = (await page.locator('.kind__n').allInnerTexts()).map((t) => Number(plain(t)))
  const shown = await page.locator('.voice').count()
  check('  عدد الباب يطابق ما يُعرض فيه', shown === counts[0], `${shown} = ${counts[0]}`)
  check('  والشكر في بابه لا في باب التحسين', counts[1] > 0 && counts[1] < counts[0],
    `تحسين ${counts[0]} · شكر ${counts[1]} · بلا مضمون ${counts[2]}`)
  check('  ومجموع الأبواب هو كل الآراء',
    counts[0] + counts[1] + counts[2] === 113, `${counts[0] + counts[1] + counts[2]}`)

  // باب الشكر: لا أدوات تصنيف ولا لوح تحسين — لا يُردّ عليه
  await page.locator('.kind--positive').click()
  await page.waitForTimeout(500)
  const praiseRow = page.locator('.voice').first()
  check('  باب الشكر بلا أدوات معالجة',
    (await praiseRow.locator('select').count()) === 0
    && (await praiseRow.getByRole('button', { name: /لوح التحسين/ }).count()) === 0)
  check('  وفيه زرّ نقلٍ إن أخطأ الفرز',
    (await praiseRow.getByRole('button', { name: /انقليه/ }).count()) === 1)
  await page.locator('.kinds').scrollIntoViewIfNeeded()
  await page.screenshot({ path: join(out, 'kinds.png') })

  console.log('\n٧) استبعاد رأي يُسجَّل ولا يُمحى')
  await page.locator('.kind--improve').click()
  await page.waitForTimeout(500)
  const beforeCount = await page.locator('.voice').count()
  const victim = (await page.locator('.voice__text').first().innerText()).trim()
  page.once('dialog', (d) => d.accept('اسم شخصي في النص'))
  await page.locator('.voice').first().getByRole('button', { name: 'استبعاد' }).click()
  await page.waitForTimeout(700)
  check('الرأي المستبعَد يخرج من العرض',
    (await page.locator('.voice').count()) === beforeCount - 1)
  const gone = page.locator('.gone__row')
  check('  ويظهر في «آراء مستبعَدة» بنصّه', (await gone.count()) === 1
    && (await gone.first().locator('.gone__text').innerText()).trim() === victim)
  check('  ومعه سببه', (await gone.first().locator('.gone__why').innerText()).includes('اسم شخصي'))
  check('  وسطر في أسفل الصفحة يذكر عددها',
    (await page.locator('.basis-note').innerText()).includes('استُبعد'))

  await gone.first().getByRole('button', { name: /أعيديه/ }).click()
  await page.waitForTimeout(700)
  check('  وإعادته تُرجعه كما كان',
    (await page.locator('.voice').count()) === beforeCount
    && (await page.locator('.gone__row').count()) === 0)

  console.log('\n٨) كشف من لم تشارك، وفيه الأرشفة والحذف')
  await page.goto(`http://127.0.0.1:${PORT}/#/admin/non-respondents`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.table', { timeout: 20000 })
  const listed = await page.locator('.table tbody tr').count()
  const stats = (await page.locator('.stats').innerText()).replace(/[\u2066-\u2069]/g, '')
  check('الكشف يعرض من لا أثر لها', listed > 0 && listed < 60, `${listed} طالبة`)
  check('  وليس «بلا استجابة مؤكَّدة» وهنّ مئات',
    (await page.locator('.basis-note').innerText()).includes('258'), stats.split('\n')[0])
  check('  ولكل صفّ زرّا أرشفة وحذف',
    (await page.locator('.table tbody tr').first().getByRole('button', { name: 'أرشفة' }).count()) === 1
    && (await page.locator('.table tbody tr').first().getByRole('button', { name: 'حذف' }).count()) === 1)

  const firstName = (await page.locator('.table tbody tr').first().locator('.table__title').innerText()).trim()
  page.once('dialog', (d) => d.accept())
  await page.locator('.table tbody tr').first().getByRole('button', { name: 'أرشفة' }).click()
  await page.waitForTimeout(700)
  check('  والأرشفة تُخرجها من الكشف',
    (await page.locator('.table tbody tr').count()) === listed - 1
    && !(await page.locator('.table').innerText()).includes(firstName))
  await page.screenshot({ path: join(out, 'non-participants.png') })

} finally {
  await browser.close()
  server.close()
}

const failed = checks.filter((ok) => !ok).length
console.log(`\nمن الرأي إلى التحسين: ${checks.length - failed}/${checks.length} تحققًا`)
console.log(`لقطات الشاشة: ${out}`)
process.exit(failed ? 1 : 0)
