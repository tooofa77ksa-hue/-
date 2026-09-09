/**
 * سكربت إنشاء حساب معلمة/إدارة (Admin only, No Public Signup).
 * يُشغَّل محليًا من قِبل المسؤول فقط - لا يُنشر ضمن التطبيق.
 *
 * المعلمة تسجّل الدخول باسم مستخدم بسيط فقط (مثال: Dalal)، بلا أي بريد
 * إلكتروني ظاهر لها. مرّر --username= ليُشتق البريد الداخلي تلقائيًا عبر
 * نفس دالة src/lib/usernameAuth.ts المستخدَمة في شاشة الدخول، فيتطابق
 * الاثنان دائمًا. أو مرّر --email= مباشرة إن رغبت باستخدام بريد فعلي.
 *
 * محاكي محلي (بلا Secret):
 *   npm run emulator   # في نافذة
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *     npm run create-teacher -- --username=Dalal --password=Dalal1234 --name="دلال"
 *
 * مشروع حقيقي (يتطلب FIREBASE_TOKEN أو serviceAccountKey.json):
 *   npm run create-teacher -- --username=Dalal --password=Dalal1234 --name="دلال" --role=teacher
 */
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initAdminApp } from "./adminApp";
import { usernameToInternalEmail } from "../src/lib/usernameAuth";

function parseArgs() {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

async function main() {
  const { username, email: rawEmail, password, name, role = "teacher" } = parseArgs();
  const email = rawEmail || (username ? usernameToInternalEmail(username) : "");
  if (!email || !password || !name) {
    console.error(
      '[create-teacher] الاستخدام: npm run create-teacher -- --username=Dalal --password=... --name="..." --role=teacher|admin'
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

  const loginHint = username ? `باسم المستخدم "${username}"` : `بالبريد ${email}`;
  console.log(`[create-teacher] تم منح الدور "${role}". يمكنها الآن الدخول إلى /teacher ${loginHint}.`);
}

main().catch((err) => {
  console.error("[create-teacher] فشل التنفيذ:", err);
  process.exit(1);
});
