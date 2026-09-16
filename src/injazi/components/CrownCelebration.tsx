/*
  لحظة التاج
  ------------------------------------------------------------------
  تُستدعى مرة واحدة عند اكتمال نجوم مادة كاملة — وهي أندر لحظة في
  المنصة، ولذلك وحدها تستحق شاشة كاملة وقُصاصات احتفال.
  تُغلق بأي لمسة أو بمفتاح Escape ولا تبقى أكثر من ~3.5 ثانية.
  عند تقليل الحركة: تبقى الرسالة والتاج، وتختفي القُصاصات فقط.
*/
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LottieMoment } from "@/injazi/components/LottieMoment";
import { useCapability } from "@/injazi/lib/useCapability";
import { DUR, EASE_CLAY, EASE_POP } from "@/injazi/motion/motion";

const AUTO_CLOSE_MS = 3600;

const CONFETTI_TONES = [
  "var(--iz-rose)",
  "var(--iz-lemon)",
  "var(--iz-mint)",
  "var(--iz-sky)",
  "var(--iz-lilac)",
  "var(--iz-gold)",
];

type Props = {
  open: boolean;
  subjectName: string;
  onClose: () => void;
};

export function CrownCelebration({ open, subjectName, onClose }: Props) {
  const { reducedMotion } = useCapability();

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, AUTO_CLOSE_MS);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="iz-crown-scene"
          role="dialog"
          aria-modal="true"
          aria-label={`تاج ${subjectName}`}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.base, ease: EASE_CLAY }}
        >
          {!reducedMotion && <Confetti />}

          <motion.div
            className="iz-crown-scene__card"
            initial={{ scale: 0.86, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            transition={{ duration: DUR.slow, ease: EASE_POP }}
          >
            <LottieMoment name="crown" size={148} label="تاج جديد" />
            <p className="iz-crown-scene__title">تاجٌ جديد!</p>
            <p className="iz-crown-scene__body">
              أكملتِ كل نجوم <strong>{subjectName}</strong> — إنجازكِ يحكي عنكِ الآن.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Confetti() {
  return (
    <div className="iz-confetti" aria-hidden="true">
      {Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        const distance = 150 + (index % 4) * 40;
        return (
          <motion.span
            key={index}
            className="iz-confetti__piece"
            style={{ background: CONFETTI_TONES[index % CONFETTI_TONES.length] }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance + 60,
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1, 1, 0.9],
              rotate: index % 2 ? 220 : -220,
            }}
            transition={{
              duration: 1.9,
              delay: 0.18 + (index % 5) * 0.05,
              ease: EASE_CLAY,
              times: [0, 0.18, 0.7, 1],
            }}
          />
        );
      })}
    </div>
  );
}
