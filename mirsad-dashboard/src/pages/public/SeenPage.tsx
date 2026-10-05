import { useEffect, useMemo, useRef, useState } from 'react'

import { BrandFooter } from '../../components/BrandFooter'
import { loadPublicContext, submitAck, type PublicContext } from '../../data/remote/firestoreRepo'
import { ensureRespondent } from '../../firebase/auth'

const ORG_LOGO = '/brand/moe-logo.png'

/**
 * صفحة «تمَّ الاطّلاع» — ما يصل إلى المدرسة بعد الكرّاسة.
 *
 * الكرّاسة تُرسل إلى أولياء الأمور فتُقرأ ولا يعود منها شيء، فلا
 * تعرف المدرسة أبلغت أم لم تبلغ. وهذه الصفحة هي طريق العودة: ضغطةٌ
 * واحدة تقول «قرأتُها»، وحقلٌ اختياري لمن أراد أن يكتب كلمة.
 *
 * ولا يُطلب فيها اسمٌ ولا رقم: من أراد أن يُعرَف كتب اسمه، ومن أراد
 * أن يمرّ مرّ. فطلبُ الاسم شرطًا يُنقص المقرّين ولا يزيد صدقهم.
 *
 * ولا تقرأ هذه الصفحة شيئًا من إقرارات غيرها: تكتب وتنصرف، كما
 * تفعل صفحة القياس بالضبط.
 */
function newToken(): string {
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** تُعاد الكلمة إلى صاحبها لو تعثّرت الشبكة، فلا يُعاد كتابتها. */
const DRAFT_KEY = 'qiyas.seen.draft'

export function SeenPage() {
  const [context, setContext] = useState<PublicContext | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [classId, setClassId] = useState('')
  const [name, setName] = useState('')
  const [word, setWord] = useState(() => {
    try { return localStorage.getItem(DRAFT_KEY) ?? '' } catch { return '' }
  })
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const token = useRef(newToken())
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        await ensureRespondent()
        const ctx = await loadPublicContext()
        if (!alive) return
        if (!ctx) { setLoadError('لا توجد دورة قياس مفتوحة حاليًا.'); return }
        setContext(ctx)
      } catch {
        if (alive) setLoadError('تعذّر الاتصال. تأكّدوا من الشبكة ثم أعيدوا المحاولة.')
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, word) } catch { /* وضع التصفّح الخاص */ }
  }, [word])

  useEffect(() => { headingRef.current?.focus() }, [done])

  const rooms = useMemo(() => {
    if (!context) return []
    const grade = new Map(context.grades.map((g) => [g.id, g]))
    return context.classes
      .map((c) => ({ id: c.id, label: `${grade.get(c.gradeId)?.name ?? ''} / ${c.name}` }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ar'))
  }, [context])

  async function send() {
    if (!context) return
    setSending(true)
    setSendError(null)
    try {
      await submitAck({
        cycleId: context.cycle.id,
        name: name || null,
        classId: classId || null,
        word: word || null,
        clientToken: token.current,
      })
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* لا يضرّ */ }
      setDone(true)
    } catch {
      setSendError('تعذّر الإرسال. تأكّدوا من الشبكة ثم أعيدوا المحاولة.')
    } finally {
      setSending(false)
    }
  }

  const frame = (children: React.ReactNode) => (
    <div className="app app--survey">
      <main className="survey seen">
        <img className="seen__logo" src={ORG_LOGO} alt="وزارة التعليم" />
        <p className="seen__org">الإدارة العامة للتعليم بمحافظة جدة</p>
        <p className="seen__school">الابتدائية الخامسة والستون بعد المائة</p>
        {children}
      </main>
      <BrandFooter />
    </div>
  )

  if (loadError) {
    return frame(
      <div className="survey__state">
        <h1 className="survey__q" tabIndex={-1} ref={headingRef}>تعذّر فتح الصفحة</h1>
        <p className="survey__lead">{loadError}</p>
      </div>,
    )
  }

  if (!context) {
    return frame(
      <div className="survey__state">
        <span className="survey__spinner" aria-hidden="true" />
        <p className="survey__lead">جارٍ التحميل…</p>
      </div>,
    )
  }

  if (done) {
    return frame(
      <div className="seen__done">
        <span className="seen__tick" aria-hidden="true">✓</span>
        <h1 className="survey__q" tabIndex={-1} ref={headingRef}>وصلَنا إقراركم، فشكرًا لكم</h1>
        <p className="survey__lead">
          نَعتزُّ بمتابعتكم، ونَعِدُكم أن يبقى رأيُكم أمامنا في كل قرارٍ يخصُّ بناتِكم.
        </p>
        <p className="seen__sign">
          إدارة المدرسة
          <span>الابتدائية الخامسة والستون بعد المائة</span>
        </p>
      </div>,
    )
  }

  return frame(
    <>
      <h1 className="survey__q" tabIndex={-1} ref={headingRef}>تمَّ الاطّلاع</h1>
      <p className="seen__lede">
        نشكر لكم قراءةَ تقرير «ماذا عملنا برأيكم؟»، ونرجو تأكيدَ اطّلاعكم عليه.
        <br />
        ولا يستغرق ذلك سوى لحظة، ولا يُطلب فيه تسجيلُ دخولٍ ولا بريدٌ إلكتروني.
      </p>

      <label className="seen__field">
        <span>فصل ابنتكم <i>(اختياري)</i></span>
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">— لم أُحدِّد —</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </label>

      <label className="seen__field">
        <span>اسم وليّ الأمر <i>(اختياري)</i></span>
        <input
          type="text"
          value={name}
          maxLength={120}
          placeholder="اكتبوه إن أحببتم أن نشكركم باسمكم"
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="seen__field">
        <span>كلمةٌ للمدرسة <i>(اختياري)</i></span>
        <textarea
          rows={4}
          value={word}
          maxLength={1000}
          placeholder="عبارةُ تشجيعٍ، أو ملاحظةٌ ترونها، أو دعوةٌ طيّبة…"
          onChange={(e) => setWord(e.target.value)}
        />
        <small>تصل كلمتُكم إلى إدارة المدرسة وحدها، وتُقرأ بنصّها كما كتبتموها.</small>
      </label>

      {sendError && <p className="survey__error" role="alert">{sendError}</p>}

      <button
        type="button"
        className="survey__cta"
        disabled={sending}
        onClick={() => void send()}
      >
        {sending ? 'جارٍ الإرسال…' : 'أُقِرُّ بالاطّلاع'}
      </button>

      <p className="seen__note">
        رأيُكم هو ما غيَّر ما رأيتموه في التقرير. ونحن نقرأ كل ملاحظةٍ تصلنا بنصّها،
        ونُحوّلها إلى إجراءٍ له مسؤولةٌ وتاريخٌ وشاهدُ تنفيذ.
      </p>
    </>,
  )
}
