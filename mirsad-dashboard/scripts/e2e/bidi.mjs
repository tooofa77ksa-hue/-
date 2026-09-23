/**
 * فحص ترتيب الأرقام داخل النص العربي.
 *
 * الأرقام لاتينية تُرسم من اليسار إلى اليمين داخل سطر من اليمين إلى
 * اليسار. وما جاورها من علامات محايدة — الإشارة والشرطة — لا ينتمي
 * إليها في خوارزمية الاتجاه، فيأخذ اتجاه الجملة ويقفز إلى طرفها.
 * المشاهَد فعلًا قبل العزل: «0.06+» بدل «+0.06»، و«1448-1447» بدل
 * «1447-1448»، و«12-» بدل «-12» في ترقيم المصدر.
 *
 * ولا يُفحص هذا بالنظر: يُقاس موضع كل محرف على الشاشة.
 *
 * يُفحص نمطان بعينهما لا ترتيب السطر كله: إعادة بناء ترتيب سطرٍ
 * مختلطٍ تُنتج إنذارات كاذبة عند نقطة نهاية الجملة وقوس الإغلاق،
 * وكلاهما يقع في موضعه الصحيح.
 */

/**
 * الإشارة تسبق رقمها: «+0.06» لا «0.06+».
 *
 * تُحتسب محارف العزل بين الإشارة والرقم: الرقم معزول أصلًا، والعيب
 * أن تبقى الإشارة خارج العزل. ولولا احتسابها لمرّ العيب دون أن يُرى.
 */
const SIGNED = /([+−–-])([⁦-⁩]*)(\d[\d.,]*)/g

/** المدى يبقى بترتيبه: «1447-1448» لا «1448-1447». */
const RANGE = /(\d[\d,]*)\s*([-–—])\s*(\d[\d,]*)/g

export async function misorderedNumbers(page) {
  return page.evaluate(({ signedSrc, rangeSrc }) => {
    const signed = new RegExp(signedSrc, 'g')
    const range = new RegExp(rangeSrc, 'g')
    const problems = []
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const r = document.createRange()

    /** مركز محرف بعينه على الشاشة، أو null إن لم يُرسم. */
    const at = (node, i) => {
      r.setStart(node, i)
      r.setEnd(node, i + 1)
      const box = r.getBoundingClientRect()
      if (box.width === 0 && box.height === 0) return null
      return box.left + box.width / 2
    }

    for (let node = walk.nextNode(); node; node = walk.nextNode()) {
      const raw = node.nodeValue
      if (!/\d/.test(raw) || !raw.trim()) continue
      const parent = node.parentElement
      if (!parent) continue
      if (!parent.offsetParent && !['text', 'tspan'].includes(parent.tagName)) continue

      signed.lastIndex = 0
      for (let m = signed.exec(raw); m; m = signed.exec(raw)) {
        // شرطة بين رقمين مدًى لا إشارة، ولها فحصها أدناه
        const before = raw.slice(0, m.index).replace(/[\u2066-\u2069]/g, '')
        if (/\d$/.test(before)) continue
        const sign = at(node, m.index)
        const digit = at(node, m.index + 1 + m[2].length)
        // الإشارة يسار أول رقم دائمًا
        if (sign !== null && digit !== null && sign > digit) {
          problems.push({ text: raw.trim().slice(0, 60), kind: 'إشارة في الطرف الخطأ', part: m[0] })
        }
      }

      range.lastIndex = 0
      for (let m = range.exec(raw); m; m = range.exec(raw)) {
        const first = at(node, m.index)
        const second = at(node, m.index + m[0].length - 1)
        // الرقم الأول يسار الثاني: المدى يُقرأ من اليسار كوحدة لاتينية
        if (first !== null && second !== null && first > second) {
          problems.push({ text: raw.trim().slice(0, 60), kind: 'مدى مقلوب', part: m[0] })
        }
      }
    }
    return problems
  }, { signedSrc: SIGNED.source, rangeSrc: RANGE.source })
}

/**
 * النص بلا محارف العزل.
 *
 * الأرقام معزولة بمحرفين لا يُرسمان (U+2066 و U+2069) كي لا تقفز
 * إشارتها إلى الطرف الخطأ. وهما موجودان في النص المقروء من الصفحة،
 * فتُسقطان قبل أي مطابقة نصّية وإلا فشلت مطابقة سليمة.
 */
export const plain = (text) => text.replace(/[\u2066-\u2069\u200e\u200f]/g, '')
