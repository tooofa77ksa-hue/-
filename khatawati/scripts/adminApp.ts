/**
 * تهيئة موحّدة لتطبيق Firebase Admin لمشروع "خطواتي" - نفس نمط شعلة
 * لغتي بالضبط (ثلاثة أوضاع: محاكي محلي / FIREBASE_TOKEN شخصي /
 * serviceAccountKey.json)، لكن بمعرّف مشروع وهمي منفصل للمحاكي حتى لا
 * يتداخل مع بيانات شعلة لغتي أبدًا حتى في وضع الاختبار المحلي.
 */
import { initializeApp, cert, refreshToken, type App } from "firebase-admin/app";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FIREBASE_CLI_OAUTH_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLI_OAUTH_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

export const isEmulatorMode = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST
);

export function initAdminApp(): App {
  if (isEmulatorMode) {
    const projectId = process.env.GCLOUD_PROJECT || "demo-khatawati";
    console.log(`[admin] وضع المحاكي (Emulator) - معرّف مشروع وهمي: ${projectId}`);
    return initializeApp({ projectId });
  }

  if (process.env.FIREBASE_TOKEN) {
    const projectId = process.env.GCLOUD_PROJECT;
    if (!projectId) {
      console.error("[admin] وضع FIREBASE_TOKEN يتطلب أيضًا ضبط GCLOUD_PROJECT بمعرّف المشروع.");
      process.exit(1);
    }
    console.log(`[admin] وضع رمز CI شخصي (FIREBASE_TOKEN) - المشروع: ${projectId}`);
    return initializeApp({
      credential: refreshToken({
        client_id: FIREBASE_CLI_OAUTH_CLIENT_ID,
        client_secret: FIREBASE_CLI_OAUTH_CLIENT_SECRET,
        refresh_token: process.env.FIREBASE_TOKEN,
        type: "authorized_user",
      }),
      projectId,
    });
  }

  const keyPath = join(__dirname, "..", "serviceAccountKey.json");
  if (!existsSync(keyPath)) {
    console.error(
      "\n[admin] لم يتم العثور على serviceAccountKey.json ولا على متغيرات المحاكي أو FIREBASE_TOKEN.\n" +
        "  - للتطوير المحلي الآمن: شغّلي `npm run emulator` في نافذة، ثم شغّلي هذا الأمر داخل\n" +
        "    `firebase emulators:exec` حتى تُضبَط المتغيرات تلقائيًا.\n" +
        "  - للإنتاج بلا مفتاح: `npx firebase-tools login:ci` ثم صدّري FIREBASE_TOKEN وGCLOUD_PROJECT.\n" +
        "  - للإنتاج بمفتاح حساب خدمة: نزّلي مفتاح من Firebase Console > Project Settings >\n" +
        "    Service Accounts، واحفظيه باسم serviceAccountKey.json في جذر مجلد khatawati.\n"
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));
  return initializeApp({ credential: cert(serviceAccount) });
}
