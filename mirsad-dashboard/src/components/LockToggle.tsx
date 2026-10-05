import { Link } from 'react-router-dom'

import { useViewOnly } from '../state/viewOnly'

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg className="lock__icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
      {locked ? (
        <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      ) : (
        <path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7" />
      )}
      <circle cx="12" cy="15.8" r="1.5" className="lock__pin" />
    </svg>
  )
}

/**
 * القفل: ضغطةٌ واحدة تجعل اللوحة كلَّها للعرض.
 *
 * ولا ينقل إلى شاشةٍ أخرى ولا يُنقص شيئًا: اللوحة تبقى كما هي —
 * الأسماء والفصول والآراء وكل قسمٍ فيها — غير أن شيئًا لا يُكتب ولا
 * يُحفظ. من تعرض لوحتها أو تُسلّم جوّالها تريد ما فيها كاملًا، لا
 * ملخّصًا عنه.
 *
 * والمنع في طبقة الحالة لا في هذا الزرّ: كل كتابةٍ تُرفض وهي واقفة،
 * فلا ينفذ شيءٌ من زرٍّ نُسي أو اختصارِ لوحة مفاتيح.
 */
export function LockToggle() {
  const [locked, set] = useViewOnly()

  return (
    <button
      type="button"
      className={locked ? 'lock is-locked' : 'lock'}
      onClick={() => set(!locked)}
      aria-pressed={locked}
      aria-label={locked ? 'فتح القفل للعودة إلى التعديل' : 'إقفال اللوحة على العرض'}
      title={locked
        ? 'اللوحة معروضة كاملةً ولا شيء يُحفظ — اضغطي لتعود الكتابة'
        : 'اقفلي اللوحة على العرض: كل شيء يُقرأ ولا شيء يُعدَّل'}
    >
      <LockIcon locked={locked} />
      <span className="lock__label">{locked ? 'مقفلة للعرض' : 'اقفلي للعرض'}</span>
    </button>
  )
}

/** خروجٌ من شاشة الشرائح إلى اللوحة — وهي طريقٌ آخر غير القفل. */
export function ExitDisplay() {
  return (
    <Link className="lock" to="/admin" title="العودة إلى اللوحة">
      <LockIcon locked={false} />
      <span className="lock__label">العودة إلى اللوحة</span>
    </Link>
  )
}
