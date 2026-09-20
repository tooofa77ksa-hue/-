import { useMemo, useState } from 'react'

import { EmptyState } from '../../components/EmptyState'
import { SectionTitle } from '../../components/SectionTitle'
import { exportNonRespondents } from '../../lib/excel'
import { nonRespondents, participation, type Scope } from '../../lib/analysis'
import { normalizeArabic } from '../../lib/arabic'
import { num, pct } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

export function NonRespondentsPage() {
  const { state } = useSystem()
  const [gradeId, setGradeId] = useState('all')
  const [classId, setClassId] = useState('all')
  const [search, setSearch] = useState('')

  const scope: Scope = useMemo(() => {
    if (classId !== 'all') return { classId }
    if (gradeId !== 'all') return { gradeId }
    return {}
  }, [gradeId, classId])

  const part = participation(state, scope)
  const rows = useMemo(() => {
    const needle = normalizeArabic(search)
    return nonRespondents(state, scope).filter(
      (s) => !needle || normalizeArabic(s.name).includes(needle),
    )
  }, [state, scope, search])

  const classes = state.classes.filter((c) => gradeId === 'all' || c.gradeId === gradeId)
  const classById = new Map(state.classes.map((c) => [c.id, c]))
  const gradeById = new Map(state.grades.map((g) => [g.id, g]))

  return (
    <>
      <SectionTitle note="طالبة في الكشف الرسمي بلا استجابة مؤكّدة في هذه الدورة">
        غير المستجيبات
      </SectionTitle>

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
        <p className="toolbar__count">
          {num(rows.length)} من {num(part.totalStudents)} ({pct(100 - part.rate)})
        </p>
      </section>

      <section className="panel">
        {rows.length === 0 ? (
          <EmptyState title="لا توجد طالبات غير مستجيبات في هذا النطاق" />
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
