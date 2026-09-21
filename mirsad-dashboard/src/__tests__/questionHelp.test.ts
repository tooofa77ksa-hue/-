import { describe, expect, it } from 'vitest'

import { SCALE_HELP, helpFor, optionHint } from '../data/questionHelp'
import { initialState } from '../data/store'

const state = initialState()
const active = state.questions.filter((q) => q.active)

describe('شرح الأسئلة', () => {
  it('لكل سؤال شرح مبسّط', () => {
    const without = active.filter((q) => !helpFor(q.id)?.plain)
    expect(without.map((q) => q.id)).toEqual([])
  })

  it('لكل خيار شرح لمعناه', () => {
    for (const option of state.options) {
      expect(optionHint(option.label), option.label).toBeTruthy()
    }
  })

  it('كل عبارة عكسية تحمل تنبيهًا يوضّح معنى الموافقة', () => {
    const reverse = active.filter((q) => q.direction === 'reverse')
    expect(reverse.length).toBe(6)
    for (const q of reverse) {
      const note = helpFor(q.id)?.reverseNote
      expect(note, q.id).toBeTruthy()
      // التنبيه يشرح ماذا تعني الموافقة، فيذكر الخيار صراحةً
      expect(note, q.id).toContain('أوافق تماماً')
    }
  })

  it('الأسئلة الموجبة لا تحمل تنبيه العبارة العكسية', () => {
    const positive = active.filter((q) => q.direction === 'positive')
    const mislabeled = positive.filter((q) => helpFor(q.id)?.reverseNote)
    expect(mislabeled.map((q) => q.id)).toEqual([])
  })
})

describe('حياد الشرح', () => {
  /**
   * الشرح يوضّح ولا يوجّه. لو تسلّلت إليه كلمة تصف إجابةً بأنها
   * «الصحيحة» أو «الإيجابية» أو تطلب اختيارها، صار النظام يقترح على
   * وليّ الأمر ما يجيب به، فتقيس النتيجةُ الاقتراحَ لا المدرسة.
   */
  const STEERING = [
    'اختاري هذا', 'اختر هذا', 'الإجابة الصحيحة', 'الإجابة الأفضل',
    'إيجابية ✅', 'سلبية ❌', 'يُفضّل اختيار', 'الأفضل أن تختاري',
  ]

  const texts = [
    SCALE_HELP.intro,
    SCALE_HELP.reverseHeading,
    ...Object.values(SCALE_HELP.options),
    ...active.flatMap((q) => [helpFor(q.id)?.plain, helpFor(q.id)?.reverseNote]),
  ].filter((t): t is string => Boolean(t))

  it('لا يوجّه أي نص إلى إجابة بعينها', () => {
    for (const text of texts) {
      for (const phrase of STEERING) {
        expect(text, phrase).not.toContain(phrase)
      }
    }
  })

  it('لا يصف أي خيار بأنه إيجابي أو سلبي', () => {
    // الوصف المسموح للعبارة نفسها («عبارة منفية») لا للإجابة.
    const labels = state.options.map((o) => o.label)
    for (const text of texts) {
      for (const label of labels) {
        const near = new RegExp(`«?${label}»?\\s*(إجابة\\s*)?(إيجابي|سلبي)`)
        expect(near.test(text), `${label} في: ${text}`).toBe(false)
      }
    }
  })

  it('شرح الخيارات واحد لكل الأسئلة، فلا يتغيّر بين موجب وعكسي', () => {
    // لو اختلف الشرح بحسب اتجاه السؤال لأصبح تلميحًا لا توضيحًا.
    expect(Object.keys(SCALE_HELP.options).sort())
      .toEqual(state.options.map((o) => o.label).sort())
  })
})
