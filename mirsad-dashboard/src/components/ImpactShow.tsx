import { EvidenceQr } from './EvidenceQr'
import { SCHOOL_SCOPE, suggestionsInScope } from '../lib/analysis'
import type { Band } from '../lib/bands'
import { num } from '../lib/format'
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

/** بنود شريحةٍ واحدة. التقسيم في لوحة العرض لأنها تعرف كم شريحة عندها. */
export function ImpactBands({
  bands, all, page, pages,
}: { bands: Band[]; all: Band[]; page: number; pages: number }) {
  const covered = all.reduce((n, b) => n + b.voices.length, 0)
  const done = all.filter((b) => b.action.status === 'completed').length
  const proofs = all.reduce((n, b) => n + b.action.evidence.length, 0)

  return (
    <section className="show__screen impact">
      <h2 className="show__h2">
        من الرأي إلى التحسين
        {pages > 1 && (
          <span className="show__legend">
            البنود {num(page + 1)} من {num(pages)}
          </span>
        )}
      </h2>

      {page === 0 && (
        <ol className="impact__flow" aria-label="مسار الرأي حتى الشاهد">
          <li><strong>{num(covered)}</strong><span>ملاحظة سُمعت</span></li>
          <li><strong>{num(all.length)}</strong><span>بندًا رُدَّ عليه</span></li>
          <li className="is-done"><strong>{num(done)}</strong><span>منجزًا</span></li>
          <li><strong>{num(proofs)}</strong><span>شاهدًا بالباركود</span></li>
        </ol>
      )}

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
}

/** شريحة الثناء: لا تتوقّف على وجود بندٍ، فالثناء وارد في القياس نفسه. */
export function ImpactPraise({ state, bands }: { state: SystemState; bands: number }) {
  const all = suggestionsInScope(state, SCHOOL_SCOPE)
  const praise = all.filter((s) => voiceKind(s) === 'positive')

  return (
    <section className="show__screen impact">
      <h2 className="show__h2">
        ما قالته الطالبات وأولياء الأمور في مدرستهن
        {/* عددٌ لا نسبة: مقام النسبة يضمّ «لا يوجد» وأمثاله، فتهبط
            بما ليس رأيًا أصلًا. والعبارات معروضة تحتها تُعدّ بالعين. */}
        <span className="impact__share">{num(praise.length)} عبارة ثناء</span>
      </h2>
      <ul className="impact__praise">
        {praise.map((s) => (
          <li key={s.id}><blockquote>{s.text}</blockquote></li>
        ))}
      </ul>
      <p className="impact__basis">
        ثناءٌ ورد في القياس بنصّه · ولا ملاحظة واحدة على التعليم:
        ما نُقد كان على المرافق{bands > 0 ? `، وقد رُدَّ عليه في ${num(bands)} بندًا` : ''}.
      </p>
    </section>
  )
}
