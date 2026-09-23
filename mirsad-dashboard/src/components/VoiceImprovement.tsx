import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EvidenceQr } from './EvidenceQr'
import { SimilarVoices } from './SimilarVoices'
import { addAction, updateAction, type ActionDraft } from '../domain/actions'
import type { ImprovementAction, Suggestion, SystemState } from '../domain/types'
import { dateOnly, num } from '../lib/format'
import { similarTo } from '../lib/similar'

const STATUS = { planned: 'مخطط', in_progress: 'جارٍ التنفيذ', completed: 'مكتمل' } as const
const PRIORITY = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' } as const

function blankDraft(voice: Suggestion): ActionDraft {
  return {
    title: '', problem: voice.text, categoryId: voice.categoryId,
    sourceNote: 'آراء الطالبات في قياس الاتجاه', mentions: 1, priority: 'medium',
    action: '', owner: '', startDate: null, dueDate: null, doneDate: null,
    status: 'planned', notes: '', impact: '', followUp: '',
    linkedSuggestionIds: [voice.id], evidence: [],
  }
}

interface Props {
  voice: Suggestion
  action: ImprovementAction | null
  state: SystemState
  replace: (next: SystemState) => void
}

/**
 * لوح التحسين تحت رأي الطالبة.
 *
 * يُفتح في مكانه ولا ينقل الإدارة إلى صفحة أخرى: تقرأ الرأي، وتربطه
 * بإجراء، وترى ما فعلته المدرسة عليه — في موضع واحد.
 *
 * والخيار الأول ربطٌ بإجراء قائم لا إنشاءُ جديد: الآراء تتكرّر
 * (عشرون رأيًا في دورات المياه)، والمدرسة تتّخذ إجراءً واحدًا. ولولا
 * هذا الخيار لأنشأت الإدارة عشرين إجراءً لمشكلة واحدة، وقرأتها
 * الوزارة عشرين مشكلة.
 */
