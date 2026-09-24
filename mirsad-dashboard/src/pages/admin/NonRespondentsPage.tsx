import { useMemo, useState } from 'react'

import { EmptyState } from '../../components/EmptyState'
import { SectionTitle } from '../../components/SectionTitle'
import { StatCard } from '../../components/StatCard'
import { archiveStudent, deleteStudent } from '../../domain/actions'
import { exportNonRespondents } from '../../lib/excel'
import { participation, type Scope } from '../../lib/analysis'
import { attendance, awaitingConfirmation, nonParticipants } from '../../lib/attendance'
import { normalizeArabic } from '../../lib/arabic'
import { num, pct } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

/**
 * كشف من لم تشارك في القياس.
 *
 * القاعدة مكتوبة في الشاشة عمدًا: الكشف يُرفع، ومن يقرؤه يسأل عن
 * أساسه. وهي ليست «بلا استجابة مؤكَّدة» — تلك تعدّ غائبةً كل طالبة
 * تنتظر استجابتُها تأكيد اسمها، وهنّ أكثر المشاركات.
 */
export function NonRespondentsPage() {
  const { state, replace } = useSystem()
  const [gradeId, setGradeId] = useState('all')
  const [classId, setClassId] = useState('all')
  const [search, setSearch] = useState('')

  const scope: Scope = useMemo(() => {
    if (classId !== 'all') return { classId }
    if (gradeId !== 'all') return { gradeId }
    return {}
  }, [gradeId, classId])

  const part = participation(state, scope)
  const pending = awaitingConfirmation(state, scope)
  const missing = useMemo(() => nonParticipants(state, scope), [state, scope])
  const orphans = useMemo(() => attendance(state).orphans, [state])

  const rows = useMemo(() => {
    const needle = normalizeArabic(search)
    return missing.filter((s) => !needle || normalizeArabic(s.name).includes(needle))
  }, [missing, search])

  const classes = state.classes.filter((c) => gradeId === 'all' || c.gradeId === gradeId)
  const classById = new Map(state.classes.map((c) => [c.id, c]))
  const gradeById = new Map(state.grades.map((g) => [g.id, g]))

  function archive(id: string, name: string) {
    if (window.confirm(`أرشفة «${name}»؟\n\nتخرج من كل الأعداد والنسب، ويبقى تاريخها كاملًا، ويمكن إرجاعها من صفحة الطالبات.`)) {
      replace(archiveStudent(state, id))
    }
  }

  function remove(id: string, name: string) {
    const linked = state.responses.filter((r) => r.studentId === id).length
    const warn = linked > 0 ? `\n\nومعها ${linked} استجابة ستُحذف كذلك.` : ''
    if (window.confirm(`حذف «${name}» نهائيًا؟${warn}\n\nالحذف لا يُتراجَع عنه. للطالبة المنقولة أو المتسرّبة الأرشفة أصحّ — هذا لاسمٍ دخل بالخطأ ولا وجود له.`)) {
      replace(deleteStudent(state, id))
    }
  }

  return (
    <>
      <SectionTitle note="طالبة في كشف الفصل لا يقابلها في القياس استجابةٌ مؤكَّدة ولا مرشَّحة ولا باسمٍ يشبه اسمها">
        من لم تشارك في القياس
      </SectionTitle>

      <section className="stats">
        <StatCard tone="blue" label="طالبات الكشف" value={num(part.totalStudents)} />
        <StatCard tone="green" label="لها أثر في القياس"
          value={num(part.totalStudents - missing.length)} />
        <StatCard tone="sand" label="لم تشارك" value={num(missing.length)}
          meta={pct(part.totalStudents ? (missing.length / part.totalStudents) * 100 : 0)} />
        <StatCard tone="purple" label="استجابات تنتظر تأكيد الاسم" value={num(pending)}
          meta="من شاشة مراجعة المطابقة" />
      </section>

      <p className="basis-note">
        هذا الكشف غير «بلا استجابة مؤكَّدة» وعددهن {num(part.nonRespondents)}: أكثرهن شاركن
        وتنتظر استجاباتهن تأكيد الاسم. وهذا الكشف هو من لا أثر لها إطلاقًا.
      </p>

      <section className="toolbar no-print">
        <div className="field field--grow">
          <label className="field__label" htmlFor="nr-search">بحث</label>
          <input id="nr-search" type="search" className="input" value={search}
            placeholder="ابحثي عن اسم…" onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="nr-grade">الصف</label>
          <select id="nr-grade" className="input" value={gradeId}
            onChange={(e) => { setGradeId(e.target.value); setClassId('all') }}>
            <option value="all">كل الصفوف</option>
            {state.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="nr-class">الفصل</label>
          <select id="nr-class" className="input" value={classId}
            onChange={(e) => setClassId(e.target.value)} disabled={gradeId === 'all'}>
            <option value="all">كل الفصول</option>
            {classes.map((c) => <option key={c.id} value={c.id}>فصل {c.name}</option>)}
          </select>
        </div>
        <button type="button" className="button button--small"
          onClick={() => exportNonRespondents(state, scope)}>
          تصدير Excel
        </button>
        <button type="button" className="button button--small" onClick={() => window.print()}>
          طباعة
        </button>
        <p className="toolbar__count">{num(rows.length)} طالبة</p>
      </section>

      <section className="panel">
        {rows.length === 0 ? (
          <EmptyState title="لا توجد طالبة بلا أثر في هذا النطاق" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col" className="table__num">م</th>
                  <th scope="col">اسم الطالبة</th>
                  <th scope="col">الصف</th>
                  <th scope="col">الفصل</th>
                  <th scope="col" className="table__num">رقم الكشف</th>
                  <th scope="col" className="no-print">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={s.id}>
                    <td className="table__num">{num(i + 1)}</td>
                    <td><span className="table__title">{s.name}</span></td>
                    <td>{gradeById.get(s.gradeId)?.name ?? '—'}</td>
                    <td>{s.classId ? `فصل ${classById.get(s.classId)?.name}` : '—'}</td>
                    <td className="table__num">{s.rosterNo ? num(s.rosterNo) : '—'}</td>
                    <td className="no-print">
                      <div className="row-btn">
                        <button type="button" className="button button--small"
                          onClick={() => archive(s.id, s.name)}>أرشفة</button>
                        <button type="button" className="button button--small button--danger"
                          onClick={() => remove(s.id, s.name)}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {orphans.length > 0 && (
        <section className="panel panel--pad">
          <SectionTitle note="وصلت استجابة بهذه الأسماء ولا يقابلها اسم في أي كشف فصل — طالبة جديدة لم تُضَف، أو اسم كُتب بصورة بعيدة">
            أسماء شاركت وليست في كشوف الفصول ({num(orphans.length)})
          </SectionTitle>
          <ul className="gone">
            {orphans.map((r) => (
              <li key={r.id} className="gone__row">
                <p className="gone__text">{r.rawName}</p>
                <p className="gone__why">
                  الصف المعلن: {r.declaredGradeId ? gradeById.get(r.declaredGradeId)?.name ?? '—' : '—'}
                  {' · '}تُضاف من صفحة «الطالبات» أو تُربط من «مراجعة المطابقة»
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
