import type { QuestionAnalysis } from '../lib/analysis'
import { avg, num } from '../lib/format'

interface RankedListProps {
  rows: QuestionAnalysis[]
  variant?: 'strength' | 'gap'
}

/**
 * ترتيب الأسئلة بالمتوسط المصحَّح.
 *
 * تُعلَّم الأسئلة العكسية صراحةً: نصّها منفيّ، فارتفاع متوسطها المصحَّح
 * يعني أن الطالبات لا يوافقن عليه — وهذا هو المعنى الإيجابي.
 * بدون هذا التوضيح يُقرأ «أرغب في الانتقال إلى مدرسة أخرى» بين نقاط
 * القوة قراءةً معكوسة تمامًا.
 */
export function RankedList({ rows, variant = 'strength' }: RankedListProps) {
  return (
    <ol className={variant === 'gap' ? 'ranked ranked--gap' : 'ranked'}>
      {rows.map((r) => (
        <li key={r.question.id}>
          <span className="ranked__text">
            {r.question.text}
            {r.question.direction === 'reverse' && (
              <span className="tag" title={r.question.reverseNote ?? undefined}>
                عكسي — الدرجة مصحَّحة
              </span>
            )}
          </span>
          <span className="ranked__score" title={`ن = ${num(r.n)}`}>
            {avg(r.adjustedMean as number)}
          </span>
        </li>
      ))}
    </ol>
  )
}
