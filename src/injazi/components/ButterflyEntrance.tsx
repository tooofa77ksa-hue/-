/*
  دخول الفراشات — لحظة ترحيب واحدة، لا زخرفة دائمة
  ------------------------------------------------------------------
  القواعد التي يفرضها هذا المكوّن على نفسه:
    • خمس فراشات مضيئة (رسم SVG، بلا صور واقعية).
    • الأجنحة ثلاثية الأبعاد فعلًا: كل جناح يدور حول محوره (rotateY)
      داخل مشهد له perspective، فيُرى مرة عريضًا ومرة من حرفه — لا
      صورة تهتزّ. بلا three.js: المكتبة ٨١٣ كيلوبايت تُحمَّل قبل أول
      إطار، فتصير اللحظة انتظارًا بدل ترحيب.
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
// خمس فراشات لا أربع، فضُغط التتابع كي تبقى اللحظة كلها دون ٥٫٥ ثانية:
// الترحيب الذي يطول يصير انتظارًا.
const FLIGHT_SECONDS = 4.2;

type Flight = {
  /** وجه الجناح المضيء وقاعدته — التدرّج بينهما هو ما يعطي الحجم. */
  c1: string;
  c2: string;
  glow: string;
  /** زمن الرفرفة: القريبة أسرع، والبعيدة أبطأ. */
  flap: number;
  /** نقاط الطريق كنِسَب من عرض/ارتفاع الشاشة: [x%, y%] */
  waypoints: [number, number][];
  scale: number;
  delay: number;
  /** ميل ثابت يعطي كل فراشة شخصية مختلفة قليلًا */
  tilt: number;
  /** ضباب خفيف على البعيدة — هذا ما يصنع العمق، لا عدد الفراشات. */
  blur: number;
  opacity: number;
};

// المسارات تعبر الشاشة من الحواف نحو الداخل ثم تخرج من الجهة المقابلة،
// فلا تستقر أي فراشة فوق نص أو زر.
const FLIGHTS: Flight[] = [
  {
    c1: "#8BEBFF",
    c2: "#3FB8FF",
    glow: "rgba(95, 227, 255, .75)",
    flap: 0.26,
    waypoints: [
      [-14, 78],
      [16, 58],
      [40, 70],
      [72, 42],
      [112, 26],
    ],
    scale: 1.15,
    delay: 0.1,
    tilt: -8,
    blur: 0,
    opacity: 1,
  },
  {
    c1: "#D9C6FF",
    c2: "#9B78FF",
    glow: "rgba(169, 139, 255, .7)",
    flap: 0.32,
    waypoints: [
      [112, 18],
      [78, 34],
      [52, 22],
      [22, 40],
      [-14, 30],
    ],
    scale: 0.78,
    delay: 0.3,
    tilt: 10,
    blur: 0.4,
    opacity: 0.85,
  },
  {
    c1: "#FFE3A8",
    c2: "#FFB03A",
    glow: "rgba(255, 201, 107, .6)",
    flap: 0.38,
    waypoints: [
      [24, 114],
      [34, 76],
      [56, 60],
      [48, 30],
      [58, -16],
    ],
    scale: 0.6,
    delay: 0.5,
    tilt: 4,
    blur: 1.1,
    opacity: 0.62,
  },
  {
    c1: "#FFC9E0",
    c2: "#FF6FAE",
    glow: "rgba(255, 143, 192, .7)",
    flap: 0.23,
    waypoints: [
      [-12, 24],
      [22, 30],
      [46, 46],
      [80, 58],
      [114, 74],
    ],
    scale: 1.32,
    delay: 0.7,
    tilt: -4,
    blur: 0,
    opacity: 1,
  },
  {
    c1: "#AFF6E2",
    c2: "#38D3AC",
    glow: "rgba(110, 231, 199, .65)",
    flap: 0.29,
    waypoints: [
      [114, 62],
      [82, 74],
      [50, 84],
      [20, 72],
      [-14, 88],
    ],
    scale: 0.92,
    delay: 0.9,
    tilt: 14,
    blur: 0.2,
    opacity: 0.92,
  },
];

/*
  العلامة في sessionStorage لا في localStorage: «مرة واحدة إلى الأبد»
  تعني أن الطالبة ترى ترحيبها مرة في عمر المتصفّح ثم لا تراه أبدًا،
  وهي تفتح ملفها كل يوم. الحدّ المقصود هو ألّا تتكرّر عند كل تنقّل
  داخل الزيارة الواحدة — وهذا ما تضبطه الجلسة بالضبط: تطير عند فتح
  الموقع، وتصمت وأنتِ تتنقّلين، وتعود في الزيارة التالية.
*/
function hasSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // تخزين محجوب تمامًا: لا وسيلة لمعرفة ما إذا رأتها، ولا وسيلة
    // لمنع التكرار عند كل تنقّل. نعرضها — الترحيب المتكرّر أهون من
    // ترحيب لا يحدث أبدًا.
    return false;
  }
}

function markSeen() {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* بلا تخزين: تبقى اللحظة مرة واحدة لكل تحميل صفحة */
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
                style={{
                  scale: flight.scale,
                  opacity: flight.opacity,
                  filter: `drop-shadow(0 0 14px ${flight.glow})${flight.blur ? ` blur(${flight.blur}px)` : ""}`,
                }}
              >
                <Butterfly flight={flight} index={index} />
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

/*
  الجناحان عنصران منفصلان، كل واحد يدور حول حافته الملاصقة للجسم.
  المشهد الأب يحمل perspective، فيقصر الجناح بصريًا كلما التفّ — وهذا
  هو الفرق بين جناح يرفرف وصورة تتمدّد أفقيًا.
  معرّفات التدرّج مُفهرسة (index) لأن أكثر من فراشة في الصفحة، ومعرّف
  مكرّر في SVG يجعلهنّ كلهنّ يأخذن لون الأولى.
*/
function Butterfly({ flight, index }: { flight: Flight; index: number }) {
  const style = { ["--iz-flap" as string]: `${flight.flap}s` };
  return (
    <span className="iz-butterfly" style={style}>
      <span className="iz-butterfly__wing iz-butterfly__wing--l">
        <Wing id={`izwl${index}`} c1={flight.c1} c2={flight.c2} />
      </span>
      <span className="iz-butterfly__wing iz-butterfly__wing--r">
        <Wing id={`izwr${index}`} c1={flight.c1} c2={flight.c2} />
      </span>
      <span className="iz-butterfly__body" style={{ background: flight.c1 }} />
    </span>
  );
}

function Wing({ id, c1, c2 }: { id: string; c1: string; c2: string }) {
  return (
    <svg viewBox="0 0 42 68" fill="none" focusable="false">
      <defs>
        <radialGradient id={id} cx="82%" cy="42%" r="95%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="58%" stopColor={c2} />
          <stop offset="100%" stopColor={c2} stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <path d="M42 33 C41 14 34 2 20 0 C7 -2 -2 10 3 22 C8 32 24 37 42 33 Z" fill={`url(#${id})`} />
      <path
        d="M42 37 C32 37 19 41 13 50 C7 60 15 69 25 64 C34 59 40 47 42 41 Z"
        fill={`url(#${id})`}
        opacity="0.9"
      />
      <circle cx="17" cy="17" r="3.4" fill="#fff" opacity="0.55" />
      <circle cx="9" cy="25" r="1.8" fill="#fff" opacity="0.4" />
      <circle cx="24" cy="53" r="2.4" fill="#fff" opacity="0.42" />
    </svg>
  );
}
