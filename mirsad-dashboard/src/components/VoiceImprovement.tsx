import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EvidenceQr } from './EvidenceQr'
import { addAction, updateAction, type ActionDraft } from '../domain/actions'
import type { ImprovementAction, Suggestion, SystemState } from '../domain/types'
import { dateOnly, num } from '../lib/format'

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

  const others = action ? action.linkedSuggestionIds.filter((id) => id !== voice.id).length : 0
  const available = state.improvementActions

  function attachToExisting() {
    const target = state.improvementActions.find((a) => a.id === pick)
    if (!target) return
    replace(updateAction(state, target.id, {
      ...target,
      mentions: Math.max(target.mentions, target.linkedSuggestionIds.length + 1),
      linkedSuggestionIds: [...new Set([...target.linkedSuggestionIds, voice.id])],
    }))
    setOpen(false)
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
    replace(addAction(state, { ...draft, evidence }))
    setDraft(blankDraft(voice))
    setProofLabel(''); setProofUrl('')
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
                        اربطي
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
                    حفظ الإجراء
                  </button>
                </span>
              </label>
            </div>
          )}
        </div>
      )}
    </>
  )
}
