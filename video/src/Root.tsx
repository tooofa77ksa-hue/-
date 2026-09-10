import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { MainVideo, type MainVideoProps } from "./MainVideo";
import { buildTimeline } from "./timeline";
import { voiceoverScript } from "./data/voiceover-scripts";
import { resolveAllVoiceLines } from "./audio/getVoiceDuration";
import { resolveAssetAvailability } from "./audio/checkAssetExists";
import { TRANSITION_DURATION_FRAMES } from "./components/Transition/SceneTransition";
import { layout } from "./styles/tokens";

const NUMBER_OF_TRANSITIONS = 4; // Intro↔Third↔Transition↔Sixth↔Outro = 4 انتقالات

const calculateMetadata: CalculateMetadataFunction<MainVideoProps> = async () => {
  const [resolvedLines, availability] = await Promise.all([
    resolveAllVoiceLines(voiceoverScript),
    resolveAssetAvailability(),
  ]);

  const timeline = buildTimeline(resolvedLines, layout.fps);
  const durationInFrames = Math.max(
    layout.fps,
    timeline.totalDurationInFrames - NUMBER_OF_TRANSITIONS * TRANSITION_DURATION_FRAMES,
  );

  return {
    durationInFrames,
    fps: layout.fps,
    width: layout.width,
    height: layout.height,
    props: {
      timeline,
      musicAvailable: availability.music,
      sfxAvailable: availability.sfx,
    },
  };
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={300}
        fps={layout.fps}
        width={layout.width}
        height={layout.height}
        defaultProps={{
          timeline: { scenes: [], totalDurationInFrames: 300, fps: layout.fps },
          musicAvailable: false,
          sfxAvailable: {
            whoosh: false,
            riser: false,
            impact: false,
            tick: false,
            transitionWhoosh: false,
            titleHit: false,
          },
        }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
