import { Link } from 'react-router-dom'

import { avg, num, pct } from '../lib/format'

export interface GradeMark {
  id: string
  name: string
  mean: number | null
}

interface Props {
  mean: number | null
  scaleMin: number
  scaleMax: number
  n: number
  responses: number
  students: number
  grades: GradeMark[]
}

/**
 * مؤشر الاتجاه كمسطرة قياس، لا كرقم في صندوق.
 *
 * القياس نفسه مقياس من ١ إلى ٣، فأصدق تمثيل له مسطرةٌ بمداه الحقيقي،
 * عليها موضع المدرسة وموضع كل صف. هذا يجيب عن سؤالين في نظرة واحدة:
 * أين نحن؟ وأي صف أبعد عن البقية؟ — وهو ما كان يحتاج قراءة جدول كامل.
 */
export function IndexGauge({
  mean, scaleMin, scaleMax, n, responses, students, grades,
}: Props) {
  const span = scaleMax - scaleMin
  const place = (v: number) => ((v - scaleMin) / span) * 100
  const rate = students > 0 ? responses / students : 0

  const marked = grades
    .filter((g): g is GradeMark & { mean: number } => g.mean !== null)
    .sort((a, b) => a.mean - b.mean)

  const lowest = marked[0]
  const highest = marked[marked.length - 1]

  return (
    <section className="gauge">
      <header className="gauge__head">
        <h2 className="gauge__title">مؤشر اتجاه المتعلمات</h2>
        <p className="gauge__basis">
          متوسط {num(n)} إجابة مُقيَّسة، بعد تصحيح اتجاه العبارات العكسية
        </p>
      </header>

      {mean === null ? (
        <p className="gauge__empty">لا توجد إجابات مُقيَّسة بعد.</p>
      ) : (
        <>
          <div className="gauge__value">
            <strong>{avg(mean)}</strong>
            <span>من {num(scaleMax)}</span>
          </div>

          <div
            className="gauge__scale"
            role="img"
            aria-label={`المؤشر ${avg(mean)} من ${num(scaleMax)} على مقياس من ${num(scaleMin)} إلى ${num(scaleMax)}`}
          >
            <div className="gauge__track">
              <span className="gauge__fill" style={{ width: `${place(mean)}%` }} />
              <span className="gauge__needle" style={{ insetInlineStart: `${place(mean)}%` }} />
            </div>

            <div className="gauge__grades">
              {marked.map((g) => (
                <Link
                  key={g.id}
                  to={`/admin/grades/${g.id}`}
                  className="gauge__tick"
                  style={{ insetInlineStart: `${place(g.mean)}%` }}
                  title={`${g.name}: ${avg(g.mean)}`}
                >
                  <span className="sr-only">{g.name} — {avg(g.mean)}</span>
                </Link>
              ))}
            </div>

            <div className="gauge__ruler">
              <span>{num(scaleMin)}</span>
              <span>{num(scaleMin + span / 2)}</span>
              <span>{num(scaleMax)}</span>
            </div>
          </div>

          <dl className="gauge__facts">
            <div>
              <dt>الاستجابة</dt>
              <dd>{num(responses)} من {num(students)} — {pct(rate)}</dd>
            </div>
            {lowest && (
              <div>
                <dt>أدنى صف</dt>
                <dd>{lowest.name} — {avg(lowest.mean)}</dd>
              </div>
            )}
            {highest && marked.length > 1 && (
              <div>
                <dt>أعلى صف</dt>
                <dd>{highest.name} — {avg(highest.mean)}</dd>
              </div>
            )}
          </dl>
        </>
      )}
    </section>
  )
}
