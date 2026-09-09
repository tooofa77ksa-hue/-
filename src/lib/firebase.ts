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
    `[Firebase] لم يتم ضبط إعدادات Firebase بعد. أضف القيم التالية إلى ملف .env: ${missingKeys.join(", ")}`
  );
}

export const app = initializeApp(firebaseConfig);

/**
 * getAuth()/getFirestore() يتحققان من شكل apiKey ويرميان استثناءً
 * متزامنًا فورًا إذا كان غير صالح - وبما أن firebase.ts يُستورَد من
 * الشجرة الجذرية (BrandHeader/BrandFooter)، فإن استثناءً هنا يحدث أثناء
 * تقييم الوحدات (Module evaluation) قبل أن يبدأ React بالعرض إطلاقًا،
 * فلا تستطيع أي ErrorBoundary داخل React التقاطه، وتظهر صفحة بيضاء
 * فارغة تمامًا بلا أي رسالة. لتفادي ذلك: التهيئة داخل try/catch، وعند
 * الفشل نُصدِّر كائنًا بديلًا (Proxy) يرمي نفس الخطأ لاحقًا فقط عند أول
 * استخدام فعلي (داخل useEffect بمكوّنات React)، حيث تلتقطه ErrorBoundary
 * في main.tsx وتعرض رسالة واضحة بدل شاشة بيضاء صامتة.
 */
function createThrowingProxy<T extends object>(error: unknown): T {
  const throwError = (): never => {
    throw error instanceof Error ? error : new Error(String(error));
  };
  return new Proxy({} as T, {
    get: throwError,
    apply: throwError,
  });
}

let authInstance: Auth;
let dbInstance: Firestore;
let initError: unknown = null;
try {
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
} catch (err) {
  initError = err;
  console.error(
    "[Firebase] فشلت تهيئة Auth/Firestore - تحققي من قيم .env (خصوصًا VITE_FIREBASE_API_KEY):",
    err
  );
  authInstance = createThrowingProxy<Auth>(err);
  dbInstance = createThrowingProxy<Firestore>(err);
}

export const auth = authInstance;
export const db = dbInstance;

// أي استدعاء إضافي على auth/db (استمرارية الجلسة، الاتصال بالمحاكي) يُقيَّد
// بنجاح التهيئة أعلاه فقط - لا يُلمَس auth/db إطلاقًا إن كانا كائنَي Proxy
// يرميان الخطأ، حتى لا يتكرر الاستثناء المتزامن هنا خارج try/catch.
if (!initError) {
  if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence).catch(() => {
      /* لا حاجة لإيقاف التطبيق إذا فشل ضبط الاستمرارية */
    });
  }

  // الاتصال بالمحاكيات المحلية (Emulator Suite) مقصور على وضع التطوير
  // (import.meta.env.DEV) عمدًا، حتى لو تسرّب المتغير خطأً إلى بيئة إنتاج،
  // فلا يمكن لبناء الإنتاج (npm run build) الاتصال بمحاكٍ محلي إطلاقًا -
  // Vite يستبدل import.meta.env.DEV بقيمة ثابتة (false) عند البناء، فهذا
  // الشرط بأكمله يُستبعَد من حزمة الإنتاج (Dead code elimination).
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    // eslint-disable-next-line no-console
    console.info("[Firebase] متصل بمحاكيات Firebase المحلية (Auth: 9099, Firestore: 8080)");
  }
}
