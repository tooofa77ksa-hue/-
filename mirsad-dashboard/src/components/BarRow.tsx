import { num, pct } from '../lib/format'

interface BarRowProps {
  label: string
  count: number
  percent: number
  tone?: string
  title?: string
}

/** شريط أفقي نسبي — الشكل الأنسب لمقارنة فئات ذات تسميات عربية طويلة. */
export function BarRow({ label, count, percent, tone = 'var(--moe-teal)', title }: BarRowProps) {
  return (
    <div className="bar-row" title={title ?? `${label}: ${num(count)} (${pct(percent)})`}>
      <span className="bar-row__label">{label}</span>
      <span className="bar-row__track">
        <span className="bar-row__fill" style={{ width: `${percent}%`, background: tone }} />
      </span>
      <span className="bar-row__value">
        {num(count)} <span className="bar-row__pct">{pct(percent)}</span>
      </span>
    </div>
  )
}
