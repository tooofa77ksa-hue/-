import { Easing, interpolate, useCurrentFrame } from "remotion";
import { CountUpNumber } from "./CountUpNumber";
import { performanceLevelColors, performanceLevelLabels } from "../data/grade3";
import { fontFamily } from "../brand/tokens";
import { Sfx } from "./Sfx";

type Distribution = { veryLow: number; low: number; medium: number; high: number };

const order: (keyof Distribution)[] = ["veryLow", "low", "medium", "high"];

export const DistributionBar: React.FC<{
  distribution: Distribution;
  from: number;
  width: number;
}> = ({ distribution, from, width }) => {
  const frame = useCurrentFrame();
  const segDuration = 18;

  let cumulative = 0;
  const segments = order.map((key, i) => {
    const left = cumulative;
    cumulative += distribution[key];
    return { key, left, value: distribution[key], from: from + i * segDuration };
  });

  return (
    <div style={{ width }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 76,
          borderRadius: 14,
          overflow: "hidden",
          background: "#eef2f1",
          boxShadow: "0 10px 30px rgba(21,68,90,0.12)",
        }}
      >
        {segments.map(({ key, left, value, from: segFrom }) => {
          const grow = interpolate(frame, [segFrom, segFrom + segDuration], [0, value], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const labelIn = interpolate(frame, [segFrom + segDuration - 8, segFrom + segDuration], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={key}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${left}%`,
                width: `${grow}%`,
                background: performanceLevelColors[key],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  opacity: labelIn,
                  whiteSpace: "nowrap",
                  color: key === "medium" ? "#15445a" : "#ffffff",
                  fontWeight: 800,
                  fontSize: 22,
                  fontFamily,
                }}
              >
                <CountUpNumber value={value} decimals={1} suffix="%" from={segFrom} durationInFrames={segDuration} />
              </span>
              <Sfx kind="tick" at={segFrom} volume={0.4} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, direction: "rtl" }}>
        {[...order].reverse().map((key) => {
          const seg = segments.find((s) => s.key === key)!;
          const appear = interpolate(frame, [seg.from, seg.from + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: appear,
                fontFamily,
                fontSize: 20,
                color: "#15445a",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: performanceLevelColors[key],
                  display: "inline-block",
                }}
              />
              {performanceLevelLabels[key]}
            </div>
          );
        })}
      </div>
    </div>
  );
};
