import { AbsoluteFill, Sequence } from "remotion";
import { fontFamily } from "./brand/tokens";
import { FadeWrapper } from "./components/FadeWrapper";
import { OrgStatsScene, ORG_STATS_DURATION } from "./scenes/OrgStatsScene";
import { StudentDistributionScene, STUDENT_DISTRIBUTION_DURATION } from "./scenes/StudentDistributionScene";
import { SmartScheduleScene, SMART_SCHEDULE_DURATION } from "./scenes/SmartScheduleScene";
import { TeacherDataScene, TEACHER_DATA_DURATION } from "./scenes/TeacherDataScene";
import { FacilitiesScene, FACILITIES_DURATION } from "./scenes/FacilitiesScene";

/**
 * New standalone composition for the school-stats section (organizational/
 * statistical map, student distribution table, smart schedule, teacher
 * data) - a separate video from Grade3Nafs/Grade6Nafs, built entirely in
 * new files. No grade-3/6 NAFS file was touched to build this.
 *
 * OrgStatsScene replaces the old StatsIntroScene as this video's opening
 * beat (per explicit user request, to avoid showing employee/student/class
 * counts twice) - StatsIntroScene.tsx itself was left untouched on disk,
 * just removed from this timeline.
 *
 * Narration audio: unlike Grade3Nafs/Grade6Nafs (one continuous track), this
 * section only speaks at isolated points, so each real ElevenLabs line
 * (public/audio/school-stats/*.mp3, same voice as grade-3/6) is wired
 * directly inside its own scene/beat as a local <Audio> - see the
 * TransitionBeat in StudentDistributionScene.tsx (line4), SmartScheduleScene
 * .tsx (line5), TeacherDataScene.tsx (line6). OrgStatsScene's narration is
 * still pending (user is recording it); its duration is a provisional
 * word-count estimate until that audio arrives - see the comment at the top
 * of OrgStatsScene.tsx. Each scene's *_DURATION is derived from its line's
 * real measured length once recorded.
 */
const introFrom = 0;
const distributionFrom = introFrom + ORG_STATS_DURATION;
const scheduleFrom = distributionFrom + STUDENT_DISTRIBUTION_DURATION;
const teachersFrom = scheduleFrom + SMART_SCHEDULE_DURATION;
const facilitiesFrom = teachersFrom + TEACHER_DATA_DURATION;

export const schoolStatsTotalDuration = facilitiesFrom + FACILITIES_DURATION;

export const SchoolStats: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily, direction: "rtl" }}>
      <Sequence from={introFrom} durationInFrames={ORG_STATS_DURATION} layout="absolute-fill" name="OrgStats">
        <FadeWrapper durationInFrames={ORG_STATS_DURATION}>
          <OrgStatsScene />
        </FadeWrapper>
      </Sequence>

      <Sequence
        from={distributionFrom}
        durationInFrames={STUDENT_DISTRIBUTION_DURATION}
        layout="absolute-fill"
        name="StudentDistribution"
      >
        <FadeWrapper durationInFrames={STUDENT_DISTRIBUTION_DURATION}>
          <StudentDistributionScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={scheduleFrom} durationInFrames={SMART_SCHEDULE_DURATION} layout="absolute-fill" name="SmartSchedule">
        <FadeWrapper durationInFrames={SMART_SCHEDULE_DURATION}>
          <SmartScheduleScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={teachersFrom} durationInFrames={TEACHER_DATA_DURATION} layout="absolute-fill" name="TeacherData">
        <FadeWrapper durationInFrames={TEACHER_DATA_DURATION}>
          <TeacherDataScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={facilitiesFrom} durationInFrames={FACILITIES_DURATION} layout="absolute-fill" name="Facilities">
        <FadeWrapper durationInFrames={FACILITIES_DURATION}>
          <FacilitiesScene />
        </FadeWrapper>
      </Sequence>
    </AbsoluteFill>
  );
};
