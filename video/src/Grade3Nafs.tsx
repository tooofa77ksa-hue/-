import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { fontFamily } from "./brand/tokens";
import { FadeWrapper } from "./components/FadeWrapper";
import { IntroScene, INTRO_DURATION } from "./scenes/IntroScene";
import { HeadlineScene, HEADLINE_DURATION } from "./scenes/HeadlineScene";
import { MathScene, MATH_DURATION } from "./scenes/MathScene";
import { ReadingScene, READING_DURATION } from "./scenes/ReadingScene";
import { OutroScene, OUTRO_DURATION } from "./scenes/OutroScene";

/**
 * Scene durations are placed back-to-back with no time overlap (plain
 * <Sequence>, not TransitionSeries) so the single continuous narration
 * track (public/audio/narration-grade3.mp3) stays frame-exact in sync with
 * every scene. Each scene fades itself in/out locally instead. See
 * video/NARRATION-TIMING.md for how these numbers were derived from the
 * voiceover's word distribution.
 */
const introFrom = 0;
const headlineFrom = introFrom + INTRO_DURATION;
const mathFrom = headlineFrom + HEADLINE_DURATION;
const readingFrom = mathFrom + MATH_DURATION;
const outroFrom = readingFrom + READING_DURATION;

export const grade3TotalDuration = outroFrom + OUTRO_DURATION;

export const Grade3Nafs: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily, direction: "rtl" }}>
      <Audio src={staticFile("audio/narration-grade3.mp3")} />

      <Sequence from={introFrom} durationInFrames={INTRO_DURATION} layout="absolute-fill" name="Intro">
        <FadeWrapper durationInFrames={INTRO_DURATION}>
          <IntroScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={headlineFrom} durationInFrames={HEADLINE_DURATION} layout="absolute-fill" name="Headline">
        <FadeWrapper durationInFrames={HEADLINE_DURATION}>
          <HeadlineScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={mathFrom} durationInFrames={MATH_DURATION} layout="absolute-fill" name="Math">
        <FadeWrapper durationInFrames={MATH_DURATION}>
          <MathScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={readingFrom} durationInFrames={READING_DURATION} layout="absolute-fill" name="Reading">
        <FadeWrapper durationInFrames={READING_DURATION}>
          <ReadingScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={outroFrom} durationInFrames={OUTRO_DURATION} layout="absolute-fill" name="Outro">
        <FadeWrapper durationInFrames={OUTRO_DURATION}>
          <OutroScene />
        </FadeWrapper>
      </Sequence>
    </AbsoluteFill>
  );
};
