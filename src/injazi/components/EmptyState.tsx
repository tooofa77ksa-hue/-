/*
  الحالة الفارغة
  ------------------------------------------------------------------
  الفراغ في واجهة أطفال يجب أن يبدو دعوة لا عطلًا: جسم صلصالي يطفو
  ببطء، جملة واحدة واضحة، وطريق واحد للخروج من الفراغ.
*/
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { ClayObject } from "@/injazi/components/ClayObject";
import type { ClayName, ClayTone } from "@/injazi/components/ClayObject";
import { useCapability } from "@/injazi/lib/useCapability";
import { DUR, EASE_CLAY, EASE_SOFT, floatLoop } from "@/injazi/motion/motion";

type Props = {
  object?: ClayName;
  tone?: ClayTone;
  title: string;
  body: string;
  action?: ReactNode;
};

export function EmptyState({ object = "bag", tone = "lilac", title, body, action }: Props) {
  const { reducedMotion } = useCapability();
  const float = floatLoop(9, 5.5);

  return (
    <motion.div
      className="iz-empty"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.slow, ease: EASE_CLAY }}
    >
      <motion.div
        className="iz-empty__object"
        animate={reducedMotion ? undefined : float.animate}
        transition={reducedMotion ? { duration: 0, ease: EASE_SOFT } : float.transition}
      >
        <ClayObject name={object} tone={tone} size={132} />
      </motion.div>
      <h3 className="iz-empty__title">{title}</h3>
      <p className="iz-empty__body">{body}</p>
      {action && <div className="iz-empty__action">{action}</div>}
    </motion.div>
  );
}
