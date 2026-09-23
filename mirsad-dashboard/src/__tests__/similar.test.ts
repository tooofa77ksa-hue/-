/** ترشيح الآراء المتشابهة — يجمع الشكوى الواحدة ولا يخلط الموضوعات. */
import { describe, expect, it } from 'vitest'

import { initialState } from '../data/store'
import { addAction, removeAction, updateAction } from '../domain/actions'
import type { Suggestion } from '../domain/types'
import { clusterVoices, contentTokens, similarTo, similarity } from '../lib/similar'

let seq = 0
function voice(text: string): Suggestion {
  seq += 1
  return {
    id: `sg-t${seq}`, responseId: 'r1', studentId: null, gradeId: null, classId: null,
    text, categoryId: null, status: 'new',
  }
}

describe('الكلمات الدالّة', () => {
  it('تطرح ما لا يدلّ على موضوع', () => {
    expect(contentTokens('لا يوجد شيء')).toHaveLength(0)
    expect(contentTokens('لا يوجد اي اقتراح')).toHaveLength(0)
  })

  it('تلتقي صيغ الكلمة الواحدة في مفتاح واحد', () => {
    const a = contentTokens('نظافة دورات المياه')
    const b = contentTokens('الحرص على نظافه دوره المياه')
    expect(a.filter((t) => b.includes(t)).length).toBeGreaterThanOrEqual(2)
  })

  it('لا تعدّ الكلمة مرتين في الرأي الواحد', () => {
    expect(contentTokens('تكييف تكييف تكييف')).toHaveLength(1)
  })
})

describe('معامل التشابه', () => {
  it('صفر إذا خلا أحدهما من كلمة دالّة', () => {
    expect(similarity([], ['تكييف'])).toBe(0)
  })

  it('واحد للنصّين المتطابقين في كلماتهما', () => {
    expect(similarity(['تكييف', 'ساحه'], ['ساحه', 'تكييف'])).toBe(1)
  })
})

describe('الترشيح لرأي بعينه', () => {
  const target = voice('نرجو تكييف الساحة الخارجية')
  const pool = [
    target,
    voice('وضع تكييف في الساحه'),
    voice('تكييف الساحة نظرا لشدة الحرارة'),
    voice('الاهتمام بنظافة دورات المياه'),
    voice('لا يوجد'),
  ]

  it('يرشّح الآراء التي تتحدث عن الموضوع نفسه', () => {
    const hits = similarTo(target, pool).map((s) => s.voice.text)
    expect(hits).toContain('وضع تكييف في الساحه')
    expect(hits).toContain('تكييف الساحة نظرا لشدة الحرارة')
  })

  it('ولا يخلط موضوعًا بموضوع', () => {
    const hits = similarTo(target, pool).map((s) => s.voice.text)
    expect(hits).not.toContain('الاهتمام بنظافة دورات المياه')
  })

  it('ولا يرشّح الرأي لنفسه ولا يرشّح «لا يوجد»', () => {
    const hits = similarTo(target, pool).map((s) => s.voice.text)
    expect(hits).not.toContain(target.text)
    expect(hits).not.toContain('لا يوجد')
  })

  it('ويبيّن الكلمات التي جمعت الرأيين كي تُراجَع بالعين', () => {
    const [first] = similarTo(target, pool)
    expect(first.shared.length).toBeGreaterThan(0)
    expect(first.score).toBeGreaterThan(0)
  })

  it('والكلمة تُعرض كما كتبتها الطالبة لا كجذعٍ مقطوع', () => {
    const shared = similarTo(target, pool).flatMap((s) => s.shared)
    expect(shared).toContain('تكييف')
    expect(shared).not.toContain('تكي')
  })

  it('«لا يوجد» لا يُرشَّح له شيء وإن تطابق مع مثله', () => {
    const empty = voice('لا يوجد')
    expect(similarTo(empty, [empty, voice('لا يوجد'), voice('لا يوجد شيء')])).toHaveLength(0)
  })
})

