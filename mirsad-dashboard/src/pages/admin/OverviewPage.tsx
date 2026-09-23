import { Link } from 'react-router-dom'

import { Legend } from '../../components/Legend'
import { BarRow } from '../../components/BarRow'
import { GradeStrip } from '../../components/GradeStrip'
import { NoDataNotice } from '../../components/NoDataNotice'
import { RankedList } from '../../components/RankedList'
import { ReverseNote } from '../../components/ReverseNote'
import { SectionTitle } from '../../components/SectionTitle'
import { IndexGauge } from '../../components/IndexGauge'
import { StackedBar } from '../../components/StackedBar'
import { OPTION_TONES } from '../../lib/tones'
import {
  SCHOOL_SCOPE, overallDistribution, participation, satisfactionIndex,
  strengthsAndGaps, suggestionsInScope,
} from '../../lib/analysis'
import { avg, num, pct, arabicDigits } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

export function OverviewPage() {
  const { state } = useSystem()

  const part = participation(state, SCHOOL_SCOPE)
  const index = satisfactionIndex(state, SCHOOL_SCOPE)
  const overall = overallDistribution(state, SCHOOL_SCOPE)
  const { strengths, gaps } = strengthsAndGaps(state, SCHOOL_SCOPE, 5)
  const voices = suggestionsInScope(state, SCHOOL_SCOPE)
  const actions = state.improvementActions
  const done = actions.filter((a) => a.status === 'completed').length

  // يُحسب مرة واحدة ويُستعمل في المسطرة وفي الجدول معًا
  const readings = state.grades.map((g) => {
    const p = participation(state, { gradeId: g.id })
    return {
      grade: g,
      part: p,
      index: satisfactionIndex(state, { gradeId: g.id }),
      classCount: state.classes.filter((c) => c.gradeId === g.id).length,
    }
  })

  return (
    <>
      {state.students.length === 0 && <NoDataNotice />}

      <IndexGauge
        mean={index.mean}
        scaleMin={index.scaleMin}
        scaleMax={index.scaleMax}
        n={index.n}
        responses={part.responsesReceived}
        receivedRate={part.receivedRate}
        year={arabicDigits(state.meta.academicYear)}
        counts={[
          { to: '/admin/students', value: part.totalStudents, label: 'طالبة في الكشوف' },
          { to: '/admin/questions', value: part.responsesReceived, label: 'استجابة واردة' },
          { to: '/admin/voice', value: voices.length, label: 'رأيًا ومقترحًا' },
          {
            to: '/admin/improvement',
            value: done,
            label: actions.length > 0
              ? `من ${num(actions.length)} إجراء تحسين`
              : 'إجراء تحسين مكتمل',
          },
        ]}
      />

      {(part.awaitingReview > 0 || part.withoutRoster > 0) && (
        <div className="alert alert--info no-print">
          <span>
            {part.awaitingReview > 0 && (
              <>
                <strong>{num(part.awaitingReview)}</strong> استجابة بانتظار تأكيد المطابقة.{' '}
              </>
            )}
            {part.withoutRoster > 0 && (
              <>
                <strong>{num(part.withoutRoster)}</strong> استجابة لصفوف لم يُرفع كشفها الرسمي.
              </>
            )}{' '}
            المؤكَّد مطابقتها حتى الآن <strong>{num(part.confirmedRespondents)}</strong> من{' '}
            {num(part.totalStudents)} — {pct(part.rate)}. وهذا رقم المطابقة الإدارية، لا نسبة
            من أجابت: تلك {pct(part.receivedRate)}.
          </span>
          <Link className="button button--small" to="/admin/match-review">
            مركز مراجعة المطابقة
          </Link>
        </div>
      )}

      <GradeStrip
        scaleMin={index.scaleMin}
        scaleMax={index.scaleMax}
        schoolMean={index.mean}
        grades={readings.map((r) => ({
          id: r.grade.id,
          name: r.grade.name,
          mean: r.index.mean,
          rate: r.part.receivedRate,
          students: r.part.totalStudents,
          responses: r.part.responsesReceived,
        }))}
      />

      <div className="spread">
        <section className="panel panel--pad">
          <SectionTitle note={`ن = ${num(overall.n)}`}>التقويم العام للمدرسة</SectionTitle>
          {overall.n === 0 ? (
            <p className="muted">لا توجد بيانات تقويم عام.</p>
          ) : (
            <div className="bars">
              {overall.rows.map((r, i) => (
                <BarRow
                  key={r.value}
                  label={r.value}
                  count={r.count}
                  percent={r.percent}
                  tone={i === 0 ? 'var(--moe-green)' : 'var(--moe-blue)'}
                />
              ))}
            </div>
          )}
          {overall.missing > 0 && (
            <p className="muted">بيانات مفقودة: {num(overall.missing)} استجابة بلا تقويم عام.</p>
          )}
        </section>

        <section className="panel panel--pad">
          <SectionTitle note="حسب المتوسط المصحَّح لاتجاه السؤال">نقاط القوة</SectionTitle>
          <RankedList rows={strengths} />
        </section>
      </div>

      <section className="panel panel--pad">
        <SectionTitle note="أدنى المتوسطات المصحَّحة — أولى بالتحسين">فرص التحسين</SectionTitle>
        <Legend items={state.options.map((o) => ({ label: o.label, tone: OPTION_TONES[o.id] }))} />
        <ReverseNote />
        <div className="qlist qlist--wide">
          {gaps.map((g) => (
            <article key={g.question.id} className="qlist__item">
              <header className="qlist__head">
                <span className="qlist__text">{g.question.text}</span>
                <span className="qlist__meta">
                  المتوسط {avg(g.adjustedMean as number)} · ن = {num(g.n)}
                  {g.question.direction === 'reverse' && <span className="tag">سؤال عكسي</span>}
                </span>
              </header>
              <StackedBar
                n={g.n}
                segments={g.counts.map((c) => ({
                  label: c.label, count: c.count, percent: c.percent, tone: OPTION_TONES[c.optionId],
                }))}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <SectionTitle note="كل أرقام الصفوف في جدول واحد">تفصيل الصفوف</SectionTitle>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">الصف</th>
                <th scope="col">الفصول</th>
                <th scope="col" className="table__num">الطالبات</th>
                <th scope="col" className="table__num">المستجيبات</th>
                <th scope="col" className="table__num">غير المستجيبات</th>
                <th scope="col" className="table__num">الاستجابات المستلمة</th>
                <th scope="col" className="table__num">نسبة الاستجابة</th>
                <th scope="col" className="table__num">المؤشر</th>
              </tr>
            </thead>
            <tbody>
              {readings.map(({ grade, part: p, index: idx, classCount }) => (
                <tr key={grade.id}>
                  <td>
                    <Link className="link" to={`/admin/grades/${grade.id}`}>{grade.name}</Link>
                  </td>
                  <td>{classCount ? num(classCount) : <span className="muted">لا يوجد كشف</span>}</td>
                  <td className="table__num">{num(p.totalStudents)}</td>
                  <td className="table__num">{num(p.confirmedRespondents)}</td>
                  <td className="table__num">{num(p.nonRespondents)}</td>
                  <td className="table__num">{num(p.responsesReceived)}</td>
                  <td className="table__num">{p.totalStudents ? pct(p.rate) : '—'}</td>
                  <td className="table__num">{idx.mean === null ? '—' : avg(idx.mean)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
