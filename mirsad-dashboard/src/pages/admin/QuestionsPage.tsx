import { useMemo, useState } from 'react'

import { Legend } from '../../components/Legend'
import { ReverseNote } from '../../components/ReverseNote'
import { SectionTitle } from '../../components/SectionTitle'
import { StackedBar } from '../../components/StackedBar'
import { OPTION_TONES } from '../../lib/tones'
import { analyzeAllQuestions, type Scope } from '../../lib/analysis'
import { avg, num, pct } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

export function QuestionsPage() {
  const { state } = useSystem()
  const [gradeId, setGradeId] = useState<string>('all')
  const [classId, setClassId] = useState<string>('all')

  const scope: Scope = useMemo(() => {
    if (classId !== 'all') return { classId }
    if (gradeId !== 'all') return { gradeId }
    return {}
  }, [gradeId, classId])

  const rows = analyzeAllQuestions(state, scope)
  const classes = state.classes.filter((c) => gradeId === 'all' || c.gradeId === gradeId)

  return (
    <>
      <SectionTitle note="النص الأصلي للسؤال كما ورد في ملفات المصدر، بلا أي إعادة صياغة">
        تحليل الأسئلة
      </SectionTitle>

      <section className="toolbar no-print">
        <div className="field">
          <label className="field__label" htmlFor="q-grade">الصف</label>
          <select id="q-grade" className="input" value={gradeId}
            onChange={(e) => { setGradeId(e.target.value); setClassId('all') }}>
            <option value="all">المدرسة كاملة</option>
            {state.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="q-class">الفصل</label>
          <select id="q-class" className="input" value={classId}
            onChange={(e) => setClassId(e.target.value)} disabled={gradeId === 'all'}>
            <option value="all">كل الفصول</option>
            {classes.map((c) => <option key={c.id} value={c.id}>فصل {c.name}</option>)}
          </select>
        </div>
        <p className="toolbar__count">{num(rows.length)} سؤالًا مقيسًا</p>
      </section>

      <Legend items={state.options.map((o) => ({ label: o.label, tone: OPTION_TONES[o.id] }))} />
      <ReverseNote />

      <section className="panel">
        <div className="table-wrap">
          <table className="table table--dense">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">نص السؤال</th>
                {state.options.map((o) => (
                  <th key={o.id} scope="col" className="table__num">{o.label}</th>
                ))}
                <th scope="col" className="table__num">ن</th>
                <th scope="col" className="table__num">مفقود</th>
                <th scope="col" className="table__num">المتوسط المصحَّح</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.question.id}>
                  <td className="table__num">{num(r.question.order)}</td>
                  <td>
                    <span className="table__title">{r.question.text}</span>
                    {r.question.direction === 'reverse' && (
                      <span className="table__notes">سؤال عكسي — {r.question.reverseNote}</span>
                    )}
                  </td>
                  {r.counts.map((c) => (
                    <td key={c.optionId} className="table__num">
                      {num(c.count)} <span className="muted">({pct(c.percent, 0)})</span>
                    </td>
                  ))}
                  <td className="table__num">{num(r.n)}</td>
                  <td className="table__num">{r.missing ? num(r.missing) : '—'}</td>
                  <td className="table__num">{r.adjustedMean === null ? '—' : avg(r.adjustedMean)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--pad">
        <SectionTitle>توزيع الإجابات لكل سؤال</SectionTitle>
        <div className="qlist">
          {rows.map((r) => (
            <article key={r.question.id} className="qlist__item">
              <header className="qlist__head">
                <span className="qlist__text">{num(r.question.order)}. {r.question.text}</span>
                <span className="qlist__meta">ن = {num(r.n)}</span>
              </header>
              <StackedBar n={r.n} segments={r.counts.map((c) => ({
                label: c.label, count: c.count, percent: c.percent, tone: OPTION_TONES[c.optionId],
              }))} />
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
