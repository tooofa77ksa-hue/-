import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { fontFamily } from "./brand/tokens";
import { FadeWrapper } from "./components/FadeWrapper";
import { Grade6IntroScene, INTRO_DURATION } from "./scenes/Grade6IntroScene";
import { Grade6HeadlineScene, HEADLINE_DURATION } from "./scenes/Grade6HeadlineScene";
import { ScienceScene, SCIENCE_DURATION } from "./scenes/ScienceScene";
import { Grade6ReadingScene, READING_DURATION } from "./scenes/Grade6ReadingScene";
import { Grade6MathScene, MATH_DURATION } from "./scenes/Grade6MathScene";
import { Grade6OutroScene, OUTRO_DURATION } from "./scenes/Grade6OutroScene";

/**
 * Same structure as Grade3Nafs.tsx: scenes placed back-to-back with no time
 * overlap so the single continuous narration track
 * (public/audio/narration-grade6.mp3) stays frame-exact in sync. Subject
 * order (Science, Reading, Math) follows the source card's own page order.
 * See video/NARRATION-TIMING-grade6.md for how the numbers were derived.
 */
const introFrom = 0;
const headlineFrom = introFrom + INTRO_DURATION;
const scienceFrom = headlineFrom + HEADLINE_DURATION;
const readingFrom = scienceFrom + SCIENCE_DURATION;
const mathFrom = readingFrom + READING_DURATION;
const outroFrom = mathFrom + MATH_DURATION;

export const grade6TotalDuration = outroFrom + OUTRO_DURATION;

export const Grade6Nafs: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily, direction: "rtl" }}>
      <Audio src={staticFile("audio/narration-grade6.mp3")} />

      <Sequence from={introFrom} durationInFrames={INTRO_DURATION} layout="absolute-fill" name="Intro">
        <FadeWrapper durationInFrames={INTRO_DURATION}>
          <Grade6IntroScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={headlineFrom} durationInFrames={HEADLINE_DURATION} layout="absolute-fill" name="Headline">
        <FadeWrapper durationInFrames={HEADLINE_DURATION}>
          <Grade6HeadlineScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={scienceFrom} durationInFrames={SCIENCE_DURATION} layout="absolute-fill" name="Science">
        <FadeWrapper durationInFrames={SCIENCE_DURATION}>
          <ScienceScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={readingFrom} durationInFrames={READING_DURATION} layout="absolute-fill" name="Reading">
        <FadeWrapper durationInFrames={READING_DURATION}>
          <Grade6ReadingScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={mathFrom} durationInFrames={MATH_DURATION} layout="absolute-fill" name="Math">
        <FadeWrapper durationInFrames={MATH_DURATION}>
          <Grade6MathScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={outroFrom} durationInFrames={OUTRO_DURATION} layout="absolute-fill" name="Outro">
        <FadeWrapper durationInFrames={OUTRO_DURATION}>
          <Grade6OutroScene />
        </FadeWrapper>
      </Sequence>
    </AbsoluteFill>
  );
};
