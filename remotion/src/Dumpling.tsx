import React from "react";

/**
 * إعادة رسم شخصية «دَمبل» بصيغة SVG لاستخدامها في الفيديو، مطابقة لهندسة
 * الرسم الأصلي بالـ Phaser (src/game/Dumpling.ts في المشروع الرئيسي):
 * جسم بيضاوي أصفر دافئ، خدود وردية، عينان كبيرتان، وابتسامة مقوَّسة.
 */
export const Dumpling: React.FC<{
  size?: number;
  mood?: "happy" | "cheer";
}> = ({ size = 200, mood = "happy" }) => {
  const eyeY = -10;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-70 -70 140 140"
      style={{ overflow: "visible" }}
    >
      <ellipse cx={0} cy={6} rx={58} ry={50} fill="#ffd166" />
      <ellipse cx={0} cy={-14} rx={35} ry={15} fill="#ffe8a3" />
      <ellipse cx={-36} cy={14} rx={10} ry={6.5} fill="#ff8fa3" opacity={0.65} />
      <ellipse cx={36} cy={14} rx={10} ry={6.5} fill="#ff8fa3" opacity={0.65} />

      <circle cx={-22} cy={eyeY} r={7.5} fill="#2b2140" />
      <circle cx={22} cy={eyeY} r={7.5} fill="#2b2140" />
      <circle cx={-19} cy={eyeY - 3} r={2.6} fill="#ffffff" />
      <circle cx={25} cy={eyeY - 3} r={2.6} fill="#ffffff" />

      {mood === "cheer" ? (
        <path
          d="M -22 6 A 22 22 0 0 0 22 6"
          fill="none"
          stroke="#2b2140"
          strokeWidth={4}
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M -19 8 A 20 20 0 0 0 19 8"
          fill="none"
          stroke="#2b2140"
          strokeWidth={4}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};
