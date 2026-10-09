import { Easing, interpolate, useCurrentFrame } from "remotion";

type Props = {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  /** Frame (in the parent's local timeline) at which the count-up begins. */
  from?: number;
  /** How many frames the count-up animation takes. */
  durationInFrames?: number;
  style?: React.CSSProperties;
};

/**
 * Animates a number counting up from 0 to `value`, landing on the exact
 * source figure (never rounding away from it - `decimals` only controls
 * display formatting, the final displayed value always equals `value`).
 */
export const CountUpNumber: React.FC<Props> = ({
  value,
  decimals = 1,
  suffix = "",
  prefix = "",
  from = 0,
  durationInFrames = 24,
  style,
}) => {
  const frame = useCurrentFrame();

  const current = interpolate(frame, [from, from + durationInFrames], [0, value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const isDone = frame >= from + durationInFrames;
  const display = isDone ? value : current;

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate", ...style }}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};
