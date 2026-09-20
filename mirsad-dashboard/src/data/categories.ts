import type { Category } from '../domain/types'

/**
 * تصنيفات مساعدة لفرز آراء الطالبات. قابلة للتعديل من الإدارة،
 * ولا تُغيّر نص الطالبة الأصلي إطلاقًا.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-environment', name: 'البيئة المدرسية' },
  { id: 'cat-building', name: 'المبنى والمرافق' },
  { id: 'cat-cooling', name: 'التكييف والتهوية' },
  { id: 'cat-restrooms', name: 'دورات المياه' },
  { id: 'cat-yard', name: 'الساحة' },
  { id: 'cat-teaching', name: 'التعليم' },
  { id: 'cat-activities', name: 'الأنشطة' },
  { id: 'cat-safety', name: 'الأمن والسلامة' },
  { id: 'cat-discipline', name: 'الانضباط' },
  { id: 'cat-canteen', name: 'المقصف' },
  { id: 'cat-other', name: 'أخرى' },
]
