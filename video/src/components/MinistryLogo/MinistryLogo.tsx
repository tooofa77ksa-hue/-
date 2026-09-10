import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { timedReveal } from "../../utils/animation";
import { safeArea } from "../../utils/safeArea";

interface MinistryLogoProps {
  /** يظهر لمرة واحدة عند بداية الفيديو ثم يبقى ثابتًا صغيرًا في الزاوية */
  persistent?: boolean;
}

/**
 * شعار وزارة التعليم - موضع ثابت أنيق أعلى يمين الشاشة (متوافق مع اتجاه RTL)،
 * بحجم متحفظ (لا مبالغة)، بمساحة آمنة حول الشعار كما يحدد دليل الهوية، بلا
 * أي Glow أو ظل مبالغ فيه - فقط دخول ناعم بالتلاشي والحجم.
 */
export const MinistryLogo: React.FC<MinistryLogoProps> = ({ persistent = true }) => {
  const frame = useCurrentFrame();
  const enter = timedReveal(frame, 0, 24);
  const scale = 0.94 + enter * 0.06;

  return (
    <div
      style={{
        position: "absolute",
        top: safeArea.top - 24,
        right: safeArea.left - 24,
        opacity: persistent ? enter : enter,
        transform: `scale(${scale})`,
        transformOrigin: "top right",
      }}
    >
      <Img
        src={staticFile("assets/logos/ministry-logo.png")}
        style={{ height: 84, width: "auto", display: "block" }}
      />
    </div>
  );
};
