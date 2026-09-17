import { useMemo } from "react";

interface Star {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

/** خلفية نجوم متلألئة خفيفة - عناصر DOM ثابتة (لا تُعاد حسابها كل
 * تحديث لأن useMemo يحسبها مرة واحدة فقط) بحركة CSS بحتة (تلألؤ
 * opacity)، بلا Canvas وبلا أي حلقة JavaScript، عشان تبقى خفيفة جدًا
 * على الجوال. تتوقف الحركة تلقائيًا لمن تفعّل "تقليل الحركة" في جهازها
 * (عبر CSS فقط - راجعي .star-field__dot في global.css). */
export function StarField({ count = 44 }: { count?: number }) {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2.2,
      delay: Math.random() * 6,
      duration: 3 + Math.random() * 4,
    }));
  }, [count]);

  return (
    <div className="star-field" aria-hidden="true">
      {stars.map((s, i) => (
        <span
          key={i}
          className="star-field__dot"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
