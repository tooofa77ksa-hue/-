import { ABOVE_HEX, BELOW_HEX } from '../lib/tones'
import { avg, num } from '../lib/format'

export interface ChartRow {
  label: string
  value: number | null
}

interface Props {
  title: string
  rows: ChartRow[]
  min: number
  max: number
  /** خط المرجع: مؤشر المدرسة. */
  reference: number | null
  referenceLabel?: string
}

const ROW = 24
const GAP = 6
const WIDTH = 660
/** عمود الأسماء يمينًا حيث تبدأ القراءة، وعمود القيم يسارًا حيث ينتهي الشريط. */
const NAME_W = 116
const VALUE_W = 48
const TOP = 30
const BOTTOM = 26

/**
 * رسم أعمدة أفقية على مدى المقياس الحقيقي.
 *
 * SVG لا صورة: يُطبع بدقّة الطابعة مهما كُبِّر، ويخرج في PDF نصًّا
 * قابلًا للبحث لا بكسلات.
 *
 * المحور يبدأ من حدّ المقياس الأدنى لا من الصفر ولا من أدنى قيمة:
 * البدء من أدنى قيمة يضخّم فروقًا بالمئات حتى تبدو أضعافًا، والبدء
 * من الصفر يسحق مقياسًا مداه من ١ إلى ٣. والمدى المعلن مكتوب تحت
 * المحور كي لا يُقرأ الرسم على غير أساسه.
 *
 * ولون العمود يتبع موضعه من مؤشر المدرسة لا ترتيبه، فلا يتغيّر لون
 * صفٍّ لأن صفًّا آخر سبقه.
 */
export function ScaleChart({ title, rows, min, max, reference, referenceLabel }: Props) {
  const span = max - min || 1
  const height = TOP + rows.length * (ROW + GAP) - GAP + BOTTOM
  const plot = WIDTH - NAME_W - VALUE_W
  const origin = WIDTH - NAME_W          // حافة الشريط اليمنى: من هنا ينمو يسارًا
  const place = (v: number) => ((v - min) / span) * plot
  const refX = reference === null ? null : origin - place(reference)
  const ticks = [min, min + span / 2, max]

  return (
    <figure className="chart">
      <figcaption className="chart__title">{title}</figcaption>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={`${title}. المقياس من ${num(min)} إلى ${num(max)}.`}
        style={{ direction: 'rtl' }}
      >
        {/* الشبكة خلف الأعمدة وبلون خافت: مرجع لا زينة */}
        {ticks.map((t) => {
          const x = origin - place(t)
          return (
            <line
              key={`g${t}`} x1={x} x2={x} y1={TOP - 6} y2={height - BOTTOM}
              stroke="#dbe6e8" strokeWidth="1"
            />
          )
        })}

        {rows.map((r, i) => {
          const y = TOP + i * (ROW + GAP)
          const above = r.value !== null && reference !== null && r.value >= reference
          const w = r.value === null ? 0 : place(r.value)
          return (
            <g key={r.label}>
              <text
                x={WIDTH - 6} y={y + ROW / 2} dominantBaseline="central" textAnchor="start"
                fontSize="11.5" fill="#15445a"
              >
                {r.label}
              </text>

              {r.value === null ? (
                <text
                  x={origin - 8} y={y + ROW / 2} dominantBaseline="central" textAnchor="start"
                  fontSize="11" fill="#7a8f99"
                >
                  لا إجابات
                </text>
              ) : (
                <>
                  <rect
                    x={origin - w} y={y} width={w} height={ROW} rx="4"
                    fill={above ? ABOVE_HEX : BELOW_HEX}
                  />
                  <text
                    x={VALUE_W - 8} y={y + ROW / 2} dominantBaseline="central" textAnchor="start"
                    fontSize="11.5" fontWeight="700" fill="#15445a"
                  >
                    {avg(r.value)}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {refX !== null && (
          <>
            <line
              x1={refX} x2={refX} y1={TOP - 10} y2={height - BOTTOM}
              stroke="#15445a" strokeWidth="1.5" strokeDasharray="4 3"
            />
            <text
              x={refX} y={TOP - 15} textAnchor="middle" fontSize="10.5" fill="#15445a"
            >
              {referenceLabel ?? 'المدرسة'} {reference !== null && avg(reference)}
            </text>
          </>
        )}

        {ticks.map((t) => (
          <text
            key={`t${t}`} x={origin - place(t)} y={height - 9}
            textAnchor="middle" fontSize="10.5" fill="#4a6b78"
          >
            {num(t)}
          </text>
        ))}
      </svg>
      <p className="chart__note">
        المحور على مدى المقياس المعلن كاملًا: من {num(min)} إلى {num(max)}. الشريط الفيروزي
        فوق مؤشر المدرسة، والذهبي دونه.
      </p>
    </figure>
  )
}
