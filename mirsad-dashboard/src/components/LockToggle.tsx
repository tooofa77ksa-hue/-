import { Link } from 'react-router-dom'

/**
 * قفل يبدّل بين وضعي اللوحة الواحدة: العرض والتعديل.
 *
 * لوحة واحدة لا لوحتان، ورابط واحد لا رابطان. القفل مغلق في وضع
 * العرض فلا زرّ يُضغط ولا حقل يُعدَّل — تُعرض على الإدارة وهي آمنة من
 * تعديل عارض. ويُفتح فتعود اللوحة كاملة الصلاحيات.
 *
 * ولا علاقة لهذا بالصلاحيات ولا بقواعد الأمان: من يفتح اللوحة دخل
 * بحساب المدرسة أصلًا. القفل يريح العين لا يحمي البيانات.
 */
export function LockToggle({ locked }: { locked: boolean }) {
  return (
    <Link
      className={locked ? 'lock is-locked' : 'lock'}
      to={locked ? '/admin' : '/admin/display'}
      aria-label={locked ? 'فتح القفل للعودة إلى التعديل' : 'إقفال اللوحة وعرضها'}
      title={locked ? 'افتحي القفل للتعديل' : 'اقفلي للعرض'}
    >
      <svg className="lock__icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
        {locked ? (
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        ) : (
          <path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7" />
        )}
        <circle cx="12" cy="15.8" r="1.5" className="lock__pin" />
      </svg>
      <span className="lock__label">{locked ? 'مقفلة للعرض' : 'اقفلي للعرض'}</span>
    </Link>
  )
}
