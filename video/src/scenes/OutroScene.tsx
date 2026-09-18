import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { schoolInfo } from "../data/grade3";
import { CameraRig } from "../components/CameraRig";
import { SceneChrome } from "../components/SceneChrome";
import { Sfx } from "../components/Sfx";

// Matches the narration's closing-sentence duration (see
// video/NARRATION-TIMING.md).
export const OUTRO_DURATION = 193;

const Chip: React.FC<{ text: string; tone: "up" | "down"; from: number }> = ({ text, tone, from }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, from + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
    output: "perceptual-scale",
  });
  const bg = tone === "up" ? "#e7f8ef" : "#fdeaea";
  const fg = tone === "up" ? "#1f9d5c" : "#c0392b";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: bg,
        color: fg,
        borderRadius: 999,
        padding: "6px 18px",
        fontWeight: 800,
        opacity: t,
        scale: t,
      }}
    >
      {tone === "up" ? "↑" : "↓"} {text}
    </span>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();

  const textIn = interpolate(frame, [10, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <Sfx kind="impact" at={6} volume={0.5} />
      <SceneChrome sectionTitle="خلاصة" />
      <CameraRig durationInFrames={OUTRO_DURATION} intensity={0.5}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30, paddingTop: 90 }}>
          <div
            style={{
              opacity: textIn,
              translate: `0 ${interpolate(textIn, [0, 1], [16, 0])}px`,
              fontFamily,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 26,
              background: "#fbfdfc",
              borderRadius: 28,
              padding: "50px 70px",
              boxShadow: "0 20px 60px rgba(21,68,90,0.10)",
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 800, color: brand.primaryDark }}>باختصار</div>
            <div style={{ display: "flex", gap: 20, fontSize: 24 }}>
              <Chip text="تحسّن ملموس في الرياضيات" tone="up" from={30} />
              <Chip text="تراجع يستدعي الانتباه في القراءة" tone="down" from={50} />
            </div>
            <div style={{ fontSize: 18, color: brand.muted, marginTop: 8 }}>
              {schoolInfo.schoolName} - {reportLine()}
            </div>
          </div>
        </AbsoluteFill>
      </CameraRig>
    </AbsoluteFill>
  );
};

function reportLine() {
  return `بطاقة نافس - ${schoolInfo.grade}`;
}
