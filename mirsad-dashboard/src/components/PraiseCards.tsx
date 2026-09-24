import { useMemo } from 'react'

import { normalizeArabic } from '../lib/arabic'
import { num, pct } from '../lib/format'
import type { Suggestion } from '../domain/types'

/**
 * موضوعات الثناء — ما الذي أثنت عليه الطالبات بالضبط.
 *
 * «شكرًا لكم» وحدها لا تُقال في تقرير. أما «تسع عشرة طالبة أثنت على
 * الكادر التعليمي» فرقمٌ يُقرأ ويُعرض.
 */
const THEMES = [
  { id: 'staff', name: 'المعلمات والكادر', tone: 'teal',
    words: ['معلم', 'مدرس', 'الكادر', 'المديره', 'القائده', 'قائده', 'الاداري', 'المعلمات'] },
  { id: 'teaching', name: 'التعليم والمستوى', tone: 'blue',
    words: ['تعليم', 'التعليم', 'مستوي', 'شرح', 'الدروس', 'التعليمي', 'تدريس'] },
  { id: 'order', name: 'التنظيم والبيئة', tone: 'purple',
    words: ['تنظيم', 'التنظيم', 'نظام', 'بيئه', 'متكامل', 'نظافه', 'مرتب'] },
  { id: 'care', name: 'الاهتمام بالطالبات', tone: 'green',
    words: ['اهتمام', 'رعايه', 'تشجيع', 'حب', 'تعاون', 'ثقه', 'احترام'] },
  { id: 'general', name: 'شكر عام', tone: 'sand', words: [] },
] as const

function themeOf(text: string): typeof THEMES[number] {
  const normal = normalizeArabic(text)
  for (const theme of THEMES) {
    if (theme.words.some((w) => normal.includes(w))) return theme
  }
  return THEMES[THEMES.length - 1]
}

interface Props {
  voices: Suggestion[]
  /** آراء القياس كلها — قاعدة النسبة. */
  total: number
  /** ما تحقّق من تحسين: إجراءات المدرسة على الآراء السلبية. */
  impact?: { actions: number; answered: number; needWork: number }
  /** نقل رأي إلى «تحتاج تحسين» — الفرز بالكلمات يخطئ أحيانًا. */
  onMove?: (id: string) => void
}

/**
 * لوحة الثناء.
 *
 * تُعرض بطاقاتٍ لا أسطرًا في جدول، لأن هذه هي الصفحة التي تُعرض على
 * الإدارة والوزارة: ما قالته الطالبات في مدرستهن بخطّهن، وما فعلته
 * المدرسة مقابل ما شكونه. الوجهان في مكان واحد.
 */
export function PraiseCards({ voices, total, impact, onMove }: Props) {
  const groups = useMemo(() => {
    const tally = new Map<string, Suggestion[]>()
    for (const v of voices) {
      const theme = themeOf(v.text)
      tally.set(theme.id, [...(tally.get(theme.id) ?? []), v])
    }
    return THEMES
      .map((t) => ({ theme: t, items: tally.get(t.id) ?? [] }))
      .filter((g) => g.items.length > 0)
      .sort((a, b) => b.items.length - a.items.length)
  }, [voices])

  if (voices.length === 0) return null
  const share = total ? (voices.length / total) * 100 : 0

  return (
    <div className="praise">
      <div className="praise__lead">
        <p className="praise__big">{pct(share)}</p>
        <p className="praise__sub">
          من آراء الطالبات ثناءٌ على المدرسة — {num(voices.length)} من {num(total)} رأيًا
        </p>
        {impact && impact.actions > 0 && (
          <p className="praise__impact">
            ومقابل ما شكونه: {num(impact.actions)} إجراء تحسين، عولج بها {num(impact.answered)}
            {' '}من {num(impact.needWork)} رأيًا
          </p>
        )}
      </div>

      <div className="praise__themes">
        {groups.map(({ theme, items }) => (
          <span key={theme.id} className={`praise__chip praise__chip--${theme.tone}`}>
            {theme.name}
            <b>{num(items.length)}</b>
          </span>
        ))}
      </div>

      <ul className="praise__grid">
        {groups.flatMap(({ theme, items }) => items.map((v) => (
          <li key={v.id} className={`card card--${theme.tone}`}>
            <span className="card__mark" aria-hidden="true">”</span>
            <blockquote className="card__text">{v.text}</blockquote>
            <span className="card__theme">
              {theme.name}
              {onMove && (
                <button
                  type="button" className="card__move no-print"
                  onClick={() => onMove(v.id)}
                  title="إن كان فيه مطلب فانقليه إلى «تحتاج تحسين»"
                >
                  انقليه
                </button>
              )}
            </span>
          </li>
        )))}
      </ul>
    </div>
  )
}
