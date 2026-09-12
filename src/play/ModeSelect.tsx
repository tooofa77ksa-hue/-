import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GAME_MODE_LABELS } from "@/game/modes/registry";
import { useGameSettings } from "./useGameData";
import { useBranding } from "@/lib/useBranding";
import { AudioControls } from "./AudioControls";
import type { GameMode } from "@/types/models";

const MODE_EMOJI: Record<GameMode, string> = {
  rocket_mission: "🚀",
  squishy_treasure: "💎",
  magic_gate: "🌈",
};

const ALL_MODES: GameMode[] = ["rocket_mission", "squishy_treasure", "magic_gate"];

export function ModeSelect() {
  const navigate = useNavigate();
  const settings = useGameSettings();
  const branding = useBranding();
  const activeModes = settings?.activeGameModes?.length ? settings.activeGameModes : ALL_MODES;
  const [leaving, setLeaving] = useState<GameMode | null>(null);

  const handlePick = (mode: GameMode) => {
    if (leaving) return;
    setLeaving(mode);
    window.setTimeout(() => navigate(`/play/${mode}`), 160);
  };

  return (
    <div className="mode-select">
      <div className="mode-select__audio">
        <AudioControls />
      </div>
      <h1 className="mode-select__title">{branding.welcomeMessage}</h1>
      <div className="mode-select__grid">
        {activeModes.map((mode) => (
          <button
            key={mode}
            className={`mode-card mode-card--${mode} ${leaving === mode ? "is-leaving" : ""}`}
            onClick={() => handlePick(mode)}
          >
            <span className="mode-card__emoji">{MODE_EMOJI[mode]}</span>
            <span className="mode-card__label">{GAME_MODE_LABELS[mode]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
