import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getAudioManager } from "@/game/audio/AudioManager";

const MUSIC_SRC = `${import.meta.env.BASE_URL}audio/music/intro_theme.mp3`;
// أخف من الأصوات الرئيسية حتى لا تطغى على صوت الشخصية والمؤثرات لاحقًا
const MUSIC_VOLUME_FACTOR = 0.35;

/** الموسيقى تُعزف في الصفحة الرئيسية ("/") وشاشة اختيار اللعبة ("/play"
 * فقط، بلا أي مسار فرعي بعدها) - وليس داخل أي لعبة فعلية أو لوحة
 * المعلمة. */
function shouldPlayOnPath(pathname: string): boolean {
  return pathname === "/" || /^\/play\/?$/.test(pathname);
}

/** موسيقى خلفية على مستوى التطبيق كله (تُركَّب مرة واحدة في App.tsx) -
 * عنصر <audio> واحد فقط يستمر بلا انقطاع مسموع عبر كل تنقّل بين الصفحة
 * الرئيسية وشاشة اختيار اللعبة (لا يُعاد إنشاؤه أو إيقافه عند كل تنقّل
 * بينهما كما لو كان مربوطًا بمكوّن واحد فقط)، ويتوقف فقط عند دخول لعبة
 * فعلية (GameScreen/SessionPlayScreen) أو لوحة المعلمة. تتجاوز قيود
 * التشغيل التلقائي للمتصفحات بإعادة المحاولة عند أول تفاعل من
 * المستخدمة (عبر Ref يُعاد التحقق منه في وقت الحدث نفسه، لا وقت
 * إضافة المستمع)، وتحترم كتم/مستوى الصوت العام من AudioManager. */
export function BackgroundMusic() {
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldPlayRef = useRef(false);

  useEffect(() => {
    const el = new Audio(MUSIC_SRC);
    el.loop = true;
    audioRef.current = el;

    const manager = getAudioManager();
    el.volume = manager.getPrefs().muted ? 0 : manager.getPrefs().masterVolume * MUSIC_VOLUME_FACTOR;
    const unsubscribe = manager.subscribe((prefs) => {
      el.volume = prefs.muted ? 0 : prefs.masterVolume * MUSIC_VOLUME_FACTOR;
    });

    const retry = () => {
      if (shouldPlayRef.current) el.play().catch(() => {});
    };
    window.addEventListener("pointerdown", retry);

    return () => {
      unsubscribe();
      window.removeEventListener("pointerdown", retry);
      el.pause();
    };
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    const shouldPlay = shouldPlayOnPath(location.pathname);
    shouldPlayRef.current = shouldPlay;
    if (!el) return;
    if (shouldPlay) {
      el.play().catch(() => {
        /* التشغيل التلقائي محظور حتى أول تفاعل - يعالجه مستمع pointerdown أعلاه */
      });
    } else {
      el.pause();
    }
  }, [location.pathname]);

  return null;
}
