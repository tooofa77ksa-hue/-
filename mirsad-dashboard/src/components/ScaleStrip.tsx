import { Link } from 'react-router-dom'

import { avg, num, pct } from '../lib/format'
import { delta } from '../lib/delta'

export interface Reading {
  id: string
  name: string
  to: string
  mean: number | null
  /** نسبة من أجابت، مئويةً. */
  rate: number
  students: number
  responses: number
}

interface Props {
  title: string
  readings: Reading[]
  scaleMin: number
  scaleMax: number
  schoolMean: number | null
  /** عدد الخانات في الصف الواحد على الشاشة الواسعة. */
  columns: number
}

/**
 * وحدات القياس (صفوفًا كانت أو فصولًا) على مسطرة واحدة.
 *
 * كلها على المسطرة نفسها التي يقف عليها مؤشر المدرسة، ويمرّ موضعه
 * خطًّا عبرها جميعًا، فتُقرأ كل وحدة منسوبةً إليه: فوقه أم دونه، وبكم.
 */
export function ScaleStrip({
  title, readings, scaleMin, scaleMax, schoolMean, columns,
}: Props) {
  const span = scaleMax - scaleMin
  const place = (v: number) => ((v - scaleMin) / span) * 100

  return (
    <section className="strip" aria-label={title} style={{ '--cols': columns } as React.CSSProperties}>
      <header className="strip__head">
        <h2 className="strip__title">{title}</h2>
        <p className="strip__legend">
          <span className="strip__legend-mark" aria-hidden="true" />
          الخط الفاصل موضع مؤشر المدرسة
          {schoolMean !== null && <> ({avg(schoolMean)})</>}
        </p>
      </header>

      <ol className="strip__grid">
        {readings.map((r) => {
          const above = r.mean !== null && schoolMean !== null && r.mean >= schoolMean
          return (
            <li key={r.id} className="strip__cell">
              <Link className="reading" to={r.to}>
                <span className="reading__name">{r.name}</span>

                <span className="reading__value">
                  {r.mean === null ? '—' : avg(r.mean)}
                  {r.mean !== null && schoolMean !== null && (
                    <span className={above ? 'reading__delta is-above' : 'reading__delta'}>
                      {delta(r.mean, schoolMean)}
                    </span>
                  )}
                </span>

                <span className="reading__scale" aria-hidden="true">
                  <span className="reading__track">
                    {r.mean !== null && (
                      <span
                        className={above ? 'reading__bar is-above' : 'reading__bar'}
                        style={{ width: `${place(r.mean)}%` }}
                      />
                    )}
                    {schoolMean !== null && (
                      <span
                        className="reading__school"
                        style={{ insetInlineStart: `${place(schoolMean)}%` }}
                      />
                    )}
                  </span>
                </span>

                <span className="reading__foot">
                  {num(r.responses)} من {num(r.students)}
                  <span className="reading__rate">{r.students ? pct(r.rate) : '—'}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
