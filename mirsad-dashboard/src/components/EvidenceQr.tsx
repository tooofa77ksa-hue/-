import { useEffect, useState } from 'react'

import { qrDataUrl } from '../lib/qr'
import type { Evidence } from '../domain/types'

/**
 * شاهد الإجراء: رابطٌ يُطبع باركودًا ملوّنًا.
 *
 * المشرفة تمسحه بجوالها فينفتح الدليل، بدل أن تكتب رابطًا طويلًا
 * بيدها من ورقة مطبوعة.
 *
 * والرابط يبقى مكتوبًا تحته: الباركود لا يُقرأ بالعين، فلو تعذّر
 * المسح بقي الرابط. ويُذكَّر أن الرابط لا بدّ أن يكون مفتوحًا لمن
 * يمسحه، وإلا فتح له الباركودُ صفحةَ «لا صلاحية».
 */
export function EvidenceQr({ evidence }: { evidence: Evidence }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let alive = true
    if (evidence.kind !== 'link' || !evidence.value.trim()) return () => { alive = false }
    qrDataUrl(evidence.value, '#0f5d5b')
      .then((url) => { if (alive) setSrc(url) })
      .catch(() => { if (alive) setSrc('') })
    return () => { alive = false }
  }, [evidence.kind, evidence.value])

  if (evidence.kind !== 'link') {
    return (
      <div className="proof proof--note">
        <span className="chip">ملاحظة</span>
        <div className="proof__txt">
          <strong>{evidence.label || 'شاهد'}</strong>
          <span className="proof__value">{evidence.value}</span>
        </div>
      </div>
    )
  }

  return (
    <figure className="proof">
      {/* الاسم فوق الباركود: من يراه يعرف ما الشاهد قبل أن يمسحه */}
      <figcaption className="proof__name">{evidence.label || 'شاهد التنفيذ'}</figcaption>
      {src
        ? <img className="proof__qr" src={src} alt={`باركود ${evidence.label || 'الشاهد'}`} />
        : <span className="proof__qr proof__qr--empty" aria-hidden="true" />}
      <div className="proof__txt">
        <a className="proof__value" href={evidence.value} target="_blank" rel="noreferrer noopener">
          {evidence.value}
        </a>
        <span className="proof__hint">
          امسحيه بالجوال ليفتح الشاهد. تأكّدي أن الرابط مفتوح لمن يمسحه.
        </span>
      </div>
    </figure>
  )
}
