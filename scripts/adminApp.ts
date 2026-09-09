/**
 * تهيئة موحّدة لتطبيق Firebase Admin تُستخدم من سكربتات seed وcreate-teacher.
 *
 * وضع المحاكي (Emulator): إذا كانت متغيرات FIRESTORE_EMULATOR_HOST أو
 * FIREBASE_AUTH_EMULATOR_HOST موجودة (تُضبَط تلقائيًا عبر
 * `firebase emulators:exec` أو `firebase emulators:start`)، يُهيَّأ
 * التطبيق بمعرّف مشروع وهمي بلا أي بيانات اعتماد - لا حاجة لأي Secret.
 *
 * وضع الإنتاج: يتطلب serviceAccountKey.json في جذر المشروع (مُستبعد من
 * git). لا يُنشئ هذا الملف أي مفتاح وهمي - فقط يطلبه عند الحاجة الفعلية.
 */
import { initializeApp, cert, type App } from "firebase-admin/app";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const isEmulatorMode = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST
);

export function initAdminApp(): App {
  if (isEmulatorMode) {
    const projectId = process.env.GCLOUD_PROJECT || "demo-shualat-lughati";
    console.log(`[admin] وضع المحاكي (Emulator) - معرّف مشروع وهمي: ${projectId}`);
    return initializeApp({ projectId });
  }

  const keyPath = join(__dirname, "..", "serviceAccountKey.json");
  if (!existsSync(keyPath)) {
    console.error(
      "\n[admin] لم يتم العثور على serviceAccountKey.json ولا على متغيرات المحاكي.\n" +
        "  - للتطوير المحلي الآمن: شغّلي `npm run emulator` في نافذة، ثم شغّلي هذا الأمر عبر\n" +
        "    `npm run test:rules` أو داخل `firebase emulators:exec` حتى تُضبَط المتغيرات تلقائيًا.\n" +
        "  - للإنتاج الحقيقي: نزّلي مفتاح حساب خدمة من Firebase Console > Project Settings >\n" +
        "    Service Accounts، واحفظيه باسم serviceAccountKey.json في جذر المشروع.\n"
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));
  return initializeApp({ credential: cert(serviceAccount) });
}
