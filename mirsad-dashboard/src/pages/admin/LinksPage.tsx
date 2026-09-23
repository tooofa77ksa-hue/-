import { useEffect, useState } from 'react'

import { SectionTitle } from '../../components/SectionTitle'
import { downloadQr, qrColorFor, qrDataUrl, surveyUrl } from '../../lib/qr'
import { num } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

interface LinkRow {
  key: string
  title: string
  subtitle: string
  url: string
  filename: string
  color: string
}

export function LinksPage() {
  const { state } = useSystem()
  const [images, setImages] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const gradeById = new Map(state.grades.map((g) => [g.id, g]))

  const rows: LinkRow[] = [
    {
      key: 'main',
      title: 'الرابط الرئيسي للقياس',
      subtitle: 'تختار الطالبة صفها وفصلها بنفسها',
      url: surveyUrl(),
      filename: `qr-survey-main-${state.meta.hijriYear}.png`,
      color: qrColorFor(0),
    },
    ...state.classes.map((c) => {
      const grade = gradeById.get(c.gradeId)
      return {
        key: c.id,
        title: `${grade?.name ?? ''} — فصل ${c.name}`,
        subtitle: 'يفتح القياس على هذا الفصل مباشرة',
        url: surveyUrl(c.id),
        filename: `qr-${c.id}-${state.meta.hijriYear}.png`,
        color: qrColorFor(grade?.no),
      }
    }),
  ]

  useEffect(() => {
    let alive = true
    Promise.all(rows.map(async (r) => [r.key, await qrDataUrl(r.url, r.color)] as const))
      .then((pairs) => { if (alive) setImages(Object.fromEntries(pairs)) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.classes.length, state.grades.length])

  async function copy(url: string, key: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(key)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      window.prompt('انسخي الرابط:', url)
    }
  }

  return (
    <>
      <SectionTitle note="رابط الفصل يتعرّف على الفصل تلقائيًا فلا تُطالَب الطالبة باختياره">
        مركز الروابط والباركود
      </SectionTitle>

      {/* ما هو الباركود ولماذا؟ — شرح يُقرأ مرة واحدة ويغني عن السؤال */}
      <section className="qr-guide no-print">
        <h3 className="qr-guide__title">ما هذه الباركودات، ولماذا لكل فصل واحد؟</h3>
        <p className="qr-guide__lead">
          الباركود صورة الرابط. تفتح الطالبة كاميرا جوالها وتوجّهها إليه، فينفتح القياس
          فورًا بلا كتابة رابط ولا خطأ في حرف. وكل استجابة تصل لوحة الإدارة مباشرة.
        </p>
        <ol className="qr-guide__steps">
          <li>
            <strong>باركود الفصل</strong> — اطبعيه وسلّميه معلّمة الفصل أو اعرضيه على شاشة
            الصف. من يمسحه يفتح القياس <em>وقد حُدّد صفه وفصله سلفًا</em>، فلا تختار
            الطالبة صفها ولا تخطئ فيه، وتُنسب استجابتها إلى فصلها الصحيح في اللوحة.
          </li>
          <li>
            <strong>الباركود الرئيسي</strong> — للمجموعات العامة وأولياء الأمور. من يمسحه
            يختار صفه وفصله بنفسه، وهو المناسب حين لا تعرفين فصل من سيجيب.
          </li>
          <li>
            <strong>لون كل صف يميّزه</strong> عند الطباعة والتوزيع، فلا يُسلَّم باركود صفٍّ
            لمعلّمة صفٍّ آخر. اللون للتمييز فقط ولا يغيّر الرابط.
          </li>
        </ol>
        <p className="qr-guide__note">
          الباركود لا يحمل اسم طالبة ولا يفتح لوحة الإدارة — يفتح صفحة القياس وحدها،
          فلا ضرر إن رآه غير المقصود.
        </p>
      </section>

      <p className="basis-note no-print">
        {num(rows.length)} رابطًا. الباركود بتصحيح خطأ مرتفع (H) وهامش هادئ ٤ وحدات،
        بألوان داكنة عالية التباين على أبيض — صالح للمسح والطباعة.
      </p>

      <div className="qr-grid">
        {rows.map((r) => (
          <article key={r.key} className="qr-card" style={{ '--qr': r.color } as React.CSSProperties}>
            <span className="qr-card__band" aria-hidden="true" />
            <h3 className="qr-card__title">{r.title}</h3>
            <p className="qr-card__subtitle">{r.subtitle}</p>
            {images[r.key] ? (
              <img className="qr-card__image" src={images[r.key]} alt={`باركود ${r.title}`} />
            ) : (
              <div className="qr-card__placeholder" aria-hidden="true" />
            )}
            <code className="qr-card__url">{r.url}</code>
            <div className="qr-card__actions no-print">
              <button type="button" className="button button--small" onClick={() => copy(r.url, r.key)}>
                {copied === r.key ? 'تم النسخ ✓' : 'نسخ'}
              </button>
              <a className="button button--small" href={r.url} target="_blank" rel="noreferrer noopener">
                فتح
              </a>
              <button type="button" className="button button--small"
                onClick={() => downloadQr(r.url, r.filename, r.color)}>
                تحميل PNG
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="no-print" style={{ marginTop: 20 }}>
        <button type="button" className="button button--primary" onClick={() => window.print()}>
          طباعة كل الباركودات
        </button>
      </div>
    </>
  )
}
