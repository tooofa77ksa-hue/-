/*
  التقييم بالنجوم.
  في وضع الإدخال: أزرار حقيقية (لوحة مفاتيح + أسهم) لا صور قابلة للنقر.
  الأسهم في RTL تتبع اتجاه القراءة: السهم الأيمن يزيد، الأيسر ينقص.
*/
import { useState } from "react";
import { motion } from "motion/react";
import { ClayObject } from "@/injazi/components/ClayObject";
import { DUR, EASE_POP, isRtl } from "@/injazi/motion/motion";

type Props = {
  value: number;
  max?: number;
  size?: number;
  readOnly?: boolean;
  onChange?: (value: number) => void;
  label?: string;
};

export function Rating({ value, max = 5, size = 30, readOnly = false, onChange, label }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  if (readOnly) {
    return (
      <span className="iz-stars" role="img" aria-label={label ?? `${value} من ${max} نجوم`}>
        {Array.from({ length: max }, (_, index) => (
          <span key={index} className={`iz-star ${index < value ? "" : "iz-star--empty"}`}>
            <ClayObject name="star" tone="gold" size={size} grounded={false} />
          </span>
        ))}
      </span>
    );
  }

  function step(direction: number) {
    onChange?.(Math.max(1, Math.min(max, value + direction)));
  }

  return (
    <div
      className="iz-stars iz-stars--input"
      role="radiogroup"
      aria-label={label ?? "التقييم بالنجوم"}
      onKeyDown={(event) => {
        const forward = isRtl() ? "ArrowLeft" : "ArrowRight";
        const backward = isRtl() ? "ArrowRight" : "ArrowLeft";
        if (event.key === forward || event.key === "ArrowUp") {
          event.preventDefault();
          step(1);
        } else if (event.key === backward || event.key === "ArrowDown") {
          event.preventDefault();
          step(-1);
        }
      }}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const active = starValue <= shown;
        return (
          <motion.button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} من ${max}`}
            className={`iz-star iz-star--btn ${active ? "" : "iz-star--empty"}`}
            onClick={() => onChange?.(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onFocus={() => setHover(starValue)}
            onBlur={() => setHover(null)}
            animate={{ scale: active ? 1 : 0.92, rotate: active && hover === starValue ? -8 : 0 }}
            whileTap={{ scale: 0.85 }}
            transition={{ duration: DUR.base, ease: EASE_POP }}
          >
            <ClayObject name="star" tone="gold" size={size} grounded={false} />
          </motion.button>
        );
      })}
    </div>
  );
}
