import { arabicDigits } from '../lib/format'
import { ORGANIZATION } from '../brand'
import { useSystem } from '../state/useSystem'

interface BrandHeaderProps {
  /** عناصر تُعرض في الطرف المقابل (تُخفى عند الطباعة). */
  actions?: React.ReactNode
  compact?: boolean
}

/** ترويسة الهوية: شعار الوزارة + عنوان القياس + اسم المدرسة. */
export function BrandHeader({ actions, compact }: BrandHeaderProps) {
  const { state } = useSystem()
  const { meta } = state

  return (
    <>
      <div className="brand-strip" aria-hidden="true" />
      <header className={compact ? 'header header--compact' : 'header'}>
        <div className="header__identity">
          <img
            className="header__logo"
            src={ORGANIZATION.logo}
            alt={`شعار ${ORGANIZATION.ministry}`}
            width={520}
            height={396}
          />
          <span className="header__divider" aria-hidden="true" />
          <div>
            <h1 className="header__title">
              {meta.surveyTitle} {arabicDigits(meta.hijriYear)}هـ
            </h1>
            <p className="header__subtitle">{meta.school}</p>
          </div>
        </div>
        {actions && <div className="header__actions no-print">{actions}</div>}
      </header>
    </>
  )
}
