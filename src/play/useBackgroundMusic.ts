import { useEffect } from "react";
import { getAudioManager } from "@/game/audio/AudioManager";

const MUSIC_SRC = `${import.meta.env.BASE_URL}audio/music/intro_theme.mp3`;
// أخف من الأصوات الرئيسية حتى لا تطغى على صوت الشخصية والمؤثرات لاحقًا
const MUSIC_VOLUME_FACTOR = 0.35;

/** موسيقى خلفية لشاشة اختيار اللعبة فقط - تُستدعى من ModeSelect وتعتمد
 * كليًا على دورة حياة المكوّن نفسه: تبدأ عند التركيب، وتتوقف تلقائيًا عند
 * التفكيك (الانتقال لأي لعبة أو شاشة جلسة) بلا أي منطق توجيه إضافي، لأن
 * React Router يفكّك ModeSelect فورًا عند مغادرة المسار. تحترم كتم/مستوى
 * الصوت العام من AudioManager، وتتجاوز قيود التشغيل التلقائي للمتصفحات
 * بإعادة المحاولة عند أول تفاعل من المستخدمة إن لزم. */
export function useBackgroundMusic() {
  useEffect(() => {
    const manager = getAudioManager();
    const el = new Audio(MUSIC_SRC);
    el.loop = true;
    el.volume = manager.getPrefs().muted ? 0 : manager.getPrefs().masterVolume * MUSIC_VOLUME_FACTOR;

    let retryListenerAttached = false;
    const tryPlay = () => {
      el.play().catch(() => {
        if (retryListenerAttached) return;
        retryListenerAttached = true;
        const retry = () => {
          el.play().catch(() => {
            /* فشل ثانٍ (نادر) - نتجاهله بصمت بدل مقاطعة تجربة الطالبة */
          });
        };
        window.addEventListener("pointerdown", retry, { once: true });
      });
    };
    tryPlay();

    const unsubscribe = manager.subscribe((prefs) => {
      el.volume = prefs.muted ? 0 : prefs.masterVolume * MUSIC_VOLUME_FACTOR;
    });

    return () => {
      unsubscribe();
      el.pause();
      el.currentTime = 0;
    };
  }, []);
}
