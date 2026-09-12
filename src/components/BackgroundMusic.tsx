import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getAudioManager, type AudioPrefs } from "@/game/audio/AudioManager";

const MUSIC_SRC = `${import.meta.env.BASE_URL}audio/music/intro_theme.mp3`;
// مستوى معتدل في الصفحة الرئيسية/شاشة اختيار اللعبة (أخف من الأصوات
// الرئيسية أصلًا؛ خُفِّض من 0.35 إلى 0.2 بعد ملاحظة المستخدمة أن الصوت
// "عالي جدًا")، ومستوى خافت جدًا (خلفية بحتة) أثناء اللعب الفعلي حتى لا
// يطغى على المؤثرات أو صوت الشخصية - الموسيقى تستمر بدل أن تتوقف تمامًا،
// لكن بصوت "واطئ جدًا خلف الخلفية". يبقى شريط "موسيقى الخلفية" في لوحة
// إعدادات الصوت (AudioControls) قادرًا على خفضها أكثر أو رفعها يدويًا
// فوق هذا الأساس.
const MENU_VOLUME_FACTOR = 0.2;
const GAME_VOLUME_FACTOR = 0.06;

type MusicMode = "menu" | "game" | "off";

/** menu: الصفحة الرئيسية أو شاشة اختيار اللعبة (صوت عادي).
 * game: داخل لعبة فعلية (GameScreen أو SessionPlayScreen) - الموسيقى
 * تستمر لكن بصوت خافت جدًا خلف المؤثرات وصوت الشخصية، لا تتوقف.
 * off: أي مكان آخر (لوحة المعلمة) - لا موسيقى إطلاقًا. */
function musicModeForPath(pathname: string): MusicMode {
  if (pathname === "/" || /^\/play\/?$/.test(pathname)) return "menu";
  if (pathname.startsWith("/play/")) return "game";
  return "off";
}

function volumeFactorFor(mode: MusicMode): number {
  if (mode === "menu") return MENU_VOLUME_FACTOR;
  if (mode === "game") return GAME_VOLUME_FACTOR;
  return 0;
}

/** موسيقى خلفية على مستوى التطبيق كله (تُركَّب مرة واحدة في App.tsx) -
 * عنصر <audio> واحد فقط يُنشأ مرة واحدة ولا يُعاد إنشاؤه أو إيقافه عند
 * كل تنقّل، فيستمر العزف بلا انقطاع مسموع عبر كل الصفحة الرئيسية وشاشة
 * اختيار اللعبة وحتى داخل اللعب الفعلي (بمستوى خافت جدًا هناك فقط)،
 * ويتوقف تمامًا فقط في لوحة المعلمة. تتجاوز قيود التشغيل التلقائي في
 * كل المتصفحات (بما فيها Safari على الجوال) بإعادة المحاولة عند أول
 * لمسة/ضغطة فعلية من المستخدمة (عبر Ref يُعاد التحقق منه وقت الحدث
 * نفسه)، وتحترم كتم/مستوى الصوت العام من AudioManager. */
export function BackgroundMusic() {
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const modeRef = useRef<MusicMode>("off");

  useEffect(() => {
    const el = new Audio(MUSIC_SRC);
    el.loop = true;
    el.preload = "auto";
    audioRef.current = el;

    const applyVolume = (prefs: AudioPrefs) => {
      el.volume = prefs.muted ? 0 : prefs.masterVolume * prefs.musicVolume * volumeFactorFor(modeRef.current);
    };

    const manager = getAudioManager();
    applyVolume(manager.getPrefs());
    const unsubscribe = manager.subscribe(applyVolume);

    // إعادة المحاولة عند أول تفاعل حقيقي (لمسة/ضغطة/نقرة) - ضرورية على
    // أغلب متصفحات الجوال (Safari/Chrome) التي تمنع تشغيل صوت تلقائيًا
    // قبل أول تفاعل فعلي من المستخدمة، بغضّ النظر عن أي محاولة برمجية.
    const retry = () => {
      if (modeRef.current !== "off") el.play().catch(() => {});
    };
    window.addEventListener("pointerdown", retry);
    window.addEventListener("touchstart", retry, { passive: true });
    window.addEventListener("keydown", retry);

    return () => {
      unsubscribe();
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("touchstart", retry);
      window.removeEventListener("keydown", retry);
      el.pause();
    };
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    const mode = musicModeForPath(location.pathname);
    modeRef.current = mode;
    if (!el) return;

    const manager = getAudioManager();
    const prefs = manager.getPrefs();
    el.volume = prefs.muted ? 0 : prefs.masterVolume * prefs.musicVolume * volumeFactorFor(mode);

    if (mode === "off") {
      el.pause();
    } else {
      el.play().catch(() => {
        /* التشغيل التلقائي محظور حتى أول تفاعل - يعالجه مستمع اللمس/الضغط أعلاه */
      });
    }
  }, [location.pathname]);

  return null;
}
