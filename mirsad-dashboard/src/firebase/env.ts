/**
 * فحص متغيّرات البيئة دون استيراد حزمة Firebase.
 * فصل هذا الملف يسمح بتحميل Firebase عند الحاجة فقط،
 * فلا تُحمّل الحزمة إطلاقًا في وضع التخزين المحلي.
 */
const REQUIRED_KEYS = [
  'VITE_MIRSAD_FIREBASE_API_KEY',
  'VITE_MIRSAD_FIREBASE_AUTH_DOMAIN',
  'VITE_MIRSAD_FIREBASE_PROJECT_ID',
  'VITE_MIRSAD_FIREBASE_APP_ID',
] as const

export function readEnv(key: string): string {
  const value = import.meta.env?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

/** هل كل مفاتيح Firebase المطلوبة لهذا المشروع موجودة؟ */
export function isFirebaseConfigured(): boolean {
  return REQUIRED_KEYS.every((key) => readEnv(key).length > 0)
}
