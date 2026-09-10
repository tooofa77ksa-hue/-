import React from "react";
import type { SceneSchedule } from "../../../timeline";
import type { SfxKey } from "../../../audio/checkAssetExists";
import { nafesThird } from "../../../data/nafes-third";
import { NafesGradeScene } from "../shared/NafesGradeScene";
import { SceneVoiceover } from "../../../audio/SceneVoiceover";

interface NafesThirdSceneProps {
  scene: SceneSchedule;
  sfxAvailable: Record<SfxKey, boolean>;
  presenterVideoSrc?: string;
}

/** بطاقة نافس - الصف الثالث: المذيعة إلى اليمين، البيانات إلى اليسار */
export const NafesThirdScene: React.FC<NafesThirdSceneProps> = ({ scene, sfxAvailable, presenterVideoSrc }) => (
  <>
    <SceneVoiceover scene={scene} />
    <NafesGradeScene
      scene={scene}
      data={nafesThird}
      presenterSide="right"
      contentAlign="start"
      introLineId="third_intro_01"
      trendLineIds={["third_trend_2023", "third_trend_2025", "third_trend_2026"]}
      compareLineId="third_compare_01"
      subjectLineIds={["third_subject_math_01", "third_subject_reading_01"]}
      summaryLineId="third_summary_01"
      sfxAvailable={sfxAvailable}
      presenterVideoSrc={presenterVideoSrc}
    />
  </>
);
