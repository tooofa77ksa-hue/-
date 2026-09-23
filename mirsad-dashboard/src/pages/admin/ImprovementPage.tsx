import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { EmptyState } from '../../components/EmptyState'
import { SectionTitle } from '../../components/SectionTitle'
import { StatCard } from '../../components/StatCard'
import { addAction, removeAction, updateAction, type ActionDraft } from '../../domain/actions'
import type { ImprovementAction } from '../../domain/types'
import { exportActions } from '../../lib/excel'
import { dateOnly, num } from '../../lib/format'
import { useSystem } from '../../state/useSystem'

const STATUS = { planned: 'مخطط', in_progress: 'جارٍ التنفيذ', completed: 'مكتمل' } as const
const PRIORITY = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' } as const

const STAGES = [
  'رأي الطالبة', 'القياس', 'التحليل', 'أولوية التحسين',
  'إجراء المدرسة', 'التنفيذ', 'الدليل', 'قياس الأثر',
]

function emptyDraft(): ActionDraft {
  return {
    title: '', problem: '', categoryId: null, sourceNote: 'آراء الطالبات في قياس الاتجاه',
    mentions: 0, priority: 'medium', action: '', owner: '',
    startDate: null, dueDate: null, doneDate: null, status: 'planned',
    notes: '', impact: '', followUp: '', linkedSuggestionIds: [], evidence: [],
  }
}

