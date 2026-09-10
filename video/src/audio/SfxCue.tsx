import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { SFX_FILES, type SfxKey } from "./checkAssetExists";

interface SfxCueProps {
  kind: SfxKey;
  /** إطار التشغيل نسبة إلى بداية المشهد الحالي (Sequence الأب) */
  from: number;
  available: boolean;
  volume?: number;
}

/**
 * مؤثر صوتي لحظي (Whoosh/Riser/Impact/Tick) متزامن مع حركة بصرية محددة -
 * لا يُشغَّل إطلاقًا إن لم يكن الملف متوفرًا (available)، فلا صوت بديل رخيص.
 */
export const SfxCue: React.FC<SfxCueProps> = ({ kind, from, available, volume = 0.55 }) => {
  if (!available) return null;
  return (
    <Sequence from={from} durationInFrames={30} layout="none">
      <Audio src={staticFile(SFX_FILES[kind])} volume={volume} />
    </Sequence>
  );
};
