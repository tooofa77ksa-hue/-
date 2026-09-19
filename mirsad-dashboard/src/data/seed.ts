import type { Entry } from '../types'

/** بيانات تجريبية تُعرض عند أول تشغيل حتى لا تكون اللوحة فارغة. */
export function seedEntries(now: number = Date.now()): Entry[] {
  const day = 86_400_000
  const rows: Array<[string, string, Entry['status'], number, number, string]> = [
    ['تجديد اشتراك الاستضافة', 'بنية تحتية', 'active', 1450, 1, 'يُجدَّد سنويًا في الربع الأول.'],
    ['ترخيص أدوات التصميم', 'تراخيص', 'active', 890, 3, 'خمسة مقاعد مفعّلة.'],
    ['حملة إعلانية — الربع الثالث', 'تسويق', 'pending', 6200, 4, 'بانتظار اعتماد الميزانية.'],
    ['صيانة الأجهزة المكتبية', 'عمليات', 'pending', 780, 6, ''],
    ['أرشيف عقود ٢٠٢٣', 'عقود', 'archived', 0, 40, 'نُقل إلى الأرشيف بعد انتهاء المدة.'],
    ['تدريب الفريق على الأمن السيبراني', 'تدريب', 'active', 2300, 9, 'ورشتان حضوريتان.'],
    ['اشتراك خدمة التحليلات', 'بنية تحتية', 'active', 540, 12, ''],
    ['مراجعة حسابات خارجية', 'مالية', 'pending', 4100, 15, 'مكتب المراجعة أرسل العرض المبدئي.'],
  ]

  return rows.map(([title, category, status, amount, daysAgo, notes], index) => ({
    id: `seed-${index + 1}`,
    title,
    category,
    status,
    amount,
    ownerUid: 'local-user',
    notes,
    createdAt: now - (daysAgo + 20) * day,
    updatedAt: now - daysAgo * day,
  }))
}
