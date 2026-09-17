/*
  السماء الحيّة.
  ------------------------------------------------------------------
  خلفية المنصة كلها: ثلاث سُحُب لونية تنزلق وتتنفّس ببطء، وثلاث طبقات
  نجوم بأعماق مختلفة تُبحر بسرعات متفاوتة، وتنزلق مع المؤشّر بمقادير
  تتناسب مع بُعدها. النتيجة إحساس كاميرا داخل فضاء، لا صورة ثابتة.

  لماذا لا three.js؟ المشهد هنا خلفية لا موضوع، والمكتبة ٨١٣ كيلوبايت
  تُحمَّل قبل أول إطار. كل الحركة أدناه transform وopacity فقط — لا
  إعادة تخطيط ولا إعادة طلاء، فتبقى ٦٠ إطارًا على جوال متوسط.

  النجوم تُولَّد مرة واحدة ثم تُجمَّد (useMemo بلا اعتماديات): إعادة
  توليدها مع كل تصيير تجعلها تقفز أمام العين.
*/
import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "motion/react";

type Layer = {
  /** معامل الانزلاق مع المؤشّر — كلما قرُبت الطبقة زاد. */
  depth: number;
  count: number;
  size: number;
  dim: number;
  sail: string;
};

const LAYERS: Layer[] = [
  { depth: 6, count: 44, size: 1.1, dim: 0.45, sail: "38s" },
  { depth: 14, count: 28, size: 1.8, dim: 0.7, sail: "26s" },
  { depth: 26, count: 15, size: 2.8, dim: 1, sail: "18s" },
];

type Star = { top: string; left: string; size: string; opacity: string; glow: string };

function makeStars(layer: Layer): Star[] {
  return Array.from({ length: layer.count }, () => {
    // تفاوت الحجم والشفافية يمنع أن تبدو النجوم مطبوعة بقالب واحد.
    const size = layer.size * (0.6 + Math.random() * 0.8);
    return {
      top: `${(Math.random() * 100).toFixed(2)}%`,
      left: `${(Math.random() * 100).toFixed(2)}%`,
      size: `${size.toFixed(2)}px`,
      opacity: (layer.dim * (0.35 + Math.random() * 0.65)).toFixed(2),
      glow: `0 0 ${(size * 3).toFixed(1)}px rgba(255,255,255,.75)`,
    };
  });
}

export function NightSky() {
  const reducedMotion = useReducedMotion();
  const skyRef = useRef<HTMLDivElement>(null);
  const layers = useMemo(() => LAYERS.map((layer) => ({ layer, stars: makeStars(layer) })), []);

  useEffect(() => {
    if (reducedMotion) return;
    const sky = skyRef.current;
    if (!sky) return;

    let x = 0;
    let y = 0;
    let queued = false;

    const apply = () => {
      queued = false;
      sky.style.setProperty("--iz-sky-px", x.toFixed(3));
      sky.style.setProperty("--iz-sky-py", y.toFixed(3));
    };

    // مربوط بإطار العرض: pointermove يُطلق عشرات المرات في الثانية،
    // والكتابة على النمط أكثر من مرة في الإطار الواحد هدر خالص.
    const onMove = (event: PointerEvent) => {
      x = (event.clientX / window.innerWidth - 0.5) * -2;
      y = (event.clientY / window.innerHeight - 0.5) * -2;
      if (!queued) {
        queued = true;
        requestAnimationFrame(apply);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  return (
    <div className="iz-nightsky" ref={skyRef} aria-hidden="true">
      <span className="iz-neb iz-neb--1" />
      <span className="iz-neb iz-neb--2" />
      <span className="iz-neb iz-neb--3" />
      {layers.map(({ layer, stars }) => (
        <div
          key={layer.depth}
          className="iz-starlayer"
          style={{ ["--iz-depth" as string]: layer.depth }}
        >
          <div className="iz-starlayer__sail" style={{ ["--iz-sail" as string]: layer.sail }}>
            {stars.map((star, index) => (
              <span
                key={index}
                className="iz-star"
                style={{
                  top: star.top,
                  left: star.left,
                  width: star.size,
                  height: star.size,
                  opacity: star.opacity,
                  boxShadow: star.glow,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
