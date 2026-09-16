/*
  بوابة المشهد ثلاثي الأبعاد
  ------------------------------------------------------------------
  الواجهة تعمل كاملةً بدون Three.js: ما يُرسَم افتراضيًا هو تكوين
  صلصالي مسطّح (SVG + طفو خفيف) مكتفٍ بذاته. المشهد ثلاثي الأبعاد
  ترقية اختيارية تُحمَّل فقط عندما تجتمع الشروط الأربعة:
    • الجهاز يحتمله (شاشة كبيرة، ذاكرة/أنوية كافية، بلا توفير بيانات)
    • تفضيل الحركة يسمح به
    • البطل ظاهر فعلًا في الشاشة (IntersectionObserver)
    • وحُمِّل بنجاح — وإلا بقي البديل المسطّح كما هو بلا رسالة خطأ
  بهذا لا يدخل three إلى أي حزمة يحمّلها هاتف، ولا يتأثر LCP بمشهد
  زخرفي.
*/
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ClayObject } from "@/injazi/components/ClayObject";
import { useCapability } from "@/injazi/lib/useCapability";
import { DUR, EASE_CLAY, EASE_SOFT, floatLoop } from "@/injazi/motion/motion";
import type { SceneColors } from "@/injazi/three/HeroScene";

const HeroScene = lazy(() => import("@/injazi/three/HeroScene"));

/** يقرأ ألوان المشهد من رموز CSS حتى يبقى الصلصال عائلة واحدة. */
function readSceneColors(element: HTMLElement): SceneColors {
  const styles = getComputedStyle(element);
  const token = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;

  return {
    star: token("--iz-gold", "#f6b93b"),
    book1: token("--iz-lilac", "#c3aef5"),
    book2: token("--iz-sky", "#8fcbff"),
    book3: token("--iz-mint", "#8fe0c0"),
  };
}

export function HeroObject() {
  const { allow3D, reducedMotion } = useCapability();
  const host = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [colors, setColors] = useState<SceneColors | null>(null);

  useEffect(() => {
    const element = host.current;
    if (!element || !allow3D) return;

    if (typeof IntersectionObserver !== "function") {
      setVisible(true);
      setColors(readSceneColors(element));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // يُفرَّغ المشهد عند الخروج من الشاشة: لا حلقة رسم تعمل خلف الكواليس.
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setColors(readSceneColors(element));
      },
      { rootMargin: "120px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [allow3D]);

  const show3D = allow3D && visible && colors !== null;

  return (
    <div className="iz-hero-object" ref={host}>
      {show3D ? (
        <Suspense fallback={<FlatHero reducedMotion={reducedMotion} />}>
          <HeroScene colors={colors} />
        </Suspense>
      ) : (
        <FlatHero reducedMotion={reducedMotion} />
      )}
    </div>
  );
}

/** التكوين المسطّح: نجمة تعلو كتابًا وقلمًا — نفس فكرة المشهد بلا تكلفته. */
function FlatHero({ reducedMotion }: { reducedMotion: boolean }) {
  const star = floatLoop(10, 5);
  const book = floatLoop(6, 6.5, 0.4);

  return (
    <motion.div
      className="iz-hero-flat"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DUR.scene, ease: EASE_CLAY }}
    >
      <motion.div
        className="iz-hero-flat__star"
        animate={reducedMotion ? undefined : star.animate}
        transition={reducedMotion ? { duration: 0, ease: EASE_SOFT } : star.transition}
      >
        <ClayObject name="star" tone="gold" size={108} grounded={false} />
      </motion.div>
      <motion.div
        className="iz-hero-flat__book"
        animate={reducedMotion ? undefined : book.animate}
        transition={reducedMotion ? { duration: 0, ease: EASE_SOFT } : book.transition}
      >
        <ClayObject name="book" tone="lilac" size={150} />
      </motion.div>
      <div className="iz-hero-flat__pencil">
        <ClayObject name="pencil" tone="sky" size={92} grounded={false} />
      </div>
    </motion.div>
  );
}
