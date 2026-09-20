/**
 * بناء صفوف التقارير — مصدر واحد للأرقام.
 *
 * تستعمله ملفات Excel والتقارير المطبوعة واختبار التطابق النهائي معًا،
 * فيستحيل أن تختلف الأرقام بين قاعدة البيانات واللوحة والتصدير.
 */
import {
  analyzeAllQuestions, nonRespondents, overallDistribution,
  participation, satisfactionIndex, studentsInScope, suggestionsInScope, type Scope,
} from './analysis'
import type { SystemState } from '../domain/types'

export function nonRespondentRows(state: SystemState, scope: Scope) {
  const gradeById = new Map(state.grades.map((g) => [g.id, g]))
  const classById = new Map(state.classes.map((c) => [c.id, c]))
  return nonRespondents(state, scope).map((s, i) => ({
    index: i + 1,
    name: s.name,
    grade: gradeById.get(s.gradeId)?.name ?? '',
    className: s.classId ? `فصل ${classById.get(s.classId)?.name}` : '',
    rosterNo: s.rosterNo ?? '',
  }))
}

export function summaryRows(state: SystemState, scope: Scope) {
  const p = participation(state, scope)
  const idx = satisfactionIndex(state, scope)
  return [
    { label: 'إجمالي الطالبات', value: p.totalStudents, basis: 'الكشوف الرسمية المرفوعة' },
    { label: 'المستجيبات المؤكّدات', value: p.confirmedRespondents, basis: 'استجابة مرتبطة بطالبة مؤكّدة' },
    { label: 'غير المستجيبات', value: p.nonRespondents, basis: 'طالبات الكشف بلا استجابة مؤكّدة' },
    { label: 'نسبة الاستجابة المؤكّدة', value: `${p.rate.toFixed(1)}%`, basis: `من ${p.totalStudents} طالبة` },
    { label: 'الاستجابات المستلمة', value: p.responsesReceived, basis: 'كل الاستجابات المنسوبة للنطاق' },
    { label: 'بانتظار مراجعة المطابقة', value: p.awaitingReview, basis: 'لم تُربط بعد بطالبة' },
    { label: 'استجابات بلا كشف رسمي', value: p.withoutRoster, basis: 'صفوف لم يُرفع كشفها' },
    {
      label: 'مؤشر الاتجاه',
      value: idx.mean === null ? '—' : idx.mean.toFixed(2),
      basis: `مقياس ${idx.scaleMin}–${idx.scaleMax} · ن = ${idx.n}`,
    },
  ]
}

export function questionRows(state: SystemState, scope: Scope) {
  return analyzeAllQuestions(state, scope).map((r) => ({
    order: r.question.order,
    text: r.question.text,
    direction: r.question.direction === 'reverse' ? 'عكسي' : 'إيجابي',
    counts: r.counts.map((c) => c.count),
    percents: r.counts.map((c) => Number(c.percent.toFixed(1))),
    n: r.n,
    missing: r.missing,
    adjustedMean: r.adjustedMean === null ? '' : Number(r.adjustedMean.toFixed(2)),
  }))
}

export function overallRows(state: SystemState, scope: Scope) {
  return overallDistribution(state, scope).rows.map((r) => ({
    value: r.value, count: r.count, percent: Number(r.percent.toFixed(1)),
  }))
}

export function studentRows(state: SystemState, scope: Scope) {
  const gradeById = new Map(state.grades.map((g) => [g.id, g]))
  const classById = new Map(state.classes.map((c) => [c.id, c]))
  const respondents = new Set(
    state.responses.filter((r) => r.studentId).map((r) => r.studentId as string),
  )
  return studentsInScope(state, scope).map((s, i) => ({
    index: i + 1,
    name: s.name,
    grade: gradeById.get(s.gradeId)?.name ?? '',
    className: s.classId ? `فصل ${classById.get(s.classId)?.name}` : '',
    rosterNo: s.rosterNo ?? '',
    status: s.status === 'active' ? 'نشطة' : 'مؤرشفة',
    responded: respondents.has(s.id) ? 'نعم' : 'لا',
  }))
}

export function suggestionRows(state: SystemState, scope: Scope) {
  const gradeById = new Map(state.grades.map((g) => [g.id, g]))
  const classById = new Map(state.classes.map((c) => [c.id, c]))
  const catById = new Map(state.categories.map((c) => [c.id, c]))
  const respById = new Map(state.responses.map((r) => [r.id, r]))
  const labels = { new: 'جديد', reviewed: 'مُراجَع', linked: 'مرتبط بإجراء', closed: 'مغلق' }

  return suggestionsInScope(state, scope).map((s, i) => {
    const gid = s.gradeId ?? respById.get(s.responseId)?.declaredGradeId ?? null
    return {
      index: i + 1,
      text: s.text,
      grade: gid ? gradeById.get(gid)?.name ?? '' : '',
      className: s.classId ? `فصل ${classById.get(s.classId)?.name}` : '',
      category: s.categoryId ? catById.get(s.categoryId)?.name ?? '' : 'بلا تصنيف',
      status: labels[s.status],
    }
  })
}
