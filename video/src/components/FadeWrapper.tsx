import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

/**
 * Wraps a scene in a simple opacity fade-in/fade-out, entirely local to the
 * scene's own duration. Used instead of cross-scene TransitionSeries overlap
 * so every scene's frame range stays frame-exact - required to keep the
 * single continuous narration track in sync with the visuals.
 */
export const FadeWrapper: React.FC<{
  durationInFrames: number;
  fadeFrames?: number;
  children: React.ReactNode;
}> = ({ durationInFrames, fadeFrames = 12, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
