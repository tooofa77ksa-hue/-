import { Link } from 'react-router-dom'

import { avg, num, pct } from '../lib/format'

export interface Count {
  to: string
  value: number
  label: string
}

interface Props {
  mean: number | null
  scaleMin: number
  scaleMax: number
  n: number
  responses: number
  /** نسبة من أجابت، مئويةً كما تصل من participation(). */
  receivedRate: number
  /** العام الدراسي كما يُكتب في الوثائق الرسمية. */
  year: string
  counts: Count[]
}

/**
 * صدر اللوحة: المؤشر كمسطرة قياس، لا كرقم في صندوق.
 *
 * القياس نفسه مقياس من ١ إلى ٣، فأصدق تمثيل له مسطرةٌ بمداه الحقيقي.
 * ولا تُرسم عليها علامات الصفوف: «الصفوف على مسطرة القياس» تحتها تعرض
 * كل صف باسمه ورقمه ونسبته، فنقطة مجهولة هنا تكرار لا يزيد شيئًا.
 *
 * والأعداد الأربعة داخل الصدر لا في بطاقات تحته: هي سياق هذا الرقم
 * — على كم طالبة واستجابة حُسب — لا موضوع مستقل.
 */
export function IndexGauge({
  mean, scaleMin, scaleMax, n, responses, receivedRate, year, counts,
}: Props) {
  const span = scaleMax - scaleMin
  const place = (v: number) => ((v - scaleMin) / span) * 100

  return (
    <section className="hero">
      <div className="hero__meter">
        <div className="hero__head">
          <h2 className="hero__title">مؤشر اتجاه المتعلمات</h2>
          <p className="hero__year">العام الدراسي {year}هـ</p>
        </div>

        {mean === null ? (
          <p className="hero__empty">لا توجد إجابات مُقيَّسة بعد.</p>
        ) : (
          <>
            <p className="hero__value">
              <strong>{avg(mean)}</strong>
              <span>من {num(scaleMax)}</span>
            </p>

            <div
              className="hero__scale"
              role="img"
              aria-label={`المؤشر ${avg(mean)} من ${num(scaleMax)} على مقياس من ${num(scaleMin)} إلى ${num(scaleMax)}`}
            >
              <span className="hero__track">
                <span className="hero__fill" style={{ width: `${place(mean)}%` }} />
                <span className="hero__needle" style={{ insetInlineStart: `${place(mean)}%` }} />
              </span>
              <span className="hero__ruler">
                <span>{num(scaleMin)}</span>
                <span>{num(scaleMin + span / 2)}</span>
                <span>{num(scaleMax)}</span>
              </span>
            </div>

            <p className="hero__basis">
              متوسط {num(n)} إجابة مُقيَّسة بعد تصحيح اتجاه العبارات العكسية، من{' '}
              {num(responses)} استجابة — {pct(receivedRate)} من طالبات الكشوف.
            </p>
          </>
        )}
      </div>

      <ul className="hero__counts">
        {counts.map((c) => (
          <li key={c.to}>
            <Link className="hero__count" to={c.to}>
              <strong>{num(c.value)}</strong>
              <span>{c.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
