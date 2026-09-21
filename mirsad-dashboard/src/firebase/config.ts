import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'

import { isFirebaseConfigured, readEnv } from './env'

/**
 * إعداد Firebase الخاص بمشروع "مرصد" وحده.
 *
 * البادئة VITE_MIRSAD_ مقصودة: هذا المشروع لا يقرأ ولا يشارك أي متغيّر
 * بيئة أو مشروع Firebase أو قاعدة بيانات مع أي تطبيق آخر.
 * إن لم تكتمل المتغيّرات، يبقى الاتصال معطّلًا ويعمل التطبيق محليًا.
 */
function buildOptions(): FirebaseOptions {
  return {
    apiKey: readEnv('VITE_MIRSAD_FIREBASE_API_KEY'),
    authDomain: readEnv('VITE_MIRSAD_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('VITE_MIRSAD_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('VITE_MIRSAD_FIREBASE_STORAGE_BUCKET') || undefined,
    messagingSenderId: readEnv('VITE_MIRSAD_FIREBASE_MESSAGING_SENDER_ID') || undefined,
    appId: readEnv('VITE_MIRSAD_FIREBASE_APP_ID'),
  }
}

let cachedApp: FirebaseApp | null = null
let cachedDb: Firestore | null = null

/** يُنشئ تطبيق Firebase مرة واحدة، أو يُعيد null إن لم يُضبط الإعداد. */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null
  if (!cachedApp) {
    // اسم مميّز للتطبيق حتى لا يتعارض مع أي نسخة Firebase أخرى على الصفحة.
    cachedApp = initializeApp(buildOptions(), 'mirsad-dashboard')
  }
  return cachedApp
}

/** يُعيد قاعدة بيانات Firestore الخاصة بهذا المشروع، أو null. */
export function getDb(): Firestore | null {
  if (cachedDb) return cachedDb

  const app = getFirebaseApp()
  if (!app) return null

  cachedDb = getFirestore(app)

  if (readEnv('VITE_MIRSAD_USE_EMULATOR') === 'true') {
    connectFirestoreEmulator(cachedDb, '127.0.0.1', 8181)
  }

  return cachedDb
}