describe('عناقيد الآراء على بيانات القياس الفعلية', () => {
  const state = initialState()

  it('تجمع أكثر الشكاوى تكرارًا في عنقود واحد', () => {
    const clusters = clusterVoices(state.suggestions)
    expect(clusters.length).toBeGreaterThan(0)
    // أكبر عنقود عن تكييف الساحة: أكثر ما تكرّر في آراء هذا القياس
    expect(clusters[0].members.length).toBeGreaterThanOrEqual(4)
    expect(clusters[0].keywords.length).toBeGreaterThan(0)
  })

  it('وعنوان الموضوع كلماتٌ تُقرأ، لا جذوع مقطوعة', () => {
    // كل كلمة معروضة موجودة حرفيًا في نصّ رأي من أعضاء العنقود
    for (const c of clusterVoices(state.suggestions).slice(0, 5)) {
      const corpus = c.members.map((m) => m.text).join(' ')
      for (const word of c.keywords) {
        // الكلمة كما كتبتها طالبة فعلًا، بتائها المربوطة وهمزتها
        expect(corpus).toContain(word)
      }
    }
  })

  it('لا يقع رأي واحد في عنقودين', () => {
    const seen = new Set<string>()
    for (const c of clusterVoices(state.suggestions)) {
      for (const m of c.members) {
        expect(seen.has(m.id)).toBe(false)
        seen.add(m.id)
      }
    }
  })

  it('ولا عنقود بعضو واحد — العنقود تكرارٌ لا رأي منفرد', () => {
    for (const c of clusterVoices(state.suggestions)) {
      expect(c.members.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('حالة الرأي تتبع ارتباطه بإجراء', () => {
  const base = initialState()
  const ids = base.suggestions.slice(0, 3).map((s) => s.id)
  const draft = {
    title: 'تكييف الساحة', problem: '', categoryId: null, sourceNote: '', mentions: 3,
    priority: 'high' as const, action: 'تركيب مراوح رذاذ', owner: 'وكيلة الشؤون',
    startDate: null, dueDate: null, doneDate: null, status: 'planned' as const,
    notes: '', impact: '', followUp: '', linkedSuggestionIds: ids, evidence: [],
  }

  it('الربط يجعلها «مرتبط بإجراء»', () => {
    const next = addAction(base, draft)
    for (const id of ids) {
      expect(next.suggestions.find((s) => s.id === id)?.status).toBe('linked')
    }
  })

  it('وفكّ الربط يعيدها «مُراجَعًا» لا «جديدًا»', () => {
    const linked = addAction(base, draft)
    const action = linked.improvementActions[0]
    const next = updateAction(linked, action.id, { ...action, linkedSuggestionIds: [ids[0]] })
    expect(next.suggestions.find((s) => s.id === ids[0])?.status).toBe('linked')
    expect(next.suggestions.find((s) => s.id === ids[1])?.status).toBe('reviewed')
  })

  it('وحذف الإجراء يحرّر آراءه كلها', () => {
    const linked = addAction(base, draft)
    const next = removeAction(linked, linked.improvementActions[0].id)
    for (const id of ids) {
      expect(next.suggestions.find((s) => s.id === id)?.status).toBe('reviewed')
    }
  })

  it('ورأيٌ يشاركه إجراءٌ آخر يبقى مرتبطًا', () => {
    const first = addAction(base, draft)
    const second = addAction(first, { ...draft, title: 'إجراء ثانٍ', linkedSuggestionIds: [ids[1]] })
    const target = second.improvementActions.find((a) => a.title === 'تكييف الساحة')!
    const next = updateAction(second, target.id, { ...target, linkedSuggestionIds: [] })
    expect(next.suggestions.find((s) => s.id === ids[1])?.status).toBe('linked')
    expect(next.suggestions.find((s) => s.id === ids[0])?.status).toBe('reviewed')
  })
})
