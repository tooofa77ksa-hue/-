import { useEffect, useRef, useState } from "react";

const MUSIC_SRC = `${import.meta.env.BASE_URL}audio/theme.mp3`;
const VOLUME = 0.35;
const MUTE_KEY = "khatawati_music_muted";

/**
 * أغنية مشتركة تشتغل تلقائيًا عند فتح الموقع (أي صفحة) - نفس أسلوب
 * شعلة لغتي: عنصر <audio> واحد يُنشأ مرة واحدة، إعادة محاولة التشغيل
 * عند أول لمسة/ضغطة لتفادي قيود التشغيل التلقائي في المتصفحات، وزر
 * كتم/تشغيل ظاهر دائمًا. لا ينهار الموقع إذا لم يوضع ملف الأغنية بعد
 * (public/audio/theme.mp3) - فقط يبقى الزر بلا صوت فعلي.
 */
export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    const el = new Audio(MUSIC_SRC);
    el.loop = true;
    el.preload = "auto";
    el.volume = VOLUME;
    audioRef.current = el;

    const tryPlay = () => {
      if (!mutedRef.current) el.play().catch(() => {});
    };
    tryPlay();

    const retry = () => tryPlay();
    window.addEventListener("pointerdown", retry);
    window.addEventListener("touchstart", retry, { passive: true });
    window.addEventListener("keydown", retry);

    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("touchstart", retry);
      window.removeEventListener("keydown", retry);
      el.pause();
    };
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* لا مشكلة إن فشل الحفظ محليًا */
    }
    const el = audioRef.current;
    if (!el) return;
    if (next) el.pause();
    else el.play().catch(() => {});
  };

  return (
    <button type="button" className="music-toggle" onClick={toggleMute} aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}>
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
