import { useEffect, useState } from 'react'

import { SectionTitle } from '../../components/SectionTitle'
import { downloadQr, qrDataUrl, surveyUrl } from '../../lib/qr'
import { num } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

interface LinkRow {
  key: string
  title: string
  url: string
  filename: string
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
      url: surveyUrl(),
      filename: `qr-survey-main-${state.meta.hijriYear}.png`,
    },
    ...state.classes.map((c) => ({
      key: c.id,
      title: `${gradeById.get(c.gradeId)?.name ?? ''} — فصل ${c.name}`,
      url: surveyUrl(c.id),
      filename: `qr-${c.id}-${state.meta.hijriYear}.png`,
    })),
  ]

  useEffect(() => {
    let alive = true
    Promise.all(rows.map(async (r) => [r.key, await qrDataUrl(r.url)] as const)).then((pairs) => {
      if (alive) setImages(Object.fromEntries(pairs))
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.classes.length])

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

      <p className="basis-note no-print">
        {num(rows.length)} رابطًا. الباركود بتصحيح خطأ مرتفع (H) وهامش هادئ ٤ وحدات، أسود على
        أبيض — صالح للمسح والطباعة.
      </p>

      <div className="qr-grid">
        {rows.map((r) => (
          <article key={r.key} className="qr-card">
            <h3 className="qr-card__title">{r.title}</h3>
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
                onClick={() => downloadQr(r.url, r.filename)}>
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
