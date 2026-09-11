import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { fontFamily } from "./brand/tokens";
import { IntroScene, INTRO_DURATION } from "./scenes/IntroScene";
import { HeadlineScene, HEADLINE_DURATION } from "./scenes/HeadlineScene";
import { SubjectScene, SUBJECT_DURATION } from "./scenes/SubjectScene";
import { OutroScene, OUTRO_DURATION } from "./scenes/OutroScene";
import { math, reading } from "./data/grade3";

const TRANSITION_FRAMES = 15;

export const grade3TotalDuration =
  INTRO_DURATION + HEADLINE_DURATION + SUBJECT_DURATION * 2 + OUTRO_DURATION - TRANSITION_FRAMES * 4;

export const Grade3Nafs: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily, direction: "rtl" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_DURATION} name="Intro">
          <IntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />

        <TransitionSeries.Sequence durationInFrames={HEADLINE_DURATION} name="Headline">
          <HeadlineScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />

        <TransitionSeries.Sequence durationInFrames={SUBJECT_DURATION} name="Math">
          <SubjectScene
            subjectTitle="الرياضيات"
            distribution={math.distribution}
            averageScore={math.averageScore}
            proficiency={math.proficiency}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />

        <TransitionSeries.Sequence durationInFrames={SUBJECT_DURATION} name="Reading">
          <SubjectScene
            subjectTitle="القراءة"
            distribution={reading.distribution}
            averageScore={reading.averageScore}
            proficiency={reading.proficiency}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />

        <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION} name="Outro">
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
