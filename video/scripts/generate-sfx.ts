/**
 * توليد مؤثرات صوتية (SFX) قصيرة إجرائيًا (Procedural) - بلا أي ملفات
 * خارجية أو مكتبات موسيقى مرخّصة، فقط تركيب موجات بسيطة (Sine/Noise) بصيغة
 * WAV خام. هذا مسموح ومختلف عن توليد صوت بشري (TTS) أو موسيقى مؤلَّفة
 * كاملة - إنه فقط "أصوات واجهة" قصيرة جدًا (Whoosh/Tick/Impact) شبيهة بما
 * تولّده WebAudio API في المتصفح لكن مُصدَّرة كملفات لاستخدامها مع Remotion
 * Audio في وقت الرندر (Node) حيث لا يتوفر WebAudio.
 *
 * التشغيل: npm run make-sfx (من داخل video/)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_RATE = 44100;
const OUT_DIR = join(import.meta.dirname, "..", "public", "audio", "sfx");

function writeWav(filename: string, samples: Float32Array) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, filename), buffer);
  console.log(`✓ ${filename} (${(samples.length / SAMPLE_RATE).toFixed(2)}s)`);
}

function seconds(n: number) {
  return Math.round(n * SAMPLE_RATE);
}

function whiteNoise(length: number, seedOffset = 0): Float32Array {
  const arr = new Float32Array(length);
  let seed = 42 + seedOffset;
  for (let i = 0; i < length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    arr[i] = (seed / 0x7fffffff) * 2 - 1;
  }
  return arr;
}

function lowpass(input: Float32Array, alpha: number): Float32Array {
  const out = new Float32Array(input.length);
  let prev = 0;
  for (let i = 0; i < input.length; i++) {
    prev = prev + alpha * (input[i] - prev);
    out[i] = prev;
  }
  return out;
}

function envelope(length: number, attack: number, release: number): Float32Array {
  const env = new Float32Array(length);
  const a = Math.max(1, Math.round(attack * length));
  for (let i = 0; i < length; i++) {
    if (i < a) {
      env[i] = i / a;
    } else {
      const t = (i - a) / Math.max(1, length - a);
      env[i] = Math.pow(1 - t, release);
    }
  }
  return env;
}

function sineTone(length: number, freqStart: number, freqEnd: number): Float32Array {
  const out = new Float32Array(length);
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / length;
    const freq = freqStart + (freqEnd - freqStart) * t;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    out[i] = Math.sin(phase);
  }
  return out;
}

function mix(...layers: { data: Float32Array; gain: number }[]): Float32Array {
  const length = Math.max(...layers.map((l) => l.data.length));
  const out = new Float32Array(length);
  for (const { data, gain } of layers) {
    for (let i = 0; i < data.length; i++) out[i] += data[i] * gain;
  }
  return out;
}

// --- tick: نقرة UI خفيفة جدًا عند ظهور مؤشرات صغيرة ---
function makeTick() {
  const len = seconds(0.05);
  const tone = sineTone(len, 3200, 2600);
  const env = envelope(len, 0.02, 6);
  writeWav("tick.wav", mix({ data: tone.map((v, i) => v * env[i]), gain: 0.35 }));
}

// --- whoosh: عند ظهور بطاقة ---
function makeWhoosh() {
  const len = seconds(0.42);
  const noise = lowpass(whiteNoise(len, 1), 0.06);
  const env = envelope(len, 0.35, 2.2);
  const data = new Float32Array(len);
  for (let i = 0; i < len; i++) data[i] = noise[i] * env[i];
  writeWav("whoosh.wav", mix({ data, gain: 0.5 }));
}

// --- transition-whoosh: عند الانتقال بين ثالث وسادس ---
function makeTransitionWhoosh() {
  const len = seconds(0.7);
  const noise = lowpass(whiteNoise(len, 2), 0.045);
  const env = envelope(len, 0.3, 1.8);
  const shimmer = sineTone(len, 1800, 2600);
  const data = new Float32Array(len);
  for (let i = 0; i < len; i++) data[i] = noise[i] * env[i] * 0.85 + shimmer[i] * env[i] * 0.08;
  writeWav("transition-whoosh.wav", mix({ data, gain: 0.55 }));
}

// --- riser: عند ارتفاع عمود ---
function makeRiser() {
  const len = seconds(0.55);
  const tone = sineTone(len, 220, 760);
  const env = envelope(len, 0.85, 1.4);
  const data = new Float32Array(len);
  for (let i = 0; i < len; i++) data[i] = tone[i] * env[i];
  writeWav("riser.wav", mix({ data, gain: 0.3 }));
}

// --- impact: عند وصول الرقم للقيمة النهائية ---
function makeImpact() {
  const len = seconds(0.28);
  const thump = sineTone(len, 130, 70);
  const thumpEnv = envelope(len, 0.02, 5);
  const transient = lowpass(whiteNoise(seconds(0.02), 3), 0.3);
  const data = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    data[i] = thump[i] * thumpEnv[i] * 0.8 + (transient[i] ?? 0) * 0.4;
  }
  writeWav("impact.wav", mix({ data, gain: 0.55 }));
}

// --- title-hit: عند ظهور عنوان ---
function makeTitleHit() {
  const len = seconds(0.5);
  const root = sineTone(len, 523.25, 523.25); // C5
  const fifth = sineTone(len, 783.99, 783.99); // G5
  const env = envelope(len, 0.015, 4.5);
  const data = new Float32Array(len);
  for (let i = 0; i < len; i++) data[i] = (root[i] * 0.7 + fifth[i] * 0.3) * env[i];
  writeWav("title-hit.wav", mix({ data, gain: 0.28 }));
}

makeTick();
makeWhoosh();
makeTransitionWhoosh();
makeRiser();
makeImpact();
makeTitleHit();
