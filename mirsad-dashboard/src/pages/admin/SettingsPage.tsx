import { useState } from 'react'

import { SectionTitle } from '../../components/SectionTitle'
import { exportBackup, resetToSource } from '../../data/store'
import { saveBlob } from '../../lib/excel'
import { dateTime, num } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

export function SettingsPage() {
  const { state, replace } = useSystem()
  const [confirming, setConfirming] = useState(false)

  function downloadBackup() {
    const blob = new Blob([exportBackup(state)], { type: 'application/json' })
    saveBlob(blob, `backup-${state.meta.hijriYear}-${new Date().toISOString().slice(0, 10)}.json`)
  }

  return (
    <>
      <SectionTitle>الإعدادات وسجل العمليات</SectionTitle>

      <section className="panel panel--pad">
        <h3 className="sub-label">بيانات القياس</h3>
        <dl className="action__grid">
          <div><dt>المدرسة</dt><dd>{state.meta.school}</dd></div>
          <div><dt>الجهة</dt><dd>{state.meta.directorate}</dd></div>
          <div><dt>القياس</dt><dd>{state.meta.surveyTitle} {state.meta.hijriYear}هـ</dd></div>
          <div><dt>العام الدراسي</dt><dd>{state.meta.academicYear}هـ</dd></div>
          <div><dt>المقياس</dt><dd>من {num(state.meta.scale.min)} إلى {num(state.meta.scale.max)}</dd></div>
          <div><dt>تاريخ الاستيراد</dt><dd>{dateTime(state.meta.generatedAt)}</dd></div>
        </dl>
        <h3 className="sub-label">مصادر البيانات</h3>
        <ul className="sources">
          {state.meta.sources.map((s) => <li key={s}><code>{s}</code></li>)}
        </ul>
      </section>

      <section className="panel panel--pad">
        <h3 className="sub-label">النسخ الاحتياطي</h3>
        <p className="basis-note">
          نزّلي نسخة كاملة من حالة النظام قبل أي عملية واسعة. تشمل النسخة الطالبات
          والاستجابات والآراء وإجراءات التحسين وسجل العمليات.
        </p>
        <div className="table__actions">
          <button type="button" className="button button--primary" onClick={downloadBackup}>
            تنزيل نسخة احتياطية
          </button>
          {confirming ? (
            <>
              <span className="chip chip--warn">
                ستُفقد كل تعديلات الإدارة وتعود البيانات إلى ملفات المصدر. متأكدة؟
              </span>
              <button type="button" className="button button--small button--danger"
                onClick={() => { replace(resetToSource()); setConfirming(false) }}>
                نعم، إعادة التعيين
              </button>
              <button type="button" className="button button--small" onClick={() => setConfirming(false)}>
                إلغاء
              </button>
            </>
          ) : (
            <button type="button" className="button button--small button--danger"
              onClick={() => setConfirming(true)}>
              إعادة التعيين إلى بيانات المصدر
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <SectionTitle note={`${num(state.audit.length)} عملية مسجّلة`}>سجل العمليات</SectionTitle>
        </div>
        {state.audit.length === 0 ? (
          <p className="empty__description" style={{ padding: 24 }}>لم تُسجَّل عمليات بعد.</p>
        ) : (
          <div className="table-wrap">
            <table className="table table--dense">
              <thead>
                <tr>
                  <th scope="col">التاريخ والوقت</th>
                  <th scope="col">العملية</th>
                  <th scope="col">الكيان</th>
                  <th scope="col">التفاصيل</th>
                  <th scope="col">المنفّذ</th>
                </tr>
              </thead>
              <tbody>
                {state.audit.slice(0, 200).map((a) => (
                  <tr key={a.id}>
                    <td className="table__muted">{dateTime(a.at)}</td>
                    <td><span className="table__title">{a.operation}</span></td>
                    <td><span className="chip">{a.entity}</span></td>
                    <td>{a.details}</td>
                    <td className="table__muted">{a.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
