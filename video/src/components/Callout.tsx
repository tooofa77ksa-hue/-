import { Easing, interpolate, useCurrentFrame } from "remotion";
import { fontFamily } from "../brand/tokens";
import { Sfx } from "./Sfx";

/** A small emphasis callout box for a spoken observation, e.g. a warning or a note. */
export const Callout: React.FC<{
  text: string;
  from: number;
  tone?: "neutral" | "warning";
  style?: React.CSSProperties;
}> = ({ text, from, tone = "neutral", style }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, from + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
    output: "perceptual-scale",
  });

  const bg = tone === "warning" ? "#fdeeee" : "#eef6f2";
  const fg = tone === "warning" ? "#b23b3b" : "#15445a";
  const border = tone === "warning" ? "#f3c6c6" : "#cfe6db";

  return (
    <div
      style={{
        opacity: t,
        scale: t,
        transformOrigin: "top center",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: bg,
        color: fg,
        border: `1.5px solid ${border}`,
        borderRadius: 16,
        padding: "16px 24px",
        fontFamily,
        fontSize: 22,
        fontWeight: 700,
        boxShadow: "0 10px 26px rgba(21,68,90,0.08)",
        ...style,
      }}
    >
      {tone === "warning" ? "⚠" : "•"}
      <span>{text}</span>
      <Sfx kind="tick" at={from} volume={0.3} />
    </div>
  );
};
