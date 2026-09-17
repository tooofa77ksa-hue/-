/**
 * أيقونات أوضاع اللعب الثلاثة - رسمة أصلية (SVG بالكود) بلمسة "لعبة
 * ثلاثية الأبعاد لامعة" مستوحاة من مراجع صممتها المستخدمة، بدل الإيموجي
 * المسطح السابق. الألوان تطابق --mode-accent الموجود أصلًا لكل وضع
 * (لا نُدخل هوية بصرية جديدة على العلامة - نرفع جودة الأيقونة فقط).
 */
export function RocketModeIcon() {
  return (
    <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
      <defs>
        <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef1ff" />
        </linearGradient>
        <radialGradient id="rocketWindow" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#eaf6ff" />
          <stop offset="100%" stopColor="#5b8fd9" />
        </radialGradient>
      </defs>
      <path d="M32 4c9 8 13 20 13 32 0 8-4 15-13 19-9-4-13-11-13-19 0-12 4-24 13-32Z" fill="url(#rocketBody)" />
      <path d="M32 4c5 8 8 18 9 28h-18c1-10 4-20 9-28Z" fill="#c9b6f2" opacity="0.7" />
      <circle cx="32" cy="27" r="7" fill="#f2a63c" />
      <circle cx="32" cy="27" r="4.6" fill="url(#rocketWindow)" />
      <path d="M19 33c-5 2-8 8-8 14l11-6Z" fill="#ec5c8d" />
      <path d="M45 33c5 2 8 8 8 14l-11-6Z" fill="#ec5c8d" />
      <path d="M32 55c-4 4-4 9 0 14 4-5 4-10 0-14Z" fill="#f2a63c" />
    </svg>
  );
}

export function SquishyModeIcon() {
  return (
    <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
      <defs>
        <radialGradient id="squishyBody" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff3cf" />
          <stop offset="100%" stopColor="#f2a63c" />
        </radialGradient>
      </defs>
      <path
        d="M32 10c14 0 22 9 22 21 0 13-10 21-22 21S10 44 10 31c0-12 8-21 22-21Z"
        fill="url(#squishyBody)"
      />
      <circle cx="22" cy="26" r="6" fill="#fff" opacity="0.55" />
      <circle cx="23.5" cy="29" r="2.4" fill="#3a2a3d" />
      <circle cx="34.5" cy="29" r="2.4" fill="#3a2a3d" />
      <path d="M23 37c3 3 9 3 12 0" stroke="#3a2a3d" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="18" cy="35" r="2.3" fill="#e2554a" opacity="0.5" />
      <circle cx="42" cy="35" r="2.3" fill="#e2554a" opacity="0.5" />
      <path d="M47 14l1.6 3.4L52 19l-3.4 1.6L47 24l-1.6-3.4L42 19l3.4-1.6Z" fill="#fff" opacity="0.9" />
      <path d="M14 44l1 2.2L17 47l-2 1-1 2.2-1-2.2-2-1 2-.8Z" fill="#fff" opacity="0.8" />
    </svg>
  );
}

export function MagicGateModeIcon() {
  return (
    <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
      <path d="M8 52c0-16 10.7-28 24-28s24 12 24 28" fill="none" stroke="#8b5fbf" strokeWidth="6" strokeLinecap="round" />
      <path d="M14 52c0-13 8-23 18-23s18 10 18 23" fill="none" stroke="#2f9bd6" strokeWidth="6" strokeLinecap="round" />
      <path d="M20 52c0-9.5 5.4-17 12-17s12 7.5 12 17" fill="none" stroke="#21a67a" strokeWidth="6" strokeLinecap="round" />
      <path d="M26 52c0-6 2.7-11 6-11s6 5 6 11" fill="none" stroke="#f2a63c" strokeWidth="6" strokeLinecap="round" />
      <path d="M18 14l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4Z" fill="#ec5c8d" />
      <path d="M48 10l1.1 2.4 2.4 1.1-2.4 1.1-1.1 2.4-1.1-2.4-2.4-1.1 2.4-1.1Z" fill="#f2a63c" />
      <path d="M52 26l0.9 2 2 0.9-2 0.9-0.9 2-0.9-2-2-0.9 2-0.9Z" fill="#2f9bd6" />
    </svg>
  );
}
