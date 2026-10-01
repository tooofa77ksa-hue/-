import { useMemo } from 'react'

import { EvidenceQr } from './EvidenceQr'
import { suggestionsInScope, SCHOOL_SCOPE } from '../lib/analysis'
import { num, pct } from '../lib/format'
import { voiceKind } from '../lib/voiceKind'
import type { SystemState } from '../domain/types'

/**
 * «من الرأي إلى التحسين» على شاشة العرض.
 *
 * الأرقام وحدها لا تُقنع زائرًا: مؤشّرٌ من خمسة لا يقول له شيئًا عن
 * المدرسة. والذي يُقنعه أن يرى شكوى بنصّها، وتحتها ما عملته المدرسة
 * عليها، وبجانبها باركودٌ يمسحه بجواله فيرى الشاهد بعينه.
 *
 * فهذا القسم هو الفرق بين تقريرٍ يُقرأ ومدرسةٍ تُصدَّق.
 */
export function ImpactShow({ state, screen }: { state: SystemState; screen: number }) {
  const all = suggestionsInScope(state, SCHOOL_SCOPE)

  const praise = useMemo(() => all.filter((s) => voiceKind(s) === 'positive'), [all])
  const improve = useMemo(() => all.filter((s) => voiceKind(s) === 'improve'), [all])

  /** البنود مرتَّبة بعدد ما تحته من أصوات: الأكثر تكرارًا أولًا. */
  const bands = useMemo(() => {
    const byId = new Map(all.map((s) => [s.id, s]))
    return state.improvementActions
      .map((a) => ({
        action: a,
        voices: a.linkedSuggestionIds.map((id) => byId.get(id)).filter(Boolean),
      }))
      .filter((b) => b.voices.length > 0)
      .sort((x, y) => y.voices.length - x.voices.length)
  }, [state.improvementActions, all])

  const covered = bands.reduce((n, b) => n + b.voices.length, 0)
  const done = bands.filter((b) => b.action.status === 'completed').length
  const proofs = bands.reduce((n, b) => n + b.action.evidence.length, 0)

  if (bands.length === 0) return null
  // «improve» محسوبٌ للتوثيق لا للعرض: البنود تغطّيه
  void improve

  if (screen === 1) return (
      <section className="show__screen impact">
        <h2 className="show__h2">من الرأي إلى التحسين</h2>

        <ol className="impact__flow" aria-label="مسار الرأي حتى الشاهد">
          <li><strong>{num(covered)}</strong><span>ملاحظة سُمعت</span></li>
          <li><strong>{num(bands.length)}</strong><span>بندًا رُدَّ عليه</span></li>
          <li className="is-done"><strong>{num(done)}</strong><span>منجزًا</span></li>
          <li><strong>{num(proofs)}</strong><span>شاهدًا بالباركود</span></li>
        </ol>

        <div className="impact__bands">
          {bands.map(({ action, voices }) => (
            <article key={action.id} className="band">
              <header className="band__head">
                <h3 className="band__title">{action.title}</h3>
                <span className="band__count">{num(voices.length)} ملاحظة</span>
                <span className={`band__state band__state--${action.status}`}>
                  {action.status === 'completed' ? 'مُنجَز' : 'جارٍ التنفيذ'}
                </span>
              </header>

              {/* صوت الطالبة أولًا، فهو سبب البند لا حاشيته */}
              <blockquote className="band__voice">{voices[0]?.text}</blockquote>
              {voices.length > 1 && (
                <p className="band__more">وقالتها {num(voices.length - 1)} غيرها بعبارات أخرى</p>
              )}

              <p className="band__did">
                <span className="band__did-label">ما عملته المدرسة</span>
                {action.action}
              </p>

              {action.evidence.length > 0 && (
                <div className="band__proofs">
                  {action.evidence.map((e) => <EvidenceQr key={e.id} evidence={e} />)}
                </div>
              )}
            </article>
          ))}
        </div>
        <p className="impact__basis">
          كل ملاحظة معروضة بنصّها كما كتبتها صاحبتها، بلا تحرير ولا إعادة صياغة.
          والباركود يفتح شاهد التنفيذ نفسه — امسحه بجوالك.
        </p>
      </section>
  )

  return (
      <section className="show__screen impact">
          <h2 className="show__h2">
            ما قالته الطالبات وأولياء الأمور في مدرستهن
            <span className="impact__share">
              {pct(all.length ? (praise.length / all.length) * 100 : 0)} من الآراء ثناء
            </span>
          </h2>
        <ul className="impact__praise">
          {praise.map((s) => (
            <li key={s.id}><blockquote>{s.text}</blockquote></li>
          ))}
        </ul>
        <p className="impact__basis">
          ثناءٌ ورد في القياس بنصّه · ولا ملاحظة واحدة على التعليم:
          ما نُقد كان على المرافق، وقد رُدَّ عليه في {num(bands.length)} بندًا.
        </p>
      </section>
  )
}
