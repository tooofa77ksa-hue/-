import { useState } from 'react'

import { signOutCurrent } from '../../firebase/auth'
import { num } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

/**
 * حالة التخزين، والرفع الأوّلي إلى قاعدة البيانات.
 *
 * الرفع لا يحدث تلقائيًا أبدًا: تراه الإدارة مفصّلًا بالأعداد، ثم
 * تؤكّده بنفسها. وبعد الرفع لا يظهر الزر ثانية، فلا يُعاد رفع بيانات
 * قديمة فوق بيانات حيّة بالخطأ.
 */
export function DatabasePanel() {
  const { state, mode, status, identity, saving, syncError, reload, seedRemote } = useSystem()
  const [asking, setAsking] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const counts = {
    students: state.students.length,
    responses: state.responses.length,
    answers: state.answers.length,
    suggestions: state.suggestions.length,
    questions: state.questions.length,
    classes: state.classes.length,
  }

  async function upload() {
    setAsking(false)
    setError(null)
    try {
      const written = await seedRemote(state)
      setResult(`رُفع ${num(written)} مستندًا إلى قاعدة البيانات.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <section className="panel panel--pad">
      <h3 className="sub-label">قاعدة البيانات</h3>

      <dl className="action__grid">
        <div>
          <dt>مكان الحفظ</dt>
          <dd>{mode === 'remote' ? 'قاعدة بيانات Firestore' : 'هذا المتصفّح وحده (localStorage)'}</dd>
        </div>
        <div>
          <dt>الحالة</dt>
          <dd>
            {status === 'ready' && 'متصلة والبيانات محمّلة'}
            {status === 'empty' && 'متصلة وفارغة — تنتظر الرفع الأوّلي'}
            {status === 'loading' && 'جارٍ القراءة…'}
            {status === 'denied' && 'الحساب الحالي بلا صلاحية إدارة'}
            {status === 'error' && 'تعذّرت القراءة'}
          </dd>
        </div>
        {mode === 'remote' && (
          <div>
            <dt>الحساب</dt>
            <dd dir="ltr" style={{ textAlign: 'start' }}>{identity.email ?? '—'}</dd>
          </div>
        )}
        <div>
          <dt>عمليات حفظ جارية</dt>
          <dd>{num(saving)}</dd>
        </div>
      </dl>

      {mode === 'local' && (
        <p className="basis-note">
          التخزين المحلي لا يصلح مصدرًا دائمًا بعد النشر: يضيع بمسح بيانات المتصفّح، ولا يُقرأ من
          جهاز آخر، ولا تحكمه صلاحيات. لتفعيل قاعدة البيانات، اضبطي متغيّرات{' '}
          <code>VITE_MIRSAD_FIREBASE_*</code> ثم أعيدي بناء النسخة.
        </p>
      )}

      {syncError && <p className="field__error">{syncError}</p>}
      {error && <p className="field__error">{error}</p>}
      {result && <p className="basis-note"><strong>{result}</strong></p>}

      {mode === 'remote' && status === 'empty' && !asking && (
        <>
          <p className="basis-note">
            قاعدة البيانات فارغة. الرفع يكتب البيانات المستوردة الحالية فيها مرة واحدة، ولا يحذف
            شيئًا ولا يدمج اسمين.
          </p>
          <button type="button" className="button button--primary" onClick={() => setAsking(true)}>
            رفع البيانات إلى قاعدة البيانات
          </button>
        </>
      )}

      {asking && (
        <div className="panel panel--pad">
          <p>سيُرفع إلى قاعدة البيانات:</p>
          <ul className="sources">
            <li>{num(counts.students)} طالبة</li>
            <li>{num(counts.responses)} استجابة تحمل {num(counts.answers)} إجابة</li>
            <li>{num(counts.suggestions)} رأيًا</li>
            <li>{num(counts.questions)} سؤالًا و{num(counts.classes)} فصلًا</li>
          </ul>
          <div className="table__actions">
            <button type="button" className="button button--primary" onClick={() => void upload()}>
              نعم، ارفعي البيانات
            </button>
            <button type="button" className="button button--ghost" onClick={() => setAsking(false)}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {mode === 'remote' && (
        <div className="table__actions">
          <button type="button" className="button button--ghost" onClick={() => void reload()}>
            إعادة القراءة من قاعدة البيانات
          </button>
          <button type="button" className="button button--ghost" onClick={() => void signOutCurrent()}>
            تسجيل الخروج
          </button>
        </div>
      )}
    </section>
  )
}
