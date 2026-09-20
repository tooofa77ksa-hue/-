import emptySchool from './school-data.empty.json'

/**
 * بيانات المدرسة (أسماء الطالبات واستجاباتهن وآراؤهن).
 *
 * هذا الملف مستثنى من المستودع لأنه بيانات شخصية لقاصرات.
 * يولّده `npm run etl` من `data/source/`. عند غيابه يعمل النظام
 * على تعريف القياس وحده، ويوضّح للمستخدمة أن البيانات غير محمّلة
 * بدل الإيهام بأن المدرسة بلا طالبات.
 */
export type SchoolData = typeof emptySchool

const modules = import.meta.glob('./school-data.json', { eager: true })

const loaded = Object.values(modules)[0] as { default?: SchoolData } | undefined

export const schoolData: SchoolData = (loaded?.default ?? emptySchool) as SchoolData

/** هل حُمّلت بيانات مدرسة فعلية؟ */
export const hasSchoolData: boolean = schoolData.students.length > 0
