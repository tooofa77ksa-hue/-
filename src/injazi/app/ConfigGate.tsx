/*
  بوابة الإعدادات.
  ------------------------------------------------------------------
  بدون هذه الشاشة يبدو الموقع في الإنتاج وكأنه يعمل: الترويسة تظهر،
  والمعرض يقول "لم تُضَف أي طالبة بعد" — وهي رسالة كاذبة، فالسبب أن
  الاتصال بـ Firebase لم يُضبَط أصلًا لا أن البيانات فارغة.
  الفشل الصامت في الإنتاج أسوأ من الخطأ الظاهر، فنُظهر ما ينقص بالضبط.
*/
import { motion } from "motion/react";
import { TriangleAlert } from "lucide-react";
import { ClayObject } from "@/injazi/components/ClayObject";
import { isFirebaseConfigured, missingFirebaseEnvKeys } from "@/lib/firebase";
import { isFirebaseUsable } from "@/injazi/firebase/client";
import { DUR, EASE_CLAY } from "@/injazi/motion/motion";
import type { ReactNode } from "react";

export function ConfigGate({ children }: { children: ReactNode }) {
  if (isFirebaseConfigured && isFirebaseUsable) return <>{children}</>;

  const keys = missingFirebaseEnvKeys.length > 0 ? missingFirebaseEnvKeys : ["VITE_FIREBASE_API_KEY"];

  return (
    <motion.div
      className="iz-page iz-page--narrow iz-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.slow, ease: EASE_CLAY }}
      role="alert"
    >
      <ClayObject name="globe" tone="apricot" size={110} />
      <h1 className="iz-page__title">المنصة غير متصلة بقاعدة البيانات</h1>
      <p className="iz-empty__body">
        لم تُضبَط إعدادات Firebase في بيئة النشر، لذلك لا يمكن عرض ملفات الطالبات ولا تسجيل
        الدخول. هذه ليست مشكلة في البيانات — الاتصال نفسه غير مُعد.
      </p>

      <div className="iz-notice iz-notice--danger" style={{ textAlign: "start", width: "100%" }}>
        <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 8px", fontWeight: 700 }}>
          <TriangleAlert size={18} strokeWidth={2.4} aria-hidden="true" />
          المتغيّرات الناقصة
        </p>
        <ul style={{ margin: 0, paddingInlineStart: 20, lineHeight: 2 }}>
          {keys.map((key) => (
            <li key={key}>
              <code>{key}</code>
            </li>
          ))}
        </ul>
      </div>

      <p className="iz-field__meter" style={{ maxWidth: "46ch", lineHeight: 1.9 }}>
        تُضاف هذه القيم في إعدادات المشروع على منصة النشر (Environment Variables) ثم يُعاد
        البناء. القيم متاحة في Firebase Console ← إعدادات المشروع ← تطبيق الويب.
      </p>
    </motion.div>
  );
}
