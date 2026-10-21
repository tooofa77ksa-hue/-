/*
  تأكيد الحفظ
  ------------------------------------------------------------------
  يظهر من أسفل الشاشة على الهاتف ومن جهة بداية السطر على الشاشات الكبيرة.
  role="status" حتى تصل الرسالة لقارئ الشاشة كما تصل للعين.
*/
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, Info, TriangleAlert, Undo2 } from "lucide-react";
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

  return createPortal(
    <div className="iz-toasts" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            /*
              الرسالة لوحٌ لا زر.
              ------------------------------------------------------
              كانت الرسالة كلها <button> لتُغلق باللمس. ولمّا صار فيها
              «تراجع» لم يعد ذلك ممكنًا: زرٌّ داخل زر لا يصحّ، والمتصفّح
              يبتلع الضغطة الداخلية. فاللمس على اللوح يُغلق كما كان،
              و«تراجع» زرٌّ حقيقي يوقف انتشار الضغطة فلا يُغلق قبل أن
              يعمل.
            */
            <motion.div
              key={toast.id}
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
              {toast.action && (
                <button
                  type="button"
                  className="iz-toast__action"
                  onClick={(event) => {
                    event.stopPropagation();
                    toast.action?.run();
                    dismissToast(toast.id);
                  }}
                >
                  <Undo2 size={15} strokeWidth={2.6} aria-hidden="true" />
                  {toast.action.label}
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
