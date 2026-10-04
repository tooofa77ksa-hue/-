import { num, pct } from '../lib/format'

/**
 * حلقة المشاركة: نسبةٌ واحدة تُقرأ من آخر القاعة.
 *
 * الزائر لا يقرأ جدولًا: ينظر مرةً فيعرف هل شاركت المدرسة كلها أم
 * نصفها. ولذلك سلسلة واحدة بلون واحد — لا ألوان تتنافس ولا دليل
 * ألوان يُفَكّ، والرقم مكتوب في قلب الحلقة لا على حاشيتها.
 */
export function Ring({ done, total }: { done: number; total: number }) {
  const share = total ? (done / total) * 100 : 0
  // نصف قطرٍ يترك مكان السُّمك داخل مربّع 120، ومحيطٌ يُقصّ بالشَّرطة
  const R = 50
  const C = 2 * Math.PI * R
  return (
    <div className="ring">
      <svg className="ring__svg" viewBox="0 0 120 120" role="img"
           aria-label={`شاركت ${num(done)} من ${num(total)} — ${pct(share)}`}>
        <circle className="ring__track" cx="60" cy="60" r={R} />
        <circle
          className="ring__value" cx="60" cy="60" r={R}
          strokeDasharray={`${(share / 100) * C} ${C}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ring__mid">
        <strong>{pct(share)}</strong>
        <span>{num(done)} من {num(total)}</span>
      </div>
    </div>
  )
}
