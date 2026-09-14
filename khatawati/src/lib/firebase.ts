import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = missingKeys.length === 0;

if (!isFirebaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    `[Firebase] لم يتم ضبط إعدادات Firebase بعد لمشروع خطواتي. أضيفي القيم التالية إلى ملف .env: ${missingKeys.join(", ")}`
  );
}

export const app = initializeApp(firebaseConfig);

/**
 * نفس أسلوب مشروع شعلة لغتي: تهيئة Auth/Firestore داخل try/catch حتى لا
 * يظهر خطأ متزامن أثناء تقييم الوحدات (قبل أن يبدأ React) كشاشة بيضاء
 * صامتة بلا رسالة - عند الفشل نُصدِّر Proxy يرمي الخطأ فقط عند أول
 * استخدام فعلي داخل React، فتلتقطه ErrorBoundary في main.tsx.
 */
function createThrowingProxy<T extends object>(error: unknown): T {
  const throwError = (): never => {
    throw error instanceof Error ? error : new Error(String(error));
  };
  return new Proxy({} as T, { get: throwError, apply: throwError });
}

let authInstance: Auth;
let dbInstance: Firestore;
let initError: unknown = null;
try {
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
} catch (err) {
  initError = err;
  console.error("[Firebase] فشلت تهيئة Auth/Firestore لمشروع خطواتي - تحققي من .env:", err);
  authInstance = createThrowingProxy<Auth>(err);
  dbInstance = createThrowingProxy<Firestore>(err);
}

export const auth = authInstance;
export const db = dbInstance;
export const isFirebaseUsable = !initError;

if (!initError) {
  if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence).catch(() => {
      /* لا حاجة لإيقاف التطبيق إذا فشل ضبط الاستمرارية */
    });
  }

  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    // eslint-disable-next-line no-console
    console.info("[Firebase] متصل بمحاكيات Firebase المحلية (Auth: 9099, Firestore: 8080)");
  }
}
