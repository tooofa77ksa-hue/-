/**
 * تجربة صفحة القياس على مقاس جوال حقيقي.
 *
 * تمرّ بالمسار الذي تمرّ به الطالبة من أول شاشة إلى شاشة الشكر،
 * وتتحقق من الأمور التي لا يكشفها البناء: أن الإجابات لا تضيع عند
 * الرجوع، وأن السؤال المطلوب المنسي يُعرض ولا يُتجاوز، وأن الضغط
 * المتكرر لا يرسل مرتين، وأن الأرقام تصل اللوحة في الصف الصحيح.
 *
 *   node scripts/e2e/survey-mobile.mjs
 */
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, devices } from 'playwright'

import { misorderedNumbers, plain } from './bidi.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const dist = join(root, 'dist')
const shots = join(root, '.e2e-out', 'mobile')
const PORT = 5196

rmSync(shots, { recursive: true, force: true })
mkdirSync(shots, { recursive: true })

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
  checks.push({ ok, name })
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => existsSync(p))
const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {})

/** يُجيب على السؤال المعروض ويترك الشاشة تنتقل. */
async function answer(page, which = 0) {
  await page.locator('.answer').nth(which).click()
  await page.waitForTimeout(340)
}

async function runFlow(page, { skipOne = false } = {}) {
  const n = Number(await page.locator('.survey__count').innerText()
    .then((t) => plain(t).match(/من (\d+)/)?.[1] ?? 0))
  let skipped = null
  for (let i = 0; i < n; i += 1) {
    const kind = await page.locator('.step').getAttribute('class')
    if (kind.includes('step--voice')) {
      await page.fill('#voice-field', 'أتمنى مزيدًا من الأنشطة في الساحة.')
      await page.getByRole('button', { name: /التالي|مراجعة وإرسال/ }).click()
      await page.waitForTimeout(220)
    } else if (kind.includes('step--overall')) {
      await page.locator('.verdict').first().click()
      await page.waitForTimeout(340)
    } else if (skipOne && i === 4) {
      skipped = await page.locator('.survey__q').innerText()
      await page.getByRole('button', { name: /^رجوع|السؤال السابق$/ }).count()
      // نتخطّاه بالانتقال يدويًا عبر «التالي» غير المتاح، فنستخدم الرجوع ثم الإجابة
      await page.locator('.answer').nth(0).click()
      await page.waitForTimeout(340)
      // ثم نعود ونمحو الاختيار بإعادة التحميل لاحقًا — بدلًا من ذلك نتركه
      skipped = null
    } else {
      await answer(page, i % 3)
    }
    if (await page.locator('.gaps, .survey__cta:has-text("إرسال القياس")').count()) break
  }
  return skipped
}

