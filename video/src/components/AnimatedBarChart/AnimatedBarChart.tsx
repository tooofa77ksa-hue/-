import React from "react";
import { useCurrentFrame } from "remotion";
import { timedReveal } from "../../utils/animation";
import { colors } from "../../styles/tokens";
import { Counter } from "../Counter/Counter";
import { ArabicText } from "../common/ArabicText";

export interface BarChartPoint {
  year: number;
  value: number;
}

interface AnimatedBarChartProps {
  points: BarChartPoint[];
  /** إطار بداية حركة كل عمود على التوالي - يتحكم به المشهد ليتزامن مع الصوت */
  barStartFrames: number[];
  barDuration?: number;
  /** فهرس العمود المميَّز حاليًا (يتزامن مع الجملة المنطوقة) */
  activeIndex?: number;
  maxValue?: number;
  width?: number;
  height?: number;
  barColor?: string;
  activeColor?: string;
}

/**
 * رسم بياني بأعمدة تنمو من الصفر إلى القيمة الحقيقية، أعوام مرتبة زمنيًا من
 * الأقدم (يمين، لاتجاه RTL) إلى الأحدث (يسار). كل عمود له توقيت بداية مستقل
 * (staggered) بدل تحريك الجميع معًا. العمود النشط يبرز بلون أغمق وبقية
 * الأعمدة تخفت قليلًا (Highlight راقٍ بلا Flash).
 */
export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
  points,
  barStartFrames,
  barDuration = 26,
  activeIndex,
  maxValue = 100,
  width = 900,
  height = 460,
  barColor = colors.blue,
  activeColor = colors.primary,
}) => {
  const frame = useCurrentFrame();
  const barWidth = Math.min(160, (width / points.length) * 0.42);
  const gap = width / points.length;

  return (
    <div style={{ position: "relative", width, height, direction: "rtl" }}>
      {/* خط الأساس */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 0,
          left: 0,
          height: 2,
          background: colors.border,
        }}
      />
      {points.map((point, i) => {
        const start = barStartFrames[i] ?? 0;
        const growth = timedReveal(frame, start, barDuration);
        const barHeight = (point.value / maxValue) * (height - 120) * growth;
        const isActive = activeIndex === undefined || activeIndex === i;
        const opacity = timedReveal(frame, start, 12, { from: 0.001, to: isActive ? 1 : 0.42 });
        const centerX = gap * i + gap / 2;

        return (
          <div key={point.year}>
            {/* العمود */}
            <div
              style={{
                position: "absolute",
                bottom: 60,
                right: centerX - barWidth / 2,
                width: barWidth,
                height: Math.max(0, barHeight),
                background: isActive ? activeColor : barColor,
                borderRadius: 6,
                opacity,
                transition: "background 0.2s",
              }}
            />
            {/* الرقم أعلى العمود */}
            <div
              style={{
                position: "absolute",
                bottom: 60 + Math.max(0, barHeight) + 14,
                right: centerX - 70,
                width: 140,
                textAlign: "center",
                opacity: timedReveal(frame, start, barDuration, { from: 0, to: opacity }),
              }}
            >
              <Counter
                to={point.value}
                startFrame={start}
                durationInFrames={barDuration}
                size={38}
                color={isActive ? activeColor : colors.muted}
              />
            </div>
            {/* السنة */}
            <div
              style={{
                position: "absolute",
                bottom: 20,
                right: centerX - 70,
                width: 140,
                textAlign: "center",
                opacity,
              }}
            >
              <ArabicText size={28} weight={700} color={isActive ? colors.ink : colors.muted} align="center">
                {point.year}
              </ArabicText>
            </div>
          </div>
        );
      })}
    </div>
  );
};
