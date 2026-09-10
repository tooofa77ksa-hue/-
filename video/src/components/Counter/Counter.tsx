import React from "react";
import { useCurrentFrame } from "remotion";
import { timedReveal } from "../../utils/animation";
import { arabicFontFamily } from "../../styles/fonts";

interface CounterProps {
  from?: number;
  to: number;
  startFrame: number;
  durationInFrames: number;
  suffix?: string;
  decimals?: number;
  size?: number;
  weight?: number;
  color?: string;
}

/** عدّاد تصاعدي 0 → القيمة النهائية، متزامن مع ارتفاع العمود */
export const Counter: React.FC<CounterProps> = ({
  from = 0,
  to,
  startFrame,
  durationInFrames,
  suffix = "%",
  decimals = 1,
  size = 44,
  weight = 800,
  color = "#15445a",
}) => {
  const frame = useCurrentFrame();
  const progress = timedReveal(frame, startFrame, durationInFrames);
  const value = from + (to - from) * progress;
  const display = value.toFixed(decimals);

  return (
    <span
      dir="ltr"
      style={{
        fontFamily: arabicFontFamily,
        fontSize: size,
        fontWeight: weight,
        color,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {display}
      {suffix}
    </span>
  );
};
