import { slide } from "@remotion/transitions/slide";
import { springTiming } from "@remotion/transitions";

/**
 * إعداد انتقال موحّد بين المشاهد الرئيسية - Slide ناعم بتوقيت Spring
 * (لا Bounce واضح، damping مرتفع) بدل Fade مسطح أو Cut مفاجئ. يُستخدم هذا
 * الإعداد نفسه من timeline.ts في كل TransitionSeries.Transition لضمان
 * اتساق الهوية الحركية عبر الفيديو كاملًا.
 */
export const TRANSITION_DURATION_FRAMES = 24;

export function sceneTransition(direction: "from-right" | "from-left" = "from-left") {
  return {
    presentation: slide({ direction }),
    timing: springTiming({
      config: { damping: 200, stiffness: 110, mass: 1 },
      durationInFrames: TRANSITION_DURATION_FRAMES,
    }),
  };
}
