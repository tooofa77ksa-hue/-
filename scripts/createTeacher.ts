/**
 * سكربت إنشاء حساب معلمة/إدارة (Admin only, No Public Signup).
 * يُشغَّل محليًا من قِبل المسؤول فقط - لا يُنشر ضمن التطبيق.
 *
 * محاكي محلي (بلا Secret):
 *   npm run emulator   # في نافذة
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *     npm run create-teacher -- --email=teacher@example.com --password=Str0ngPass! --name="معلمة الاختبار"
 *
 * مشروع حقيقي (يتطلب serviceAccountKey.json):
 *   npm run create-teacher -- --email=teacher@example.com --password=Str0ngPass! --name="اسم المعلمة" --role=teacher
 */
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initAdminApp } from "./adminApp";

function parseArgs() {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

async function main() {
  const { email, password, name, role = "teacher" } = parseArgs();
  if (!email || !password || !name) {
    console.error(
      '[create-teacher] الاستخدام: npm run create-teacher -- --email=... --password=... --name="..." --role=teacher|admin'
    );
    process.exit(1);
  }
  if (role !== "teacher" && role !== "admin") {
    console.error("[create-teacher] الدور يجب أن يكون teacher أو admin فقط.");
    process.exit(1);
  }

  initAdminApp();
  const auth = getAuth();
  const db = getFirestore();

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`[create-teacher] المستخدم موجود مسبقًا (${userRecord.uid})، سيتم تحديث دوره فقط.`);
  } catch {
    userRecord = await auth.createUser({ email, password, displayName: name });
    console.log(`[create-teacher] تم إنشاء المستخدم (${userRecord.uid}).`);
  }

  await db.collection("users").doc(userRecord.uid).set(
    {
      email,
      displayName: name,
      role,
      createdAt: Date.now(),
    },
    { merge: true }
  );

  console.log(`[create-teacher] تم منح الدور "${role}" للمستخدم ${email}. يمكنها الآن الدخول إلى /teacher.`);
}

main().catch((err) => {
  console.error("[create-teacher] فشل التنفيذ:", err);
  process.exit(1);
});
