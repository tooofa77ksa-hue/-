/**
 * اختبار التطابق النهائي.
 *
 * يتحقق أن الرقم نفسه يظهر في كل طبقة:
 *   قاعدة البيانات = اللوحة = صفوف Excel = صفوف التقرير المطبوع
 * أي اختلاف يُعدّ خطأً يمنع اعتبار النظام جاهزًا.
 */
import { describe, expect, it } from 'vitest'

import { initialState } from '../data/store'
import { submitResponse } from '../domain/actions'
import {
  SCHOOL_SCOPE, analyzeAllQuestions, nonRespondents, overallDistribution,
  participation, responsesInScope, satisfactionIndex, studentsInScope,
  suggestionsInScope, type Scope,
} from '../lib/analysis'
import { nonParticipants } from '../lib/attendance'
import {
  nonRespondentRows, overallRows, questionRows, studentRows,
  suggestionRows, summaryRows,
} from '../lib/reportRows'

const state = initialState()

const SCOPES: { name: string; scope: Scope }[] = [
  { name: 'المدرسة كاملة', scope: SCHOOL_SCOPE },
  { name: 'الصف السادس', scope: { gradeId: 'g6' } },
  { name: 'الصف الثالث', scope: { gradeId: 'g3' } },
  { name: 'السادس فصل ١', scope: { classId: 'g6-c1' } },
  { name: 'السادس فصل ٢', scope: { classId: 'g6-c2' } },
  { name: 'الثالث فصل ١', scope: { classId: 'g3-c1' } },
]


/**
 * قراءة بند من الملخّص بعنوانه لا بموضعه.
 *
 * كانت الفحوص تقرأ «summaryRows[2]»، فلمّا أُضيف بند إلى الملخّص
 * انزاحت المواضع وسقطت فحوصٌ لا علاقة لها بالتغيير.
 */
function summaryValue(rows: { label: string; value: string | number }[], label: string) {
  const row = rows.find((r) => r.label === label)
  if (!row) throw new Error(`لا يوجد بند «${label}» في الملخّص`)
  return row.value
}

describe('التطابق بين قاعدة البيانات واللوحة والتصدير', () => {
  for (const { name, scope } of SCOPES) {
    describe(name, () => {
      it('عدد الطالبات واحد في الثلاثة', () => {
        const db = state.students.filter((s) => {
          if (s.status !== 'active') return false
          if (scope.classId) return s.classId === scope.classId
          if (scope.gradeId) return s.gradeId === scope.gradeId
          return true
        }).length

        expect(studentsInScope(state, scope)).toHaveLength(db)
        expect(participation(state, scope).totalStudents).toBe(db)
        expect(studentRows(state, scope)).toHaveLength(db)
        expect(Number(summaryValue(summaryRows(state, scope), 'إجمالي الطالبات'))).toBe(db)
      })

      it('المستجيبات + غير المستجيبات = إجمالي الطالبات', () => {
        const p = participation(state, scope)
        expect(p.confirmedRespondents + p.nonRespondents).toBe(p.totalStudents)
        const rows = summaryRows(state, scope)
        expect(Number(summaryValue(rows, 'المستجيبات المؤكّدات'))
             + Number(summaryValue(rows, 'بلا استجابة مؤكّدة'))).toBe(p.totalStudents)
      })

      it('كشف من لم تشارك في اللوحة وExcel متطابق اسمًا وعددًا', () => {
        const dash = nonParticipants(state, scope)
        const excel = nonRespondentRows(state, scope)
        expect(excel).toHaveLength(dash.length)
        expect(excel.map((r) => r.name)).toEqual(dash.map((s) => s.name))
        expect(Number(summaryValue(summaryRows(state, scope), 'لم تشارك إطلاقًا'))).toBe(dash.length)
      })

      it('ومن لم تشارك أقلّ ممن بلا استجابة مؤكّدة — والفرق منتظِرو التأكيد', () => {
        const p = participation(state, scope)
        expect(nonParticipants(state, scope).length).toBeLessThanOrEqual(p.nonRespondents)
      })

      it('عدد المستجيبات يطابق الطالبات ذوات الاستجابة المرتبطة', () => {
        const linked = new Set(
          responsesInScope(state, scope).filter((r) => r.studentId).map((r) => r.studentId),
        )
        const p = participation(state, scope)
        expect(p.confirmedRespondents).toBe(linked.size)
        expect(studentRows(state, scope).filter((r) => r.responded === 'نعم')).toHaveLength(linked.size)
      })

      it('أرقام كل سؤال متطابقة بين اللوحة وExcel', () => {
        const dash = analyzeAllQuestions(state, scope)
        const excel = questionRows(state, scope)
        expect(excel).toHaveLength(dash.length)
        dash.forEach((d, i) => {
          expect(excel[i].order).toBe(d.question.order)
          expect(excel[i].n).toBe(d.n)
          expect(excel[i].missing).toBe(d.missing)
          expect(excel[i].counts).toEqual(d.counts.map((c) => c.count))
          expect(excel[i].counts.reduce((s, c) => s + c, 0)).toBe(d.n)
        })
      })

      it('التقويم العام متطابق بين اللوحة وExcel', () => {
        const dash = overallDistribution(state, scope)
        const excel = overallRows(state, scope)
        expect(excel).toHaveLength(dash.rows.length)
        expect(excel.map((r) => r.count)).toEqual(dash.rows.map((r) => r.count))
        expect(excel.reduce((s, r) => s + r.count, 0)).toBe(dash.n)
      })

      it('عدد الآراء متطابق بين اللوحة وExcel', () => {
        expect(suggestionRows(state, scope)).toHaveLength(suggestionsInScope(state, scope).length)
      })

      it('الاستجابات المستلمة في الملخّص تطابق ما ينسبه النطاق', () => {
        expect(Number(summaryValue(summaryRows(state, scope), 'الاستجابات المستلمة')))
          .toBe(responsesInScope(state, scope).length)
      })

      it('المؤشر في الملخّص يطابق حساب اللوحة', () => {
        const idx = satisfactionIndex(state, scope)
        const value = summaryValue(summaryRows(state, scope), 'مؤشر الاتجاه')
        expect(value).toBe(idx.mean === null ? '—' : idx.mean.toFixed(2))
      })
    })
  }
})

