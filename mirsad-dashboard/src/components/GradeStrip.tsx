import { Link } from 'react-router-dom'

import { avg, num, pct } from '../lib/format'

/**
 * الفارق عن مؤشر المدرسة بإشارته.
 *
 * فروق الصفوف هنا بالمئات (٢٫٧٢ إلى ٢٫٨٤)، وعلى مسطرة من ١ إلى ٣ تبدو
 * الأشرطة متطابقة. ولا يُقصّ المقياس ليبدو الفارق أكبر مما هو — ذلك
 * تهويل — بل يُكتب الفارق رقمًا إلى جانب الشريط الصادق.
 */
function delta(mean: number, school: number): string {
  const d = mean - school
  if (Math.abs(d) < 0.005) return '='
  return `${d > 0 ? '+' : '−'}${avg(Math.abs(d))}`
}

export interface GradeReading {
  id: string
  name: string
  mean: number | null
  /** نسبة من أجابت، مئويةً. */
  rate: number
  students: number
  responses: number
}

interface Props {
  grades: GradeReading[]
  scaleMin: number
  scaleMax: number
  schoolMean: number | null
}

/**
 * الصفوف كلوحة قياس واحدة، لا ستّ بطاقات متجاورة.
 *
 * كل صف على المسطرة نفسها (١ إلى ٣) التي يقف عليها مؤشر المدرسة،
 * فالمقارنة تصير بصرية لا حسابية: أي صف أبعد عن البقية يُرى في لحظة
 * دون قراءة عمود أرقام.
 *
 * وخط مؤشر المدرسة يمرّ عبر الصفوف كلها في موضعه من المسطرة، فيُقرأ
 * كل صف منسوبًا إليه: فوقه أم دونه، وبكم.
 */
export function GradeStrip({ grades, scaleMin, scaleMax, schoolMean }: Props) {
  const span = scaleMax - scaleMin
  const place = (v: number) => ((v - scaleMin) / span) * 100

  return (
    <section className="strip" aria-label="مؤشر كل صف">
      <header className="strip__head">
        <h2 className="strip__title">الصفوف على مسطرة القياس</h2>
        <p className="strip__legend">
          <span className="strip__legend-mark" aria-hidden="true" />
          الخط الفاصل موضع مؤشر المدرسة
          {schoolMean !== null && <> ({avg(schoolMean)})</>}
        </p>
      </header>

      <ol className="strip__grid">
        {grades.map((g) => {
          const above = g.mean !== null && schoolMean !== null && g.mean >= schoolMean
          return (
            <li key={g.id} className="strip__cell">
              <Link className="reading" to={`/admin/grades/${g.id}`}>
                <span className="reading__name">{g.name}</span>

                <span className="reading__value">
                  {g.mean === null ? '—' : avg(g.mean)}
                  {g.mean !== null && schoolMean !== null && (
                    <span className={above ? 'reading__delta is-above' : 'reading__delta'}>
                      {delta(g.mean, schoolMean)}
                    </span>
                  )}
                </span>

                <span className="reading__scale" aria-hidden="true">
                  <span className="reading__track">
                    {g.mean !== null && (
                      <span
                        className={above ? 'reading__bar is-above' : 'reading__bar'}
                        style={{ width: `${place(g.mean)}%` }}
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
                  {num(g.responses)} من {num(g.students)}
                  <span className="reading__rate">{g.students ? pct(g.rate) : '—'}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
