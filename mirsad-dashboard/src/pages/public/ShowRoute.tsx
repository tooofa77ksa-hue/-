import { useEffect, useState } from 'react'

import { DisplayPage } from '../admin/DisplayPage'
import { initialState } from '../../data/store'
import { ANONYMOUS } from '../../firebase/auth'
import { SystemContext, type SystemContextValue } from '../../state/SystemContext'
import type { SystemState } from '../../domain/types'

/**
 * لوحة العرض مفتوحةً بلا تسجيل دخول.
 *
 * اللوحة تُعرض على شاشةٍ في المدرسة وعلى جوّال من يمرّ بها، ومطالبةُ
 * من يعرضها بكلمة المرور في كل مرة تُعطّل الغرض منها: الشاشة تُفتح
 * وتُترك، ولا يقف أحدٌ عندها يُدخل حسابًا.
 *
 * وهي لا تقرأ قاعدة البيانات: قواعد الأمان تمنع قراءة أسماء الطالبات
 * لمن لا يحمل صلاحية الإدارة، وهي تمنع ذلك بحقّ. فتقرأ لقطةً منشورة
 * لا اسمَ فيها — لا للطالبات ولا لأسرهنّ — تكتبها المدرسة بأمرٍ صريح
 * من جهازها، وفيها ما تعرضه اللوحة وحده: مؤشّرات وأعداد وبنود تحسين
 * وأصوات بلا نسبة.
 *
 * فالمعروض واحدٌ في الحالين، والمحجوب محجوبٌ في الحالين.
 */
export function ShowRoute() {
  const [state, setState] = useState<SystemState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const res = await fetch('/data/show.json', { cache: 'no-cache' })
        if (!res.ok) throw new Error('not found')
        const snapshot = (await res.json()) as SystemState
        if (alive) setState({ ...initialState(), ...snapshot })
      } catch {
        if (alive) setError('لم تُنشر لوحة العرض بعد.')
      }
    })()
    return () => { alive = false }
  }, [])

  if (error) {
    return (
      <div className="app app--survey">
        <main className="survey">
          <h1 className="survey__q">{error}</h1>
          <p className="survey__lead">تُنشر من جهاز المدرسة، ثم تُفتح من أي شاشة بلا دخول.</p>
        </main>
      </div>
    )
  }

  if (!state) return <p className="loading" role="status">جارٍ التحميل…</p>

  /**
   * سياقٌ للقراءة فقط: اللوحة لا تكتب شيئًا، وأي محاولة كتابة هنا
   * خطأٌ برمجي يُرمى في وجه من كتبه لا يُبتلع صامتًا.
   */
  const readOnly: SystemContextValue = {
    state,
    apply: () => { throw new Error('لوحة العرض المنشورة للقراءة فقط') },
    replace: () => { throw new Error('لوحة العرض المنشورة للقراءة فقط') },
    mode: 'remote',
    status: 'ready',
    identity: ANONYMOUS,
    saving: 0,
    syncError: null,
    reload: async () => {},
    seedRemote: async () => 0,
  }

  return (
    <SystemContext.Provider value={readOnly}>
      <DisplayPage published />
    </SystemContext.Provider>
  )
}
