import { useEffect, useState } from "react";
import { getAudioSettings, getGameSettings, updateAudioSettings, updateGameSettings } from "@/lib/repo";
import { GAME_MODE_KEYS, GAME_MODE_LABELS_AR } from "@/lib/constants";
import { DEFAULT_BRANDING } from "@/lib/starterData";
import type { AudioSettings, BrandingSettings, GameMode, GameSettings } from "@/types/models";

const DEFAULT_GAME: Omit<GameSettings, "updatedAt"> = {
  activeGameModes: ["rocket_mission", "squishy_treasure", "magic_gate"],
  defaultGameMode: "rocket_mission",
  defaultDifficulty: "easy",
  questionsPerRound: 6,
  branding: DEFAULT_BRANDING,
};

const DEFAULT_AUDIO: Omit<AudioSettings, "updatedAt"> = {
  masterVolumeDefault: 0.8,
  voiceVolumeDefault: 1,
  sfxVolumeDefault: 0.7,
  quietModeDefault: false,
  reducedMotionDefault: false,
  duckingAmount: 0.6,
};

export function SettingsPage() {
  const [game, setGame] = useState<GameSettings | null>(null);
  const [audio, setAudio] = useState<AudioSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getGameSettings().then((g) =>
      setGame(g ? { ...g, branding: { ...DEFAULT_BRANDING, ...g.branding } } : { ...DEFAULT_GAME, updatedAt: Date.now() })
    );
    getAudioSettings().then((a) => setAudio(a || { ...DEFAULT_AUDIO, updatedAt: Date.now() }));
  }, []);

  if (!game || !audio) return <div>جارٍ التحميل...</div>;

  const toggleMode = (mode: GameMode) => {
    const active = game.activeGameModes.includes(mode)
      ? game.activeGameModes.filter((m) => m !== mode)
      : [...game.activeGameModes, mode];
    setGame({ ...game, activeGameModes: active });
  };

  const setBrandingField = (field: keyof BrandingSettings, value: string) => {
    setGame({ ...game, branding: { ...game.branding, [field]: value } });
  };

  const save = async () => {
    await Promise.all([updateGameSettings(game), updateAudioSettings(audio)]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <h1>إعدادات اللعبة والصوت</h1>

      <section>
        <h2>الهوية والنصوص التعريفية</h2>
        <p className="muted">
          كل نص هنا يظهر مباشرة في اللعبة والصفحة الرئيسية والفوتر فور الحفظ - بلا أي تعديل على
          الكود وبلا إعادة نشر.
        </p>
        <label>
          اسم اللعبة (العنوان الرئيسي)
          <input value={game.branding.gameName} onChange={(e) => setBrandingField("gameName", e.target.value)} />
        </label>
        <label>
          الوصف المختصر تحت الاسم
          <input value={game.branding.gameTagline} onChange={(e) => setBrandingField("gameTagline", e.target.value)} />
        </label>
        <label>
          عبارة الترحيب في شاشة اختيار اللعبة
          <input
            value={game.branding.welcomeMessage}
            onChange={(e) => setBrandingField("welcomeMessage", e.target.value)}
          />
        </label>
        <label>
          اسم المدرسة (السطر الأول في الفوتر)
          <input value={game.branding.schoolName} onChange={(e) => setBrandingField("schoolName", e.target.value)} />
        </label>
        <div className="form-row">
          <label>
            اسم المديرة
            <input
              value={game.branding.principalName}
              onChange={(e) => setBrandingField("principalName", e.target.value)}
            />
          </label>
          <label>
            اسم الوكيلة
            <input value={game.branding.deputyName} onChange={(e) => setBrandingField("deputyName", e.target.value)} />
          </label>
        </div>
        <label>
          اسم المعلمة (سطر التصميم الصغير أسفل الفوتر)
          <input
            value={game.branding.designerCredit}
            onChange={(e) => setBrandingField("designerCredit", e.target.value)}
          />
        </label>
      </section>

      <section>
        <h2>إعدادات اللعبة</h2>
        <label>
          عدد الأسئلة في الجولة الواحدة
          <input
            type="number"
            min={1}
            max={20}
            value={game.questionsPerRound}
            onChange={(e) => setGame({ ...game, questionsPerRound: Number(e.target.value) })}
          />
        </label>

        <div>
          <p>الألعاب المفعّلة في /play:</p>
          {GAME_MODE_KEYS.map((mode) => (
            <label key={mode} className="checkbox-label">
              <input
                type="checkbox"
                checked={game.activeGameModes.includes(mode)}
                onChange={() => toggleMode(mode)}
              />
              {GAME_MODE_LABELS_AR[mode]}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2>الإعدادات الافتراضية للصوت (تُطبَّق أول مرة لدى الطالبة)</h2>
        <label>
          مستوى الصوت العام
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={audio.masterVolumeDefault}
            onChange={(e) => setAudio({ ...audio, masterVolumeDefault: Number(e.target.value) })}
          />
        </label>
        <label>
          مستوى صوت الشخصية
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={audio.voiceVolumeDefault}
            onChange={(e) => setAudio({ ...audio, voiceVolumeDefault: Number(e.target.value) })}
          />
        </label>
        <label>
          مستوى المؤثرات الصوتية
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={audio.sfxVolumeDefault}
            onChange={(e) => setAudio({ ...audio, sfxVolumeDefault: Number(e.target.value) })}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={audio.quietModeDefault}
            onChange={(e) => setAudio({ ...audio, quietModeDefault: e.target.checked })}
          />
          تفعيل الوضع الهادئ افتراضيًا
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={audio.reducedMotionDefault}
            onChange={(e) => setAudio({ ...audio, reducedMotionDefault: e.target.checked })}
          />
          تقليل الحركة افتراضيًا
        </label>
      </section>

      <button className="primary-btn" onClick={save}>
        حفظ الإعدادات
      </button>
      {saved && <span className="save-confirm">تم الحفظ ✓</span>}
    </div>
  );
}
