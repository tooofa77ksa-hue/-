/*
  بطاقة بعمق CSS ثلاثي الأبعاد
  ------------------------------------------------------------------
  عمق البطاقة يُنفَّذ بـ CSS 3D فقط (perspective + rotateX/rotateY) ولا
  علاقة له بـ Three.js: الميلان الخفيف تجاه المؤشر يكفي لإيحاء أن البطاقة
  جسم مادي، بتكلفة transform واحدة لا أكثر.
  يُعطَّل الميلان تلقائيًا على شاشات اللمس وعند تقليل الحركة، فتبقى
  البطاقة بطاقة عادية سريعة على الهاتف.
*/
import type { PointerEvent, ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useCapability } from "@/injazi/lib/useCapability";

const MAX_TILT = 7;
const SPRING = { stiffness: 220, damping: 22, mass: 0.6 };

type Props = {
  children: ReactNode;
  className?: string;
  /** يرفع البطاقة قليلًا عند التحويم — يُطفأ للبطاقات غير القابلة للنقر. */
  interactive?: boolean;
  onClick?: () => void;
};

export function ClayCard({ children, className = "", interactive = true, onClick }: Props) {
  const { compact, reducedMotion } = useCapability();
  const tiltEnabled = interactive && !compact && !reducedMotion;

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-MAX_TILT, MAX_TILT]), SPRING);
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [MAX_TILT, -MAX_TILT]), SPRING);

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (!tiltEnabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  return (
    <div className={`iz-card-stage ${interactive ? "" : "iz-card-stage--flat"}`}>
      <motion.div
        className={`iz-card ${interactive ? "iz-card--interactive" : ""} ${className}`}
        style={tiltEnabled ? { rotateX, rotateY } : undefined}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        onClick={onClick}
        whileHover={interactive && !reducedMotion ? { y: -4 } : undefined}
        whileTap={onClick ? { scale: 0.985 } : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
}
