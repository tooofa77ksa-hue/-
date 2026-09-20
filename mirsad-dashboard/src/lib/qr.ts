/**
 * إعدادات الباركود: تصحيح خطأ مرتفع، هامش هادئ كافٍ،
 * وتباين أسود على أبيض — كي يبقى قابلًا للمسح فعليًا.
 */
const OPTIONS = {
  errorCorrectionLevel: 'H' as const,
  margin: 4,          // Quiet Zone: ٤ وحدات وهو الحد القياسي
  scale: 8,
  color: { dark: '#000000', light: '#ffffff' },
}

export async function qrDataUrl(text: string): Promise<string> {
  const { default: QRCode } = await import('qrcode')
  return QRCode.toDataURL(text, OPTIONS)
}

export async function downloadQr(text: string, filename: string): Promise<void> {
  const { default: QRCode } = await import('qrcode')
  const url = await QRCode.toDataURL(text, { ...OPTIONS, scale: 16 })
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/** الرابط المطلق لصفحة القياس، صالح للنسخ والمسح خارج الجهاز. */
export function surveyUrl(classId?: string): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return classId ? `${base}#/survey/${classId}` : `${base}#/survey`
}
