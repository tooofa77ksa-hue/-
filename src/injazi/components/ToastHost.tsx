/*
  تأكيد الحفظ
  ------------------------------------------------------------------
  يظهر من أسفل الشاشة على الهاتف ومن جهة بداية السطر على الشاشات الكبيرة.
  role="status" حتى تصل الرسالة لقارئ الشاشة كما تصل للعين.
*/
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Info, TriangleAlert } from "lucide-react";
import { DUR, EASE_CLAY, EASE_SOFT } from "@/injazi/motion/motion";
import { dismissToast, subscribeToasts } from "@/injazi/lib/toast";
import type { Toast, ToastTone } from "@/injazi/lib/toast";

const ICONS: Record<ToastTone, typeof Check> = {
  success: Check,
  info: Info,
  danger: TriangleAlert,
};

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  return (
    <div className="iz-toasts" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <motion.button
              key={toast.id}
              type="button"
              className={`iz-toast iz-toast--${toast.tone}`}
              onClick={() => dismissToast(toast.id)}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: DUR.base, ease: toasts.length ? EASE_CLAY : EASE_SOFT }}
              layout
            >
              <span className="iz-toast__icon">
                <Icon size={18} strokeWidth={2.6} aria-hidden="true" />
              </span>
              <span>{toast.text}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
