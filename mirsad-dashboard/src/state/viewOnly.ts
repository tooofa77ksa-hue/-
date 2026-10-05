import { useEffect, useState } from 'react'

/**
 * وضع العرض: كل شيء يُقرأ، ولا شيء يُكتب.
 *
 * اللوحة تُفتح على شاشةٍ أمام لجنة، وتُمرَّر في جوّالٍ بين يدين، وقد
 * تُترك مفتوحةً على مكتب. وضغطةٌ واحدة في غير موضعها تُغيّر حالة
 * طالبة أو تمحو إجراءً — ولا يُنتبه إليها إلا بعد حين.
 *
 * فالقفل هنا ليس إخفاء أزرار: هو منعٌ في طبقة الحالة نفسها. كل
 * محاولة كتابة تُرفض وهي واقفة، مهما كان الزرّ الذي استُدعيت منه.
 *
 * وهو محفوظٌ في الجهاز لا في قاعدة البيانات: جهازُ العرض يبقى مقفلًا
 * بعد إعادة التشغيل، وجهازُ العمل يبقى مفتوحًا — ولا يُقفل أحدهما
 * على الآخر.
 */
const KEY = 'qiyas.viewOnly'
const EVENT = 'qiyas:viewOnly'

export function isViewOnly(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setViewOnly(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    // وضع التصفّح الخاص: يبقى الاختيار لهذه الجلسة وحدها
  }
  window.dispatchEvent(new CustomEvent(EVENT))
}

/** يتابع الوضع ويعيد رسم ما يعتمد عليه فور تبديله. */
export function useViewOnly(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(isViewOnly)

  useEffect(() => {
    const sync = () => setOn(isViewOnly())
    window.addEventListener(EVENT, sync)
    // تبويبٌ آخر على الجهاز نفسه بدّل الوضع
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return [on, setViewOnly]
}

/** رسالة الرفض، واحدةٌ في كل موضع كي تُعرف. */
export const VIEW_ONLY_MESSAGE =
  'اللوحة مقفلة للعرض: لا شيء يُحفظ. اضغطي القفل في الأعلى لتعود الكتابة.'
