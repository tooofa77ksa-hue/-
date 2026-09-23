import { arabicDigits, num } from './format'
import type { ClassRoom, Grade } from '../domain/types'

/**
 * أسماء الصفوف مختصرةً كما تنطقها الإدارة: «أولى ١» لا «الأول الابتدائي — فصل ١».
 *
 * الاسم الكامل يبقى في الجداول والتقارير الرسمية؛ والمختصر لمحاور
 * الرسوم وبطاقات المسطرة، حيث المساحة ضيّقة والاسم الكامل يُقصّ أو
 * يُدير النص فيصير غير مقروء.
 */
const ORDINALS = ['أولى', 'ثانية', 'ثالثة', 'رابعة', 'خامسة', 'سادسة'] as const

export function shortGrade(no: number): string {
  return ORDINALS[no - 1] ?? num(no)
}

export function shortClass(grade: Grade | undefined, room: ClassRoom): string {
  const head = grade ? shortGrade(grade.no) : ''
  return `${head} ${arabicDigits(String(room.name))}`.trim()
}

export function fullClass(grade: Grade | undefined, room: ClassRoom): string {
  return `${grade?.name ?? ''} — فصل ${arabicDigits(String(room.name))}`.trim()
}

/**
 * الفصول بترتيب الصف ثم رقم الفصل: أولى ١، أولى ٢، ثانية ١ …
 *
 * الترتيب على رقم الصف لا على اسمه: الترتيب الأبجدي يضع «الثالث» قبل
 * «الثاني»، وهو ليس ترتيب الكشوف ولا ما تتوقّعه الإدارة.
 */
export function orderedClasses(grades: Grade[], classes: ClassRoom[]) {
  const byId = new Map(grades.map((g) => [g.id, g]))
  return classes
    .map((room) => ({ room, grade: byId.get(room.gradeId) }))
    .sort((a, b) => {
      const byGrade = (a.grade?.no ?? 0) - (b.grade?.no ?? 0)
      if (byGrade !== 0) return byGrade
      return String(a.room.name).localeCompare(String(b.room.name), 'ar', { numeric: true })
    })
}
