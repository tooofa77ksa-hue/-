/**
 * أيقونات مسطحة مرسومة بالكود (SVG) بدل الإيموجي - شكل ثابت ومتناسق
 * على كل الأجهزة والمتصفحات (الإيموجي يختلف شكله حسب النظام)، ويقبل
 * لون مخصص لكل قسم بدل الاعتماد على لون الإيموجي الجاهز.
 */
type IconProps = { size?: number; color?: string };

export function IconMedal({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8.5 3h2l1.5 5-1.7 1.2L8.5 3z" fill={color} />
      <path d="M15.5 3h-2l-1.5 5 1.7 1.2L15.5 3z" fill={color} />
      <circle cx="12" cy="14.5" r="6" fill={color} />
      <circle cx="12" cy="14.5" r="3.4" fill="#fff" opacity="0.35" />
    </svg>
  );
}

export function IconStar({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.5l2.95 6.02 6.64.97-4.8 4.68 1.13 6.6L12 17.7l-5.92 3.07 1.13-6.6-4.8-4.68 6.64-.97L12 2.5z"
        fill={color}
      />
    </svg>
  );
}

export function IconBook({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 6.2c-1.8-1.3-4.2-2-6.7-2-.7 0-1.3.6-1.3 1.3v10.8c0 .7.6 1.3 1.3 1.3 2.3 0 4.5.7 6.2 2 .2.2.5.2.7 0 1.7-1.3 3.9-2 6.2-2 .7 0 1.3-.6 1.3-1.3V5.5c0-.7-.6-1.3-1.3-1.3-2.5 0-4.9.7-6.7 2z"
        fill={color}
      />
      <path d="M12 6.2v12.4" stroke="#fff" strokeWidth="1.1" opacity="0.4" />
    </svg>
  );
}

export function IconCalculator({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="2.5" width="15" height="19" rx="2.5" fill={color} />
      <rect x="6.7" y="4.8" width="10.6" height="4" rx="1" fill="#fff" opacity="0.9" />
      {[8.4, 12, 15.6].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="12.3" r="1.15" fill="#fff" opacity="0.9" />
          <circle cx={cx} cy="16.3" r="1.15" fill="#fff" opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

export const CATEGORY_STYLE = {
  certificate: { bg: "#fdecd1", fg: "#b8791f", Icon: IconMedal },
  achievement: { bg: "#daf3ea", fg: "#158a63", Icon: IconStar },
  lughati: { bg: "#dff1fc", fg: "#1c6f95", Icon: IconBook },
  riyadiyat: { bg: "#ece3f7", fg: "#6b3fa0", Icon: IconCalculator },
} as const;

export function IconHeart({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20.5s-7.5-4.6-9.8-9.4C.6 7.7 2.3 4 5.9 3.3 8 2.9 10 3.9 12 6.3c2-2.4 4-3.4 6.1-3 3.6.7 5.3 4.4 3.7 7.8C19.5 15.9 12 20.5 12 20.5z"
        fill={color}
      />
    </svg>
  );
}
