/*
  زر من صلصال
  ------------------------------------------------------------------
  العمق ليس زخرفة هنا: السماكة السفلية تُظهر أن الزر جسم يمكن ضغطه،
  وعند اللمس تنضغط السماكة فعلًا (الزر ينزل بمقدار سماكته). هذا هو
  كل الرد البصري المطلوب — لا توهّج ولا نبض مستمر.
*/
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { DUR, EASE_CLAY } from "@/injazi/motion/motion";

const MotionLink = motion.create(Link);

type Variant = "primary" | "soft" | "ghost";
type Size = "md" | "lg";

type Props = {
  children: ReactNode;
  /** أيقونة Lucide تُوضع في جهة بداية السطر (يمين في العربية). */
  icon?: ReactNode;
  variant?: Variant;
  size?: Size;
  to?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  block?: boolean;
  className?: string;
};

export function ClayButton({
  children,
  icon,
  variant = "primary",
  size = "md",
  to,
  onClick,
  type = "button",
  disabled = false,
  block = false,
  className = "",
}: Props) {
  const classes = [
    "iz-btn",
    `iz-btn--${variant}`,
    `iz-btn--${size}`,
    block ? "iz-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const gesture = disabled
    ? {}
    : {
        whileHover: { y: -3 },
        whileTap: { y: 2, scale: 0.97 },
        transition: { duration: DUR.tap, ease: EASE_CLAY },
      };

  const content = (
    <>
      {icon && <span className="iz-btn__icon">{icon}</span>}
      <span className="iz-btn__label">{children}</span>
    </>
  );

  if (to && !disabled) {
    return (
      <MotionLink to={to} className={classes} onClick={onClick} {...gesture}>
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...gesture}
    >
      {content}
    </motion.button>
  );
}
