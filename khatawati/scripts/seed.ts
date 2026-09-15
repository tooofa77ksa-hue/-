/**
 * ينشئ حسابات "خطواتي" الثمانية (كل طالبة) + حسابي المعلمتين + وثائق
 * الطالبات في Firestore. Idempotent - يعيد تشغيله بأمان دون تكرار.
 *
 *   محاكي محلي:
 *     npm run emulator   # في نافذة
 *     FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run seed
 *
 *   إنتاج حقيقي (serviceAccountKey.json أو FIREBASE_TOKEN + GCLOUD_PROJECT):
 *     npm run seed
 */
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initAdminApp } from "./adminApp";
import { usernameToInternalEmail } from "../src/lib/usernameAuth";
import type { Subject } from "../src/types/models";

const COLORS = ["#e0568c", "#8b5fbf", "#2e9bd6", "#2ab07f", "#f0a340", "#e2554a"];

interface StudentSeed {
  studentId: string;
  username: string;
  password: string;
  name: string;
}

// اسم المستخدم = حرف بسيط بالإنجليزي. كلمة السر: طلبت المستخدمة "أول
// حرف بالإنجليزي + 123" لكن Firebase Authentication يرفض أي كلمة سر
// أقل من 6 خانات (قيد ثابت من فايربيس نفسه، لا نتحكم فيه) - فاستخدمنا
// نفس الفكرة تمامًا مع تمديد بسيط: الحرف + 12345 (6 خانات).
const STUDENTS: StudentSeed[] = [
  { studentId: "nadeen", username: "nadeen", password: "N12345", name: "نادين الشمراني" },
  { studentId: "rose", username: "rose", password: "R12345", name: "روز الحمراني" },
  { studentId: "jana", username: "jana", password: "J12345", name: "جنى الشريف" },
  { studentId: "lana", username: "lana", password: "L12345", name: "لانا الشهري" },
  { studentId: "nada", username: "nada", password: "N12345", name: "ندى السهلي" },
  { studentId: "tala", username: "tala", password: "T12345", name: "تالا القريقري" },
  { studentId: "retaj", username: "retaj", password: "R12345", name: "ريتاج العواجي" },
  { studentId: "mariam", username: "mariam", password: "M12345", name: "مريم باشماخ" },
];

interface TeacherSeed {
  username: string;
  password: string;
  name: string;
  subject: Subject;
}

// كلمات سر المعلمات أقوى من الطالبات لأن حسابهن يشوف كل الطالبات -
// يُنصَح بتغييرها من الإعدادات بعد أول دخول.
const TEACHERS: TeacherSeed[] = [
  { username: "dalal", password: "Dalal#2025", name: "دلال السناني", subject: "lughati" },
  { username: "samira", password: "Samira#2025", name: "سميرة الشريف", subject: "riyadiyat" },
  { username: "aisha", password: "Aisha#2025", name: "عائشة البلادي", subject: "english" },
  { username: "hanan", password: "Hanan#2025", name: "حنان العمري", subject: "science" },
  { username: "badriya", password: "Badriya#2025", name: "بدرية السفري", subject: "islamic" },
  { username: "abeer", password: "Abeer#2025", name: "عبير المطيري", subject: "life_skills" },
];

async function ensureAuthUser(email: string, password: string, displayName: string) {
  const auth = getAuth();
  try {
    return await auth.getUserByEmail(email);
  } catch {
    return auth.createUser({ email, password, displayName });
  }
}

async function main() {
  initAdminApp();
  const db = getFirestore();

  for (const [i, s] of STUDENTS.entries()) {
    const email = usernameToInternalEmail(s.username);
    const user = await ensureAuthUser(email, s.password, s.name);
    await db.collection("users").doc(user.uid).set(
      { role: "family", studentId: s.studentId, displayName: s.name },
      { merge: true }
    );
    const studentRef = db.collection("students").doc(s.studentId);
    const existing = await studentRef.get();
    if (!existing.exists) {
      await studentRef.set({
        name: s.name,
        nickname: s.name,
        color: COLORS[i % COLORS.length],
        photoUrl: null,
        bio: "",
        interests: "",
        familyUid: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(`[seed] أُنشئت طالبة: ${s.name} (${s.username})`);
    } else {
      await studentRef.set({ familyUid: user.uid }, { merge: true });
      console.log(`[seed] الطالبة موجودة مسبقًا: ${s.name}`);
    }
  }

  for (const t of TEACHERS) {
    const email = usernameToInternalEmail(t.username);
    const user = await ensureAuthUser(email, t.password, t.name);
    await db.collection("users").doc(user.uid).set(
      { role: "teacher", subject: t.subject, displayName: t.name },
      { merge: true }
    );
    console.log(`[seed] معلمة جاهزة: ${t.name} (${t.username}) - مادة: ${t.subject}`);
  }

  console.log("\n[seed] تم بنجاح. بيانات الدخول:");
  for (const s of STUDENTS) console.log(`  الطالبة ${s.name}: ${s.username} / ${s.password}`);
  for (const t of TEACHERS) console.log(`  المعلمة ${t.name}: ${t.username} / ${t.password}`);
}

main().catch((err) => {
  console.error("[seed] فشل التنفيذ:", err);
  process.exit(1);
});
