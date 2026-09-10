import React from "react";
import { useCurrentFrame } from "remotion";
import type { SceneSchedule } from "../../../timeline";
import { Presenter } from "../../../components/Presenter/Presenter";
import { ArabicText } from "../../../components/common/ArabicText";
import { SceneVoiceover } from "../../../audio/SceneVoiceover";
import { SfxCue } from "../../../audio/SfxCue";
import type { SfxKey } from "../../../audio/checkAssetExists";
import { colors } from "../../../styles/tokens";
import { timedReveal } from "../../../utils/animation";
import { findLine } from "../shared/sceneHelpers";

interface TransitionSceneProps {
  scene: SceneSchedule;
  sfxAvailable: Record<SfxKey, boolean>;
  presenterVideoSrc?: string;
}

/**
 * فاصل قصير بين بطاقتَي الصف الثالث والسادس - Zoom out بسيط وعودة المذيعة
 * إلى منتصف الشاشة، ثم Transition Whoosh احترافي عند الخروج (يُشغَّل من
 * SceneTransition.ts بين مشهدي TransitionSeries في Root.tsx).
 */
export const TransitionScene: React.FC<TransitionSceneProps> = ({
  scene,
  sfxAvailable,
  presenterVideoSrc,
}) => {
  const frame = useCurrentFrame();
  const line = findLine(scene, "transition_01");
  const zoomOut = timedReveal(frame, 0, scene.durationInFrames, { from: 1.04, to: 1 });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: colors.primaryDark,
        overflow: "hidden",
        transform: `scale(${zoomOut})`,
      }}
    >
      <SceneVoiceover scene={scene} />
      <SfxCue kind="transitionWhoosh" from={0} available={sfxAvailable.transitionWhoosh} />

      <Presenter side="center" gesture="lookingAtCamera" enterAtFrame={0} videoSrc={presenterVideoSrc} />

      <div
        style={{
          position: "absolute",
          top: 140,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: timedReveal(frame, line.sceneRelativeStart, 16),
        }}
      >
        <ArabicText size={40} weight={700} color="#ffffff" align="center">
          {line.text}
        </ArabicText>
      </div>
    </div>
  );
};
