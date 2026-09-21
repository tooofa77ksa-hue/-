import { useState } from 'react'
import type { ReactNode } from 'react'

import { BrandFooter } from '../../components/BrandFooter'
import { BrandHeader } from '../../components/BrandHeader'
import { signInAdmin } from '../../firebase/auth'
import { useSystem } from '../../state/useSystem'

const SESSION_KEY = 'qiyas.admin.session'

/**
 * بوابة دخول الإدارة.
 *
 * في الوضع البعيد (قاعدة بيانات متصلة) هذه البوابة ليست هي الحماية:
 * الحماية أن حساب Firebase يحمل صلاحية admin موقّعة، وقواعد Firestore
 * ترفض قراءة اسم طالبة واحدة لمن لا يحملها. من تجاوز هذه الشاشة بحيلة
 * في المتصفّح يجد الصفحات فارغة، لأن الخادم هو من يرفض لا الواجهة.
 *
 * في الوضع المحلي لا خادم يتحقق أصلًا، فالرمز هنا يمنع الوصول العَرَضي
 * فقط — وهذا مكتوب صراحةً في الشاشة كي لا يُظن غير ذلك.
 */
const PASSCODE = (import.meta.env?.VITE_MIRSAD_ADMIN_PASSCODE ?? '').trim()

function hasSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === 'granted'
  } catch {
    return false
  }
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <BrandHeader compact />
      <main className="gate">{children}</main>
      <BrandFooter />
    </div>
  )
}

/** دخول فعلي بحساب Firebase — الوضع البعيد. */
function RemoteGate({ children }: { children: ReactNode }) {
  const { identity, status } = useSystem()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (identity.role === 'admin') return <>{children}</>

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signInAdmin(email, password)
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      setError(/invalid-credential|wrong-password|user-not-found/.test(raw)
        ? 'البريد أو كلمة المرور غير صحيحة'
        : raw)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <form className="gate__card" onSubmit={submit}>
        <h2 className="gate__heading">دخول الإدارة</h2>
        <p className="gate__note">
          الدخول بحساب المدرسة المصرّح له. البيانات محفوظة في قاعدة بيانات تمنع قراءة أسماء
          الطالبات لأي حساب لا يحمل صلاحية الإدارة.
        </p>

        <label className="field__label" htmlFor="admin-email">البريد الإلكتروني</label>
        <input
          id="admin-email" className="input" type="email" dir="ltr" autoComplete="username"
          value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} required
        />

        <label className="field__label" htmlFor="admin-password">كلمة المرور</label>
        <input
          id="admin-password" className="input" type="password" autoComplete="current-password"
          value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} required
        />

        {error && <p className="field__error">{error}</p>}
        {identity.role === 'respondent' && !error && (
          <p className="field__error">هذا الحساب لا يملك صلاحية الإدارة.</p>
        )}
        {status === 'denied' && identity.role === 'none' && !error && (
          <p className="gate__note">تعذّر الوصول إلى البيانات بالحساب الحالي.</p>
        )}

        <button type="submit" className="button button--primary button--block" disabled={busy}>
          {busy ? 'جارٍ التحقق…' : 'دخول'}
        </button>
      </form>
    </Shell>
  )
}

/** الوضع المحلي: رمز يمنع الوصول العَرَضي، ويصرّح بحدوده. */
function LocalGate({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useState(hasSession)
  const [entry, setEntry] = useState('')
  const [error, setError] = useState('')

  if (granted) return <>{children}</>

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (PASSCODE && entry.trim() !== PASSCODE) {
      setError('رمز الدخول غير صحيح')
      return
    }
    try {
      window.sessionStorage.setItem(SESSION_KEY, 'granted')
    } catch {
      // الجلسة محجوبة — نكمل لهذه الصفحة فقط
    }
    setGranted(true)
  }

  return (
    <Shell>
      <form className="gate__card" onSubmit={submit}>
        <h2 className="gate__heading">دخول الإدارة</h2>
        <p className="gate__note gate__note--warn">
          وضع محلي: البيانات محفوظة في هذا المتصفّح وحده، ولا يوجد خادم يتحقق من الهوية. هذه
          الشاشة تمنع الفتح العَرَضي فقط. للحماية الفعلية فعّلي قاعدة البيانات.
        </p>
        {PASSCODE ? (
          <>
            <label className="field__label" htmlFor="admin-passcode">رمز الدخول</label>
            <input
              id="admin-passcode" className="input" type="password" autoComplete="current-password"
              value={entry} onChange={(e) => { setEntry(e.target.value); setError('') }}
            />
            {error && <p className="field__error">{error}</p>}
          </>
        ) : (
          <p className="gate__note">
            لم يُضبط رمز دخول. اضبطي <code>VITE_MIRSAD_ADMIN_PASSCODE</code> في ملف <code>.env</code>.
          </p>
        )}
        <button type="submit" className="button button--primary button--block">دخول</button>
      </form>
    </Shell>
  )
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { mode } = useSystem()
  return mode === 'remote'
    ? <RemoteGate>{children}</RemoteGate>
    : <LocalGate>{children}</LocalGate>
}
