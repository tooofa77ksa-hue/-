import { AbsoluteFill, Sequence } from "remotion";
import { fontFamily } from "./brand/tokens";
import { FadeWrapper } from "./components/FadeWrapper";
import { StatsIntroScene, STATS_INTRO_DURATION } from "./scenes/StatsIntroScene";
import { StudentDistributionScene, STUDENT_DISTRIBUTION_DURATION } from "./scenes/StudentDistributionScene";
import { SmartScheduleScene, SMART_SCHEDULE_DURATION } from "./scenes/SmartScheduleScene";
import { TeacherDataScene, TEACHER_DATA_DURATION } from "./scenes/TeacherDataScene";
import { FacilitiesScene, FACILITIES_DURATION } from "./scenes/FacilitiesScene";

/**
 * New standalone composition for the school-stats section (employee/student/
 * class counts, student distribution table, smart schedule, teacher data) -
 * a separate video from Grade3Nafs/Grade6Nafs, built entirely in new files.
 * No grade-3/6 NAFS file was touched to build this.
 *
 * Narration audio: unlike Grade3Nafs/Grade6Nafs (one continuous track), this
 * section only speaks at 6 short, isolated points, so each of those 6 real
 * ElevenLabs lines (public/audio/school-stats/line1.mp3 .. line6.mp3, same
 * voice as grade-3/6) is wired directly inside its own scene/beat as a
 * local <Audio>, not here at the composition level - see StatsIntroScene.tsx
 * (line1-3) and the TransitionBeat in StudentDistributionScene.tsx (line4),
 * SmartScheduleScene.tsx (line5), TeacherDataScene.tsx (line6). Each scene's
 * *_DURATION is derived from that line's real measured length.
 */
const introFrom = 0;
const distributionFrom = introFrom + STATS_INTRO_DURATION;
const scheduleFrom = distributionFrom + STUDENT_DISTRIBUTION_DURATION;
const teachersFrom = scheduleFrom + SMART_SCHEDULE_DURATION;
const facilitiesFrom = teachersFrom + TEACHER_DATA_DURATION;

export const schoolStatsTotalDuration = facilitiesFrom + FACILITIES_DURATION;

export const SchoolStats: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily, direction: "rtl" }}>
      <Sequence from={introFrom} durationInFrames={STATS_INTRO_DURATION} layout="absolute-fill" name="StatsIntro">
        <FadeWrapper durationInFrames={STATS_INTRO_DURATION}>
          <StatsIntroScene />
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
