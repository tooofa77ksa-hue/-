/**
 * صاروخ زخرفي أصلي (SVG مرسوم بالكود، بدون أي صورة خارجية أو محفوظة
 * الحقوق) يعوم بحركة خفيفة في خلفية الصفحة - زخرفة بحتة، لا يغطي أي
 * محتوى أو زر تفاعلي، ويحترم prefers-reduced-motion (يتوقف عن الحركة
 * تلقائيًا لمن تفضّل تقليل الحركة).
 */
export function RocketDecoration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 140" className={`rocket-decoration ${className ?? ""}`} aria-hidden="true">
      <ellipse cx="50" cy="128" rx="16" ry="5" fill="#8b5fbf" opacity="0.18" />
      <g className="rocket-decoration__flame">
        <path d="M50 108 C44 118 44 128 50 136 C56 128 56 118 50 108Z" fill="#f2a63c" />
        <path d="M50 112 C47 119 47 126 50 131 C53 126 53 119 50 112Z" fill="#ffd580" />
      </g>
      <path
        d="M50 6 C64 22 70 44 70 66 C70 82 63 96 50 106 C37 96 30 82 30 66 C30 44 36 22 50 6Z"
        fill="#ffffff"
      />
      <path
        d="M50 6 C58 22 62 44 62 62 L38 62 C38 44 42 22 50 6Z"
        fill="#d9c6f2"
      />
      <circle cx="50" cy="52" r="11" fill="#2f9bd6" />
      <circle cx="50" cy="52" r="6.5" fill="#eaf6fd" />
      <path d="M30 66 C22 70 16 80 16 92 L32 82Z" fill="#ec5c8d" />
      <path d="M70 66 C78 70 84 80 84 92 L68 82Z" fill="#ec5c8d" />
    </svg>
  );
}
