/**
 * سكربت إنشاء حساب معلمة/إدارة (Admin only, No Public Signup).
 * يُشغَّل محليًا من قِبل المسؤول فقط - لا يُنشر ضمن التطبيق.
 *
 * الاستخدام:
 *   npm run create-teacher -- --email=teacher@example.com --password=Str0ngPass! --name="اسم المعلمة" --role=teacher
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, "..", "serviceAccountKey.json");

if (!existsSync(keyPath)) {
  console.error("[create-teacher] لم يتم العثور على serviceAccountKey.json في جذر المشروع.");
  process.exit(1);
}

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

  const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));
  initializeApp({ credential: cert(serviceAccount) });
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
