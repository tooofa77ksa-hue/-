import { NavLink, Outlet } from 'react-router-dom'

import { BrandFooter } from '../../components/BrandFooter'
import { BrandHeader } from '../../components/BrandHeader'
import { AnthemPlayer } from '../../components/AnthemPlayer'
import { LiveClock } from '../../components/LiveClock'
import { useTheme } from '../../hooks/useTheme'

const LINKS = [
  { to: '/admin', end: true, label: 'نظرة عامة' },
  { to: '/admin/questions', label: 'تحليل الأسئلة' },
  { to: '/admin/voice', label: 'صوت طالباتنا' },
  { to: '/admin/improvement', label: 'من الرأي إلى التحسين' },
  { to: '/admin/non-respondents', label: 'غير المستجيبات' },
  { to: '/admin/students', label: 'إدارة الطالبات' },
  { to: '/admin/match-review', label: 'مراجعة المطابقة' },
  { to: '/admin/links', label: 'الروابط والباركود' },
  { to: '/admin/reports', label: 'التقارير' },
  { to: '/admin/settings', label: 'الإعدادات' },
]

export function AdminLayout() {
  const { theme, toggle } = useTheme()

  return (
    <div className="app">
      <BrandHeader
        actions={
          <>
            <LiveClock />
            <AnthemPlayer />
            <button
              type="button"
              className="button button--ghost button--icon"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'السمة الفاتحة' : 'السمة الداكنة'}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </>
        }
      />

      <nav className="admin-nav no-print" aria-label="أقسام النظام">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => (isActive ? 'admin-nav__item is-active' : 'admin-nav__item')}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <main className="main">
        <Outlet />
      </main>

      <BrandFooter />
    </div>
  )
}
