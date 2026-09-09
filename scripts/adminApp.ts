/**
 * تهيئة موحّدة لتطبيق Firebase Admin تُستخدم من سكربتات seed وcreate-teacher.
 * ثلاثة أوضاع، بالأولوية التالية:
 *
 * 1) وضع المحاكي (Emulator): FIRESTORE_EMULATOR_HOST أو
 *    FIREBASE_AUTH_EMULATOR_HOST موجودة (تُضبَط تلقائيًا عبر
 *    `firebase emulators:exec/start`) - معرّف مشروع وهمي بلا أي بيانات
 *    اعتماد.
 *
 * 2) وضع رمز CI شخصي (FIREBASE_TOKEN): رمز OAuth قابل للإبطال يُنشئه
 *    المطوّر بنفسه محليًا عبر `npx firebase-tools login:ci` (وليس مفتاح
 *    حساب خدمة/Private Key) - يُستخدم فقط عبر متغير بيئة، ولا يُخزَّن في
 *    أي ملف داخل المستودع.
 *
 * 3) وضع الإنتاج بمفتاح حساب خدمة: يتطلب serviceAccountKey.json في جذر
 *    المشروع (مُستبعد من git). لا يُنشئ هذا الملف أي مفتاح وهمي - فقط
 *    يطلبه عند الحاجة الفعلية وعدم توفر الوضعين أعلاه.
 */
import { initializeApp, cert, refreshToken, type App } from "firebase-admin/app";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// معرّف وسر عميل Firebase CLI الرسمي - قيم عامة مُضمَّنة في الكود المصدري
// المفتوح لـ firebase-tools نفسها (Installed-App OAuth client)، وليست سرًا
// خاصًا بأي حساب أو مشروع. مطلوبة فقط لتفسير رمز التحديث (Refresh Token)
// الذي يُنشئه المطوّر بنفسه عبر `firebase login:ci`.
const FIREBASE_CLI_OAUTH_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLI_OAUTH_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

export const isEmulatorMode = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST
);

export function initAdminApp(): App {
  if (isEmulatorMode) {
    const projectId = process.env.GCLOUD_PROJECT || "demo-shualat-lughati";
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
        "  - للتطوير المحلي الآمن: شغّلي `npm run emulator` في نافذة، ثم شغّلي هذا الأمر عبر\n" +
        "    `npm run test:rules` أو داخل `firebase emulators:exec` حتى تُضبَط المتغيرات تلقائيًا.\n" +
        "  - للإنتاج بلا مفتاح: `npx firebase-tools login:ci` ثم صدّري FIREBASE_TOKEN وGCLOUD_PROJECT.\n" +
        "  - للإنتاج بمفتاح حساب خدمة: نزّلي مفتاح من Firebase Console > Project Settings >\n" +
        "    Service Accounts، واحفظيه باسم serviceAccountKey.json في جذر المشروع.\n"
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));
  return initializeApp({ credential: cert(serviceAccount) });
}