export function VoiceImprovement({ voice, action, state, replace }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'link' | 'new'>('link')
  const [pick, setPick] = useState('')
  const [draft, setDraft] = useState<ActionDraft>(() => blankDraft(voice))
  const [proofLabel, setProofLabel] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [chosen, setChosen] = useState<Set<string>>(() => new Set())

  const others = action ? action.linkedSuggestionIds.filter((id) => id !== voice.id).length : 0
  const available = state.improvementActions

  /**
   * الآراء التي تشبه هذا الرأي ولمّا تُربط بعد.
   *
   * المربوطة تُستبعد: لها جوابها، وعرضها هنا يوهم أن عليها ربطًا آخر.
   * والحساب على آراء المدرسة كلها لا على ما تصفّيه الشاشة، لأن الإجراء
   * الواحد يغطّي الصفوف كلها.
   */
  const similar = useMemo(() => {
    const linked = new Set<string>()
    for (const a of state.improvementActions) {
      for (const id of a.linkedSuggestionIds) linked.add(id)
    }
    return similarTo(voice, state.suggestions).filter((s) => !linked.has(s.voice.id))
  }, [voice, state.suggestions, state.improvementActions])

  /** المختار من المشابهات، مقصورًا على ما زال معروضًا. */
  const picked = useMemo(
    () => similar.filter((s) => chosen.has(s.voice.id)).map((s) => s.voice.id),
    [similar, chosen],
  )

  function toggle(id: string) {
    setChosen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setChosen((prev) => (prev.size === similar.length ? new Set() : new Set(similar.map((s) => s.voice.id))))
  }

  function attachToExisting() {
    const target = state.improvementActions.find((a) => a.id === pick)
    if (!target) return
    const ids = [...new Set([...target.linkedSuggestionIds, voice.id, ...picked])]
    replace(updateAction(state, target.id, {
      ...target,
      mentions: Math.max(target.mentions, ids.length),
      linkedSuggestionIds: ids,
    }))
    setChosen(new Set())
    setOpen(false)
  }

  /** ضمّ المشابهات إلى إجراء قائم على هذا الرأي، بعد ربطه. */
  function attachSimilarToCurrent() {
    if (!action || picked.length === 0) return
    const ids = [...new Set([...action.linkedSuggestionIds, ...picked])]
    replace(updateAction(state, action.id, {
      ...action,
      mentions: Math.max(action.mentions, ids.length),
      linkedSuggestionIds: ids,
    }))
    setChosen(new Set())
  }

  function createNew() {
    const evidence = proofUrl.trim()
      ? [{
          id: `ev-${Date.now().toString(36)}`,
          kind: 'link' as const,
          label: proofLabel.trim() || 'شاهد التنفيذ',
          value: proofUrl.trim(),
          addedAt: new Date().toISOString(),
        }]
      : []
    const ids = [...new Set([voice.id, ...picked])]
    replace(addAction(state, {
      ...draft, evidence, linkedSuggestionIds: ids, mentions: ids.length,
    }))
    setDraft(blankDraft(voice))
    setProofLabel(''); setProofUrl(''); setChosen(new Set())
    setOpen(false)
  }

  function unlink() {
    if (!action) return
    replace(updateAction(state, action.id, {
      ...action,
      linkedSuggestionIds: action.linkedSuggestionIds.filter((id) => id !== voice.id),
    }))
  }

  return (
    <>
      <button type="button" className="button button--small no-print" onClick={() => setOpen(!open)}>
        {open ? '▴ إغلاق' : action ? '▾ إجراء المدرسة' : '▾ لوح التحسين'}
      </button>

      {open && (
        <div className="improve">
          {action ? (
            <div className="done">
              <div className="done__head">
                <h3 className="done__title">{action.title || 'إجراء بلا عنوان'}</h3>
                <span className={`status status--ia-${action.status}`}>{STATUS[action.status]}</span>
                <span className={`chip chip--p-${action.priority}`}>أولوية {PRIORITY[action.priority]}</span>
              </div>

              <dl className="done__grid">
                <div><dt>المسؤولة</dt><dd>{action.owner || '—'}</dd></div>
                <div><dt>البدء</dt><dd>{dateOnly(action.startDate)}</dd></div>
                <div><dt>الإنجاز الفعلي</dt><dd>{dateOnly(action.doneDate)}</dd></div>
              </dl>

              <p className="improve__what">
                <strong>إجراء المدرسة:</strong> {action.action || '— لم يُكتب بعد —'}
              </p>
              {action.impact && (
                <p className="improve__what"><strong>الأثر:</strong> {action.impact}</p>
              )}

              {action.evidence.map((e) => <EvidenceQr key={e.id} evidence={e} />)}

              {others > 0 && (
                <Link className="improve__shared" to="/admin/improvement">
                  ويشاركه {num(others)} من آراء الطالبات ←
                </Link>
              )}

              <SimilarVoices
                items={similar} chosen={chosen} toggle={toggle} toggleAll={toggleAll}
                title="آراء تشبهه بلا إجراء"
              />
              {similar.length > 0 && (
                <button
                  type="button" className="button button--primary button--small no-print"
                  disabled={picked.length === 0} onClick={attachSimilarToCurrent}
                >
                  {picked.length > 0
                    ? `ضمّي ${num(picked.length)} رأيًا إلى هذا الإجراء`
                    : 'اختاري ما يُضمّ إلى هذا الإجراء'}
                </button>
              )}

              <div className="row-btn no-print">
                <Link className="button button--small" to="/admin/improvement">تعديل الإجراء</Link>
                <button type="button" className="button button--small" onClick={unlink}>
                  فكّ ربط هذا الرأي
                </button>
              </div>
            </div>
          ) : (
            <div className="improve__choices">
              <label className={mode === 'link' ? 'choice is-on' : 'choice'}>
                <input
                  type="radio" name={`m-${voice.id}`} className="sr-only"
                  checked={mode === 'link'} onChange={() => setMode('link')}
                />
                <span className="choice__dot" aria-hidden="true" />
                <span className="choice__body">
                  <span className="choice__title">اربطيه بإجراء قائم</span>
                  {available.length === 0 ? (
                    <span className="improve__note">لا توجد إجراءات بعد — أنشئي أوّلها أدناه.</span>
                  ) : (
                    <>
                      <select
                        className="input" value={pick} onChange={(e) => setPick(e.target.value)}
                        aria-label="اختيار إجراء قائم"
                      >
                        <option value="">اختاري إجراءً…</option>
                        {available.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title || 'إجراء بلا عنوان'} — {num(a.linkedSuggestionIds.length)} رأيًا
                          </option>
                        ))}
                      </select>
                      <span className="improve__note">
                        الربط لا ينشئ إجراءً جديدًا: يضيف هذا الرأي شاهدًا على إجراء قائم،
                        فلا يتكرّر الإجراء الواحد في التقرير.
                      </span>
                      <button
                        type="button" className="button button--primary button--small"
                        disabled={!pick} onClick={attachToExisting}
                      >
                        {picked.length > 0 ? `اربطي ${num(picked.length + 1)} آراء` : 'اربطي'}
                      </button>
                    </>
                  )}
                </span>
              </label>

              <label className={mode === 'new' ? 'choice is-on' : 'choice'}>
                <input
                  type="radio" name={`m-${voice.id}`} className="sr-only"
                  checked={mode === 'new'} onChange={() => setMode('new')}
                />
                <span className="choice__dot" aria-hidden="true" />
                <span className="choice__body">
                  <span className="choice__title">أو أنشئي إجراءً جديدًا</span>

                  <div className="mini">
                    <label>
                      عنوان الإجراء
                      <input
                        className="input" value={draft.title}
                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      />
                    </label>
                    <label>
                      المسؤولة
                      <input
                        className="input" value={draft.owner}
                        onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
                      />
                    </label>
                  </div>

                  <label className="mini__wide">
                    الإجراء الذي اتخذته المدرسة
                    <textarea
                      className="input" rows={2} value={draft.action}
                      onChange={(e) => setDraft({ ...draft, action: e.target.value })}
                    />
                  </label>

                  <div className="mini mini--3">
                    <label>
                      التصنيف
                      <select
                        className="input" value={draft.categoryId ?? ''}
                        onChange={(e) => setDraft({ ...draft, categoryId: e.target.value || null })}
                      >
                        <option value="">بلا تصنيف</option>
                        {state.categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      الأولوية
                      <select
                        className="input" value={draft.priority}
                        onChange={(e) => setDraft({ ...draft, priority: e.target.value as never })}
                      >
                        {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </label>
                    <label>
                      الحالة
                      <select
                        className="input" value={draft.status}
                        onChange={(e) => setDraft({ ...draft, status: e.target.value as never })}
                      >
                        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="mini">
                    <label>
                      اسم الشاهد
                      <input
                        className="input" value={proofLabel} placeholder="صور التنفيذ قبل وبعد"
                        onChange={(e) => setProofLabel(e.target.value)}
                      />
                    </label>
                    <label>
                      رابط الشاهد
                      <input
                        className="input" dir="ltr" type="url" value={proofUrl}
                        placeholder="https://…" onChange={(e) => setProofUrl(e.target.value)}
                      />
                    </label>
                  </div>
                  <span className="improve__note">
                    الرابط يصير باركودًا ملوّنًا في اللوحة والتقرير. اجعليه مفتوحًا لمن يمسحه،
                    ولا تضعي فيه صور طالبات إن كان التقرير يخرج من المدرسة.
                  </span>

                  <button
                    type="button" className="button button--primary button--small"
                    disabled={!draft.title.trim()} onClick={createNew}
                  >
                    {picked.length > 0
                      ? `حفظ الإجراء على ${num(picked.length + 1)} آراء`
                      : 'حفظ الإجراء'}
                  </button>
                </span>
              </label>

              <SimilarVoices
                items={similar} chosen={chosen} toggle={toggle} toggleAll={toggleAll}
                title="آراء تشبهه، اربطيها معه"
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}
