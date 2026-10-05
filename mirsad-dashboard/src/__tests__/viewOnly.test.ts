import { describe, expect, it, beforeEach } from 'vitest'

import { isViewOnly, setViewOnly } from '../state/viewOnly'

/**
 * القفل وعدٌ لا زينة: من يقفل اللوحة ويسلّم جوّاله يعتمد عليه.
 * فيُختبر أنه يُحفظ في الجهاز ويبقى، وأنه يُرفع كما يُوضع.
 */
describe('وضع العرض', () => {
  beforeEach(() => { localStorage.clear() })

  it('مغلق افتراضيًا: اللوحة تُفتح للعمل لا للعرض', () => {
    expect(isViewOnly()).toBe(false)
  })

  it('يُحفظ في الجهاز فيبقى بعد إعادة الفتح', () => {
    setViewOnly(true)
    expect(isViewOnly()).toBe(true)
    expect(localStorage.getItem('qiyas.viewOnly')).toBe('1')
  })

  it('يُرفع فتعود الكتابة', () => {
    setViewOnly(true)
    setViewOnly(false)
    expect(isViewOnly()).toBe(false)
    expect(localStorage.getItem('qiyas.viewOnly')).toBeNull()
  })

  it('يُنادي المتابعين عند كل تبديل', () => {
    let calls = 0
    const onChange = () => { calls += 1 }
    window.addEventListener('qiyas:viewOnly', onChange)
    setViewOnly(true)
    setViewOnly(false)
    window.removeEventListener('qiyas:viewOnly', onChange)
    expect(calls).toBe(2)
  })
})
