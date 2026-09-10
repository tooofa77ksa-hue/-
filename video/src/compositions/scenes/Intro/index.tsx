import React from "react";
import { useCurrentFrame } from "remotion";
import type { SceneSchedule } from "../../../timeline";
import type { NafesCardData } from "../../../data/types";
import { Presenter } from "../../../components/Presenter/Presenter";
import { Title } from "../../../components/Title/Title";
import { ArabicText } from "../../../components/common/ArabicText";
import { SceneVoiceover } from "../../../audio/SceneVoiceover";
import { SfxCue } from "../../../audio/SfxCue";
import type { SfxKey } from "../../../audio/checkAssetExists";
import { colors } from "../../../styles/tokens";
import { timedReveal } from "../../../utils/animation";
import { findLine } from "../shared/sceneHelpers";

interface IntroSceneProps {
  scene: SceneSchedule;
  meta: NafesCardData["meta"];
  sfxAvailable: Record<SfxKey, boolean>;
  presenterVideoSrc?: string;
}

export const IntroScene: React.FC<IntroSceneProps> = ({ scene, meta, sfxAvailable, presenterVideoSrc }) => {
  const frame = useCurrentFrame();
  const line = findLine(scene, "intro_01");
  const fade = timedReveal(frame, 0, 20);

  return (
    <div style={{ position: "absolute", inset: 0, background: colors.paper, overflow: "hidden" }}>
      <SceneVoiceover scene={scene} />
      <SfxCue kind="whoosh" from={0} available={sfxAvailable.whoosh} />
      <SfxCue kind="titleHit" from={16} available={sfxAvailable.titleHit} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${colors.paper} 0%, #f4f8f6 100%)`,
          opacity: fade,
        }}
      />

      <Presenter side="right" gesture="lookingAtCamera" enterAtFrame={4} videoSrc={presenterVideoSrc} />

      <div
        style={{
          position: "absolute",
          top: "30%",
          right: 500,
          left: 140,
          textAlign: "center",
        }}
      >
        <Title
          text="التقرير السنوي لنتائج اختبارات نافس"
          startFrame={10}
          size={58}
          align="center"
        />
        <div style={{ marginTop: 20, opacity: timedReveal(frame, line.sceneRelativeStart, 20) }}>
          <ArabicText size={26} weight={500} color={colors.muted} align="center">
            {`${meta.schoolName} - ${meta.educationAdministration} - العام الدراسي ${meta.academicYear}`}
          </ArabicText>
        </div>
      </div>
    </div>
  );
};
