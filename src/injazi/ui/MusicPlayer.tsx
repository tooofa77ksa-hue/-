/*
  زر الموسيقى.
  قواعد صارمة: لا تشغيل تلقائي بصوت قبل تفاعل المستخدمة (المتصفحات
  تمنعه أصلًا، ونحن لا نحاول الالتفاف عليه)، والتفضيل يُحفظ محليًا
  فتعود الطالبة لاحقًا إلى نفس الحالة.
  العنصر الوحيد المتحرك باستمرار في المنصة هو أعمدة الصوت — وذلك فقط
  أثناء التشغيل الفعلي، لأنها تخبر بحالة حقيقية.
*/
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Music, Pause, Play, Volume2 } from "lucide-react";
import { DUR, EASE_CLAY } from "@/injazi/motion/motion";
import type { Settings } from "@/injazi/types/models";

const PREF_KEY = "injazi:music:v1";

type Pref = { playing: boolean; volume: number };

function readPref(fallbackVolume: number): Pref {
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (raw) return { volume: fallbackVolume, ...(JSON.parse(raw) as Partial<Pref>) } as Pref;
  } catch {
    /* تخزين محجوب: نبدأ بالقيم الافتراضية */
  }
  return { playing: false, volume: fallbackVolume };
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
    element.loop = settings.audioLoop;
  }, [pref.volume, settings.audioLoop]);

  useEffect(() => {
    const element = audio.current;
    if (!element || !enabled) return;
    if (pref.playing) {
      element.play().catch(() => {
        // المتصفح رفض التشغيل قبل التفاعل: نعرض الزر ولا نعِد بصوت لم يبدأ.
        setBlocked(true);
        setPref((current) => ({ ...current, playing: false }));
      });
    } else {
      element.pause();
    }
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
        aria-label={pref.playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
        aria-pressed={pref.playing}
        title={settings.audioTitle}
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
        className="iz-music__more"
        onClick={() => setOpen((value) => !value)}
        aria-label="إعدادات الصوت"
        aria-expanded={open}
        whileTap={{ scale: 0.94 }}
      >
        <Volume2 size={16} strokeWidth={2.4} aria-hidden="true" />
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
            {blocked && <p className="iz-field__meter">اضغطي زر التشغيل مرة أخرى لبدء الصوت.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
