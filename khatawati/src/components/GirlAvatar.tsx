/**
 * أفاتار توضيحي مرسوم (SVG بسيط) يُستخدم كصورة افتراضية للطالبة قبل ما
 * ترفع صورتها الحقيقية - بديل عن إيموجي عام، بشخصية بصرية تشبه هوية
 * المنصة (لون الشعر ثابت، لون الفيونكة يطابق لون ملف الطالبة).
 */
export function GirlAvatar({ color = "#EC5C8D", className }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="صورة افتراضية">
      <circle cx="50" cy="52" r="34" fill="#FFF3E8" />
      <circle cx="17" cy="40" r="14" fill="#5B3A29" />
      <circle cx="83" cy="40" r="14" fill="#5B3A29" />
      <path
        d="M17 44 C17 16 83 16 83 44 C83 30 68 21 50 21 C32 21 17 30 17 44 Z"
        fill="#5B3A29"
      />
      <circle cx="50" cy="55" r="29" fill="#F8CBA0" />
      <path d="M23 45 C23 30 77 30 77 45 C77 34 65 27 50 27 C35 27 23 34 23 45 Z" fill="#5B3A29" />
      <ellipse cx="39" cy="56" rx="3" ry="3.6" fill="#3A2A3D" />
      <ellipse cx="61" cy="56" rx="3" ry="3.6" fill="#3A2A3D" />
      <circle cx="30" cy="66" r="5" fill={color} opacity="0.3" />
      <circle cx="70" cy="66" r="5" fill={color} opacity="0.3" />
      <path d="M40 68 Q50 75 60 68" stroke="#3A2A3D" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <g transform="translate(83 28)">
        <path d="M0 0 L-9 -6 L-9 6 Z" fill={color} />
        <path d="M0 0 L9 -6 L9 6 Z" fill={color} />
        <circle cx="0" cy="0" r="3.2" fill={color} />
      </g>
    </svg>
  );
}
