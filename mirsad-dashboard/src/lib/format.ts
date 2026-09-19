/** تنسيق المبالغ بالأرقام العربية الشرقية مع فاصل الآلاف. */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount)
}

/** تنسيق عدد صحيح (للعدادات والبطاقات). */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('ar-SA').format(value)
}

/** تنسيق طابع زمني إلى تاريخ ميلادي مقروء بالعربية. */
export function formatDate(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '—'
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp))
}

/** وصف مختصر للزمن المنقضي، مثل: "قبل ٣ أيام". */
export function formatRelative(timestamp: number, now: number = Date.now()): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '—'
  const diffSeconds = Math.round((timestamp - now) / 1000)
  const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' })

  const thresholds: [limit: number, divisor: number, unit: Intl.RelativeTimeFormatUnit][] = [
    [60, 1, 'second'],
    [3600, 60, 'minute'],
    [86400, 3600, 'hour'],
    [2592000, 86400, 'day'],
    [31536000, 2592000, 'month'],
  ]

  const magnitude = Math.abs(diffSeconds)
  for (const [limit, divisor, unit] of thresholds) {
    if (magnitude < limit) return rtf.format(Math.round(diffSeconds / divisor), unit)
  }
  return rtf.format(Math.round(diffSeconds / 31536000), 'year')
}
