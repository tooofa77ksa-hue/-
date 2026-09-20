import { num, pct } from '../lib/format'

export interface Segment {
  label: string
  count: number
  percent: number
  tone: string
}

interface StackedBarProps {
  segments: Segment[]
  n: number
}

/** شريط مكدّس لتوزيع إجابات سؤال واحد. */
export function StackedBar({ segments, n }: StackedBarProps) {
  if (n === 0) return <p className="muted">لا توجد إجابات صالحة (ن = ٠)</p>
  return (
    <div className="stacked">
      <div className="stacked__bar">
        {segments
          .filter((s) => s.count > 0)
          .map((s) => (
            <span
              key={s.label}
              className="stacked__seg"
              style={{ width: `${s.percent}%`, background: s.tone }}
              title={`${s.label}: ${num(s.count)} (${pct(s.percent)})`}
            >
              {s.percent >= 12 ? pct(s.percent, 0) : ''}
            </span>
          ))}
      </div>
    </div>
  )
}
