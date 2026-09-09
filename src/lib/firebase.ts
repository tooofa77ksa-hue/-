import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

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

if (!isFirebaseConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    `[Firebase] لم يتم ضبط إعدادات Firebase بعد. أضف القيم التالية إلى ملف .env: ${missingKeys.join(", ")}`
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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
