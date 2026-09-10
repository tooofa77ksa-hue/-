import React from "react";
import { arabicFontFamily } from "../../styles/fonts";

interface ArabicTextProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "span" | "h1" | "h2" | "h3" | "p";
  weight?: 400 | 500 | 700 | 800 | 900;
  size?: number;
  color?: string;
  lineHeight?: number;
  align?: "start" | "center" | "end";
}

/**
 * غلاف نصي موحّد يضمن اتجاه RTL صحيحًا وعدم انعكاس أو تقطيع الحروف العربية:
 * - unicodeBidi: "isolate" يمنع تسرّب اتجاه من عناصر مجاورة (أرقام لاتينية مثلًا).
 * - fontFeatureSettings الافتراضية لـ Tajawal تكفي للربط الصحيح؛ لا نستخدم
 *   letter-spacing موجب أبدًا (يكسر اتصال الحروف العربية).
 */
export const ArabicText: React.FC<ArabicTextProps> = ({
  as = "div",
  weight = 400,
  size = 32,
  color = "#15445a",
  lineHeight = 1.4,
  align = "start",
  style,
  children,
  ...rest
}) => {
  const Tag = as as any;
  return (
    <Tag
      dir="rtl"
      lang="ar"
      style={{
        fontFamily: arabicFontFamily,
        fontWeight: weight,
        fontSize: size,
        color,
        lineHeight,
        textAlign: align,
        unicodeBidi: "isolate",
        letterSpacing: 0,
        whiteSpace: "pre-wrap",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
};
