import React from "react";
import type { SceneSchedule } from "../../../timeline";
import type { SfxKey } from "../../../audio/checkAssetExists";
import { nafesSixth } from "../../../data/nafes-sixth";
import { NafesGradeScene } from "../shared/NafesGradeScene";
import { SceneVoiceover } from "../../../audio/SceneVoiceover";

interface NafesSixthSceneProps {
  scene: SceneSchedule;
  sfxAvailable: Record<SfxKey, boolean>;
  presenterVideoSrc?: string;
}

/**
 * بطاقة نافس - الصف السادس: تنويع مقصود عن الصف الثالث (المذيعة تبدأ من
 * اليسار، والبيانات تنتقل نحو منتصف الشاشة) مع نفس Design System تمامًا.
 */
export const NafesSixthScene: React.FC<NafesSixthSceneProps> = ({ scene, sfxAvailable, presenterVideoSrc }) => (
  <>
    <SceneVoiceover scene={scene} />
    <NafesGradeScene
      scene={scene}
      data={nafesSixth}
      presenterSide="left"
      contentAlign="center"
      introLineId="sixth_intro_01"
      trendLineIds={["sixth_trend_2023", "sixth_trend_2025", "sixth_trend_2026"]}
      compareLineId="sixth_compare_01"
      subjectLineIds={["sixth_subject_science_01", "sixth_subject_reading_01", "sixth_subject_math_01"]}
      summaryLineId="sixth_summary_01"
      sfxAvailable={sfxAvailable}
      presenterVideoSrc={presenterVideoSrc}
    />
  </>
);
