/*
  النوافذ والتأكيدات.
  لا يُستخدَم window.confirm إطلاقًا: نافذة التأكيد هنا تحبس التركيز،
  تُغلق بـ Escape، تعيد التركيز لمصدرها، وتُظهر حالة "جارٍ الحذف".
*/
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TriangleAlert, X } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { DUR, EASE_CLAY, EASE_POP, EASE_SOFT } from "@/injazi/motion/motion";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /**
   * هل في النموذج تعديل لم يُحفظ؟
   * ------------------------------------------------------------------
   * حين يكون صحيحًا، لا تُغلق النافذة بلمسة على الخلفية ولا بـEscape
   * إلا بعد تأكيد. السبب عملي بحت: النموذج على الجوّال يملأ الشاشة
   * تقريبًا، والإبهام يلمس حافتها بسهولة أثناء الكتابة — فكانت لمسة
   * واحدة تمحو كل ما كُتب بلا سؤال ولا رجعة.
   * زرّا «إلغاء» و«إغلاق» يبقيان فوريّين: هناك القصد واضح.
   */
  dirty?: boolean;
};

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "md",
  dirty = false,
}: ModalProps) {
  const panel = useRef<HTMLDivElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  /* المرجع لا الحالة: مستمع لوحة المفاتيح يُسجَّل مرة واحدة عند الفتح،
     فقراءة dirty منه مباشرةً كانت ستلتقط قيمتها لحظة التسجيل لا لحظة
     الضغط. */
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  /*
    onClose يُمرَّر دالةً جديدة مع كل إعادة رسم (تُعرَّف داخل النموذج)،
    فلو دخل في اعتماديات أيّ أثر لأُعيد تشغيل ذلك الأثر مع كل حرف
    تكتبه المستخدمة. المرجع يكسر هذا الارتباط ويبقي requestClose ثابتة.
  */
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const requestClose = useCallback(() => {
    if (dirtyRef.current && !window.confirm("لديكِ تعديل لم يُحفظ. هل تُغلقين بلا حفظ؟")) return;
    closeRef.current();
  }, []);

  /*
    التركيز وقفل التمرير: مرّة واحدة عند الفتح لا مع كل إعادة رسم.
    ------------------------------------------------------------------
    كان هذا الأثر يعتمد على onClose، وهي دالة جديدة مع كل حرف يُكتب.
    فكان يُعاد تشغيله مع كل ضغطة مفتاح، وينقل التركيز بعد ٤٠ جزءًا من
    الثانية إلى أول عنصر في النافذة (زرّ الإغلاق) — فتهبط لوحة مفاتيح
    الجوّال بعد كل حرف، ويتوقّف ما تكتبه المستخدمة حرفًا حرفًا.
  */
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      const target = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? panel.current)?.focus();
    }, 40);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      opener.current?.focus?.();
    };
  }, [open]);

  /* مستمع لوحة المفاتيح منفصل: تبديله رخيص ولا يمسّ التركيز. */
  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose();
        return;
      }
      // حبس التركيز: بدونه يهرب Tab إلى الصفحة خلف النافذة، وهي مخفية
      // بصريًا لكنها ما زالت في شجرة التنقّل.
      if (event.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  return (
    createPortal(
<AnimatePresence>
      {open && (
        <div className="iz-modal-layer">
          <motion.div
            className="iz-modal__scrim"
            onClick={requestClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base, ease: EASE_SOFT }}
          />
          <motion.div
            ref={panel}
            className={`iz-modal iz-modal--${size}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: DUR.slow, ease: EASE_POP }}
          >
            <header className="iz-modal__head">
              <h2 className="iz-modal__title">{title}</h2>
              <motion.button
                type="button"
                className="iz-icon-btn"
                onClick={onClose}
                aria-label="إغلاق"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: DUR.base, ease: EASE_CLAY }}
              >
                <X size={20} strokeWidth={2.6} />
              </motion.button>
            </header>
            <div className="iz-modal__body">{children}</div>
            {footer && <footer className="iz-modal__foot">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
  );
}

type ConfirmProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "نعم، احذفي",
  onConfirm,
  onCancel,
}: ConfirmProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBusy(false);
      setError(null);
    }
  }, [open]);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      // الخطأ يبقى داخل النافذة: إغلاقها هنا كان سيُخفي سبب فشل الحذف.
      setError(err instanceof Error ? err.message : "تعذّر إتمام الحذف.");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={busy ? () => {} : onCancel}
      size="sm"
      footer={
        <>
          <ClayButton variant="soft" onClick={onCancel} disabled={busy}>
            إلغاء
          </ClayButton>
          <ClayButton variant="danger" onClick={run} disabled={busy}>
            {busy ? "جارٍ الحذف…" : confirmLabel}
          </ClayButton>
        </>
      }
    >
      <div className="iz-confirm">
        <span className="iz-confirm__icon">
          <TriangleAlert size={26} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <p className="iz-confirm__text">{message}</p>
        {error && (
          <p className="iz-field__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
