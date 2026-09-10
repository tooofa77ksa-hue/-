import React from "react";
import { useCurrentFrame } from "remotion";
import { timedReveal } from "../../utils/animation";
import { ArabicText } from "../common/ArabicText";
import { colors } from "../../styles/tokens";

interface TitleProps {
  text: string;
  subtitle?: string;
  startFrame?: number;
  size?: number;
  /** محاذاة بصرية فعلية (قيمة CSS مباشرة) - right هي المحاذاة الطبيعية للعربية */
  align?: "right" | "left" | "center";
}

/** عنوان مشهد - كشف بالقناع (Mask Reveal) مع خط تمييز جانبي، بلا تأثيرات زينة */
export const Title: React.FC<TitleProps> = ({
  text,
  subtitle,
  startFrame = 0,
  size = 64,
  align = "right",
}) => {
  const frame = useCurrentFrame();
  const reveal = timedReveal(frame, startFrame, 22);
  const barReveal = timedReveal(frame, startFrame, 18);

  return (
    <div style={{ width: "100%", textAlign: align }}>
      <div
        style={{
          display: "inline-flex",
          flexDirection: align === "left" ? "row" : "row-reverse",
          alignItems: "center",
          gap: 18,
          opacity: reveal,
          transform: `translateY(${(1 - reveal) * 40}px)`,
        }}
      >
        <div
          style={{
            width: 6,
            height: size * 0.9,
            background: colors.primary,
            borderRadius: 3,
            transform: `scaleY(${barReveal})`,
            transformOrigin: "top",
            flexShrink: 0,
          }}
        />
        <ArabicText as="h1" size={size} weight={800} color={colors.ink} align={align === "left" ? "start" : "end"}>
          {text}
        </ArabicText>
      </div>
      {subtitle && (
        <div style={{ opacity: timedReveal(frame, startFrame + 8, 20), marginTop: 10 }}>
          <ArabicText size={size * 0.38} weight={500} color={colors.muted} align={align === "left" ? "start" : "end"}>
            {subtitle}
          </ArabicText>
        </div>
      )}
    </div>
  );
};
