/**
 * تقدير مدة النطق عند عدم توفر ملف الصوت الفعلي بعد - يُستخدم فقط لمعاينة
 * التوقيت في Remotion Studio قبل تسجيل التعليق الصوتي. بمجرد إضافة الملف
 * الحقيقي في public/audio/voice/{id}.mp3 يُستخدم طوله الفعلي تلقائيًا
 * (انظر getVoiceDuration.ts) دون الحاجة لأي تعديل.
 *
 * معدل نطق عربي فصيح رسمي وهادئ (لا سريع) ≈ 145-150 كلمة/دقيقة.
 */
const WORDS_PER_SECOND = 150 / 60;
const LEAD_TAIL_SECONDS = 0.55;
const MIN_SECONDS = 1.6;

export function estimateDurationSeconds(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const spoken = wordCount / WORDS_PER_SECOND;
  return Math.max(MIN_SECONDS, spoken + LEAD_TAIL_SECONDS);
}
