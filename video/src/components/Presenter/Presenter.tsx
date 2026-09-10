import React from "react";
import { OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { timedReveal } from "../../utils/animation";
import { colors } from "../../styles/tokens";

export type PresenterGesture = "idle" | "lookingAtCamera" | "pointing" | "turnedToCard";
export type PresenterSide = "left" | "right" | "center";

interface PresenterProps {
  side: PresenterSide;
  gesture?: PresenterGesture;
  enterAtFrame?: number;
  /**
   * فيديو المذيعة الفعلي (Avatar شفاف WebM/ProRes بقناة Alpha، أو Green Screen
   * يُعالَج خارجيًا). عند عدم توفره تُعرض طبقة بديلة احترافية بدلًا منه بحيث
   * يبقى المشروع قابلاً للمعاينة والرندر الآن، ويُستبدَل لاحقًا بوضع الاسم هنا
   * فقط دون أي تعديل على باقي المشاهد.
   */
  videoSrc?: string;
}

/**
 * طبقة المذيعة - مستقلة تمامًا عن باقي المشهد. تتحكم فقط بموضعها (يمين/يسار)
 * وإيماءتها (gesture) المرتبطة بما يُشرح؛ لا تحرّك نفسها باستمرار بلا داعٍ.
 */
export const Presenter: React.FC<PresenterProps> = ({
  side,
  gesture = "idle",
  enterAtFrame = 0,
  videoSrc,
}) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const enter = timedReveal(frame, enterAtFrame, 22);
  const slideDistance = side === "center" ? 0 : 90;
  const slideFrom = side === "right" ? slideDistance : side === "left" ? -slideDistance : 0;
  const translateX = (1 - enter) * slideFrom;

  const lean = gesture === "turnedToCard" && side !== "center" ? (side === "right" ? -6 : 6) : 0;
  const pointOffset = gesture === "pointing" && side !== "center" ? (side === "right" ? -1 : 1) * 18 : 0;

  const containerStyle: React.CSSProperties =
    side === "center"
      ? {
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: 560,
          height: height * 0.86,
          opacity: enter,
          transform: `translateX(calc(-50% + ${translateX}px)) scale(${0.96 + enter * 0.04})`,
        }
      : ({
          position: "absolute",
          bottom: 0,
          [side]: 80,
          width: 560,
          height: height * 0.86,
          opacity: enter,
          transform: `translateX(${translateX}px)`,
        } as React.CSSProperties);

  if (videoSrc) {
    return (
      <div style={containerStyle}>
        <OffthreadVideo
          src={staticFile(videoSrc)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom",
            transform: `rotate(${lean}deg) translateX(${pointOffset}px)`,
          }}
        />
      </div>
    );
  }

  // طبقة بديلة مجردة ومحتشمة - سيليويت هادئ بدرجات الهوية، بلا ملامح مرسومة،
  // تشغل مساحة المذيعة بأناقة حتى استبدالها بفيديو Avatar حقيقي.
  return (
    <div style={containerStyle}>
      <svg
        viewBox="0 0 400 620"
        width="100%"
        height="100%"
        style={{
          transform: `rotate(${lean}deg) translateX(${pointOffset}px)`,
          filter: "drop-shadow(0 14px 30px rgba(21,68,90,0.16))",
        }}
      >
        <defs>
          <linearGradient id="presenterGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primaryDark} stopOpacity="0.92" />
            <stop offset="100%" stopColor={colors.ink} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {/* عباية - خط انسيابي بسيط بلا تفاصيل ملامح */}
        <path
          d="M200 70
             C 150 70 130 120 128 165
             C 90 210 60 330 55 470
             C 50 560 60 610 90 615
             L 310 615
             C 340 610 350 560 345 470
             C 340 330 310 210 272 165
             C 270 120 250 70 200 70 Z"
          fill="url(#presenterGradient)"
        />
        {/* رأس مجرد - دائرة ناعمة بلا ملامح */}
        <circle cx="200" cy="70" r="46" fill={colors.ink} opacity="0.85" />
        {gesture === "pointing" && (
          <path
            d={
              side === "right"
                ? "M 60 300 L -40 260"
                : "M 340 300 L 440 260"
            }
            stroke={colors.primary}
            strokeWidth="6"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};
