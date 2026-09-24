/**
 * مطابقة الأسماء العربية — الأسماء هنا مُختلَقة عمدًا، لا أسماء طالبات.
 *
 * كل حالة منها وقعت فعلًا في بيانات القياس: طالبة كتبت اسمها بصورة
 * تختلف عن صورته في كشف الفصل، فلم يُرشَّح لها اسمٌ إطلاقًا، فظهرت في
 * كشف غير المشاركات وهي قد شاركت.
 */
import { describe, expect, it } from 'vitest'

import { coreTokens, isNameCandidate, normalizeArabic } from '../lib/arabic'

describe('تفكيك الاسم إلى كلماته الدالّة', () => {
  it('يصل صدر الاسم المركّب بما بعده', () => {
    expect(coreTokens('نورة عبد الله الزيد')).toEqual(['نوره', 'عبدالله', 'الزيد'])
    expect(coreTokens('مها أبو زيد')).toEqual(['مها', 'ابوزيد'])
    expect(coreTokens('هند أم القرى')).toEqual(['هند', 'امالقري'])
  })

  it('فتلتقي الصورتان: بمسافة وبغيرها', () => {
    expect(coreTokens('نورة عبد الله')).toEqual(coreTokens('نوره عبدالله'))
    expect(coreTokens('مها أبو زيد')).toEqual(coreTokens('مها ابوزيد'))
  })

  it('ويطرح أداة النسب لأنها لا تميّز أحدًا', () => {
    expect(coreTokens('سارة بنت محمد العتيبي')).toEqual(['ساره', 'محمد', 'العتيبي'])
    expect(coreTokens('سارة بن محمد العتيبي')).toEqual(coreTokens('سارة محمد العتيبي'))
  })

  it('ولا يبتلع كلمةً ليس قبلها صدر مركّب', () => {
    expect(coreTokens('ليان خالد الحربي')).toEqual(['ليان', 'خالد', 'الحربي'])
  })
})

describe('ترشيح الاسم للمطابقة', () => {
  it('يلتقي الاسم المركّب وإن اختُلف في وصله وفصله', () => {
    // الحالة التي أخرجت طالبةً مشاركةً إلى كشف غير المشاركات
    expect(isNameCandidate('مها يحيى أبو زيد', 'مها يحيى محمد ابوزيد')).toBe(true)
    expect(isNameCandidate('نورة عبد الله الزيد', 'نوره عبدالله سعيد الزيد')).toBe(true)
  })

  it('ويلتقي وإن سقط اسمٌ أوسط', () => {
    expect(isNameCandidate('ليان خالد الحربي', 'ليان خالد سعد الحربي')).toBe(true)
  })

  it('ولا يخلط أختين يشتركان في بقية الاسم', () => {
    expect(isNameCandidate('مها يحيى أبو زيد', 'منى يحيى محمد ابوزيد')).toBe(false)
  })

  it('ولا يخلط اسمين أولهما مختلف', () => {
    expect(isNameCandidate('سارة محمد العتيبي', 'هند محمد العتيبي')).toBe(false)
  })

  it('والتطبيع لا يمسّ النصّ الأصلي', () => {
    const original = 'نورة عبد الله الزيد'
    normalizeArabic(original)
    coreTokens(original)
    expect(original).toBe('نورة عبد الله الزيد')
  })
})
