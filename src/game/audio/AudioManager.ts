import { sfx, type SfxKey } from "./sfxSynth";
import { AUDIO_VERSION } from "./audioVersion";

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
  | "WRONG"
  | "ALMOST"
  | "ROCKET_READY";

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
  ALMOST: "almost_01",
  ROCKET_READY: "rocket_ready_01",
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
  ALMOST: "softBoop",
  ROCKET_READY: "rocketCharged",
};

/** مؤثر صوتي مُنتَج (ملف) اختياري لكل حدث - إن وُجد الملف يُشغَّل بدل
 * المؤثر المولَّف بـ WebAudio أعلاه (EVENT_SFX)، وإلا يبقى المولَّف كما
 * هو دون أي انقطاع. أسماء الملفات هنا هي نفسها التي ينتجها Skill
 * "arabic-kids-game-audio" داخل public/audio/sfx/. */
const EVENT_SFX_FILE: Partial<Record<GameEvent, string>> = {
  EXCELLENT: "correct_pop",
  HERO: "sparkle",
  AMAZING: "celebration",
  STAR: "star_twinkle",
  GEM: "gem_collect",
  CREATIVE: "applause_short",
  NEXT_LEVEL: "magic_whoosh",
  WRONG: "wrong_soft",
  ALMOST: "wrong_soft",
  ROCKET_READY: "rocket_charge",
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
  private voiceRequestSeq = 0;
  private duckingAmount = 0.35;
  private sfxBuffers = new Map<string, AudioBuffer | null>();

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

  /** توقف أي صوت بشري يُشغَّل حاليًا فورًا - يمنع تراكب عبارتين (مثل
   * "ممتازة!" و"كنز جديد!" معًا) حين يُطلَق أكثر من حدث صوتي على نفس
   * اللحظة تقريبًا (إجابة صحيحة تُشغِّل EXCELLENT من GameScreen وGEM من
   * مشهد الكنز في نفس الوقت) - العبارة الجديدة دائمًا تُسكِت القديمة. */
  private stopCurrentVoice() {
    if (!this.currentVoiceEl) return;
    this.currentVoiceEl.pause();
    this.currentVoiceEl.currentTime = 0;
    this.currentVoiceEl = null;
    this.unduckSfx();
  }

  private async tryPlayVoice(slot: string): Promise<boolean> {
    if (this.prefs.muted) return false;
    const known = this.voiceAvailability.get(slot);
    if (known === false) return false;

    // يوقف فورًا أي صوت يُشغَّل بالفعل، ويحجز "رقم طلب" فريد لهذا النداء -
    // ضروري لأن حدثين قد يُطلقان تقريبًا في نفس اللحظة (EXCELLENT من
    // GameScreen وGEM من مشهد الكنز عند نفس الإجابة الصحيحة)، فيبدأ كلا
    // النداءين تحميل ملفَيهما قبل أن يصل أيّهما لـcanplaythrough - عندها
    // stopCurrentVoice() وحدها لا تكفي لأن currentVoiceEl لم يُضبَط بعد
    // لأيٍّ منهما. requestId أدناه يضمن أن النداء الأقدم يُلغى نفسه بصمت
    // إن وصل لـcanplaythrough بعد أن سبقه نداء أحدث، بدل أن يُشغَّل فوقه.
    this.stopCurrentVoice();
    const requestId = ++this.voiceRequestSeq;

    const src = `${import.meta.env.BASE_URL}audio/voice/${slot}.mp3?v=${AUDIO_VERSION}`;
    const el = new Audio(src);
    el.volume = this.prefs.voiceVolume;

    return new Promise((resolve) => {
      let settled = false;
      el.addEventListener("canplaythrough", () => {
        if (settled) return;
        settled = true;
        this.voiceAvailability.set(slot, true);
        if (requestId !== this.voiceRequestSeq) {
          resolve(false);
          return;
        }
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

  /** يحمّل ملف مؤثر صوتي (public/audio/sfx/{fileId}.mp3) مرة واحدة
   * ويخزّنه مؤقتًا كـ AudioBuffer جاهز للتشغيل الفوري لاحقًا. فشل التحميل
   * (ملف غير موجود بعد) يُخزَّن كـ null حتى لا يُعاد جلبه في كل مرة. */
  private async loadSfxBuffer(fileId: string): Promise<AudioBuffer | null> {
    const cached = this.sfxBuffers.get(fileId);
    if (cached !== undefined) return cached;
    if (!this.ctx) return null;
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}audio/sfx/${fileId}.mp3?v=${AUDIO_VERSION}`);
      if (!res.ok) throw new Error("sfx file missing");
      const arr = await res.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arr);
      this.sfxBuffers.set(fileId, buffer);
      return buffer;
    } catch {
      this.sfxBuffers.set(fileId, null);
      return null;
    }
  }

  /** يشغّل مؤثرًا مُنتَجًا (ملف) عبر سلسلة WebAudio نفسها (sfxGain) حتى
   * يخضع بالضبط لنفس التحكم بالكتم/المستوى الذي يخضع له المؤثر المولَّف -
   * لا فرق سلوكي بين الاثنين من منظور المستخدمة. */
  private async playSfxFile(fileId: string): Promise<boolean> {
    if (!this.ctx) return false;
    const buffer = await this.loadSfxBuffer(fileId);
    if (!buffer) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.sfxGain);
    src.start();
    return true;
  }

  /** يفضّل المؤثر المُنتَج (ملف) إن وُجد، ويتراجع بصمت للمؤثر المولَّف
   * بـ WebAudio (سلوك اليوم دون أي تغيير) إن كان الملف غير موجود بعد -
   * تمامًا كما يتصرف tryPlayVoice مع ملفات الصوت البشري. */
  private async playFileOrSynth(event: GameEvent) {
    if (!this.ctx) return;
    const fileId = EVENT_SFX_FILE[event];
    const playedFile = fileId ? await this.playSfxFile(fileId) : false;
    if (!playedFile) sfx[EVENT_SFX[event]](this.ctx, this.sfxGain);
  }

  /** الحدث الموحّد: صوت بشري (إن توفر) + مؤثر صوتي متزامن. */
  async playEvent(event: GameEvent) {
    this.ensureContext();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();

    void this.playFileOrSynth(event);
    await this.tryPlayVoice(VOICE_SLOTS[event]);
  }

  /** تشغيل عبارة صوتية عامة بالاسم مباشرة (خارج الأحداث العشرة الثابتة) -
   * جاهزة لأي عبارات إضافية يولّدها Skill الصوت (مثل "هيا نبدأ!" أو
   * "اختاري لعبتك!") متى ما رُبطت بموقف مناسب في الواجهة؛ تتجاهل بصمت
   * إن كان الملف غير موجود، بنفس منطق tryPlayVoice تمامًا. */
  async playVoiceLine(slot: string) {
    this.ensureContext();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    await this.tryPlayVoice(slot);
  }

  /** إجابة خاطئة: تنويع لطيف بين ثلاث عبارات ("حاولي مرة أخرى"، "اقتربتِ
   * جربي مرة ثانية"، "أووبس! أخطأتِ") - نفس المؤثر الصوتي غير العقابي
   * ونفس حركة الدَمبلنغ (Wobble) للثلاثة معًا (event يبقى WRONG أو
   * ALMOST لأغراض المؤثر/الحركة)، فقط تنويع في العبارة المنطوقة نفسها
   * عبر voiceOverride لتفادي التكرار المزعج. */
  async playWrongVariant() {
    const variants: Array<{ event: GameEvent; voiceOverride?: string }> = [
      { event: "WRONG" },
      { event: "ALMOST" },
      { event: "WRONG", voiceOverride: "oops_01" },
    ];
    const { event, voiceOverride } = variants[Math.floor(Math.random() * variants.length)];

    this.ensureContext();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();

    void this.playFileOrSynth(event);
    await this.tryPlayVoice(voiceOverride ?? VOICE_SLOTS[event]);
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
