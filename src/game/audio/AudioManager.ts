import { sfx, type SfxKey } from "./sfxSynth";

/**
 * الأحداث الصوتية/الحركية المرتبطة بجدول التصميم:
 * كل حدث = صوت بشري (Slot جاهز) + مؤثر صوتي مُولَّف + إشارة للحركة (تُستهلك من Phaser).
 */
export type GameEvent =
  | "EXCELLENT"
  | "HERO"
  | "AMAZING"
  | "STAR"
  | "GEM"
  | "CREATIVE"
  | "NEXT_LEVEL"
  | "WRONG";

/** أسماء ملفات الصوت البشري الجاهزة للاستبدال لاحقًا بدون تعديل الكود */
export const VOICE_SLOTS: Record<GameEvent, string> = {
  EXCELLENT: "excellent_01",
  HERO: "hero_01",
  AMAZING: "amazing_01",
  STAR: "star_01",
  GEM: "gem_01",
  CREATIVE: "creative_01",
  NEXT_LEVEL: "next_01",
  WRONG: "try_again_01",
};

const EVENT_SFX: Record<GameEvent, SfxKey> = {
  EXCELLENT: "softPop",
  HERO: "bounceSparkle",
  AMAZING: "ignitionLaunchWhoosh",
  STAR: "twinkle",
  GEM: "gemCollect",
  CREATIVE: "applauseChime",
  NEXT_LEVEL: "magicWhoosh",
  WRONG: "softBoop",
};

export interface AudioPrefs {
  muted: boolean;
  masterVolume: number;
  voiceVolume: number;
  sfxVolume: number;
  quietMode: boolean;
  reducedMotion: boolean;
}

const PREFS_KEY = "shualat-lughati:audio-prefs:v1";

function loadPrefs(defaults: AudioPrefs): AudioPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

type Listener = (prefs: AudioPrefs) => void;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private voiceGain!: GainNode;
  private sfxGain!: GainNode;
  private prefs: AudioPrefs;
  private listeners = new Set<Listener>();
  private voiceAvailability = new Map<string, boolean>();
  private currentVoiceEl: HTMLAudioElement | null = null;
  private duckingAmount = 0.35;

  constructor(defaults: AudioPrefs) {
    this.prefs = loadPrefs(defaults);
  }

  /** يجب استدعاؤها بعد أول تفاعل من المستخدمة (سياسة المتصفحات لتشغيل الصوت) */
  ensureContext() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.voiceGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.voiceGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    this.applyVolumes();
  }

  setDuckingAmount(amount: number) {
    this.duckingAmount = Math.min(1, Math.max(0, amount));
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const m = this.prefs.muted ? 0 : this.prefs.masterVolume * (this.prefs.quietMode ? 0.5 : 1);
    this.masterGain.gain.setTargetAtTime(m, this.ctx.currentTime, 0.05);
    this.voiceGain.gain.setTargetAtTime(this.prefs.voiceVolume, this.ctx.currentTime, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.prefs.sfxVolume, this.ctx.currentTime, 0.05);
  }

  getPrefs(): AudioPrefs {
    return { ...this.prefs };
  }

  setPrefs(patch: Partial<AudioPrefs>) {
    this.prefs = { ...this.prefs, ...patch };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs));
    } catch {
      /* تجاهل فشل التخزين المحلي (وضع تصفح خاص مثلًا) */
    }
    this.applyVolumes();
    this.listeners.forEach((l) => l(this.prefs));
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private duckSfx() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.sfxGain.gain.cancelScheduledValues(now);
    this.sfxGain.gain.setTargetAtTime(
      this.prefs.sfxVolume * this.duckingAmount,
      now,
      0.08
    );
  }

  private unduckSfx() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.sfxGain.gain.setTargetAtTime(this.prefs.sfxVolume, now, 0.25);
  }

  private async tryPlayVoice(slot: string): Promise<boolean> {
    if (this.prefs.muted) return false;
    const known = this.voiceAvailability.get(slot);
    if (known === false) return false;

    const src = `/audio/voice/${slot}.mp3`;
    const el = new Audio(src);
    el.volume = this.prefs.voiceVolume;

    return new Promise((resolve) => {
      let settled = false;
      el.addEventListener("canplaythrough", () => {
        if (settled) return;
        settled = true;
        this.voiceAvailability.set(slot, true);
        this.currentVoiceEl = el;
        this.duckSfx();
        el.play().catch(() => resolve(false));
        el.addEventListener("ended", () => {
          this.unduckSfx();
          if (this.currentVoiceEl === el) this.currentVoiceEl = null;
        });
        resolve(true);
      });
      el.addEventListener("error", () => {
        if (settled) return;
        settled = true;
        this.voiceAvailability.set(slot, false);
        resolve(false);
      });
    });
  }

  playSfx(key: SfxKey) {
    if (this.prefs.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    sfx[key](this.ctx, this.sfxGain);
  }

  /** الحدث الموحّد: صوت بشري (إن توفر) + مؤثر صوتي متزامن. */
  async playEvent(event: GameEvent) {
    this.ensureContext();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();

    this.playSfx(EVENT_SFX[event]);
    await this.tryPlayVoice(VOICE_SLOTS[event]);
  }

  get isReducedMotion() {
    return this.prefs.reducedMotion;
  }
}

let singleton: AudioManager | null = null;

export function getAudioManager(defaults?: AudioPrefs): AudioManager {
  if (!singleton) {
    singleton = new AudioManager(
      defaults ?? {
        muted: false,
        masterVolume: 0.8,
        voiceVolume: 1,
        sfxVolume: 0.7,
        quietMode: false,
        reducedMotion: false,
      }
    );
  }
  return singleton;
}
