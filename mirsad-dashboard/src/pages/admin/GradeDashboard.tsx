import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '../../components/EmptyState'
import { ScopeDashboard } from '../../components/ScopeDashboard'
import { SectionTitle } from '../../components/SectionTitle'
import { participation, satisfactionIndex } from '../../lib/analysis'
import { avg, num, pct } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

export function GradeDashboard() {
  const { gradeId } = useParams()
  const { state } = useSystem()
  const grade = state.grades.find((g) => g.id === gradeId)

  if (!grade) return <EmptyState title="الصف غير موجود" />

  const classes = state.classes.filter((c) => c.gradeId === grade.id)

  return (
    <>
      <SectionTitle note={<Link className="link" to="/admin">رجوع إلى النظرة العامة</Link>}>
        {grade.name}
      </SectionTitle>

      <section className="panel">
        <div className="panel__head"><SectionTitle>فصول الصف</SectionTitle></div>
        {classes.length === 0 ? (
          <EmptyState
            title="لم يُرفع كشف رسمي لهذا الصف"
            description="لا يمكن حساب عدد الطالبات ولا غير المستجيبات قبل رفع الكشف."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">الفصل</th>
                  <th scope="col" className="table__num">الطالبات</th>
                  <th scope="col" className="table__num">المستجيبات</th>
                  <th scope="col" className="table__num">غير المستجيبات</th>
                  <th scope="col" className="table__num">نسبة الاستجابة</th>
                  <th scope="col" className="table__num">المؤشر</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => {
                  const p = participation(state, { classId: c.id })
                  const idx = satisfactionIndex(state, { classId: c.id })
                  return (
                    <tr key={c.id}>
                      <td><Link className="link" to={`/admin/classes/${c.id}`}>فصل {c.name}</Link></td>
                      <td className="table__num">{num(p.totalStudents)}</td>
                      <td className="table__num">{num(p.confirmedRespondents)}</td>
                      <td className="table__num">{num(p.nonRespondents)}</td>
                      <td className="table__num">{pct(p.rate)}</td>
                      <td className="table__num">{idx.mean === null ? '—' : avg(idx.mean)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ScopeDashboard
        scope={{ gradeId: grade.id }}
        basisNote="يشمل التحليل كل الاستجابات المنسوبة إلى هذا الصف، مؤكّدة المطابقة أو لا. أما نسبة الاستجابة وغير المستجيبات فتُحسبان على المطابقات المؤكّدة فقط."
      />
    </>
  )
}
