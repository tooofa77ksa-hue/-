import { useEffect, useState } from 'react'

import { BrandFooter } from '../../components/BrandFooter'

const ORG_LOGO = '/brand/moe-logo.png'

interface Word { text: string; from: string; grade: string }
interface Shukr { school: string; cycle: string; words: Word[] }

/**
 * «كلماتٌ طيّبة» — ما أثنى به أولياء الأمور، منشورًا كما كتبوه.
 *
 * التقرير يُطبع ويُرسل مرّةً ثم يُطوى، والكلمةُ الطيّبة تستحقّ موضعًا
 * يُفتح متى شاء صاحبُه ويُشارَك برابط. فهذه الصفحة هي ذلك الموضع.
 *
 * وهي تقرأ ملفًّا ثابتًا تكتبه الكرّاسة نفسها، لا قاعدةَ البيانات:
 * مجموعةُ الآراء لا تُقرأ إلا بصلاحية إدارة — وهي تمنع ذلك بحقّ —
 * فلا سبيل إلى نشر شيءٍ منها إلا باختيارٍ صريحٍ يمرّ على المدرسة.
 */
export function ShukrPage() {
  const [data, setData] = useState<Shukr | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const res = await fetch('/data/shukr.json', { cache: 'no-cache' })
        if (!res.ok) throw new Error('not found')
        const json = (await res.json()) as Shukr
        if (alive) setData(json)
      } catch {
        if (alive) setError(true)
      }
    })()
    return () => { alive = false }
  }, [])

  return (
    <div className="app app--survey">
      <main className="survey shukr">
        <img className="seen__logo" src={ORG_LOGO} alt="وزارة التعليم" />
        <p className="seen__org">الإدارة العامة للتعليم بمحافظة جدة</p>
        <p className="seen__school">{data?.school ?? 'الابتدائية الخامسة والستون بعد المائة'}</p>

        <h1 className="shukr__title">كلماتٌ طيّبة</h1>
        <p className="shukr__sub">{data?.cycle ?? 'قياس اتجاه المتعلمين 1448هـ'}</p>

        <p className="shukr__lede">
          ممّا كتبه أولياءُ أمور طالباتنا في القياس، بنصّه كما كُتب.
          <br />
          نَنشره لا ثناءً على أنفسنا، بل وفاءً لمن تكلَّم — ولتعلموا أنّ كلمتَكم تبلُغ موضعَها.
        </p>

        {error && (
          <p className="survey__error" role="alert">
            تعذّر تحميل الصفحة. أعيدوا المحاولة بعد قليل.
          </p>
        )}

        {!data && !error && <p className="survey__lead">جارٍ التحميل…</p>}

        {data && (
          <ul className="shukr__list">
            {data.words.map((w, i) => (
              <li key={i} className="shukr__one">
                <p>{w.text}</p>
                <span>{w.from}{w.grade ? ` — ${w.grade}` : ''}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="shukr__end">
          ولكلِّ أسرةٍ كتبت لنا حرفًا — شكرًا، فقد بلغَنا وأفرحَنا 💙
        </p>
      </main>
      <BrandFooter />
    </div>
  )
}
