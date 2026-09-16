/*
  إنجازي يحكي — مفردات الحركة المشتركة
  ------------------------------------------------------------------
  كل حركة في المنصة تُبنى من هذا الملف، حتى تبدو صفحة الدخول
  والبطاقة والنجمة والدرج وكأنها حُرِّكت بيد واحدة.

  قاعدة الاتجاه (RTL): الحركة الأفقية تتبع اتجاه القراءة. العنصر الذي
  "يدخل من الأمام" يدخل من اليمين في العربية ومن اليسار في الإنجليزية،
  لذا تُمرَّر كل الإزاحات الأفقية عبر inlineX() ولا تُكتب مباشرة.
*/
import type { Transition, Variants } from "motion/react";

/** منحنيات الحركة — مطابقة لـ --iz-ease-* في tokens.css */
export const EASE_CLAY = [0.22, 1, 0.36, 1] as const;
export const EASE_POP = [0.34, 1.56, 0.64, 1] as const;
export const EASE_SOFT = [0.4, 0, 0.2, 1] as const;

/** مدد الحركة بالثواني — مطابقة لـ --iz-t-* في tokens.css */
export const DUR = {
  tap: 0.12,
  fast: 0.18,
  base: 0.26,
  slow: 0.42,
  scene: 0.72,
} as const;

/** true عندما تكون صفحة القراءة من اليمين إلى اليسار. */
export function isRtl(): boolean {
  if (typeof document === "undefined") return true;
  return (document.documentElement.dir || document.dir || "rtl") === "rtl";
}

/**
 * إزاحة أفقية واعية بالاتجاه: القيمة الموجبة تعني دائمًا "من جهة بداية
 * السطر" (يمين في العربية)، فتنعكس تلقائيًا في الواجهات الإنجليزية.
 */
export function inlineX(px: number): number {
  return isRtl() ? px : -px;
}

/** انتقال الصفحات: انزلاق قصير مع تلاشٍ — لا قلب ولا تكبير مبالغ. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.995 },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DUR.slow, ease: EASE_CLAY, when: "beforeChildren" },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    transition: { duration: DUR.fast, ease: EASE_SOFT },
  },
};

/** حاوية تُدخِل أبناءها بتتابع — تُستخدم مع riseItem أو popItem. */
export const staggerContainer: Variants = {
  initial: {},
  enter: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
  exit: {},
};

/** عنصر يصعد بهدوء — للنصوص والصفوف والقوائم. */
export const riseItem: Variants = {
  initial: { opacity: 0, y: 16 },
  enter: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE_CLAY } },
  exit: { opacity: 0, y: 8, transition: { duration: DUR.fast, ease: EASE_SOFT } },
};

/** عنصر ينبثق بمرونة خفيفة — للبطاقات والأجسام الصلصالية والنجوم. */
export const popItem: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.92 },
  enter: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.slow, ease: EASE_POP } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: DUR.fast, ease: EASE_SOFT } },
};

/** بطاقة تدخل من جهة بداية السطر — للأدراج والصفوف الجانبية. */
export const slideInItem: Variants = {
  initial: () => ({ opacity: 0, x: inlineX(24) }),
  enter: { opacity: 1, x: 0, transition: { duration: DUR.slow, ease: EASE_CLAY } },
  exit: () => ({ opacity: 0, x: inlineX(16), transition: { duration: DUR.fast, ease: EASE_SOFT } }),
};

/** عمق اللمس: ارتفاع خفيف عند التحويم، وانغماس عند الضغط. */
export const tapDepth = {
  whileHover: { y: -3, scale: 1.02 },
  whileTap: { y: 1, scale: 0.97 },
  transition: { duration: DUR.tap, ease: EASE_CLAY } satisfies Transition,
};

/** طفو بطيء للأجسام الزخرفية — يُطفأ تلقائيًا عند تقليل الحركة. */
export function floatLoop(distance = 8, seconds = 5, delay = 0) {
  return {
    animate: { y: [0, -distance, 0] },
    transition: {
      duration: seconds,
      ease: EASE_SOFT,
      repeat: Infinity,
      delay,
    } satisfies Transition,
  };
}

/** نبضة نجاح قصيرة تُستخدم بعد الحفظ أو منح نجمة. */
export const successPulse: Variants = {
  initial: { scale: 0.6, opacity: 0 },
  enter: {
    scale: [0.6, 1.12, 1],
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_POP, times: [0, 0.6, 1] },
  },
  exit: { scale: 0.9, opacity: 0, transition: { duration: DUR.fast } },
};
