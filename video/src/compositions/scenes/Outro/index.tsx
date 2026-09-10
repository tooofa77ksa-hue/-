import React from "react";
import { useCurrentFrame } from "remotion";
import type { SceneSchedule } from "../../../timeline";
import { Presenter } from "../../../components/Presenter/Presenter";
import { Title } from "../../../components/Title/Title";
import { ArabicText } from "../../../components/common/ArabicText";
import { SceneVoiceover } from "../../../audio/SceneVoiceover";
import { SfxCue } from "../../../audio/SfxCue";
import type { SfxKey } from "../../../audio/checkAssetExists";
import { colors } from "../../../styles/tokens";
import { timedReveal } from "../../../utils/animation";
import { findLine } from "../shared/sceneHelpers";

interface OutroSceneProps {
  scene: SceneSchedule;
  sfxAvailable: Record<SfxKey, boolean>;
  presenterVideoSrc?: string;
}

export const OutroScene: React.FC<OutroSceneProps> = ({ scene, sfxAvailable, presenterVideoSrc }) => {
  const frame = useCurrentFrame();
  const line = findLine(scene, "outro_01");

  return (
    <div style={{ position: "absolute", inset: 0, background: colors.paper, overflow: "hidden" }}>
      <SceneVoiceover scene={scene} />
      <SfxCue kind="whoosh" from={0} available={sfxAvailable.whoosh} />

      <Presenter side="right" gesture="lookingAtCamera" enterAtFrame={2} videoSrc={presenterVideoSrc} />

      <div
        style={{
          position: "absolute",
          top: "36%",
          right: 500,
          left: 140,
          textAlign: "center",
        }}
      >
        <Title text="شكرًا لكم" startFrame={8} size={58} align="center" />
        <div style={{ marginTop: 20, opacity: timedReveal(frame, line.sceneRelativeStart, 20) }}>
          <ArabicText size={26} weight={500} color={colors.muted} align="center">
            {line.text}
          </ArabicText>
        </div>
      </div>
    </div>
  );
};
