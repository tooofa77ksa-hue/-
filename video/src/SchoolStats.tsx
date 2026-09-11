import { AbsoluteFill, Sequence } from "remotion";
import { fontFamily } from "./brand/tokens";
import { FadeWrapper } from "./components/FadeWrapper";
import { StatsIntroScene, STATS_INTRO_DURATION } from "./scenes/StatsIntroScene";
import { StudentDistributionScene, STUDENT_DISTRIBUTION_DURATION } from "./scenes/StudentDistributionScene";
import { SmartScheduleScene, SMART_SCHEDULE_DURATION } from "./scenes/SmartScheduleScene";
import { TeacherDataScene, TEACHER_DATA_DURATION } from "./scenes/TeacherDataScene";

/**
 * New standalone composition for the school-stats section (employee/student/
 * class counts, student distribution table, smart schedule, teacher data) -
 * a separate video from Grade3Nafs/Grade6Nafs, built entirely in new files.
 * No grade-3/6 NAFS file was touched to build this.
 *
 * Narration audio: this section's real narration (6 short lines, see the
 * script sent to the user) has NOT been generated yet, so no <Audio> tag is
 * wired in here - this preview is visuals + SFX only, silent where the
 * presenter would speak. Once the real narration-school-stats.mp3 arrives,
 * add a single <Audio src={staticFile("audio/narration-school-stats.mp3")}/>
 * here and re-check each scene's *_DURATION against its real length (same
 * process as NARRATION-TIMING.md) - no other file needs to change.
 */
const introFrom = 0;
const distributionFrom = introFrom + STATS_INTRO_DURATION;
const scheduleFrom = distributionFrom + STUDENT_DISTRIBUTION_DURATION;
const teachersFrom = scheduleFrom + SMART_SCHEDULE_DURATION;

export const schoolStatsTotalDuration = teachersFrom + TEACHER_DATA_DURATION;

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
    </AbsoluteFill>
  );
};
