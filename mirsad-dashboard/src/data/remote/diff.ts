/**
 * مقارنة حالتين لاستخراج ما تغيّر فعلًا.
 *
 * الغرض: ألا تُكتب في قاعدة البيانات إلا المستندات التي تغيّرت، فلا
 * تُعاد كتابة ٢٩٤ طالبة عند تعديل اسم واحد، ولا يُستهلك حد الكتابة
 * اليومي بلا داعٍ.
 *
 * المنطق هنا خالص بلا Firebase، فهو مُختبَر وحدويًا دون شبكة.
 */

export interface Change<T> {
  upserts: { id: string; value: T }[]
  /** معرّفات اختفت من الحالة الجديدة. الحذف الفعلي يقرّره المستدعي. */
  removedIds: string[]
}

/** هل تطابق الكائنان محتوًى؟ مقارنة بنيوية مستقرة لترتيب المفاتيح. */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => sameValue(item, b[i]))
  }
  const ka = Object.keys(a as object).sort()
  const kb = Object.keys(b as object).sort()
  if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false
  return ka.every((k) => sameValue(
    (a as Record<string, unknown>)[k],
    (b as Record<string, unknown>)[k],
  ))
}

/** يقارن مجموعتين من الكيانات المعرَّفة بمفتاح ثابت. */
export function diffById<T>(
  prev: { id: string; value: T }[],
  next: { id: string; value: T }[],
): Change<T> {
  const before = new Map(prev.map((e) => [e.id, e.value]))
  const upserts: { id: string; value: T }[] = []

  for (const entry of next) {
    const old = before.get(entry.id)
    if (old === undefined || !sameValue(old, entry.value)) upserts.push(entry)
    before.delete(entry.id)
  }

  return { upserts, removedIds: [...before.keys()] }
}

/** يحوّل مصفوفة كيانات لها حقل id إلى الشكل الذي تقبله diffById. */
export function keyed<T extends { id: string }>(items: T[]): { id: string; value: T }[] {
  return items.map((value) => ({ id: value.id, value }))
}

/** يحوّل سجلًا مفتاحه نصّي (مثل إقرارات المراجعة) إلى الشكل نفسه. */
export function keyedRecord<T>(record: Record<string, T>): { id: string; value: T }[] {
  return Object.entries(record).map(([id, value]) => ({ id, value }))
}
