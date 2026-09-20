import { useState } from 'react'
import type { ReactNode } from 'react'

import { BrandFooter } from '../../components/BrandFooter'
import { BrandHeader } from '../../components/BrandHeader'

const SESSION_KEY = 'qiyas.admin.session'

/**
 * بوابة دخول الإدارة.
 *
 * ملاحظة أمنية صريحة: في وضع التخزين المحلي لا يوجد خادم يتحقق من
 * الهوية، فهذه البوابة تمنع الوصول العَرَضي فقط. الحماية الفعلية تتحقق
 * عند تشغيل Firebase: قواعد Firestore في هذا المجلد تمنع قراءة بيانات
 * الإدارة إلا لحساب مصرّح له، ومسار القياس العام يكتب ولا يقرأ.
 */
const PASSCODE = (import.meta.env?.VITE_MIRSAD_ADMIN_PASSCODE ?? '').trim()

function hasSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === 'granted'
  } catch {
    return false
  }
}

export function AdminGate({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useState(hasSession)
  const [entry, setEntry] = useState('')
  const [error, setError] = useState('')

  if (granted) return <>{children}</>

  // لم يُضبط رمز دخول: نطلب تأكيدًا صريحًا بدل ادّعاء حماية غير موجودة
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
    <div className="app">
      <BrandHeader compact />
      <main className="gate">
        <form className="gate__card" onSubmit={submit}>
          <h2 className="gate__heading">دخول الإدارة</h2>
          {PASSCODE ? (
            <>
              <label className="field__label" htmlFor="admin-passcode">
                رمز الدخول
              </label>
              <input
                id="admin-passcode"
                className="input"
                type="password"
                value={entry}
                onChange={(e) => {
                  setEntry(e.target.value)
                  setError('')
                }}
                autoComplete="current-password"
              />
              {error && <p className="field__error">{error}</p>}
            </>
          ) : (
            <p className="gate__note">
              لم يُضبط رمز دخول للإدارة. اضبطي <code>VITE_MIRSAD_ADMIN_PASSCODE</code> في ملف
              <code> .env</code> لتفعيل البوابة، وفعّلي Firebase لتطبيق الحماية على مستوى قاعدة
              البيانات لا الواجهة وحدها.
            </p>
          )}
          <button type="submit" className="button button--primary button--block">
            دخول
          </button>
        </form>
      </main>
      <BrandFooter />
    </div>
  )
}
