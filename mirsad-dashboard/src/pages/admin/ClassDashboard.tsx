import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '../../components/EmptyState'
import { ScopeDashboard } from '../../components/ScopeDashboard'
import { SectionTitle } from '../../components/SectionTitle'
import { useSystem } from '../../state/useSystem'

export function ClassDashboard() {
  const { classId } = useParams()
  const { state } = useSystem()
  const klass = state.classes.find((c) => c.id === classId)
  const grade = klass ? state.grades.find((g) => g.id === klass.gradeId) : null

  if (!klass || !grade) return <EmptyState title="الفصل غير موجود" />

  return (
    <>
      <SectionTitle>{`${grade.name} — فصل ${klass.name}`}</SectionTitle>
      <p className="basis-note no-print">
        <Link className="link" to={`/admin/grades/${grade.id}`}>رجوع إلى {grade.name}</Link>
      </p>

      <ScopeDashboard
        scope={{ classId: klass.id }}
        basisNote="على مستوى الفصل تُحتسب الاستجابات المرتبطة بطالبات مؤكّدات فقط، لأن الاستجابات غير المؤكّدة لا يُعرف فصلها."
      />
    </>
  )
}
