/**
 * ثوابت الهوية البصرية لوزارة التعليم
 * — الإدارة العامة للتعليم بمحافظة جدة.
 *
 * مأخوذة حرفيًا من دليل الهوية البصرية المعتمد.
 * أي لون أو خط في هذا المشروع يعود إلى هذا الملف وإلى styles.css وحدهما.
 */

/** الألوان الأساسية. */
export const PRIMARY_COLORS = {
  green: '#07a869',
  blue: '#3d7eb9',
  teal: '#0da9a6',
  navy: '#15445a',
  sand: '#c1b489',
  grey: '#c2c1c1',
} as const

/** الألوان المساندة. */
export const SUPPORT_COLORS = {
  blueDeep: '#3078a6',
  cyan: '#218caa',
  cyanLight: '#69cee3',
  purpleDeep: '#351375',
  purple: '#7258a4',
  periwinkle: '#7a80ff',
} as const

/** الجهة المالكة للهوية. */
export const ORGANIZATION = {
  ministry: 'وزارة التعليم',
  directorate: 'الإدارة العامة للتعليم بمحافظة جدة',
  handle: 'MOE_JDH',
  logo: '/brand/moe-logo.png',
  logoLight: '/brand/moe-logo-light.png',
} as const

/** خط الهوية المعتمد: عناوين عريضة (Bold) وعناوين فرعية (Regular). */
export const BRAND_FONT = 'Helvetica Neue W23 for SKY'
