/** تطبيع مستوى الصوت (Peak Normalization) - يُستخدم على كل ملف (صوت بشري
 * أو مؤثر) بعد بنائه وقبل ترميزه MP3، بحيث تصل كل ملفات الصوت البشري إلى
 * نفس ذروة المستوى فيما بينها، وكل ملفات المؤثرات إلى نفس ذروة المستوى
 * فيما بينها - بدل الاعتماد على ضبط يدوي تقريبي لكل صوت على حدة. ذروة
 * الصوت البشري أعلى من ذروة المؤثرات عمدًا (VOICE_TARGET_PEAK >
 * SFX_TARGET_PEAK) بما يحقق "الصوت البشري أوضح من المؤثرات" على مستوى
 * الملف نفسه، إضافة إلى تحكم AudioManager بمستويين منفصلين لهما وقت
 * التشغيل (voiceVolume/sfxVolume) وDucking التلقائي. */

export const VOICE_TARGET_PEAK = 0.92;
export const SFX_TARGET_PEAK = 0.78;

/** يرفع أو يخفض كل العيّنات بنفس المعامل حتى تصل أعلى قيمة مطلقة فيها
 * إلى targetPeak بالضبط (ما لم تكن العيّنات صامتة بالكامل). maxGain يمنع
 * تضخيمًا متطرفًا لصوت شبه صامت (حماية من الضجيج). */
export function normalizePeakInt16(samples: Int16Array, targetPeak: number, maxGain = 8): Int16Array {
  let maxAbs = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i]);
    if (v > maxAbs) maxAbs = v;
  }
  if (maxAbs === 0) return samples;

  const gain = Math.min(maxGain, (targetPeak * 32767) / maxAbs);
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    out[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * gain)));
  }
  return out;
}
