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
import { clusterVoices } from './similar'
import type { ImprovementAction, SystemState } from '../domain/types'

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
  const answered = answeredBy(state)

  return suggestionsInScope(state, scope).map((s, i) => {
    const gid = s.gradeId ?? respById.get(s.responseId)?.declaredGradeId ?? null
    return {
      index: i + 1,
      text: s.text,
      grade: gid ? gradeById.get(gid)?.name ?? '' : '',
      className: s.classId ? `فصل ${classById.get(s.classId)?.name}` : '',
      category: s.categoryId ? catById.get(s.categoryId)?.name ?? '' : 'بلا تصنيف',
      status: labels[s.status],
      action: answered.get(s.id)?.action || '',
      owner: answered.get(s.id)?.owner || '',
      evidence: (answered.get(s.id)?.evidence ?? []).map((e) => `${e.label}: ${e.value}`).join(' | '),
    }
  })
}

/** الرأي ← الإجراء المتَّخذ عليه. */
function answeredBy(state: SystemState): Map<string, ImprovementAction> {
  const map = new Map<string, ImprovementAction>()
  for (const action of state.improvementActions) {
    for (const id of action.linkedSuggestionIds) map.set(id, action)
  }
  return map
}

/** عدّ ونسبة — قاعدة كل مؤشرات هذا الملف. */
function tally(entries: [string, number][], total: number) {
  return entries
    .map(([name, count], i) => ({
      index: i + 1, name, count, percent: total ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .map((r, i) => ({ ...r, index: i + 1 }))
}

/** الآراء موزَّعةً على موضوعاتها. */
export function voiceTopicRows(state: SystemState, scope: Scope) {
  const all = suggestionsInScope(state, scope)
  const catById = new Map(state.categories.map((c) => [c.id, c]))
  const counts = new Map<string, number>()
  for (const s of all) {
    const name = s.categoryId ? catById.get(s.categoryId)?.name ?? 'بلا تصنيف' : 'بلا تصنيف'
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return tally([...counts.entries()], all.length)
}

/** الآراء موزَّعةً على حالة معالجتها. */
export function voiceStatusRows(state: SystemState, scope: Scope) {
  const labels = { new: 'جديد', reviewed: 'مُراجَع', linked: 'مرتبط بإجراء', closed: 'مغلق' }
  const all = suggestionsInScope(state, scope)
  const counts = new Map<string, number>()
  for (const key of Object.values(labels)) counts.set(key, 0)
  for (const s of all) counts.set(labels[s.status], (counts.get(labels[s.status]) ?? 0) + 1)
  return tally([...counts.entries()].filter(([, n]) => n > 0), all.length)
}

/** الآراء موزَّعةً على الصفوف — أيّ صفّ تكلّم أكثر. */
export function voiceGradeRows(state: SystemState, scope: Scope) {
  const gradeById = new Map(state.grades.map((g) => [g.id, g]))
  const respById = new Map(state.responses.map((r) => [r.id, r]))
  const all = suggestionsInScope(state, scope)
  const counts = new Map<string, number>()
  for (const g of state.grades) counts.set(g.name, 0)
  for (const s of all) {
    const gid = s.gradeId ?? respById.get(s.responseId)?.declaredGradeId ?? null
    const name = gid ? gradeById.get(gid)?.name ?? 'صف غير محدد' : 'صف غير محدد'
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return tally([...counts.entries()].filter(([, n]) => n > 0), all.length)
}

/**
 * الموضوعات المتكرّرة: كل شكوى تكرّرت، وعدد من قالتها، وجوابها.
 *
 * هذا هو الجدول الذي تسأل عنه الوزارة أولًا: ما أكثر ما قالته
 * الطالبات، وماذا فعلت المدرسة فيه. والعدّ على الآراء لا على
 * الإجراءات، فعشرون رأيًا في موضوع واحد تظهر عشرين لا واحدًا.
 */
export function voiceClusterRows(state: SystemState, scope: Scope) {
  const answered = answeredBy(state)
  const all = suggestionsInScope(state, scope)
  return clusterVoices(all).map((c, i) => {
    const action = c.members.map((m) => answered.get(m.id)).find(Boolean) ?? null
    const covered = c.members.filter((m) => answered.has(m.id)).length
    return {
      index: i + 1,
      topic: c.keywords.join('، ') || c.head.text.slice(0, 40),
      count: c.members.length,
      percent: all.length ? (c.members.length / all.length) * 100 : 0,
      sample: c.head.text,
      covered,
      action: action?.title ?? 'لم يُتَّخذ إجراء بعد',
      owner: action?.owner ?? '',
    }
  })
}
