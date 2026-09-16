/*
  ناقل رسائل التأكيد
  ------------------------------------------------------------------
  كل حفظ ناجح يجب أن يترك أثرًا مرئيًا. بدل تمرير حالة الرسالة عبر كل
  شاشة، تُنشر الرسالة من مكان حدوثها ويلتقطها ToastHost في جذر القسم.
  متجر صغير جدًا بلا مكتبة — لا داعي لأكثر من ذلك.
*/

export type ToastTone = "success" | "info" | "danger";

export type Toast = {
  id: number;
  text: string;
  tone: ToastTone;
};

type Listener = (toasts: Toast[]) => void;

const LIFETIME_MS = 3200;

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

export function showToast(text: string, tone: ToastTone = "success") {
  const toast: Toast = { id: nextId++, text, tone };
  toasts = [...toasts, toast];
  emit();
  window.setTimeout(() => dismissToast(toast.id), LIFETIME_MS);
}

export function dismissToast(id: number) {
  const next = toasts.filter((toast) => toast.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}
