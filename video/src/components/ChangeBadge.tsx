import { Easing, interpolate, useCurrentFrame } from "remotion";
import { CountUpNumber } from "./CountUpNumber";

type Props = {
  change: number;
  decimals?: number;
  from?: number;
  style?: React.CSSProperties;
};

/**
 * The small pill showing "مقدار التغير: +4.7 ↑" / "-3.85 ↓", matching the
 * positive/negative styling used in the source NAFS card.
 */
export const ChangeBadge: React.FC<Props> = ({ change, decimals = 1, from = 0, style }) => {
  const frame = useCurrentFrame();
  const positive = change >= 0;

  const appear = interpolate(frame, [from, from + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const bg = positive ? "#e7f8ef" : "#fdeaea";
  const fg = positive ? "#1f9d5c" : "#c0392b";
  const border = positive ? "#b9e8cf" : "#f3c6c6";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px",
        borderRadius: 999,
        background: bg,
        border: `1.5px solid ${border}`,
        color: fg,
        fontWeight: 700,
        fontSize: 22,
        opacity: appear,
        translate: `0 ${interpolate(appear, [0, 1], [10, 0])}px`,
        ...style,
      }}
    >
      <span>مقدار التغير:</span>
      <span style={{ direction: "ltr", unicodeBidi: "isolate" }}>
        {positive ? "+" : ""}
        <CountUpNumber value={change} from={from + 4} durationInFrames={20} decimals={decimals} />
      </span>
      <span style={{ fontSize: 20 }}>{positive ? "↑" : "↓"}</span>
    </div>
  );
};
