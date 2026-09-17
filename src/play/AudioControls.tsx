import { useEffect, useState } from "react";
import { getAudioManager, type AudioPrefs } from "@/game/audio/AudioManager";

export function AudioControls() {
  const manager = getAudioManager();
  const [prefs, setPrefs] = useState<AudioPrefs>(manager.getPrefs());
  const [open, setOpen] = useState(false);

  useEffect(() => manager.subscribe(setPrefs), [manager]);

  return (
    <div className="audio-controls">
      <div className="audio-controls__row">
        <button
          className="audio-controls__toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label="إعدادات الصوت"
        >
          {prefs.muted ? "🔇" : "🔊"}
        </button>
        {/* زر مباشر وواضح دائمًا (بلا حاجة لفتح اللوحة) لأن كتم أغنية
           "نافس" تحديدًا طُلب بإلحاح، فوضعه خلف قائمة منسدلة مخفية جعله
           غير مكتشَف عمليًا رغم وجوده فعلًا في الكود. */}
        <button
          className={`audio-controls__music-toggle ${prefs.musicMuted ? "is-muted" : ""}`}
          onClick={() => manager.setPrefs({ musicMuted: !prefs.musicMuted })}
          aria-label={prefs.musicMuted ? "تشغيل أغنية نافس" : "كتم أغنية نافس"}
          title={prefs.musicMuted ? "أغنية نافس مكتومة - اضغطي للتشغيل" : "اضغطي لكتم أغنية نافس فقط"}
        >
          {prefs.musicMuted ? "🔕" : "🎵"}
        </button>
      </div>
      {open && (
        <div className="audio-controls__panel">
          <label>
            <input
              type="checkbox"
              checked={prefs.muted}
              onChange={(e) => manager.setPrefs({ muted: e.target.checked })}
            />
            كتم الصوت
          </label>
          <label>
            مستوى الصوت العام
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={prefs.masterVolume}
              onChange={(e) => manager.setPrefs({ masterVolume: Number(e.target.value) })}
            />
          </label>
          <label>
            صوت الشخصية
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={prefs.voiceVolume}
              onChange={(e) => manager.setPrefs({ voiceVolume: Number(e.target.value) })}
            />
          </label>
          <label>
            المؤثرات الصوتية
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={prefs.sfxVolume}
              onChange={(e) => manager.setPrefs({ sfxVolume: Number(e.target.value) })}
            />
          </label>
          <label>
            موسيقى الخلفية
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={prefs.musicVolume}
              onChange={(e) => manager.setPrefs({ musicVolume: Number(e.target.value) })}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={prefs.musicMuted}
              onChange={(e) => manager.setPrefs({ musicMuted: e.target.checked })}
            />
            كتم أغنية "نافس" فقط
          </label>
          <label>
            <input
              type="checkbox"
              checked={prefs.quietMode}
              onChange={(e) => manager.setPrefs({ quietMode: e.target.checked })}
            />
            الوضع الهادئ
          </label>
          <label>
            <input
              type="checkbox"
              checked={prefs.reducedMotion}
              onChange={(e) => manager.setPrefs({ reducedMotion: e.target.checked })}
            />
            تقليل الحركة
          </label>
        </div>
      )}
    </div>
  );
}
