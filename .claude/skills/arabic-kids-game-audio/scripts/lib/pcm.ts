/**
 * توليف صوتي بدون أي مشغّل صوت (Offline PCM synthesis) - نسخة تعمل داخل
 * Node لنفس أسلوب src/game/audio/sfxSynth.ts (نغمات + دفعات ضجيج بمغلّف
 * صاعد/هابط)، لكن بدلًا من رسمها لحظيًا عبر WebAudio AudioContext (متاح
 * فقط داخل المتصفح)، تُكتَب هنا مباشرة كعيّنات PCM في مصفوفة واحدة
 * لتصديرها لاحقًا كملف MP3 حقيقي عبر lib/mp3.ts.
 *
 * الأسلوب الصوتي (نغمات قصيرة لطيفة، بلا Buzzer عقابي) مطابق عمدًا لما هو
 * موجود بالفعل في sfxSynth.ts حتى تبقى المؤثرات المُنتَجة والمؤثرات
 * الاحتياطية المولَّفة حيّة متجانسة الطابع الصوتي.
 */

export const SAMPLE_RATE = 44100;

export function createBuffer(durationSec: number): Float32Array {
  return new Float32Array(Math.ceil(SAMPLE_RATE * durationSec));
}

/** مغلّف صاعد (Attack) ثم هابط أُسّي (Decay) - يقارب سلوك
 * exponentialRampToValueAtTime الذي تستخدمه sfxSynth.ts في المتصفح. */
function envelopeAt(t: number, attack: number, decay: number, peak: number): number {
  if (t < 0) return 0;
  if (t < attack) return peak * (t / attack);
  const dt = t - attack;
  if (dt > decay) return 0;
  return peak * Math.exp(-5 * (dt / decay));
}

export type ToneType = "sine" | "triangle" | "sawtooth";

/** يضيف نغمة (بتردد ثابت أو منزلق من freq إلى freqEnd) إلى buf بدءًا من
 * startSec، بالجمع (Additive) فوق أي محتوى موجود مسبقًا في تلك العيّنات -
 * هذا ما يسمح بتركيب عدة نغمات متتالية أو متداخلة في نفس الملف. */
export function addTone(
  buf: Float32Array,
  startSec: number,
  freq: number,
  duration: number,
  type: ToneType,
  peak: number,
  freqEnd?: number
) {
  const attack = Math.min(0.03, duration * 0.3);
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const totalSamples = Math.floor((duration + 0.05) * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < totalSamples; i++) {
    const idx = startSample + i;
    if (idx < 0) continue;
    if (idx >= buf.length) break;
    const t = i / SAMPLE_RATE;
    const f = freqEnd ? freq * Math.pow(freqEnd / freq, Math.min(1, t / duration)) : freq;
    phase += (2 * Math.PI * f) / SAMPLE_RATE;
    let sample: number;
    if (type === "sine") sample = Math.sin(phase);
    else if (type === "triangle") sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
    else {
      const cyclePos = phase / (2 * Math.PI);
      sample = 2 * (cyclePos - Math.floor(cyclePos + 0.5));
    }
    const env = envelopeAt(t, attack, duration, peak);
    buf[idx] += sample * env;
  }
}

/** يضيف دفعة ضجيج أبيض متلاشية (Noise Burst) - تُستخدم لأصوات الهسهسة/
 * الانطلاق (مثل magic_whoosh وrocket_launch)، بنفس أسلوب noiseBurst في
 * sfxSynth.ts. */
export function addNoiseBurst(buf: Float32Array, startSec: number, duration: number, peak: number) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  for (let i = 0; i < totalSamples; i++) {
    const idx = startSample + i;
    if (idx < 0) continue;
    if (idx >= buf.length) break;
    const t = i / totalSamples;
    const env = peak * Math.exp(-5 * t);
    buf[idx] += (Math.random() * 2 - 1) * env;
  }
}

/** نقرة واحدة قصيرة جدًا (ضجيج بمغلّف هبوط حاد جدًا) تحاكي "طقة" تصفيقة
 * منفردة - أقصر بكثير وأحدّ انحدارًا من addNoiseBurst العادية (المصمَّمة
 * لأصوات هسهسة/انطلاق أطول). تُستخدَم بتكرار عشوائي التوقيت في
 * generate-sfx.ts لتركيب applause_short (تصفيق) من عشرات النقرات
 * المتراكبة - تقريب برمجي معقول، وليس تسجيلًا حقيقيًا. */
export function addClapBurst(buf: Float32Array, startSec: number, peak: number) {
  const duration = 0.02 + Math.random() * 0.015;
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  for (let i = 0; i < totalSamples; i++) {
    const idx = startSample + i;
    if (idx < 0) continue;
    if (idx >= buf.length) break;
    const t = i / totalSamples;
    const env = peak * Math.exp(-9 * t);
    buf[idx] += (Math.random() * 2 - 1) * env;
  }
}

/** تحويل نهائي إلى PCM 16-bit موقّع (ما يتوقعه مُرمِّز MP3) مع تحديد
 * (Clamping) يمنع أي تشويه (Clipping) ناتج عن جمع عدة نغمات متزامنة. */
export function toInt16(buf: Float32Array): Int16Array {
  const out = new Int16Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    const clamped = Math.max(-1, Math.min(1, buf[i]));
    out[i] = Math.round(clamped * 32760);
  }
  return out;
}
