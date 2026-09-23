import type { SimilarVoice } from '../lib/similar'
import { num } from '../lib/format'

interface Props {
  items: SimilarVoice[]
  chosen: Set<string>
  toggle: (id: string) => void
  toggleAll: () => void
  /** عنوان القسم: يختلف بين «اربطيها معه» و«ضمّيها إلى الإجراء». */
  title: string
}

/**
 * الآراء المتشابهة، مقترحةً لا مفروضة.
 *
 * تُعرض بنصّها كاملًا وبالكلمات التي جمعتها، لأن الإدارة هي التي تقرّر
 * لا الحاسوب: قد تكتب طالبتان عن «الساحة» وتقصد إحداهما الحرارة
 * والأخرى الازدحام. فالمعروض هنا ترشيحٌ يُراجَع بالعين قبل أن يُؤخذ.
 *
 * وبلا هذا القسم كانت الإدارة تربط عشرين رأيًا واحدًا واحدًا، أو —
 * وهو الأسوأ — تنشئ لكلٍّ منها إجراءً، فتقرأ الوزارة عشرين مشكلة
 * منفصلة مكان مشكلةٍ تكرّرت عشرين مرة.
 */
export function SimilarVoices({ items, chosen, toggle, toggleAll, title }: Props) {
  if (items.length === 0) return null
  const all = chosen.size >= items.length

  return (
    <div className="akin no-print">
      <div className="akin__head">
        <h4 className="akin__title">{title} — {num(items.length)}</h4>
        <button type="button" className="button button--small" onClick={toggleAll}>
          {all ? 'ألغي الاختيار' : 'اختاري الكل'}
        </button>
      </div>

      <ul className="akin__list">
        {items.map(({ voice, shared }) => (
          <li key={voice.id} className={chosen.has(voice.id) ? 'akin__item is-on' : 'akin__item'}>
            <label className="akin__pick">
              <input
                type="checkbox"
                checked={chosen.has(voice.id)}
                onChange={() => toggle(voice.id)}
              />
              <span className="akin__text">{voice.text}</span>
              {shared.length > 0 && (
                <span className="akin__why">
                  {shared.slice(0, 3).map((word) => (
                    <span key={word} className="akin__word">{word}</span>
                  ))}
                </span>
              )}
            </label>
          </li>
        ))}
      </ul>

      <p className="improve__note">
        ترشيحٌ بالكلمات المشتركة، لا دمج: لا يُربط رأيٌ حتى تختاريه بنفسك، ولا يُغيَّر نصّ
        طالبة أبدًا.
      </p>
    </div>
  )
}