describe('التطابق بعد تسجيل استجابة جديدة', () => {
  it('يبقى الحساب متّسقًا في كل الطبقات', () => {
    const scope: Scope = { classId: 'g6-c2' }
    const target = nonRespondents(state, scope)[0]

    const { state: next } = submitResponse(state, {
      studentId: target.id,
      cycleId: 'cy-1448',
      answers: state.questions
        .filter((q) => q.kind === 'likert')
        .map((q) => ({ questionId: q.id, optionId: 'agree_somewhat', rawValue: 'أوافق إلى حد ما', score: 2 })),
    })

    const p = participation(next, scope)
    expect(p.confirmedRespondents + p.nonRespondents).toBe(p.totalStudents)
    expect(nonRespondentRows(next, scope)).toHaveLength(nonParticipants(next, scope).length)
    expect(Number(summaryValue(summaryRows(next, scope), 'المستجيبات المؤكّدات')))
      .toBe(p.confirmedRespondents)
    expect(studentRows(next, scope).filter((r) => r.responded === 'نعم')).toHaveLength(p.confirmedRespondents)

    // ترتفع قاعدة الحساب لكل سؤال بمقدار الاستجابة الواحدة
    const before = analyzeAllQuestions(state, scope)
    const after = analyzeAllQuestions(next, scope)
    after.forEach((a, i) => expect(a.n).toBe(before[i].n + 1))
  })
})

describe('حفظ مجاميع المدرسة', () => {
  it('مجموع طالبات الفصول = طالبات الصفوف = طالبات المدرسة', () => {
    const byClass = state.classes.reduce(
      (sum, c) => sum + studentsInScope(state, { classId: c.id }).length, 0,
    )
    const byGrade = state.grades.reduce(
      (sum, g) => sum + studentsInScope(state, { gradeId: g.id }).length, 0,
    )
    expect(byClass).toBe(byGrade)
    expect(byGrade).toBe(studentsInScope(state, SCHOOL_SCOPE).length)
  })

  it('مجموع استجابات الصفوف = استجابات المدرسة', () => {
    const byGrade = state.grades.reduce(
      (sum, g) => sum + responsesInScope(state, { gradeId: g.id }).length, 0,
    )
    expect(byGrade).toBe(responsesInScope(state, SCHOOL_SCOPE).length)
  })

  it('مجموع إجابات سؤال عبر الصفوف = إجاباته على مستوى المدرسة', () => {
    const school = analyzeAllQuestions(state, SCHOOL_SCOPE)
    for (const q of school) {
      const sum = state.grades.reduce((acc, g) => {
        const a = analyzeAllQuestions(state, { gradeId: g.id }).find(
          (x) => x.question.id === q.question.id,
        )
        return acc + (a?.n ?? 0)
      }, 0)
      expect(sum).toBe(q.n)
    }
  })
})
