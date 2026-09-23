/**
 * إعدادات الباركود: تصحيح خطأ مرتفع، هامش هادئ كافٍ،
 * وتباين عالٍ — كي يبقى قابلًا للمسح فعليًا.
 */
const OPTIONS = {
  errorCorrectionLevel: 'H' as const,
  margin: 4,          // Quiet Zone: ٤ وحدات وهو الحد القياسي
  scale: 8,
  color: { dark: '#15445a', light: '#ffffff' },
}

/**
 * ألوان الباركود: لكل صف لون يميّزه عند التوزيع على المعلّمات.
 *
 * كلها داكنة عن عمد. الماسح لا يقرأ لونًا بل فرق إضاءة بين المربّع
 * والخلفية، وكل لون هنا انعكاسه دون ٣٠٪ على أبيض — أي فرق يفوق ضعف
 * ما يشترطه المعيار. ولو جُرِّب تفتيحها (ذهبي أو تركوازي فاتح) لصارت
 * باركودات لا تُقرأ في يد الطالبة، والجمال لا يساوي استجابة ضائعة.
 */
export const QR_COLORS = [
  '#15445a', // كحلي الوزارة
  '#0f5d5b', // أخضر مزرقّ داكن
  '#66490f', // ذهبي داكن
  '#4a2f5e', // بنفسجي داكن
  '#1f4d2e', // أخضر داكن
  '#6b2233', // عنّابي
] as const

/** لون ثابت للصف: الصف الأول يأخذ الأول دائمًا مهما أُعيد الترتيب. */
export function qrColorFor(gradeNo: number | null | undefined): string {
  if (!gradeNo || gradeNo < 1) return QR_COLORS[0]
  return QR_COLORS[(gradeNo - 1) % QR_COLORS.length]
}

export async function qrDataUrl(text: string, dark = OPTIONS.color.dark): Promise<string> {
  const { default: QRCode } = await import('qrcode')
  return QRCode.toDataURL(text, { ...OPTIONS, color: { ...OPTIONS.color, dark } })
}

export async function downloadQr(
  text: string, filename: string, dark = OPTIONS.color.dark,
): Promise<void> {
  const { default: QRCode } = await import('qrcode')
  const url = await QRCode.toDataURL(text, {
    ...OPTIONS, scale: 16, color: { ...OPTIONS.color, dark },
  })
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
