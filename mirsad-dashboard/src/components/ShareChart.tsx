import { num, pct } from '../lib/format'

export interface Share {
  label: string
  count: number
  percent: number
  tone: string
}

interface Props {
  title: string
  shares: Share[]
  n: number
}

const H = 46
const PAD = 2

/**
 * شريط نِسَب واحد: توزيع الإجابات على خياراتها.
 *
 * شريط مكدَّس لا قطاع دائري: العين تقارن أطوالًا أدقّ بكثير مما تقارن
 * زوايا، والقطاع الدائري يخفي الفروق الصغيرة التي تهمّ هنا.
 *
 * وبين القطع فاصل أبيض ٢ بكسل، وفي كل قطعة نسبتها مكتوبة، ومع كل
 * قطعة اسمها في المفتاح — فالتمييز لا يقع على اللون وحده، ويبقى
 * مقروءًا في الطباعة بالأبيض والأسود ولمن لا يميّز الألوان.
 */
export function ShareChart({ title, shares, n }: Props) {
  const total = shares.reduce((s, x) => s + x.count, 0) || 1
  let cursor = 0

  return (
    <figure className="chart">
      <figcaption className="chart__title">{title}</figcaption>
      <svg
        className="chart__svg chart__svg--share"
        viewBox={`0 0 100 ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${title}. ${shares.map((s) => `${s.label} ${pct(s.percent)}`).join('، ')}.`}
      >
        {shares.map((s) => {
          const w = (s.count / total) * 100
          const x = cursor
          cursor += w
          if (w <= 0) return null
          return (
            <rect
              key={s.label} x={x} y="0" width={Math.max(0, w - PAD / 4)} height={H}
              fill={s.tone} rx="0.6"
            />
          )
        })}
      </svg>

      <ul className="chart__key">
        {shares.map((s) => (
          <li key={s.label}>
            <span className="chart__swatch" style={{ background: s.tone }} aria-hidden="true" />
            <span className="chart__key-label">{s.label}</span>
            {/* الرقمان في عنصرين منفصلين: لو وُضعا في نصٍّ واحد دمجهما
                خوارزمية الاتجاه ثنائي الجانب فقُرئا رقمًا واحدًا. */}
            <span className="chart__key-value">{num(s.count)}</span>
            <span className="chart__key-sep" aria-hidden="true">·</span>
            <span className="chart__key-value">{pct(s.percent)}</span>
          </li>
        ))}
      </ul>

      <p className="chart__note">ن = {num(n)} استجابة أجابت على هذا البند.</p>
    </figure>
  )
}
