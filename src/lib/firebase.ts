import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";

/**
 * إعدادات الاتصال المعلَنة بمشروع «إنجازي يحكي».
 * ------------------------------------------------------------------
 * ليست سرًّا: Firebase يصمّم هذه القيم لتُشحن داخل حزمة المتصفّح، ويراها
 * أي زائر بفتح أدوات المطوّر في أي موقع يستخدم Firebase. لا تمنح بنفسها
 * أي صلاحية — الحماية كلها في قواعد Firestore المنشورة وفي قائمة
 * النطاقات المصرّح بها (Authorized domains).
 *
 * سبب وجودها في الكود لا في متغيّرات المنصّة فقط: منصّات النشر قد تحجب
 * قيمة مضبوطة كـ Secret عن حزمة المتصفّح (Vercel يفعل ذلك صراحةً مع أي
 * متغيّر ببادئة عامة مثل VITE_)، فتصل إلى المتصفّح فارغة أو مشوّهة
 * ويرفض Firebase الطلب بـ auth/api-key-not-valid ولا يظهر سبب واضح.
 * وجودها هنا يجعل النشر يعمل بلا أي إعداد يدوي على أي منصّة.
 */
const PUBLISHED_CONFIG = {
  apiKey: "AIzaSyAk9DBAfEt8nx-aCnD5GlwBCnqp8FLZDls",
  authDomain: "injazi-yahki-165.firebaseapp.com",
  projectId: "injazi-yahki-165",
  storageBucket: "injazi-yahki-165.firebasestorage.app",
  messagingSenderId: "103069476611",
  appId: "1:103069476611:web:b61cfe1b36e82f8c3e2b36",
} as const;

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** شكل كل قيمة كما يصدرها Firebase — يكشف القيمة الفارغة أو المحجوبة أو
 *  المقصوصة قبل أن تتحوّل إلى خطأ غامض عند أول محاولة دخول. */
const SHAPE: Record<keyof typeof PUBLISHED_CONFIG, RegExp> = {
  apiKey: /^AIza[A-Za-z0-9_-]{30,}$/,
  authDomain: /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i,
  projectId: /^[a-z0-9-]{4,}$/i,
  storageBucket: /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i,
  messagingSenderId: /^\d{6,}$/,
  appId: /^\d+:\d+:web:[a-z0-9]+$/i,
};

const envKeys = Object.keys(PUBLISHED_CONFIG) as (keyof typeof PUBLISHED_CONFIG)[];

/** المجموعة من المنصّة صالحة فقط إذا كانت كاملة وكل قيمة فيها سليمة
 *  الشكل. الكل أو لا شيء عمدًا: خلط مفتاح من هنا ومعرّف مشروع من هناك
 *  ينتج إعدادًا متنافرًا يفشل بطريقة أصعب في التشخيص من غيابه أصلًا. */
const envConfigIsComplete = envKeys.every((key) => {
  const value = envConfig[key];
  return typeof value === "string" && SHAPE[key].test(value.trim());
});

/** في التطوير تُحترم قيم البيئة كما هي حتى تبقى المحاكيات تعمل على
 *  مشروع demo-injazi الوهمي، ولا يُستبدَل بها مشروع الإنتاج الحقيقي
 *  أبدًا. الاحتياط مقصور على بناء الإنتاج، حيث البديل الوحيد هو موقع
 *  معطّل. Vite يستبدل PROD بقيمة ثابتة، فالفرع الآخر يُحذف من الحزمة. */
const usePublished = import.meta.env.PROD && !envConfigIsComplete;

const firebaseConfig = usePublished
  ? { ...PUBLISHED_CONFIG }
  : Object.fromEntries(
      envKeys.map((key) => [key, (envConfig[key] ?? "").trim()]),
    ) as Record<keyof typeof PUBLISHED_CONFIG, string>;

if (usePublished) {
  // eslint-disable-next-line no-console
  console.info(
    "[Firebase] لم تصل إعدادات صالحة من منصّة النشر — استُخدمت الإعدادات المعلَنة داخل الكود.",
  );
}

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = missingKeys.length === 0;

/**
 * أسماء المتغيّرات الناقصة — تُعرَض للمشرفة في شاشة خطأ واضحة بدل أن
 * يبدو الموقع فارغًا بلا سبب. تُصدَّر لأن الفشل الصامت في الإنتاج أسوأ
 * من الخطأ الظاهر: الصفحة الفارغة تبدو "لا توجد بيانات" لا "لم يُضبَط
 * الاتصال".
 */
const ENV_NAME: Record<string, string> = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "VITE_FIREBASE_APP_ID",
};

/**
 * أسماء متغيّرات البيئة الناقصة كما تُكتب في منصة النشر بالضبط — لا
 * أسماء مفاتيح Firebase الداخلية (apiKey…)، لأن من يقرأ الرسالة يحتاج
 * الاسم الذي سيلصقه في الإعدادات لا الاسم الذي يستخدمه الـ SDK.
 */
export const missingFirebaseEnvKeys: string[] = missingKeys.map((key) => ENV_NAME[key] ?? key);

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

/** false فقط عند فشل تهيئة Auth/Firestore فعليًا (مثلًا apiKey غير صالح
 * الصيغة). تستخدمه دوال repo.ts لتفادي لمس auth/db إطلاقًا حين يكونان
 * كائنَي Proxy يرميان الخطأ، فتتوقف الميزات التي تعتمد على Firebase
 * بهدوء (تبقى النصوص الافتراضية، لا تُعرض الأسئلة) بدل كسر الصفحة كلها. */
export const isFirebaseUsable = !initError;

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
