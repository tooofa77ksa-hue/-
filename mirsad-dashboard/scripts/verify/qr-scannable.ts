/**
 * يولّد الباركودات بالألوان الفعلية ويحفظها للفحص.
 *
 * تُولَّد من الدالة نفسها التي تولّدها للمدرسة — لا من نسخة مشابهة —
 * كي يكون المفحوص هو المنشور.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { QR_COLORS, qrColorFor } from '../../src/lib/qr'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.tmp-excel')
mkdirSync(out, { recursive: true })

const { default: QRCode } = await import('qrcode')

const cases = []
for (let gradeNo = 0; gradeNo <= QR_COLORS.length; gradeNo += 1) {
  const color = qrColorFor(gradeNo)
  const url = gradeNo === 0
    ? 'https://qiyas-165-1448.web.app/#/survey'
    : `https://qiyas-165-1448.web.app/#/survey/c-${gradeNo}-1`
  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H', margin: 4, scale: 8,
    color: { dark: color, light: '#ffffff' },
  })
  cases.push({
    title: gradeNo === 0 ? 'الرابط الرئيسي' : `الصف ${gradeNo}`,
    url,
    color,
    png: [...Buffer.from(dataUrl.split(',')[1], 'base64')],
  })
}

const file = join(out, 'qr-cases.json')
writeFileSync(file, JSON.stringify(cases))
console.log(file)