export function ImprovementPage() {
  const { state, replace } = useSystem()
  const [editing, setEditing] = useState<ImprovementAction | null>(null)
  const [creating, setCreating] = useState(false)
  const [seed, setSeed] = useState<ActionDraft | null>(null)
  const [filter, setFilter] = useState<'all' | keyof typeof STATUS>('all')

  const location = useLocation()
  const navigate = useNavigate()

  /**
   * القدوم من رأي طالبة: يُفتح النموذج ونصّ الرأي في خانة المشكلة،
   * والرأي مربوط بالإجراء من أول لحظة.
   *
   * النص يُنسخ كما كتبته الطالبة ولا يُحرَّر في مصدره: هذه الخانة صورة
   * منه للعمل عليها، والأصل يبقى في «صوت طالباتنا» كما هو.
   */
  const incoming = (location.state as { fromSuggestion?: string } | null)?.fromSuggestion
  useEffect(() => {
    if (!incoming) return
    const voice = state.suggestions.find((x) => x.id === incoming)
    if (voice) {
      const twins = state.suggestions.filter(
        (x) => x.categoryId && x.categoryId === voice.categoryId,
      ).length
      setSeed({
        ...emptyDraft(),
        problem: voice.text,
        categoryId: voice.categoryId,
        mentions: voice.categoryId ? twins : 1,
        linkedSuggestionIds: [voice.id],
      })
      setCreating(true)
    }
    // الحالة تُستهلك مرة واحدة: تحديث الصفحة بعدها لا يعيد فتح النموذج
    navigate('.', { replace: true, state: null })
  }, [incoming, state.suggestions, navigate])

  /** نص كل رأي مربوط بإجراء — شاهد الإجراء بكلام الطالبة نفسه. */
  const voiceOf = useMemo(
    () => new Map(state.suggestions.map((x) => [x.id, x.text])),
    [state.suggestions],
  )

  const rows = useMemo(
    () => state.improvementActions.filter((a) => filter === 'all' || a.status === filter),
    [state.improvementActions, filter],
  )
  const catById = new Map(state.categories.map((c) => [c.id, c]))

  return (
    <>
      <SectionTitle note="من رأي الطالبة إلى أثر ملموس — دورة تحسين كاملة موثّقة">
        من الرأي إلى التحسين
      </SectionTitle>

      <ol className="workflow" aria-label="مسار التحسين">
        {STAGES.map((s, i) => (
          <li key={s} className="workflow__step">
            <span className="workflow__no" aria-hidden="true">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <section className="stats">
        <StatCard tone="blue" label="إجمالي الإجراءات" value={num(state.improvementActions.length)} />
        <StatCard tone="sand" label="جارٍ التنفيذ"
          value={num(state.improvementActions.filter((a) => a.status === 'in_progress').length)} />
        <StatCard tone="green" label="مكتملة"
          value={num(state.improvementActions.filter((a) => a.status === 'completed').length)} />
        <StatCard tone="purple" label="آراء مرتبطة بإجراء"
          value={num(state.suggestions.filter((s) => s.status === 'linked').length)} />
      </section>

      <section className="toolbar no-print">
        <div className="field">
          <label className="field__label" htmlFor="ia-filter">الحالة</label>
          <select id="ia-filter" className="input" value={filter}
            onChange={(e) => setFilter(e.target.value as never)}>
            <option value="all">الكل</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button type="button" className="button button--primary" onClick={() => setCreating(true)}>
          إجراء تحسين جديد
        </button>
        <button type="button" className="button button--small" onClick={() => exportActions(state)}>
          تصدير Excel
        </button>
        <p className="toolbar__count">{num(rows.length)} إجراء</p>
      </section>

      <section className="panel">
        {rows.length === 0 ? (
          <EmptyState
            title="لم تُسجَّل إجراءات تحسين بعد"
            description="ابدئي من «صوت طالباتنا»: اختاري رأيًا متكررًا وسجّلي إجراء المدرسة تجاهه."
            actionLabel="إجراء تحسين جديد"
            onAction={() => setCreating(true)}
          />
        ) : (
          <ul className="action-list">
            {rows.map((a) => (
              <li key={a.id} className="action">
                <div className="action__head">
                  <h3 className="action__title">{a.title}</h3>
                  <span className={`status status--ia-${a.status}`}>{STATUS[a.status]}</span>
                  <span className={`chip chip--p-${a.priority}`}>أولوية {PRIORITY[a.priority]}</span>
                  {a.categoryId && <span className="chip">{catById.get(a.categoryId)?.name}</span>}
                </div>
                <dl className="action__grid">
                  <div><dt>المشكلة / الرأي</dt><dd>{a.problem || '—'}</dd></div>
                  <div><dt>إجراء المدرسة</dt><dd>{a.action || '—'}</dd></div>
                  <div><dt>المسؤول</dt><dd>{a.owner || '—'}</dd></div>
                  <div><dt>التكرار</dt><dd>{num(a.mentions)}</dd></div>
                  <div><dt>البدء</dt><dd>{dateOnly(a.startDate)}</dd></div>
                  <div><dt>الإنجاز المتوقع</dt><dd>{dateOnly(a.dueDate)}</dd></div>
                  <div><dt>الإنجاز الفعلي</dt><dd>{dateOnly(a.doneDate)}</dd></div>
                  <div><dt>الأثر</dt><dd>{a.impact || '—'}</dd></div>
                  <div><dt>المتابعة</dt><dd>{a.followUp || '—'}</dd></div>
                </dl>
                {a.linkedSuggestionIds.length > 0 && (
                  <div className="action__voices">
                    <p className="action__voices-head">
                      بُني على {num(a.linkedSuggestionIds.length)} من آراء الطالبات:
                    </p>
                    <ul>
                      {a.linkedSuggestionIds.map((id) => (
                        <li key={id}>
                          <blockquote>{voiceOf.get(id) ?? 'رأي غير موجود'}</blockquote>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {a.evidence.length > 0 && (
                  <ul className="action__evidence">
                    {a.evidence.map((e) => (
                      <li key={e.id}>
                        <span className="chip">{e.kind === 'link' ? 'رابط' : 'ملاحظة'}</span>
                        {e.kind === 'link'
                          ? <a href={e.value} target="_blank" rel="noreferrer noopener">{e.label}</a>
                          : <span>{e.label}: {e.value}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="table__actions no-print">
                  <button type="button" className="button button--small" onClick={() => setEditing(a)}>تعديل</button>
                  <button type="button" className="button button--small button--danger"
                    onClick={() => replace(removeAction(state, a.id))}>حذف</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(creating || editing) && (
        <ActionForm
          action={editing}
          seed={seed}
          onCancel={() => { setCreating(false); setEditing(null); setSeed(null) }}
          onSave={(draft) => {
            replace(editing ? updateAction(state, editing.id, draft) : addAction(state, draft))
            setCreating(false); setEditing(null); setSeed(null)
          }}
        />
      )}
    </>
  )
}

function ActionForm({ action, seed, onSave, onCancel }: {
  action: ImprovementAction | null
  seed?: ActionDraft | null
  onSave: (d: ActionDraft) => void
  onCancel: () => void
}) {
  const { state } = useSystem()
  const [d, setD] = useState<ActionDraft>(
    () => (action ? { ...action } : seed ? { ...seed } : emptyDraft()),
  )
  const [evidenceLabel, setEvidenceLabel] = useState('')
  const [evidenceValue, setEvidenceValue] = useState('')
  const [touched, setTouched] = useState(false)

  const invalid = !d.title.trim()
  const set = <K extends keyof ActionDraft>(k: K, v: ActionDraft[K]) => setD((p) => ({ ...p, [k]: v }))

  function addEvidence() {
    if (!evidenceLabel.trim() || !evidenceValue.trim()) return
    const isLink = /^https?:\/\//i.test(evidenceValue.trim())
    set('evidence', [
      ...(d.evidence ?? []),
      {
        id: `ev-${Date.now().toString(36)}`,
        kind: isLink ? 'link' : 'note',
        label: evidenceLabel.trim(),
        value: evidenceValue.trim(),
        addedAt: new Date().toISOString(),
      },
    ])
    setEvidenceLabel(''); setEvidenceValue('')
  }

  return (
    <div className="overlay" role="presentation" onMouseDown={onCancel}>
      <div className="modal modal--wide" role="dialog" aria-modal="true"
        aria-labelledby="ia-heading" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal__heading" id="ia-heading">
          {action ? 'تعديل إجراء التحسين' : 'إجراء تحسين جديد'}
        </h2>
        <form className="form" noValidate onSubmit={(e) => {
          e.preventDefault(); setTouched(true); if (!invalid) onSave(d)
        }}>
          <div className="field">
            <label className="field__label" htmlFor="ia-title">العنوان *</label>
            <input id="ia-title" className="input" value={d.title}
              onChange={(e) => set('title', e.target.value)} aria-invalid={touched && invalid} />
            {touched && invalid && <p className="field__error">العنوان مطلوب</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="ia-problem">وصف المشكلة / الرأي</label>
            <textarea id="ia-problem" className="input input--area" rows={2}
              value={d.problem} onChange={(e) => set('problem', e.target.value)} />
          </div>

          <div className="form__row">
            <div className="field">
              <label className="field__label" htmlFor="ia-cat">التصنيف</label>
              <select id="ia-cat" className="input" value={d.categoryId ?? ''}
                onChange={(e) => set('categoryId', e.target.value || null)}>
                <option value="">بلا تصنيف</option>
                {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="ia-priority">الأولوية</label>
              <select id="ia-priority" className="input" value={d.priority}
                onChange={(e) => set('priority', e.target.value as never)}>
                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="ia-mentions">عدد مرات التكرار</label>
              <input id="ia-mentions" type="number" min={0} className="input" value={d.mentions}
                onChange={(e) => set('mentions', Number(e.target.valueAsNumber || 0))} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="ia-status">الحالة</label>
              <select id="ia-status" className="input" value={d.status}
                onChange={(e) => set('status', e.target.value as never)}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="ia-action">الإجراء الذي اتخذته المدرسة</label>
            <textarea id="ia-action" className="input input--area" rows={2}
              value={d.action} onChange={(e) => set('action', e.target.value)} />
          </div>

          <div className="form__row">
            <div className="field">
              <label className="field__label" htmlFor="ia-owner">المسؤول</label>
              <input id="ia-owner" className="input" value={d.owner}
                onChange={(e) => set('owner', e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="ia-start">تاريخ البدء</label>
              <input id="ia-start" type="date" className="input" value={d.startDate ?? ''}
                onChange={(e) => set('startDate', e.target.value || null)} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="ia-due">الإنجاز المتوقع</label>
              <input id="ia-due" type="date" className="input" value={d.dueDate ?? ''}
                onChange={(e) => set('dueDate', e.target.value || null)} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="ia-done">الإنجاز الفعلي</label>
              <input id="ia-done" type="date" className="input" value={d.doneDate ?? ''}
                onChange={(e) => set('doneDate', e.target.value || null)} />
            </div>
          </div>

          <div className="form__row">
            <div className="field">
              <label className="field__label" htmlFor="ia-impact">أثر الإجراء</label>
              <textarea id="ia-impact" className="input input--area" rows={2}
                value={d.impact} onChange={(e) => set('impact', e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="ia-follow">نتيجة المتابعة</label>
              <textarea id="ia-follow" className="input input--area" rows={2}
                value={d.followUp} onChange={(e) => set('followUp', e.target.value)} />
            </div>
          </div>

          <fieldset className="field">
            <legend className="field__label">دليل التنفيذ</legend>
            {(d.evidence ?? []).length > 0 && (
              <ul className="action__evidence">
                {(d.evidence ?? []).map((e) => (
                  <li key={e.id}>
                    <span className="chip">{e.kind === 'link' ? 'رابط' : 'ملاحظة'}</span>
                    {e.label}: {e.value}
                    <button type="button" className="link"
                      onClick={() => set('evidence', (d.evidence ?? []).filter((x) => x.id !== e.id))}>
                      إزالة
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="form__row">
              <input className="input" placeholder="وصف الدليل" value={evidenceLabel}
                onChange={(e) => setEvidenceLabel(e.target.value)} aria-label="وصف الدليل" />
              <input className="input" placeholder="رابط أو ملاحظة" value={evidenceValue}
                onChange={(e) => setEvidenceValue(e.target.value)} aria-label="قيمة الدليل" />
              <button type="button" className="button button--small" onClick={addEvidence}>إضافة</button>
            </div>
            <p className="basis-note">
              تُقبل الروابط والملاحظات النصية. رفع الملفات يتطلّب تفعيل التخزين السحابي.
            </p>
          </fieldset>

          <div className="field">
            <label className="field__label" htmlFor="ia-notes">ملاحظات</label>
            <textarea id="ia-notes" className="input input--area" rows={2}
              value={d.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <div className="modal__actions">
            <button type="button" className="button button--ghost" onClick={onCancel}>إلغاء</button>
            <button type="submit" className="button button--primary">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  )
}
