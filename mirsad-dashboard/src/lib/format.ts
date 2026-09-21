const AR = 'ar-SA-u-nu-arab'

/** عدد صحيح بالأرقام العربية. */
export function num(value: number): string {
  return new Intl.NumberFormat(AR).format(value)
}

/** نسبة مئوية بخانة عشرية واحدة عند الحاجة. */
export function pct(value: number, digits = 1): string {
  return `${new Intl.NumberFormat(AR, { maximumFractionDigits: digits }).format(value)}٪`
}

/** متوسط بخانتين. */
export function avg(value: number): string {
  return new Intl.NumberFormat(AR, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function dateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(AR, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function dateOnly(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(AR, { dateStyle: 'medium' }).format(new Date(iso))
}

/** التاريخ الهجري لعرضه في الترويسة والتقارير. */
export function hijriToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)
}

export function clockTime(now: Date = new Date()): string {
  return new Intl.DateTimeFormat(AR, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now)
}

const WESTERN_TO_ARABIC = '٠١٢٣٤٥٦٧٨٩'

/**
 * يحوّل أرقام نصٍّ جاهز إلى الأرقام العربية.
 *
 * للنصوص التي تحمل أرقامًا وليست أعدادًا: السنة الهجرية «١٤٤٨»
 * والعام الدراسي «١٤٤٧-١٤٤٨». دونها يظهر التقرير بخليط من نظامي
 * أرقام في السطر الواحد.
 */
export function arabicDigits(text: string): string {
  return text.replace(/[0-9]/g, (d) => WESTERN_TO_ARABIC[Number(d)])
}
