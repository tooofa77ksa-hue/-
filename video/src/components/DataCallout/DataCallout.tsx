import React from "react";
import { useCurrentFrame } from "remotion";
import { timedReveal } from "../../utils/animation";
import { ArabicText } from "../common/ArabicText";
import { colors } from "../../styles/tokens";

interface DataCalloutProps {
  value: number;
  label: string;
  startFrame: number;
  positive?: boolean;
}

/** بطاقة إبراز صغيرة لمقدار تغيّر (مقدار التغير: +4.7) - Highlight راقٍ بلا Flash */
export const DataCallout: React.FC<DataCalloutProps> = ({ value, label, startFrame, positive }) => {
  const frame = useCurrentFrame();
  const reveal = timedReveal(frame, startFrame, 18);
  const isPositive = positive ?? value >= 0;
  const accent = isPositive ? colors.primary : colors.levelVeryLow;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px",
        borderRadius: 999,
        border: `2px solid ${accent}`,
        background: "rgba(255,255,255,0.9)",
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * 14}px)`,
      }}
    >
      <span style={{ color: accent, fontSize: 26, fontWeight: 800 }}>
        {isPositive ? "↑" : "↓"}
      </span>
      <ArabicText size={26} weight={800} color={accent}>
        {value >= 0 ? `+${value}` : value}
      </ArabicText>
      <ArabicText size={22} weight={500} color={colors.muted}>
        {label}
      </ArabicText>
    </div>
  );
};
