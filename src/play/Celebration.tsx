import { useMemo } from "react";

type Variant = "sparkle" | "confetti";

interface Props {
  variant: Variant;
  intensity?: "normal" | "high";
}

const CONFETTI_COLORS = ["#ff8a3d", "#ff5d8f", "#35c2e8", "#7bd389", "#ffcb3d"];

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  color?: string;
  kind: "star" | "confetti" | "heart";
}

/** طبقة احتفالية خفيفة (نجوم/بريق/Confetti) فوق واجهة اللعب - CSS بحتة
 * (transform + opacity فقط، بلا فيديو ولا صور)، تُحترَم فيها Reduced
 * Motion (لا تُعرض أي جسيمات إطلاقًا حينها). عنصر زخرفي بصري فقط، لا
 * يؤثر على أي منطق لعبة أو بيانات. */
export function Celebration({ variant, intensity = "normal" }: Props) {
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const particles = useMemo<Particle[]>(() => {
    if (reducedMotion) return [];
    const count = variant === "sparkle" ? 6 : intensity === "high" ? 26 : 16;
    const items: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const kind: Particle["kind"] =
        variant === "sparkle" ? "star" : i % 9 === 0 ? "heart" : i % 2 === 0 ? "star" : "confetti";
      items.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * (variant === "sparkle" ? 0.3 : 0.6),
        duration: variant === "sparkle" ? 0.7 + Math.random() * 0.4 : 1.6 + Math.random() * 1.2,
        rotate: Math.random() * 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        kind,
      });
    }
    return items;
  }, [variant, intensity, reducedMotion]);

  if (particles.length === 0) return null;

  return (
    <div className={`celebration celebration--${variant}`} aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className={`celebration__particle celebration__particle--${p.kind}`}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--rotate" as string]: `${p.rotate}deg`,
            ...(p.kind === "confetti" ? { background: p.color } : { color: p.color }),
          }}
        >
          {p.kind === "star" ? "★" : p.kind === "heart" ? "♥" : ""}
        </span>
      ))}
    </div>
  );
}
