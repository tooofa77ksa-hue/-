import type { StorageMode } from '../types'
import type { Theme } from '../hooks/useTheme'

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
    <header className="header">
      <div className="header__identity">
        <span className="header__mark" aria-hidden="true">
          <svg viewBox="0 0 100 100" role="presentation">
            <path
              d="M26 66V44m24 22V30m24 36V52"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </span>
        <div>
          <h1 className="header__title">مرصد</h1>
          <p className="header__subtitle">لوحة تحكم وإدارة السجلات</p>
        </div>
      </div>

      <div className="header__actions">
        <span className={`badge badge--${mode}`} title={modeText.hint}>
          <span className="badge__dot" aria-hidden="true" />
          {modeText.label}
        </span>

        <button
          type="button"
          className="button button--ghost"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'التبديل إلى السمة الفاتحة' : 'التبديل إلى السمة الداكنة'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <button type="button" className="button button--primary" onClick={onCreate}>
          سجل جديد
        </button>
      </div>
    </header>
  )
}
