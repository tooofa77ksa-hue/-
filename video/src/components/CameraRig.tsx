import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

/**
 * Subtle, professional camera movement: a slow continuous push-in (Ken Burns
 * style) plus a faint drift, so every scene feels alive without distracting
 * from the data. Not a per-datapoint "punch" - stays gentle throughout.
 */
export const CameraRig: React.FC<{
  durationInFrames: number;
  intensity?: number;
  children: React.ReactNode;
}> = ({ durationInFrames, intensity = 1, children }) => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, durationInFrames], [1, 1 + 0.045 * intensity], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
    output: "perceptual-scale",
  });

  const driftX = interpolate(frame, [0, durationInFrames], [6 * intensity, -6 * intensity], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  const driftY = interpolate(frame, [0, durationInFrames], [-4 * intensity, 4 * intensity], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  return (
    <AbsoluteFill
      style={{
        scale,
        translate: `${driftX}px ${driftY}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
