/*
  ناقل رسائل التأكيد
  ------------------------------------------------------------------
  كل حفظ ناجح يجب أن يترك أثرًا مرئيًا. بدل تمرير حالة الرسالة عبر كل
  شاشة، تُنشر الرسالة من مكان حدوثها ويلتقطها ToastHost في جذر القسم.
  متجر صغير جدًا بلا مكتبة — لا داعي لأكثر من ذلك.
*/

export type ToastTone = "success" | "info" | "danger";

/** زر داخل الرسالة — «تراجع» بعد فعل قابل للرجوع. */
export type ToastAction = { label: string; run: () => void };

export type Toast = {
  id: number;
  text: string;
  tone: ToastTone;
  action?: ToastAction;
};

type Listener = (toasts: Toast[]) => void;

const LIFETIME_MS = 3200;

/*
  الرسالة التي تحمل «تراجع» تبقى أطول.
  ------------------------------------------------------------------
  ٣٫٢ ثانية تكفي لقراءة «تم الحفظ»، ولا تكفي لأن تقرأ أمٌّ الرسالة ثم
  تقرّر ثم تصل بإبهامها إلى الزر. والتراجع الذي يختفي قبل أن يُضغط
  ليس تراجعًا.
*/
const UNDO_LIFETIME_MS = 8000;

let toasts: Toast[] = [];
let listeners: Listener[] = [];
let nextId = 1;

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.push(listener);
  listener(toasts);
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
}

export function showToast(text: string, tone: ToastTone = "success", action?: ToastAction) {
  const toast: Toast = { id: nextId++, text, tone, action };
  toasts = [...toasts, toast];
  emit();
  window.setTimeout(() => dismissToast(toast.id), action ? UNDO_LIFETIME_MS : LIFETIME_MS);
}

export function dismissToast(id: number) {
  const next = toasts.filter((toast) => toast.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}
