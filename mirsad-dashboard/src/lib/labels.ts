import { ltr, num } from './format'
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
  return `${head} ${room.name}`.trim()
}

export function fullClass(grade: Grade | undefined, room: ClassRoom): string {
  return `${grade?.name ?? ''} — فصل ${room.name}`.trim()
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

/**
 * نص السؤال كما ورد في المصدر، مع عزل ترقيمه لا حذفه.
 *
 * المصدر يبدأ أسئلته بـ «1_» و«12-»، والشرطة والشرطة السفلية محايدتان
 * في خوارزمية الاتجاه فتقفزان إلى الطرف الآخر من الرقم: «12-» تظهر
 * «-12» فتُقرأ سالبًا. العزل يعيدها إلى موضعها.
 *
 * ولا يُمسّ النص: المحرفان عازلان لا يُرسمان، والحروف والأرقام كما
 * وردت حرفًا بحرف — الإدارة والوزارة تقرآن المصدر لا صياغةً له.
 */
const SOURCE_NUMBERING = /^\s*\d+\s*[-_]\s*/

export function questionText(text: string): string {
  return text.replace(SOURCE_NUMBERING, (m) => ltr(m))
}
