/*
  تحويل مرجع الصورة إلى رابط قابل للعرض.
  ------------------------------------------------------------------
  الحقل الواحد (photoUrl / coverUrl / imageUrl) قد يحمل أحد شكلين:
    • "iz-media://{id}"  → صورة محفوظة داخل Firestore
    • "https://…"        → رابط عادي (Cloud Storage أو أي مصدر خارجي)

  الرابط العادي يُعاد فورًا دون انتظار، والمرجع الداخلي يُجلب مرة واحدة
  ثم يبقى في ذاكرة الجلسة. ملف مستقل عن <Media> لأن ملف المكوّن لا
  يُصدِّر إلا مكوّنات (شرط Fast Refresh).
*/
import { useEffect, useState } from "react";
import { isMediaRef, resolveMedia } from "@/injazi/services/media";

export function useMediaSrc(src: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(
    src && !isMediaRef(src) ? src : null,
  );

  useEffect(() => {
    if (!src) {
      setResolved(null);
      return;
    }
    if (!isMediaRef(src)) {
      setResolved(src);
      return;
    }

    let cancelled = false;
    setResolved(null);
    resolveMedia(src).then((data) => {
      if (!cancelled) setResolved(data);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return resolved;
}
