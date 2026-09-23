/**
 * اللغة عربية والاتجاه من اليمين إلى اليسار، والأرقام لاتينية
 * (0 1 2 3) بطلب المدرسة.
 *
 * الزائدة «-u-nu-latn» تغيّر شكل الأرقام وحدها: النص يبقى عربيًا،
 * والاتجاه يبقى من اليمين إلى اليسار، وتتبع الفواصلُ الأرقامَ فلا
 * يخرج خليط مثل «2٫79».
 */
const AR = 'ar-SA-u-nu-latn'

/**
 * يعزل رقمًا داخل جملة عربية كي لا تعبث به خوارزمية الاتجاه.
 *
 * الأرقام اللاتينية تُرسم من اليسار إلى اليمين داخل سطر من اليمين إلى
 * اليسار، وما جاورها من علامات محايدة (+ − – %) لا تنتمي إلى الرقم
 * فتأخذ اتجاه الجملة وتقفز إلى طرفه الخطأ. المشاهَد فعلًا قبل هذا
 * العزل: «0.06+» بدل «+0.06»، و«1448-1447» بدل «1447-1448»،
 * و«%12.2» بدل «12.2%».
 *
 * المحرفان U+2066 و U+2069 عازلان لا يُرسمان: يبقى النص عربيًّا
 * والسطر من اليمين إلى اليسار، ويبقى الرقم وحده وحدةً مستقلة. وهما
 * يعملان في HTML وفي SVG وفي النص المستخرج من PDF سواء.
 */
export function ltr(text: string): string {
  return `\u2066${text}\u2069`
}

/** عدد صحيح. */
export function num(value: number): string {
  return ltr(new Intl.NumberFormat(AR).format(value))
}

/** نسبة مئوية بخانة عشرية واحدة عند الحاجة. */
export function pct(value: number, digits = 1): string {
  return ltr(`${new Intl.NumberFormat(AR, { maximumFractionDigits: digits }).format(value)}%`)
}

/** متوسط بخانتين. */
export function avg(value: number): string {
  return ltr(new Intl.NumberFormat(AR, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value))
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
  return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
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
