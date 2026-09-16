/*
  درج/لوح منزلق
  ------------------------------------------------------------------
  يدخل من أسفل الشاشة على الهاتف (حيث الإبهام) ومن جهة بداية السطر على
  الشاشات الكبيرة — أي من اليمين في العربية ومن اليسار في الإنجليزية،
  عبر inlineX() لا بقيمة ثابتة.
  يعيد التركيز إلى العنصر الذي فتحه عند الإغلاق، ويُغلق بـ Escape
  وبالنقر خارج اللوح.
*/
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useCapability } from "@/injazi/lib/useCapability";
import { DUR, EASE_CLAY, EASE_SOFT, inlineX } from "@/injazi/motion/motion";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function InjaziSheet({ open, title, onClose, children }: Props) {
  const { compact } = useCapability();
  const panel = useRef<HTMLDivElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // نقل التركيز إلى اللوح حتى يتابع قارئ الشاشة المحتوى الجديد.
    panel.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      opener.current?.focus?.();
    };
  }, [open, onClose]);

  const enterFrom = compact ? { y: 40, x: 0 } : { x: inlineX(48), y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <div className="iz-sheet-layer">
          <motion.div
            className="iz-sheet__scrim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base, ease: EASE_SOFT }}
          />
          <motion.div
            ref={panel}
            className={`iz-sheet ${compact ? "iz-sheet--bottom" : "iz-sheet--side"}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, ...enterFrom }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...enterFrom }}
            transition={{ duration: DUR.slow, ease: EASE_CLAY }}
          >
            <header className="iz-sheet__head">
              <h2 className="iz-sheet__title">{title}</h2>
              <motion.button
                type="button"
                className="iz-sheet__close"
                onClick={onClose}
                aria-label="إغلاق"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: DUR.base, ease: EASE_CLAY }}
              >
                <X size={20} strokeWidth={2.6} />
              </motion.button>
            </header>
            <div className="iz-sheet__body">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
