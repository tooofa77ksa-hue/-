import { useState } from 'react'

import { SectionTitle } from '../../components/SectionTitle'
import {
  exportBackup, inspectBackup, resetToSource, restoreBackup, type BackupFile,
} from '../../data/store'
import { saveBlob } from '../../lib/excel'
import { dateTime, num } from '../../lib/format'
import { useSystem } from '../../state/useSystem'
import { DatabasePanel } from './DatabasePanel'

export function SettingsPage() {
  const { state, replace } = useSystem()
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  /** يقرأ الملف ويفحصه فقط — لا يطبّق شيئًا قبل تأكيد صريح. */
  async function pickBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setRestoreError(null)
    setPending(null)
    const result = inspectBackup(await file.text())
    if (!result.ok || !result.file) {
      setRestoreError(result.error)
      return
    }
    setPending(result.file)
  }

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

      <DatabasePanel />

      <section className="panel panel--pad">
        <h3 className="sub-label">النسخ الاحتياطي والاستعادة</h3>
        <p className="basis-note">
          النسخة تشمل كل شيء: الطالبات والاستجابات والإجابات والآراء وإجراءات
          التحسين وإقرارات المراجعة وسجل العمليات. تحمل بصمة محتوى تُفحص عند
          الاستعادة، فلا يُقبل ملف تالف أو معدَّل.
        </p>

        <dl className="action__grid">
          <div><dt>الطالبات</dt><dd>{num(state.students.length)}</dd></div>
          <div><dt>الاستجابات</dt><dd>{num(state.responses.length)}</dd></div>
          <div><dt>الإجابات</dt><dd>{num(state.answers.length)}</dd></div>
          <div><dt>الآراء</dt><dd>{num(state.suggestions.length)}</dd></div>
          <div><dt>إجراءات التحسين</dt><dd>{num(state.improvementActions.length)}</dd></div>
          <div><dt>حالات روجعت</dt><dd>{num(Object.keys(state.reviewAcks ?? {}).length)}</dd></div>
        </dl>

        <div className="table__actions">
          <button type="button" className="button button--primary" onClick={downloadBackup}>
            تنزيل نسخة احتياطية
          </button>
          <label className="button button--small" style={{ cursor: 'pointer' }}>
            استعادة من ملف…
            <input type="file" accept="application/json,.json" hidden onChange={pickBackup} />
          </label>
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

      {restoreError && (
        <div className="alert alert--error" role="alert">
          <span>تعذّرت الاستعادة: {restoreError}</span>
          <button type="button" className="button button--small" onClick={() => setRestoreError(null)}>
            إغلاق
          </button>
        </div>
      )}

      {pending && (
        <section className="panel panel--pad">
          <h3 className="sub-label">تأكيد الاستعادة</h3>
          <p className="basis-note">
            ستحلّ محتويات هذا الملف محل حالة النظام الحالية بالكامل. راجعي
            الأرقام أدناه وتأكّدي أنه الملف الصحيح قبل المتابعة.
          </p>
          <dl className="action__grid">
            <div><dt>تاريخ النسخة</dt><dd>{dateTime(pending.createdAt)}</dd></div>
            <div><dt>المدرسة</dt><dd>{pending.school}</dd></div>
            <div><dt>القياس</dt><dd>{pending.survey}</dd></div>
            <div><dt>الطالبات</dt><dd>{num(pending.summary.students)}</dd></div>
            <div><dt>الاستجابات</dt><dd>{num(pending.summary.responses)}</dd></div>
            <div><dt>الإجابات</dt><dd>{num(pending.summary.answers)}</dd></div>
            <div><dt>الآراء</dt><dd>{num(pending.summary.suggestions)}</dd></div>
            <div><dt>إجراءات التحسين</dt><dd>{num(pending.summary.improvementActions)}</dd></div>
            <div><dt>حالات روجعت</dt><dd>{num(pending.summary.reviewAcks)}</dd></div>
          </dl>
          <div className="table__actions">
            <button type="button" className="button button--primary"
              onClick={() => { replace(restoreBackup(pending)); setPending(null) }}>
              نعم، استعيدي هذه النسخة
            </button>
            <button type="button" className="button button--small" onClick={() => setPending(null)}>
              إلغاء
            </button>
          </div>
        </section>
      )}

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
