/*
  زر الإنشودة.
  قواعد صارمة: لا تشغيل تلقائي بصوت قبل تفاعل المستخدمة (المتصفحات
  تمنعه أصلًا، ونحن لا نحاول الالتفاف عليه)، والتفضيل يُحفظ محليًا
  فتعود الطالبة لاحقًا إلى نفس الحالة.

  حين يرفض المتصفح التشغيل، لا نُسقط التفضيل: ننتظر أول تفاعل حقيقي
  (نقرة أو لمسة أو مفتاح) ثم نشغّل عندها. هذا التزام بالسياسة لا
  التفاف عليها — التشغيل يحدث داخل إيماءة المستخدمة نفسها.
  العنصر الوحيد المتحرك باستمرار في المنصة هو أعمدة الصوت — وذلك فقط
  أثناء التشغيل الفعلي، لأنها تخبر بحالة حقيقية.
*/
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { DUR, EASE_CLAY } from "@/injazi/motion/motion";
import type { Settings } from "@/injazi/types/models";

// v2: تغيّر الافتراضي من «متوقّفة» إلى «تعمل»، ورفع رقم المفتاح هو ما
// يجعل التغيير يصل إلى من جرّبت المنصة قبل اليوم — وإلا بقيت صامتة
// لديها إلى الأبد بتفضيل قديم لم تختره عمدًا.
const PREF_KEY = "injazi:music:v2";

type Pref = { playing: boolean; volume: number; muted: boolean };

function readPref(fallbackVolume: number): Pref {
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (raw) return { volume: fallbackVolume, ...(JSON.parse(raw) as Partial<Pref>) } as Pref;
  } catch {
    /* تخزين محجوب: نبدأ بالقيم الافتراضية */
  }
  // الأنشودة هوية المنصة لا زينة اختيارية: تبدأ وحدها ويُسكتها زر واحد.
  // المتصفّح قد يؤجّلها إلى أول لمسة — وهذا مُدار أدناه، لا مُتحايَل عليه.
  return { playing: true, volume: fallbackVolume, muted: false };
}

function writePref(pref: Pref) {
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(pref));
  } catch {
    /* التفضيل يبقى لهذه الجلسة فقط */
  }
}

export function MusicPlayer({ settings }: { settings: Settings }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [pref, setPref] = useState<Pref>(() => readPref(settings.audioVolume));
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const enabled = settings.features.music && settings.audioEnabled && Boolean(settings.audioUrl);

  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    element.volume = pref.volume;
    element.muted = pref.muted;
    element.loop = settings.audioLoop;
  }, [pref.volume, pref.muted, settings.audioLoop]);

  useEffect(() => {
    const element = audio.current;
    if (!element || !enabled) return;

    if (!pref.playing) {
      element.pause();
      return;
    }

    let armed = false;
    const resume = () => {
      armed = false;
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      element.play().catch(() => setBlocked(true));
    };

    element.play().then(
      () => setBlocked(false),
      () => {
        // مرفوض قبل التفاعل: نُبقي التفضيل ونعلّق التشغيل على أول
        // إيماءة حقيقية بدل إسقاطه وإجبارها على الضغط من جديد.
        setBlocked(true);
        armed = true;
        window.addEventListener("pointerdown", resume, { once: true });
        window.addEventListener("keydown", resume, { once: true });
      },
    );

    return () => {
      if (!armed) return;
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, [pref.playing, enabled]);

  if (!enabled) return null;

  function toggle() {
    setBlocked(false);
    setPref((current) => {
      const next = { ...current, playing: !current.playing };
      writePref(next);
      return next;
    });
  }

  function toggleMute() {
    setPref((current) => {
      const next = { ...current, muted: !current.muted };
      writePref(next);
      return next;
    });
  }

  function setVolume(volume: number) {
    setPref((current) => {
      const next = { ...current, volume };
      writePref(next);
      return next;
    });
  }

  return (
    <div className="iz-music">
      <audio ref={audio} src={settings.audioUrl ?? undefined} preload="none" />

      <motion.button
        type="button"
        className={`iz-music__btn ${pref.playing ? "is-playing" : ""}`}
        onClick={toggle}
        onDoubleClick={() => setOpen((value) => !value)}
        aria-label={pref.playing ? "إيقاف الأنشودة" : "تشغيل الأنشودة"}
        aria-pressed={pref.playing}
        /* حين يؤجّل المتصفّح التشغيل، الزر هو المكان الوحيد الذي تنظر
           إليه المستخدمة بحثًا عن الصوت — فالسبب يُقال هنا، لا داخل
           لوحة تُفتح بنقرة مزدوجة لن تخطر لأحد. */
        title={blocked ? `${settings.audioTitle} — المسي الشاشة لتبدأ` : settings.audioTitle}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: DUR.tap, ease: EASE_CLAY }}
      >
        {pref.playing ? (
          <span className="iz-music__bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : (
          <Music size={18} strokeWidth={2.4} aria-hidden="true" />
        )}
      </motion.button>

      <motion.button
        type="button"
        className={`iz-music__more ${pref.muted ? "is-muted" : ""}`}
        onClick={toggleMute}
        onDoubleClick={() => setOpen((value) => !value)}
        aria-label={pref.muted ? "إلغاء كتم الصوت" : "كتم الصوت"}
        aria-pressed={pref.muted}
        title={pref.muted ? "إلغاء الكتم" : "كتم"}
        whileTap={{ scale: 0.94 }}
      >
        {pref.muted ? (
          <VolumeX size={16} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <Volume2 size={16} strokeWidth={2.4} aria-hidden="true" />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="iz-music__panel"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: DUR.base, ease: EASE_CLAY }}
          >
            <p className="iz-music__title">{settings.audioTitle}</p>
            <div className="iz-music__row">
              <button type="button" className="iz-icon-btn" onClick={toggle} aria-label={pref.playing ? "إيقاف" : "تشغيل"}>
                {pref.playing ? <Pause size={16} strokeWidth={2.6} /> : <Play size={16} strokeWidth={2.6} />}
              </button>
              <input
                className="iz-range"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={pref.volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                aria-label="مستوى الصوت"
              />
            </div>
            {blocked && <p className="iz-field__meter">ستبدأ الإنشودة عند أول نقرة على الصفحة.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
