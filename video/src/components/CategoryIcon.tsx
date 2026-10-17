import type { IconKind } from "../data/achievementsFull";

/** مجموعة أيقونات بسيطة مسطّحة بلون واحد، بنفس أسلوب TrophyIcon/StarIcon الأصلي في المشروع - بلا تعقيد أو تفاصيل زائدة. */
export const CategoryIcon: React.FC<{ kind: IconKind; color: string; size: number }> = ({ kind, color, size }) => {
  switch (kind) {
    case "shield":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <path d="M32 6l20 7v16c0 14-8.5 24-20 29C20.5 53 12 43 12 29V13l20-7Z" fill={color} />
          <path d="M22 32l7 7 13-14" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "medal":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <path d="M22 8h20l-6 20H28L22 8Z" fill={color} />
          <circle cx="32" cy="40" r="16" fill={color} />
          <circle cx="32" cy="40" r="9" fill="#fff" opacity={0.85} />
        </svg>
      );
    case "heart":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <path
            d="M32 54S10 40.5 10 25.5C10 16.9 16.9 10 25 10c3.6 0 6.9 1.4 9.3 3.7C36.7 11.4 40 10 43.6 10 51.7 10 58 16.3 58 25.5 58 40.5 32 54 32 54Z"
            fill={color}
          />
        </svg>
      );
    case "palette":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <path
            d="M32 8C18 8 8 18 8 30c0 8 5 12 11 12h3c2 0 3.5 1.6 3.5 3.6 0 1-.4 1.8-.9 2.7-.6 1-1 2.1-1 3.3 0 4 3.6 6.4 8.4 6.4C46 58 58 46 58 32 58 18.7 46.4 8 32 8Z"
            fill={color}
          />
          <circle cx="21" cy="26" r="4" fill="#fff" opacity={0.9} />
          <circle cx="33" cy="19" r="4" fill="#fff" opacity={0.7} />
          <circle cx="45" cy="26" r="4" fill="#fff" opacity={0.9} />
          <circle cx="44" cy="39" r="4" fill="#fff" opacity={0.7} />
        </svg>
      );
    case "bulb":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <path d="M32 6c-10 0-18 8-18 18 0 7 3.8 11 7 14.5 1.4 1.5 2 3 2 4.9V46h18v-2.6c0-1.9.6-3.4 2-4.9 3.2-3.5 7-7.5 7-14.5 0-10-8-18-18-18Z" fill={color} />
          <rect x="24" y="50" width="16" height="4" rx="2" fill={color} />
          <rect x="26" y="56" width="12" height="4" rx="2" fill={color} />
        </svg>
      );
    case "device":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <rect x="8" y="12" width="48" height="32" rx="4" fill={color} />
          <rect x="14" y="18" width="36" height="20" rx="2" fill="#fff" opacity={0.9} />
          <rect x="24" y="48" width="16" height="4" rx="2" fill={color} />
          <rect x="18" y="54" width="28" height="4" rx="2" fill={color} />
        </svg>
      );
    case "camera":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <path d="M8 20a4 4 0 0 1 4-4h8l4-6h16l4 6h8a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V20Z" fill={color} />
          <circle cx="32" cy="34" r="11" fill="#fff" opacity={0.9} />
          <circle cx="32" cy="34" r="6" fill={color} />
        </svg>
      );
    case "trophy":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <path d="M20 10h24v12a12 12 0 0 1-24 0V10Z" fill={color} />
          <path d="M20 14h-6a2 2 0 0 0-2 2v2a8 8 0 0 0 8 8" stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round" />
          <path d="M44 14h6a2 2 0 0 1 2 2v2a8 8 0 0 1-8 8" stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round" />
          <rect x="29" y="34" width="6" height="10" fill={color} />
          <path d="M18 50h28l-3-6H21l-3 6Z" fill={color} />
        </svg>
      );
    case "star":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <path d="M32 6l7.2 15.6L56 24l-12 11.8L47.2 52 32 43.6 16.8 52 20 35.8 8 24l16.8-2.4L32 6Z" fill={color} />
        </svg>
      );
  }
};
