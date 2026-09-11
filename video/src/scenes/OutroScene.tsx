import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { schoolInfo } from "../data/grade3";
import { CameraRig } from "../components/CameraRig";
import { Sfx } from "../components/Sfx";

export const OUTRO_DURATION = 105;

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const logoIn = interpolate(frame, [6, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
    output: "perceptual-scale",
  });
  const textIn = interpolate(frame, [22, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: brand.paper, alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="impact" at={4} volume={0.5} />
      <CameraRig durationInFrames={OUTRO_DURATION} intensity={0.5}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}>
          <Img
            src={staticFile("ministry-logo.webp")}
            style={{ height: 120, width: "auto", scale: logoIn, opacity: logoIn, margin: 18 }}
          />
          <div
            style={{
              opacity: textIn,
              translate: `0 ${interpolate(textIn, [0, 1], [14, 0])}px`,
              fontFamily,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 800, color: brand.primaryDark }}>
              {schoolInfo.schoolName}
            </div>
            <div style={{ fontSize: 20, color: brand.muted }}>
              بطاقة نافس - {schoolInfo.grade} - {schoolInfo.academicYear}
            </div>
          </div>
        </AbsoluteFill>
      </CameraRig>
    </AbsoluteFill>
  );
};
