import { useMemo, useState } from 'react'

import { EmptyState } from '../../components/EmptyState'
import { SectionTitle } from '../../components/SectionTitle'
import { StatCard } from '../../components/StatCard'
import {
  addStudent, archiveStudent, deleteStudent, restoreStudent, updateStudent, type StudentDraft,
} from '../../domain/actions'
import type { Student } from '../../domain/types'
import { normalizeArabic } from '../../lib/arabic'
import { exportStudents } from '../../lib/excel'
import { num } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

export function StudentsPage() {
  const { state, replace } = useSystem()
  const [gradeId, setGradeId] = useState('all')
  const [classId, setClassId] = useState('all')
  const [status, setStatus] = useState<'active' | 'archived' | 'all'>('active')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Student | null>(null)
  const [creating, setCreating] = useState(false)

  const gradeById = new Map(state.grades.map((g) => [g.id, g]))
  const classById = new Map(state.classes.map((c) => [c.id, c]))
  const respondents = useMemo(
    () => new Set(state.responses.filter((r) => r.studentId).map((r) => r.studentId as string)),
    [state.responses],
  )

  const rows = useMemo(() => {
    const needle = normalizeArabic(search)
    return state.students
      .filter((s) => status === 'all' || s.status === status)
      .filter((s) => gradeId === 'all' || s.gradeId === gradeId)
      .filter((s) => classId === 'all' || s.classId === classId)
      .filter((s) => !needle || normalizeArabic(s.name).includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  }, [state.students, status, gradeId, classId, search])

  const classes = state.classes.filter((c) => gradeId === 'all' || c.gradeId === gradeId)

  return (
    <>
      <SectionTitle note="الأرشفة بدل الحذف — لا تُحذف طالبة ولا تُفقد استجاباتها">
        إدارة الطالبات
      </SectionTitle>

      <section className="stats">
        <StatCard tone="blue" label="الطالبات النشطات"
          value={num(state.students.filter((s) => s.status === 'active').length)} />
        <StatCard tone="green" label="لهنّ استجابة مؤكّدة"
          value={num(state.students.filter((s) => respondents.has(s.id)).length)} />
        <StatCard tone="sand" label="المؤرشفات"
          value={num(state.students.filter((s) => s.status === 'archived').length)} />
        <StatCard tone="purple" label="مُضافات يدويًا"
          value={num(state.students.filter((s) => s.source === 'manual').length)} />
      </section>

      <section className="toolbar no-print">
        <div className="field field--grow">
          <label className="field__label" htmlFor="s-search">بحث</label>
          <input id="s-search" type="search" className="input" value={search}
            onChange={(e) => setSearch(e.target.value)} placeholder="اسم الطالبة…" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="s-grade">الصف</label>
          <select id="s-grade" className="input" value={gradeId}
            onChange={(e) => { setGradeId(e.target.value); setClassId('all') }}>
            <option value="all">الكل</option>
            {state.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="s-class">الفصل</label>
          <select id="s-class" className="input" value={classId}
            onChange={(e) => setClassId(e.target.value)} disabled={gradeId === 'all'}>
            <option value="all">الكل</option>
            {classes.map((c) => <option key={c.id} value={c.id}>فصل {c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="s-status">الحالة</label>
          <select id="s-status" className="input" value={status}
            onChange={(e) => setStatus(e.target.value as never)}>
            <option value="active">النشطات</option>
            <option value="archived">المؤرشفات</option>
            <option value="all">الكل</option>
          </select>
        </div>
        <button type="button" className="button button--primary" onClick={() => setCreating(true)}>
          إضافة طالبة
        </button>
        <button type="button" className="button button--small"
          onClick={() => exportStudents(state, gradeId === 'all' ? {} : { gradeId })}>
          تصدير Excel
        </button>
        <p className="toolbar__count">{num(rows.length)} طالبة</p>
      </section>

      <section className="panel">
        {rows.length === 0 ? <EmptyState title="لا توجد طالبات مطابقات" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">اسم الطالبة</th>
                  <th scope="col">الصف</th>
                  <th scope="col">الفصل</th>
                  <th scope="col" className="table__num">رقم الكشف</th>
                  <th scope="col">المصدر</th>
                  <th scope="col">استجابت</th>
                  <th scope="col">الحالة</th>
                  <th scope="col"><span className="sr-only">إجراءات</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((s) => (
                  <tr key={s.id}>
                    <td><span className="table__title">{s.name}</span></td>
                    <td>{gradeById.get(s.gradeId)?.name ?? '—'}</td>
                    <td>{s.classId ? `فصل ${classById.get(s.classId)?.name}` : '—'}</td>
                    <td className="table__num">{s.rosterNo ? num(s.rosterNo) : '—'}</td>
                    <td><span className="chip">{s.source === 'roster' ? 'كشف رسمي' : 'إضافة يدوية'}</span></td>
                    <td>{respondents.has(s.id)
                      ? <span className="status status--active">نعم</span>
                      : <span className="status status--archived">لا</span>}</td>
                    <td>{s.status === 'active'
                      ? <span className="status status--active">نشطة</span>
                      : <span className="status status--pending">مؤرشفة</span>}</td>
                    <td>
                      <div className="table__actions no-print">
                        <button type="button" className="button button--small"
                          onClick={() => setEditing(s)}>تعديل</button>
                        <button type="button" className="button button--small button--danger"
                          onClick={() => {
                            const linked = state.responses.filter((r) => r.studentId === s.id).length
                            const warn = linked > 0 ? `\n\nومعها ${linked} استجابة ستُحذف كذلك.` : ''
                            if (window.confirm(`حذف «${s.name}» نهائيًا؟${warn}\n\nالحذف لا يُتراجَع عنه. للطالبة المنقولة الأرشفة أصحّ.`)) {
                              replace(deleteStudent(state, s.id))
                            }
                          }}>حذف</button>
                        {s.status === 'active' ? (
                          <button type="button" className="button button--small button--danger"
                            onClick={() => replace(archiveStudent(state, s.id))}>أرشفة</button>
                        ) : (
                          <button type="button" className="button button--small"
                            onClick={() => replace(restoreStudent(state, s.id))}>استعادة</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 200 && <p className="muted">يُعرض أول ٢٠٠ سجل. ضيّقي البحث لعرض البقية.</p>}
      </section>

      {(creating || editing) && (
        <StudentForm
          student={editing}
          onCancel={() => { setCreating(false); setEditing(null) }}
          onSave={(draft) => {
            replace(editing ? updateStudent(state, editing.id, draft) : addStudent(state, draft))
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

interface StudentFormProps {
  student: Student | null
  onSave: (draft: StudentDraft) => void
  onCancel: () => void
}

function StudentForm({ student, onSave, onCancel }: StudentFormProps) {
  const { state } = useSystem()
  const [name, setName] = useState(student?.name ?? '')
  const [gradeId, setGradeId] = useState(student?.gradeId ?? state.grades[0]?.id ?? '')
  const [classId, setClassId] = useState(student?.classId ?? '')
  const [touched, setTouched] = useState(false)

  const classes = state.classes.filter((c) => c.gradeId === gradeId)
  const invalid = !name.trim()

  return (
    <div className="overlay" role="presentation" onMouseDown={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="student-form-heading"
        onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal__heading" id="student-form-heading">
          {student ? 'تعديل بيانات الطالبة' : 'إضافة طالبة'}
        </h2>
        <form className="form" onSubmit={(e) => {
          e.preventDefault(); setTouched(true)
          if (!invalid) onSave({ name, gradeId, classId: classId || null })
        }} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="sf-name">اسم الطالبة *</label>
            <input id="sf-name" className="input" value={name}
              onChange={(e) => setName(e.target.value)} aria-invalid={touched && invalid} />
            {touched && invalid && <p className="field__error">الاسم مطلوب</p>}
          </div>
          <div className="form__row">
            <div className="field">
              <label className="field__label" htmlFor="sf-grade">الصف</label>
              <select id="sf-grade" className="input" value={gradeId}
                onChange={(e) => { setGradeId(e.target.value); setClassId('') }}>
                {state.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="sf-class">الفصل</label>
              <select id="sf-class" className="input" value={classId}
                onChange={(e) => setClassId(e.target.value)}>
                <option value="">بلا فصل</option>
                {classes.map((c) => <option key={c.id} value={c.id}>فصل {c.name}</option>)}
              </select>
            </div>
          </div>
          {student && student.classId !== (classId || null) && (
            <p className="basis-note">
              سيُنقل ارتباط الطالبة إلى الفصل الجديد مع الحفاظ على استجاباتها وتاريخها.
            </p>
          )}
          <div className="modal__actions">
            <button type="button" className="button button--ghost" onClick={onCancel}>إلغاء</button>
            <button type="submit" className="button button--primary">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  )
}
