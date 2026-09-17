import { useMemo } from "react";

interface Spark {
  left: number;
  size: number;
  delay: number;
  duration: number;
  hue: "gold" | "orange";
}

/**
 * زخرفة شرر/جمرات دافئة خفيفة تستحضر "الشُعلة" (بدل نجوم زرقاء باردة
 * لا تناسب هوية المشروع) - نفس تقنية خطواتي (عناصر DOM ثابتة تُحسب مرة
 * واحدة عبر useMemo، حركة CSS بحتة بلا Canvas ولا حلقة JavaScript) حتى
 * تبقى خفيفة جدًا على الجوال. تتوقف تلقائيًا مع "تقليل الحركة"
 * (.spark-field__dot في play.css).
 */
export function SparkField({ count = 22 }: { count?: number }) {
  const sparks = useMemo<Spark[]>(() => {
    return Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      size: 3 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 3.5 + Math.random() * 3,
      hue: Math.random() > 0.5 ? "gold" : "orange",
    }));
  }, [count]);

  return (
    <div className="spark-field" aria-hidden="true">
      {sparks.map((s, i) => (
        <span
          key={i}
          className={`spark-field__dot spark-field__dot--${s.hue}`}
          style={{
            left: `${s.left}%`,
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
