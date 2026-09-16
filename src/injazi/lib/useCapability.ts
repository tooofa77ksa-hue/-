/*
  قياس قدرة الجهاز قبل تحميل أي شيء ثقيل.
  ------------------------------------------------------------------
  القاعدة في هذا المشروع: الهاتف أولًا. لا يُحمَّل Three.js ولا Lottie
  إلا إذا كانت الشاشة الحالية تحتاجهما فعلًا وكان الجهاز يحتملهما.
  هذا الملف هو البوابة الوحيدة لذلك القرار حتى لا يتكرر المنطق.
*/
import { useEffect, useState } from "react";

export type Capability = {
  /** المستخدِمة طلبت تقليل الحركة من إعدادات النظام. */
  reducedMotion: boolean;
  /** جهاز لمس/شاشة صغيرة — نُبقي الزخرفة ثلاثية الأبعاد خارجه. */
  compact: boolean;
  /** وضع توفير البيانات مفعَّل. */
  saveData: boolean;
  /** يسمح بتحميل مشهد ثلاثي الأبعاد (Three.js). */
  allow3D: boolean;
  /** يسمح بتحميل حركة Lottie للحظات الخاصة. */
  allowLottie: boolean;
};

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const COMPACT_QUERY = "(max-width: 860px), (pointer: coarse)";

function read(): Capability {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return {
      reducedMotion: true,
      compact: true,
      saveData: true,
      allow3D: false,
      allowLottie: false,
    };
  }

  const reducedMotion = window.matchMedia(REDUCED_QUERY).matches;
  const compact = window.matchMedia(COMPACT_QUERY).matches;

  const connection = (navigator as any).connection;
  const saveData = Boolean(connection?.saveData);
  const slowNetwork = /(^|\b)(slow-2g|2g|3g)$/.test(String(connection?.effectiveType ?? ""));

  // deviceMemory/hardwareConcurrency غير مدعومَين في كل المتصفحات؛ الغياب
  // يُعامَل كقيمة متوسطة مقبولة بدل الحرمان من التجربة.
  const memory = Number((navigator as any).deviceMemory ?? 8);
  const cores = Number(navigator.hardwareConcurrency ?? 8);
  const weakDevice = memory < 4 || cores < 4;

  const budget = !saveData && !slowNetwork && !weakDevice;

  return {
    reducedMotion,
    compact,
    saveData,
    // الثلاثي الأبعاد زخرفة بطولية لشاشة واحدة: يُمنَع على الأجهزة
    // الصغيرة/الضعيفة وعند تقليل الحركة، ويبقى للواجهة بديل مسطّح كامل.
    allow3D: budget && !compact && !reducedMotion,
    // Lottie أخف بكثير، فيكفيه ألا تكون المستخدِمة في وضع توفير البيانات.
    allowLottie: !saveData && !slowNetwork,
  };
}

/** يقرأ قدرة الجهاز ويتابع تغيّرها (تدوير الشاشة، تبديل تفضيل الحركة). */
export function useCapability(): Capability {
  const [capability, setCapability] = useState<Capability>(read);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const queries = [window.matchMedia(REDUCED_QUERY), window.matchMedia(COMPACT_QUERY)];
    const update = () => setCapability(read());
    queries.forEach((query) => query.addEventListener("change", update));
    update();
    return () => queries.forEach((query) => query.removeEventListener("change", update));
  }, []);

  return capability;
}
