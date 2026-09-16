/*
  Firebase App Check.
  ------------------------------------------------------------------
  يمنع استهلاك قاعدة البيانات والتخزين من خارج الموقع نفسه (سكربتات،
  عملاء منتحلون)، فهو طبقة فوق القواعد الأمنية لا بديل عنها: القواعد
  تقرّر "من يملك الصلاحية"، وApp Check يقرّر "هل الطلب من تطبيقنا أصلًا".

  ثلاثة قيود مقصودة:
    • لا يُحمَّل ولا يُهيَّأ إطلاقًا إن لم يُضبَط مفتاح reCAPTCHA — فلا
      يكسر بناءً أو نشرًا قبل تسجيل الموقع في الكونسول.
    • يُعطَّل كليًا عند تشغيل المحاكيات، وإلا رفض المحاكي كل طلب
      واختبارات المتصفح والقواعد تسقط جميعًا.
    • رمز تصحيح اختياري للتطوير على جهاز حقيقي دون تسجيل نطاق محلي.

  التهيئة غير متزامنة (import ديناميكي) حتى لا تدخل حزمة app-check
  مسار التحميل الأول لمن لا يستخدمها.
*/
import { app, isFirebaseUsable } from "@/lib/firebase";

const SITE_KEY = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY as string | undefined;
const DEBUG_TOKEN = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN as string | undefined;
const USING_EMULATORS = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

let started = false;

/** true عندما يكون App Check مضبوطًا وفعّالًا في هذه البيئة. */
export const isAppCheckEnabled = Boolean(SITE_KEY) && !USING_EMULATORS;

/**
 * يُستدعى مرة واحدة عند إقلاع التطبيق. آمن للاستدعاء المتكرر، ولا يرمي
 * أبدًا: فشل App Check يجب ألا يمنع عرض الموقع — القواعد الأمنية تبقى
 * خط الدفاع الفعلي.
 */
export async function startAppCheck(): Promise<void> {
  if (started || !isAppCheckEnabled || !isFirebaseUsable) return;
  started = true;

  try {
    if (import.meta.env.DEV && DEBUG_TOKEN) {
      // موثَّق من Firebase: يجب ضبطه قبل initializeAppCheck.
      (globalThis as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN =
        DEBUG_TOKEN;
    }

    const { initializeAppCheck, ReCaptchaV3Provider } = await import("firebase/app-check");
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(SITE_KEY as string),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[AppCheck] تعذّرت تهيئة App Check — يستمر الموقع بالقواعد الأمنية وحدها:", error);
  }
}
