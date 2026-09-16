/*
  لحظات Lottie
  ------------------------------------------------------------------
  Lottie هنا للحظات الخاصة فقط (نجمة، تاج، نجاح الحفظ) ولا شيء غيرها؛
  كل حركة الواجهة اليومية تبقى transform/opacity عبر Motion.

  ثلاثة قيود مقصودة:
    1. المشغّل والملف لا يُحمَّلان إلا لحظة العرض (import ديناميكي)،
       فلا يدخل أيٌّ منهما حزمة الدخول.
    2. نسخة lottie_light (SVG، بلا WASM وبلا CDN): لا طلب شبكة خارجي
       ولا ميجابايت إضافي على شبكة مدرسية.
    3. عند تقليل الحركة أو توفير البيانات لا يُحمَّل شيء إطلاقًا،
       ويظهر الجسم الصلصالي الساكن نفسه — فاللحظة تصل في كل الحالات.
*/
import { useEffect, useRef, useState } from "react";
import { ClayObject } from "@/injazi/components/ClayObject";
import type { ClayName, ClayTone } from "@/injazi/components/ClayObject";
import { useCapability } from "@/injazi/lib/useCapability";

export type MomentName = "star" | "crown" | "success";

type Props = {
  name: MomentName;
  size?: number;
  loop?: boolean;
  onComplete?: () => void;
  className?: string;
  /** وصف نصي للحظة — مطلوب لأن الحركة وحدها لا تصل لقارئ الشاشة. */
  label: string;
};

const LOADERS: Record<MomentName, () => Promise<{ default: unknown }>> = {
  star: () => import("@/injazi/lottie/star.json"),
  crown: () => import("@/injazi/lottie/crown.json"),
  success: () => import("@/injazi/lottie/success.json"),
};

const STATIC_FALLBACK: Record<MomentName, { name: ClayName; tone: ClayTone }> = {
  star: { name: "star", tone: "gold" },
  crown: { name: "crown", tone: "gold" },
  success: { name: "star", tone: "mint" },
};

export function LottieMoment({
  name,
  size = 120,
  loop = false,
  onComplete,
  className = "",
  label,
}: Props) {
  const { allowLottie, reducedMotion } = useCapability();
  const host = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const animate = allowLottie && !reducedMotion && !failed;

  // onComplete يُقرأ من ref حتى لا تُعيد دالة جديدة بناء الحركة من الصفر.
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    if (!animate) {
      // في الوضع الساكن نُبلغ المتصل فورًا حتى لا تتعلّق أي متتالية
      // تنتظر انتهاء اللحظة.
      completeRef.current?.();
      return;
    }

    let cancelled = false;
    let destroy: (() => void) | undefined;

    Promise.all([import("lottie-web/build/player/lottie_light"), LOADERS[name]()])
      .then(([player, data]) => {
        if (cancelled || !host.current) return;
        const animation = player.default.loadAnimation({
          container: host.current,
          renderer: "svg",
          loop,
          autoplay: true,
          animationData: (data as { default: unknown }).default,
        });
        animation.addEventListener("complete", () => completeRef.current?.());
        destroy = () => animation.destroy();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [animate, loop, name]);

  if (!animate) {
    const fallback = STATIC_FALLBACK[name];
    return (
      <div className={`iz-moment ${className}`} style={{ width: size, height: size }}>
        <ClayObject name={fallback.name} tone={fallback.tone} size={size} grounded={false} title={label} />
      </div>
    );
  }

  return (
    <div
      ref={host}
      className={`iz-moment ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    />
  );
}
