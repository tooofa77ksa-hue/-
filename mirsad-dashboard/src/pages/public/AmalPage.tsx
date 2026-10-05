import { useEffect, useState } from 'react'

import { BrandFooter } from '../../components/BrandFooter'

const ORG_LOGO = '/brand/moe-logo.png'

interface Shot { src: string; caption: string }
interface Item {
  title: string
  voices: number
  said: string[]
  did: string
  shots: Shot[]
  note: string | null
}
interface Care { icon: string; title: string; body: string; shot: Shot }
interface Amal { school: string; cycle: string; items: Item[]; always: Care[] }

/**
 * «ماذا عملنا برأيكم» — الكرّاسة نفسها على صفحةٍ تُفتح برابط.
 *
 * الباركود في ورقةٍ مطبوعة لا يفتح ملفًّا في جهاز المعدّة. ووليّ
 * الأمر الذي يمسح الرمز يريد أن يرى ما عُمل برأيه في جوّاله، لا أن
 * يُحمّل ملفًّا ويبحث عنه في مجلّد التنزيلات.
 *
 * وهي تقرأ ملفًّا ثابتًا تكتبه الكرّاسة، فلا يفترق المطبوع عن المنشور.
 * ولا أسماء فيه: لا للطالبات ولا لأسرهنّ — الرابط يفتحه كلُّ من وصله.
 */
export function AmalPage() {
  const [data, setData] = useState<Amal | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const res = await fetch('/data/amal.json', { cache: 'no-cache' })
        if (!res.ok) throw new Error('not found')
        const json = (await res.json()) as Amal
        if (alive) setData(json)
      } catch {
        if (alive) setError(true)
      }
    })()
    return () => { alive = false }
  }, [])

  return (
    <div className="app app--survey">
      <main className="survey shukr amal">
        <img className="seen__logo" src={ORG_LOGO} alt="وزارة التعليم" />
        <p className="seen__org">الإدارة العامة للتعليم بمحافظة جدة</p>
        <p className="seen__school">{data?.school ?? 'الابتدائية الخامسة والستون بعد المائة'}</p>

        <h1 className="shukr__title">ماذا عملنا برأيكم؟</h1>
        <p className="shukr__sub">{data?.cycle ?? 'قياس اتجاه المتعلمين 1448هـ'}</p>

        <p className="shukr__lede">
          كتبتم ملاحظاتِكم في دقيقتين، وهذه صفحتُنا إليكم: رأيُكم بنصّه كما كتبتموه،
          وتحته ما عملته المدرسة، وتحتهما صورةُ ما عُمل.
        </p>

        {error && (
          <p className="survey__error" role="alert">
            تعذّر تحميل الصفحة. أعيدوا المحاولة بعد قليل.
          </p>
        )}
        {!data && !error && <p className="survey__lead">جارٍ التحميل…</p>}

        {data?.items.map((it, i) => (
          <section key={i} className="amal__item">
            <header>
              <span className="amal__no">{i + 1}</span>
              <div>
                <h2>{it.title}</h2>
                <span className="amal__says">
                  {it.voices === 1 ? 'قالها وليُّ أمرٍ واحد'
                    : it.voices === 2 ? 'قالها وليَّا أمر'
                      : `قالها ${it.voices} من أولياء الأمور`}
                </span>
              </div>
            </header>

            {it.said.map((t, k) => <blockquote key={k}>{t}</blockquote>)}

            <p className="amal__did"><b>ما عملناه</b>{it.did}</p>

            {it.shots.length > 0 ? (
              <div className="amal__shots">
                {it.shots.map((sh, k) => (
                  <figure key={k}>
                    <img src={sh.src} alt={sh.caption} loading="lazy" />
                    <figcaption>{sh.caption}</figcaption>
                  </figure>
                ))}
              </div>
            ) : it.note && <p className="amal__soon">📷 {it.note}</p>}
          </section>
        ))}

        {data && data.always.length > 0 && (
          <>
            <h2 className="amal__head">من اهتمام المدرسة</h2>
            <p className="shukr__lede">أشياءُ لم تسألوا عنها، وعملناها.</p>
            {data.always.map((c, i) => (
              <section key={i} className="amal__item amal__item--care">
                <h3><span aria-hidden="true">{c.icon}</span> {c.title}</h3>
                <p className="amal__did">{c.body}</p>
                <div className="amal__shots">
                  <figure>
                    <img src={c.shot.src} alt={c.shot.caption} loading="lazy" />
                    <figcaption>{c.shot.caption}</figcaption>
                  </figure>
                </div>
              </section>
            ))}
          </>
        )}

        <p className="shukr__end">
          كلُّ ملاحظةٍ تصلنا تُقرأ بنصّها، ثم تصير إجراءً له شاهدُ تنفيذ 💙
        </p>
      </main>
      <BrandFooter />
    </div>
  )
}
