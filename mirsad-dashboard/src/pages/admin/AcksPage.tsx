import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '../../components/EmptyState'
import { SectionTitle } from '../../components/SectionTitle'
import { StatCard } from '../../components/StatCard'
import { loadAcks, type Ack } from '../../data/remote/firestoreRepo'
import { num } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

/**
 * إقرارات الاطّلاع — ما عاد من أولياء الأمور بعد كرّاسة التحسين.
 *
 * الكرّاسة تُرسل فتُقرأ ولا يعود منها شيء، فلا تعرف المدرسة أبلغت
 * أم لم تبلغ. وهذه الشاشة هي طرف الطريق الآخر.
 *
 * وعددُ من أقرّوا وحده لا يكفي: الكلمة التي كتبها وليّ الأمر هي
 * الفائدة، وتُعرض هنا بنصّها كما كتبها — لا مختصرةً ولا مصحَّحة.
 *
 * وهي تُقرأ عند فتح الشاشة لا مع بقيّة الحالة: الإقرارات تصل بعد
 * إرسال الكرّاسة وحدها، فلا يُحمَّل ثقلُها على كل فتحةٍ للوحة.
 */
export function AcksPage() {
  const { state } = useSystem()
  const [rows, setRows] = useState<Ack[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const data = await loadAcks()
        if (alive) setRows(data)
      } catch {
        if (alive) setError('تعذّر تحميل الإقرارات. تأكّدي من الاتصال ثم أعيدي المحاولة.')
      }
    })()
    return () => { alive = false }
  }, [])

  const label = useMemo(() => {
    const grade = new Map(state.grades.map((g) => [g.id, g.name]))
    return new Map(state.classes.map((c) => [c.id, `${grade.get(c.gradeId) ?? ''} / ${c.name}`]))
  }, [state.grades, state.classes])

  const words = rows?.filter((r) => r.word?.trim()) ?? []
  const named = rows?.filter((r) => r.name?.trim()) ?? []

  return (
    <>
      <SectionTitle note="ما وصل من أولياء الأمور بعد إرسال كرّاسة «ماذا عملنا برأيكم؟» — رابطها ‎#/seen">
        إقرارات الاطّلاع
      </SectionTitle>

      {error && <p className="survey__error" role="alert">{error}</p>}
      {!rows && !error && <p className="loading" role="status">جارٍ التحميل…</p>}

      {rows && (
        <>
          <section className="stats">
            <StatCard label="إقرارات وصلت" value={num(rows.length)} tone="green" />
            <StatCard label="كلمة كُتبت للمدرسة" value={num(words.length)} tone="cyan" />
            <StatCard label="أفصحوا عن أسمائهم" value={num(named.length)} tone="navy" />
          </section>

          {rows.length === 0 ? (
            <EmptyState
              title="لم يصل إقرارٌ بعد"
              description="أرسلي الكرّاسة ومعها الرابط، وستظهر الإقرارات هنا أولًا بأول."
            />
          ) : (
            <div className="panel">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>الفصل</th>
                      <th>وليّ الأمر</th>
                      <th>كلمته للمدرسة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.submittedAt).toLocaleDateString('ar-SA')}</td>
                        <td>{(r.classId && label.get(r.classId)) || <span className="muted">—</span>}</td>
                        <td>{r.name?.trim() || <span className="muted">بلا اسم</span>}</td>
                        <td>{r.word?.trim() || <span className="muted">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