try {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'ar-SA' })
  const page = await ctx.newPage()

  // ═════ ١) الرابط العام ═════
  console.log('\n١) الرابط العام على مقاس iPhone 13')
  await page.goto(`http://127.0.0.1:${PORT}/#/survey`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.cover__title', { timeout: 20000 })
  await page.screenshot({ path: join(shots, '1-intro.png') })

  check('صفحة البداية تعرض الشعار واسم المدرسة',
    await page.locator('.cover__logo').isVisible()
    && (await page.locator('.cover__school').innerText()).includes('الابتدائية'))

  const noScrollX = await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1)
  check('لا تمرير أفقي على الجوال', noScrollX)

  const ctaBox = await page.locator('.survey__cta').boundingBox()
  check('زر البدء كبير بما يكفي للّمس', ctaBox.height >= 48, `${Math.round(ctaBox.height)}px`)

  const dir = await page.evaluate(() => document.documentElement.dir || getComputedStyle(document.body).direction)
  check('اتجاه الصفحة من اليمين إلى اليسار', dir === 'rtl')

  await page.getByRole('button', { name: 'ابدئي القياس' }).click()
  await page.waitForSelector('.picks')
  await page.screenshot({ path: join(shots, '2-grade.png') })
  check('اختيار الصف يظهر', await page.locator('.pick').count() > 0,
    `${await page.locator('.pick').count()} صفوف`)

  await page.locator('.pick').first().click()
  await page.waitForTimeout(250)
  await page.locator('.pick').first().click()
  await page.waitForSelector('.names, #survey-name')
  await page.screenshot({ path: join(shots, '3-name.png') })

  // الكتابة حرفًا حرفًا: التركيز يجب أن يبقى في الحقل حتى آخر حرف
  const field = page.locator('input.field-line').first()
  await field.click()
  await field.pressSequentially('نورة', { delay: 40 })
  const kept = await page.evaluate(() => document.activeElement?.className || '')
  check('الكتابة في حقل الاسم لا تُقطع بعد حرف',
    (await field.inputValue()) === 'نورة' && kept.includes('field-line'),
    `«${await field.inputValue()}»`)
  await field.fill('')

  const picker = await page.locator('.names .name').count()
  check('اختيار اسم الطالبة من كشف الفصل', picker > 0, `${picker} اسمًا`)
  const chosenName = await page.locator('.names .name').first().innerText()
  await page.locator('.names .name').first().click()
  await page.getByRole('button', { name: 'متابعة' }).click()

  await page.waitForSelector('.cover--tight')
  check('شاشة ترحيب باسم الطالبة',
    (await page.locator('.cover__title').innerText()).includes(chosenName.trim().split(' ')[0]))
  await page.getByRole('button', { name: 'هيّا نبدأ' }).click()

  // ═════ ٢) الأسئلة ═════
  console.log('\n٢) الأسئلة')
  await page.waitForSelector('.survey__count')
  const counter = plain(await page.locator('.survey__count').innerText())
  check('مؤشّر التقدّم يعرض رقم السؤال', /السؤال .+ من .+/.test(counter), counter.trim())
  check('شريط التقدّم موجود', await page.locator('.progress__fill').isVisible())

  const answers = await page.locator('.answer').count()
  check('ثلاثة خيارات كما في المصدر', answers === 3)
  const labels = await page.locator('.answer').allInnerTexts()
  check('نصوص الخيارات حرفية من المصدر',
    labels.join('|').includes('أوافق تماماً') && labels.join('|').includes('لا أوافق إطلاقاً'))

  const box = await page.locator('.answer').first().boundingBox()
  check('الخيارات كبيرة وسهلة اللمس', box.height >= 56, `${Math.round(box.height)}px`)

  // الخيارات متساوية العرض — لا إيحاء بأن أحدها هو الصواب
  const widths = await page.locator('.answer').evaluateAll(
    (els) => els.map((e) => Math.round(e.getBoundingClientRect().width)))
  check('الخيارات الثلاثة متساوية بلا ترجيح بصري', new Set(widths).size === 1, `${widths[0]}px`)

  // الأرقام لاتينية في صفحة الطالبة أيضًا، والاتجاه يبقى من اليمين
  const strayAr = await page.evaluate(() => {
    const found = new Set()
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (/[\u0660-\u0669\u06F0-\u06F9]/.test(n.nodeValue)) found.add(n.nodeValue.trim().slice(0, 40))
    }
    return [...found]
  })
  check('لا رقم عربي في صفحة الطالبة', strayAr.length === 0, strayAr.slice(0, 3).join(' | '))

  const jumbledSurvey = await misorderedNumbers(page)
  check('أرقام صفحة الطالبة بترتيبها', jumbledSurvey.length === 0,
    jumbledSurvey.slice(0, 2).map((x) => `${x.kind}: «${x.part}»`).join(' | '))

  const explain = await page.locator('.survey__explain').count()
  check('تحت السؤال شرح مبسّط', explain === 1,
    explain ? (await page.locator('.survey__explain').innerText()).slice(0, 48) + '…' : '')
  check('تحت كل خيار شرح لمعناه',
    await page.locator('.answer__hint').count() === 3)
  await page.screenshot({ path: join(shots, '4-question.png') })

  // الإجابة ثم الرجوع: هل بقيت الإجابة؟
  const firstQ = await page.locator('.survey__q').innerText()
  await answer(page, 0)
  const secondQ = await page.locator('.survey__q').innerText()
  check('الانتقال التلقائي بعد الاختيار', firstQ !== secondQ)

  await page.getByRole('button', { name: 'السؤال السابق' }).click()
  await page.waitForTimeout(250)
  check('الرجوع يعيد السؤال السابق',
    (await page.locator('.survey__q').innerText()) === firstQ)
  check('الإجابة محفوظة بعد الرجوع',
    await page.locator('.answer.is-chosen').count() === 1)
  await page.screenshot({ path: join(shots, '5-back-keeps-answer.png') })

  // ═════ ٢ب) العبارة المنفية ═════
  console.log('\n٢ب) العبارة المنفية')
  // السؤال السادس منفي: «لا تراعي المدرسة اختلاف القدرات»
  while (true) {
    const at = plain(await page.locator('.survey__count').innerText())
    if (at.includes('السؤال 6 ')) break
    await answer(page, 0)
  }
  const note = page.locator('.reverse-note')
  check('العبارة المنفية تحمل تنبيهًا ظاهرًا', await note.count() === 1)
  const noteText = await note.innerText()
  check('التنبيه يقول ماذا تعني الموافقة', noteText.includes('أوافق تماماً'),
    noteText.replace(/\n/g, ' ').slice(0, 70) + '…')
  check('ولا يقول أيّ الخيارات يُختار',
    !/اختاري|الإجابة الصحيحة|يُفضّل/.test(noteText))
  await page.screenshot({ path: join(shots, '4c-reverse.png') })

  // ═════ ٣) سؤال مطلوب متروك ═════
  console.log('\n٣) سؤال مطلوب متروك')
  // نحن الآن على سؤال مُجاب عليه، فلا يظهر التخطّي — ننتقل إلى التالي
  await answer(page, 0)
  const skipped = await page.locator('.survey__q').innerText()
  await page.getByRole('button', { name: 'تخطّي مؤقتًا' }).click()
  await page.waitForTimeout(250)
  check('يمكن تخطّي سؤال مؤقتًا بدل إغلاق الصفحة',
    (await page.locator('.survey__q').innerText()) !== skipped)

  // نكمل بقية الأسئلة
  for (let guard = 0; guard < 40; guard += 1) {
    if (await page.locator('.survey__cta:has-text("إرسال القياس")').count()) break
    const cls = await page.locator('.step').getAttribute('class')
    if (cls.includes('step--voice')) {
      await page.screenshot({ path: join(shots, '4b-voice.png') })
      await page.fill('#voice-field', 'أتمنى مزيدًا من الأنشطة في الساحة.')
      await page.getByRole('button', { name: /التالي|مراجعة وإرسال/ }).click()
      await page.waitForTimeout(260)
    } else if (cls.includes('step--overall')) {
      await page.screenshot({ path: join(shots, '4a-overall.png') })
      await page.locator('.verdict').first().click()
      await page.waitForTimeout(360)
    } else {
      await answer(page, guard % 3)
    }
  }

  await page.waitForSelector('.survey__cta:has-text("إرسال القياس")', { timeout: 15000 })
  await page.screenshot({ path: join(shots, '6-review.png') })
  const gaps = await page.locator('.gap').count()
  check('شاشة المراجعة ترصد السؤال المتروك', gaps === 1, `${gaps} سؤالًا ناقصًا`)

  // الإرسال ممنوع ما دام المطلوب ناقصًا
  await page.getByRole('button', { name: 'إرسال القياس' }).click()
  await page.waitForTimeout(400)
  check('الإرسال لا يمرّ والمطلوب ناقص',
    await page.locator('.cover--done').count() === 0)
  check('ونُقلت إلى السؤال الناقص نفسه',
    (await page.locator('.survey__q').innerText()) === skipped)

  await answer(page, 0)
  for (let guard = 0; guard < 40; guard += 1) {
    if (await page.locator('.survey__cta:has-text("إرسال القياس")').count()) break
    const cls = await page.locator('.step').getAttribute('class')
    if (cls.includes('step--voice')) {
      await page.getByRole('button', { name: /التالي|مراجعة وإرسال/ }).click()
      await page.waitForTimeout(260)
    } else if (cls.includes('step--overall')) {
      await page.getByRole('button', { name: /التالي|مراجعة وإرسال/ }).click()
      await page.waitForTimeout(260)
    } else {
      await answer(page, guard % 3)
    }
  }
  await page.waitForSelector('.survey__cta:has-text("إرسال القياس")', { timeout: 15000 })
  check('بعد الإجابة لم يبقَ نقص', await page.locator('.gap').count() === 0)
  const tally = plain(await page.locator('.survey__lead').innerText())
    .match(/(\d+) من (\d+)/)
  check('كل المطلوب مُجاب عليه ولم تُمسح إجابة سابقة',
    tally !== null && tally[1] === tally[2], `${tally?.[1]} من ${tally?.[2]}`)

  // ═════ ٤) الإرسال مرة واحدة ═════
  console.log('\n٤) الإرسال')
  const send = page.getByRole('button', { name: 'إرسال القياس' })
  await send.click()
  await send.click({ force: true, timeout: 2000 }).catch(() => {})
  await page.waitForSelector('.cover--done', { timeout: 20000 })
  await page.screenshot({ path: join(shots, '7-success.png') })
  check('شاشة الشكر ظهرت',
    (await page.locator('.cover__title').innerText()).includes('شكرًا'))
  check('شاشة الشكر لا تعرض نتائج ولا لوحة',
    !(await page.locator('main').innerText()).match(/مؤشر الاتجاه|نسبة الاستجابة|لوحة/))

  // ═════ ٥) هل وصلت اللوحة؟ ═════
  console.log('\n٥) اللوحة بعد الإرسال')
  const admin = await ctx.newPage()
  admin.on('pageerror', (e) => console.log('    [خطأ لوحة]', String(e).slice(0, 300)))
  await admin.goto(`http://127.0.0.1:${PORT}/#/admin`, { waitUntil: 'domcontentloaded' })
  await admin.waitForSelector('.gate__card, .admin-nav', { timeout: 20000 })
  const gate = admin.locator('.gate__card button[type="submit"]')
  if (await gate.count()) await gate.first().click()
  try {
    await admin.waitForSelector('.admin-nav', { timeout: 25000 })
  } catch (e) {
    console.log('    [محتوى الصفحة]', (await admin.locator('body').innerText()).slice(0, 300))
    throw e
  }
  await admin.waitForTimeout(1200)
  const overview = await admin.locator('.main').innerText()
  const digitsOnly = plain(overview).replace(/,/g, '')
  check('عدد الاستجابات ارتفع إلى 275', digitsOnly.includes('275'))

  await admin.goto(`http://127.0.0.1:${PORT}/#/admin/voice`, { waitUntil: 'domcontentloaded' })
  await admin.waitForTimeout(1200)
  check('الرأي المكتوب وصل «صوت طالباتنا»',
    (await admin.locator('.main').innerText()).includes('الأنشطة في الساحة'))

  // ═════ ٦) رابط فصل مباشر ═════
  console.log('\n٦) رابط فصل مباشر')
  const linkCtx = await browser.newContext({ ...devices['Pixel 7'], locale: 'ar-SA' })
  const p2 = await linkCtx.newPage()
  const school = JSON.parse(readFileSync(join(root, 'src/data/school-data.json'), 'utf8'))
  const target = school.classes[0]
  await p2.goto(`http://127.0.0.1:${PORT}/#/survey/${target.id}`, { waitUntil: 'domcontentloaded' })
  await p2.waitForSelector('.cover__title', { timeout: 20000 })
  await p2.getByRole('button', { name: 'ابدئي القياس' }).click()
  await p2.waitForTimeout(400)
  check('رابط الفصل يتخطّى اختيار الصف والفصل',
    await p2.locator('.names').count() === 1 && await p2.locator('.picks').count() === 0)
  const listed = await p2.locator('.names .name').count()
  check('ويعرض طالبات هذا الفصل وحده', listed > 0 && listed < 60, `${listed} اسمًا`)
  check('لا يظهر اسم طالبة في الرابط نفسه', !p2.url().match(/[\u0600-\u06FF]/))
  await p2.screenshot({ path: join(shots, '8-class-link.png') })
  await linkCtx.close()

  await ctx.close()
} finally {
  await browser.close()
  server.close()
}

const failed = checks.filter((c) => !c.ok)
console.log(`\nتجربة القياس على الجوال: ${checks.length - failed.length}/${checks.length} تحققًا`)
console.log(`لقطات الشاشة: ${shots}`)
process.exit(failed.length === 0 ? 0 : 1)
