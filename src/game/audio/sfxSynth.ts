// توليف مؤثرات صوتية بسيطة عبر WebAudio API بدون أي ملفات صوتية خارجية.
// كل دالة تُنشئ عقد Oscillator/Noise قصيرة العمر وتوصلها بعقدة الإخراج المُمررة.

function envelope(ctx: AudioContext, gain: GainNode, attack: number, decay: number, peak = 1) {
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
}

function tone(
  ctx: AudioContext,
  out: AudioNode,
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  peak = 0.5,
  freqEnd?: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  envelope(ctx, gain, Math.min(0.03, duration * 0.3), duration, peak);
  osc.connect(gain).connect(out);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.05);
}

function noiseBurst(ctx: AudioContext, out: AudioNode, duration: number, peak = 0.3) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  src.connect(gain).connect(out);
  src.start();
}

export const sfx = {
  softPop(ctx: AudioContext, out: AudioNode) {
    tone(ctx, out, 520, 0.12, "sine", 0.5, 880);
  },
  bounceSparkle(ctx: AudioContext, out: AudioNode) {
    tone(ctx, out, 440, 0.15, "triangle", 0.4, 660);
    setTimeout(() => tone(ctx, out, 880, 0.2, "sine", 0.3, 1320), 90);
  },
  ignitionLaunchWhoosh(ctx: AudioContext, out: AudioNode) {
    noiseBurst(ctx, out, 0.6, 0.25);
    tone(ctx, out, 90, 0.7, "sawtooth", 0.35, 480);
  },
  twinkle(ctx: AudioContext, out: AudioNode) {
    [1046, 1318, 1568].forEach((f, i) => {
      setTimeout(() => tone(ctx, out, f, 0.18, "sine", 0.3), i * 80);
    });
  },
  gemCollect(ctx: AudioContext, out: AudioNode) {
    tone(ctx, out, 660, 0.1, "sine", 0.35, 990);
    setTimeout(() => tone(ctx, out, 990, 0.15, "sine", 0.3, 1320), 60);
  },
  applauseChime(ctx: AudioContext, out: AudioNode) {
    noiseBurst(ctx, out, 0.4, 0.18);
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => tone(ctx, out, f, 0.2, "triangle", 0.25), i * 70);
    });
  },
  magicWhoosh(ctx: AudioContext, out: AudioNode) {
    tone(ctx, out, 220, 0.5, "sine", 0.3, 880);
    noiseBurst(ctx, out, 0.35, 0.12);
  },
  softBoop(ctx: AudioContext, out: AudioNode) {
    tone(ctx, out, 260, 0.18, "sine", 0.35, 160);
  },
  rocketCharged(ctx: AudioContext, out: AudioNode) {
    [440, 660, 880].forEach((f, i) => {
      setTimeout(() => tone(ctx, out, f, 0.12, "triangle", 0.35), i * 70);
    });
  },
};

export type SfxKey = keyof typeof sfx;
