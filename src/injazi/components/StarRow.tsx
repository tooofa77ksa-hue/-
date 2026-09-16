/*
  صف النجوم
  ------------------------------------------------------------------
  النجوم المكتسبة سابقًا تُرسَم ساكنة؛ النجمة التي مُنحت للتوّ فقط هي
  التي تتحرك. بهذا تقرأ الطفلة الحركة كخبر ("نلتِ نجمة الآن") لا كزينة.
*/
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ClayObject } from "@/injazi/components/ClayObject";
import { DUR, EASE_POP } from "@/injazi/motion/motion";

type Props = {
  earned: number;
  total: number;
  size?: number;
  className?: string;
};

export function StarRow({ earned, total, size = 34, className = "" }: Props) {
  const previous = useRef(earned);
  const [freshFrom, setFreshFrom] = useState<number | null>(null);

  useEffect(() => {
    if (earned > previous.current) {
      setFreshFrom(previous.current);
      const timer = window.setTimeout(() => setFreshFrom(null), 1200);
      previous.current = earned;
      return () => window.clearTimeout(timer);
    }
    previous.current = earned;
  }, [earned]);

  return (
    <div
      className={`iz-stars ${className}`}
      role="img"
      aria-label={`${earned} من ${total} نجوم`}
    >
      {Array.from({ length: total }, (_, index) => {
        const isEarned = index < earned;
        const isFresh = freshFrom !== null && index >= freshFrom && index < earned;
        return (
          <motion.span
            key={index}
            className={`iz-star ${isEarned ? "" : "iz-star--empty"}`}
            initial={false}
            animate={isFresh ? { scale: [0.4, 1.25, 1], rotate: [-30, 8, 0] } : { scale: 1, rotate: 0 }}
            transition={{
              duration: isFresh ? 0.55 : DUR.fast,
              ease: EASE_POP,
              delay: isFresh ? (index - (freshFrom ?? 0)) * 0.1 : 0,
            }}
          >
            <ClayObject name="star" tone="gold" size={size} grounded={false} />
          </motion.span>
        );
      })}
    </div>
  );
}
