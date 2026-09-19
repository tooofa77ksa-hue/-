import { ORGANIZATION } from '../brand'
import type { Theme } from '../hooks/useTheme'
import type { StorageMode } from '../types'

interface HeaderProps {
  mode: StorageMode
  theme: Theme
  onToggleTheme: () => void
  onCreate: () => void
}

const MODE_TEXT: Record<StorageMode, { label: string; hint: string }> = {
  firestore: {
    label: 'متصل بـ Firestore',
    hint: 'البيانات محفوظة في مشروع Firebase الخاص بـ«مرصد»',
  },
  local: {
    label: 'تخزين محلي',
    hint: 'البيانات محفوظة في هذا المتصفح فقط — اضبط ملف .env للاتصال بـ Firebase',
  },
}

export function Header({ mode, theme, onToggleTheme, onCreate }: HeaderProps) {
  const modeText = MODE_TEXT[mode]

  return (
    <>
      <div className="brand-strip" aria-hidden="true" />

      <header className="header">
        <div className="header__identity">
          <img
            className="header__logo"
            src={theme === 'dark' ? ORGANIZATION.logoLight : ORGANIZATION.logo}
            alt={`شعار ${ORGANIZATION.ministry}`}
            width={520}
            height={396}
          />
          <span className="header__divider" aria-hidden="true" />
          <div>
            <h1 className="header__title">مرصد</h1>
            <p className="header__subtitle">{ORGANIZATION.directorate}</p>
          </div>
        </div>

        <div className="header__actions">
          <span className={`badge badge--${mode}`} title={modeText.hint}>
            <span className="badge__dot" aria-hidden="true" />
            {modeText.label}
          </span>

          <button
            type="button"
            className="button button--ghost button--icon"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark' ? 'التبديل إلى السمة الفاتحة' : 'التبديل إلى السمة الداكنة'
            }
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>

          <button type="button" className="button button--primary" onClick={onCreate}>
            سجل جديد
          </button>
        </div>
      </header>
    </>
  )
}
