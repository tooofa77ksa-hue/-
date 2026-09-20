import { clockTime, hijriToday } from '../lib/format'
import { useClock } from '../hooks/useClock'

/** ساعة وتاريخ حيّان في ترويسة الإدارة — يُخفيان عند الطباعة. */
export function LiveClock() {
  const now = useClock()
  return (
    <div className="clock no-print" aria-live="off">
      <time className="clock__time" dateTime={now.toISOString()}>
        {clockTime(now)}
      </time>
      <span className="clock__date">{hijriToday(now)}</span>
    </div>
  )
}
