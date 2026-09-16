/*
  دخول الفراشات — لحظة ترحيب واحدة، لا زخرفة دائمة
  ------------------------------------------------------------------
  القواعد التي يفرضها هذا المكوّن على نفسه:
    • أربع فراشات مُنمنمة بألوان باستيل (رسم SVG، بلا صور واقعية).
    • تدخل من حواف الشاشة بمسارات منحنية هادئة ثم تتلاشى خلال ~5 ثوانٍ.
    • لا تحجب شيئًا: طبقة ثابتة بـ pointer-events: none و aria-hidden.
    • لا تتكرر: تُعرض في أول زيارة فقط ثم تُسجَّل العلامة في المتصفح.
    • تُلغى كليًا عند تفعيل "تقليل الحركة" — لا نسخة مخففة تُربك.
  المنحنى يُبنى من نقاط طريق (waypoints) بتخفيف easeInOut بين كل نقطتين،
  مع تمايل خفيف مستقل للجناحَين، فيبدو الطيران عضويًا بلا مكتبة مسارات.
*/
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useCapability } from "@/injazi/lib/useCapability";

const SEEN_KEY = "injazi:butterflies-seen:v1";
const FLIGHT_SECONDS = 4.6;

type Flight = {
  tone: string;
  /** نقاط الطريق كنِسَب من عرض/ارتفاع الشاشة: [x%, y%] */
  waypoints: [number, number][];
  scale: number;
  delay: number;
  /** ميل ثابت يعطي كل فراشة شخصية مختلفة قليلًا */
  tilt: number;
};

// المسارات تعبر الشاشة من الحواف نحو الداخل ثم تخرج من الجهة المقابلة،
// فلا تستقر أي فراشة فوق نص أو زر.
const FLIGHTS: Flight[] = [
  {
    tone: "var(--iz-rose)",
    waypoints: [
      [-14, 78],
      [16, 58],
      [40, 70],
      [72, 42],
      [112, 26],
    ],
    scale: 1,
    delay: 0.1,
    tilt: -8,
  },
  {
    tone: "var(--iz-sky)",
    waypoints: [
      [112, 18],
      [78, 34],
      [52, 22],
      [22, 40],
      [-14, 30],
    ],
    scale: 0.78,
    delay: 0.45,
    tilt: 10,
  },
  {
    tone: "var(--iz-lemon)",
    waypoints: [
      [24, 114],
      [34, 76],
      [56, 60],
      [48, 30],
      [58, -16],
    ],
    scale: 0.66,
    delay: 0.8,
    tilt: 4,
  },
  {
    tone: "var(--iz-lilac)",
    waypoints: [
      [-12, 24],
      [22, 30],
      [46, 46],
      [80, 58],
      [114, 74],
    ],
    scale: 0.88,
    delay: 1.05,
    tilt: -4,
  },
];

function hasSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // وضع التصفح الخاص أو تخزين محجوب: نعرض اللحظة مرة واحدة في الجلسة
    // بدل تعطيلها نهائيًا أو تكرارها عند كل تنقّل.
    try {
      return window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return true;
    }
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* لا شيء نفعله — تبقى اللحظة مرة واحدة لكل تحميل صفحة */
    }
  }
}

export function ButterflyEntrance() {
  const { reducedMotion } = useCapability();
  const [flying, setFlying] = useState(false);

  // الإقلاع والتوقيت في تأثيرين منفصلين عمدًا.
  // StrictMode يشغّل التأثير مرتين مع تنظيف بينهما: لو كان المؤقّت داخل
  // تأثير الإقلاع، لأُلغي في التنظيف ثم خرجت الدورة الثانية مبكرًا (لأن
  // العلامة صارت مسجَّلة) فلا يُعاد ضبطه أبدًا — وتبقى الفراشات تطير
  // إلى ما لا نهاية. ربط المؤقّت بحالة flying يجعله يُعاد ضبطه دائمًا.
  useEffect(() => {
    if (reducedMotion || hasSeen()) return;
    markSeen();
    setFlying(true);
  }, [reducedMotion]);

  useEffect(() => {
    if (!flying) return;
    const longestDelay = FLIGHTS.reduce((max, f) => Math.max(max, f.delay), 0);
    const timer = window.setTimeout(
      () => setFlying(false),
      (longestDelay + FLIGHT_SECONDS) * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [flying]);

  // القياس يُلتقط مرة واحدة عند بدء الرحلة: اللحظة أقصر من أن تستحق
  // متابعة تغيّر المقاس، وتجنّبه يمنع إعادة حساب أثناء الطيران.
  const viewport = useMemo(
    () => ({
      width: typeof window === "undefined" ? 360 : window.innerWidth,
      height: typeof window === "undefined" ? 640 : window.innerHeight,
    }),
    [],
  );

  return (
    createPortal(
<AnimatePresence>
      {flying && (
        <div className="iz-butterflies" aria-hidden="true">
          {FLIGHTS.map((flight, index) => (
            <motion.div
              key={index}
              className="iz-butterflies__flight"
              initial={{ opacity: 0 }}
              animate={{
                x: flight.waypoints.map(([x]) => (x / 100) * viewport.width),
                y: flight.waypoints.map(([, y]) => (y / 100) * viewport.height),
                opacity: [0, 1, 1, 0.85, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: FLIGHT_SECONDS,
                delay: flight.delay,
                ease: "easeInOut",
                times: [0, 0.22, 0.5, 0.78, 1],
              }}
            >
              <motion.div
                animate={{ rotate: [flight.tilt - 6, flight.tilt + 6, flight.tilt - 6] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ scale: flight.scale }}
              >
                <Butterfly tone={flight.tone} />
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
  );
}

function Butterfly({ tone }: { tone: string }) {
  return (
    <svg className="iz-butterfly" width="60" height="48" viewBox="0 0 60 48" focusable="false">
      <g className="iz-butterfly__wing">
        <path
          d="M29 15 C19 3 3 6 5 18 C7 29 20 27 29 24 Z"
          fill={tone}
          opacity="0.92"
        />
        <path
          d="M29 26 C21 28 9 32 13 40 C17 47 27 38 29 32 Z"
          fill={tone}
          opacity="0.68"
        />
      </g>
      <g transform="translate(60,0) scale(-1,1)">
        <g className="iz-butterfly__wing">
          <path
            d="M29 15 C19 3 3 6 5 18 C7 29 20 27 29 24 Z"
            fill={tone}
            opacity="0.92"
          />
          <path
            d="M29 26 C21 28 9 32 13 40 C17 47 27 38 29 32 Z"
            fill={tone}
            opacity="0.68"
          />
        </g>
      </g>
      <rect x="28.4" y="12" width="3.2" height="25" rx="1.6" fill="var(--iz-ink)" opacity="0.55" />
      <path
        d="M30 13 C27 8 24 6 21 5 M30 13 C33 8 36 6 39 5"
        stroke="var(--iz-ink)"
        strokeOpacity="0.4"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
