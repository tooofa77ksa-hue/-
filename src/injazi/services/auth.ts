/*
  المصادقة.
  بوابة واحدة لكل الأدوار: النظام يقرأ الدور من users/{uid} بعد الدخول
  ويوجّه المستخدمة إلى مكانها، فلا حاجة لثلاث صفحات دخول منفصلة المنطق.
*/
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, isFirebaseUsable } from "@/injazi/firebase/client";
import { getInvite, getStudentLink, getUserDoc, saveUserDoc } from "@/injazi/services/repo";
import type { Role, UserDoc } from "@/injazi/types/models";

export class AuthError extends Error {}

/** رسائل Firebase تقنية وبالإنجليزية — تُترجَم هنا لمرة واحدة. */
function humanize(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    case "auth/invalid-email":
      return "صيغة البريد الإلكتروني غير صحيحة.";
    case "auth/too-many-requests":
      return "محاولات كثيرة متتالية. انتظري قليلًا ثم أعيدي المحاولة.";
    case "auth/user-disabled":
      return "هذا الحساب معطَّل. راجعي إدارة المنصة.";
    case "auth/email-already-in-use":
      return "هذا البريد مستخدم في حساب آخر.";
    case "auth/weak-password":
      return "كلمة المرور قصيرة — استخدمي ٦ أحرف على الأقل.";
    case "auth/network-request-failed":
      return "تعذّر الاتصال بالشبكة. تحققي من الإنترنت.";
    case "auth/unauthorized-domain":
      return "هذا العنوان غير مسموح به في إعدادات المنصة. أضيفيه في Authorized domains.";
    case "auth/operation-not-allowed":
      return "طريقة الدخول هذه غير مفعّلة في إعدادات المنصة.";
    case "auth/api-key-not-valid":
    case "auth/invalid-api-key":
      return "مفتاح الاتصال غير صالح. راجعي قيم الإعدادات في لوحة النشر.";
    default:
      // الرمز يظهر عمدًا: خطأ لا يعرفه الكود ولا يحمل رمزًا لا يمكن
      // تشخيصه إطلاقًا — وقد كلّفنا ذلك جلسة كاملة من التخمين.
      return code
        ? `تعذّر إتمام العملية. أرسلي هذا الرمز لمن يساعدك: ${code}`
        : "تعذّر إتمام العملية. حاولي مرة أخرى.";
  }
}

function wrap(error: unknown): AuthError {
  const code = (error as { code?: string })?.code ?? "";
  return new AuthError(humanize(code));
}

export async function signIn(email: string, password: string): Promise<UserDoc | null> {
  if (!isFirebaseUsable) throw new AuthError("لم تُضبَط إعدادات Firebase بعد.");
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const profile = await getUserDoc(credential.user.uid);
    if (profile && profile.active === false) {
      await signOut(auth);
      throw new AuthError("هذا الحساب معطَّل. راجعي إدارة المنصة.");
    }
    return profile;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw wrap(error);
  }
}

export async function signOutUser(): Promise<void> {
  if (!isFirebaseUsable) return;
  await signOut(auth);
}

/**
 * دخول المعلمة برابطها.
 * ------------------------------------------------------------------
 * لا بريد ولا كلمة مرور: الرمز في الرابط هو الإثبات. نسجّل دخولًا
 * مجهولًا لنحصل على هوية تقبلها قواعد الأمان، ثم نكتب ملف صلاحيات
 * مطابقًا للدعوة حرفيًا — والقواعد هي التي تتحقّق من المطابقة، لا هذا
 * الكود. لو عُدِّل هذا الملف في المتصفح لما تغيّر شيء: الخادم يرفض.
 *
 * الصلاحية تبقى مشروطة ببقاء الدعوة: حذفها من اللوحة يقطع الوصول عن
 * كل جهاز فُتح به الرابط في الحال.
 */
export async function signInWithInvite(code: string): Promise<UserDoc> {
  if (!isFirebaseUsable) throw new AuthError("لم تُضبَط إعدادات Firebase بعد.");

  // حساب آخر مفتوح على الجهاز (ولي أمر مثلًا) لا يصلح لالتقاط الدعوة:
  // الملف يُكتب على الهوية الحالية، فنبدأ من هوية نظيفة.
  const current = auth.currentUser;
  if (current && !current.isAnonymous) await signOut(auth);

  let credential;
  try {
    credential = auth.currentUser?.isAnonymous
      ? { user: auth.currentUser }
      : await signInAnonymously(auth);
  } catch (error) {
    // أشيع سبب: مزوّد «مجهول» غير مفعّل في Firebase Authentication.
    if ((error as { code?: string })?.code === "auth/admin-restricted-operation") {
      throw new AuthError(
        "الدخول بالرابط غير مفعّل في إعدادات المنصة. راجعي مشرفة المنصة.",
      );
    }
    throw wrap(error);
  }

  const uid = credential.user.uid;

  // تُقرأ الدعوة بعد الدخول لا قبله: القواعد تشترط هوية للقراءة.
  const invite = await getInvite(code).catch(() => null);
  if (!invite || invite.active !== true) {
    // ملف الصلاحيات القديم على هذا الجهاز لا قيمة له بعد إلغاء الرابط —
    // القواعد ترفض كل كتابة منه. نُسقط الجلسة حتى لا تبقى الواجهة تُظهر
    // بوابة تعمل ظاهريًا وكل زر فيها يفشل.
    await signOut(auth).catch(() => {});
    throw new AuthError("هذا الرابط لم يعد صالحًا. اطلبي رابطًا جديدًا من مشرفة المنصة.");
  }

  const existing = await getUserDoc(uid).catch(() => null);
  const staleGrant =
    existing &&
    (existing.inviteCode !== code ||
      existing.teacherId !== invite.teacherId ||
      existing.role !== "teacher");

  // ملف قديم لهوية هذا الجهاز لا يمكن تصحيحه من هنا (التعديل للمشرفة
  // وحدها بحكم القواعد)، فنبدأ بهوية جديدة بدل أن نفشل بلا تفسير.
  if (staleGrant) {
    await signOut(auth);
    const fresh = await signInAnonymously(auth);
    return writeInviteProfile(fresh.user.uid, code, invite.teacherId, invite.teacherName, invite.subjectIds);
  }

  if (existing) return existing;

  return writeInviteProfile(uid, code, invite.teacherId, invite.teacherName, invite.subjectIds);
}

async function writeInviteProfile(
  uid: string,
  code: string,
  teacherId: string,
  teacherName: string,
  subjectIds: string[],
): Promise<UserDoc> {
  const profile: Omit<UserDoc, "id"> = {
    role: "teacher",
    name: teacherName,
    // لا بريد: هذا هو بيت القصيد — المعلمة لا تُسأل عن بريدها أصلًا.
    email: "",
    active: true,
    teacherId,
    subjectIds,
    inviteCode: code,
    createdAt: new Date().toISOString(),
  };
  try {
    await saveUserDoc(uid, profile);
  } catch {
    throw new AuthError("تعذّر تفعيل الرابط. تأكّدي من الاتصال وأعيدي فتح الرابط.");
  }
  return { id: uid, ...profile };
}

/**
 * دخول الطالبة (وولي أمرها) برابط ملفها.
 * ------------------------------------------------------------------
 * رابط واحد يفتحه الاثنان — لا رابط منفصل لكل منهما. الرمز في الرابط هو
 * الإثبات، والقواعد الأمنية هي التي تتحقّق منه على الخادم.
 *
 * ما يمنحه: تعديل ملف تلك الطالبة وحدها. لا لوحة إدارة، ولا أدوات تقييم،
 * ولا مساس بملف أي طالبة أخرى — ولو غُيّر معرّف الطالبة في الرابط يدويًا.
 */
export async function signInWithStudentLink(code: string): Promise<UserDoc> {
  if (!isFirebaseUsable) throw new AuthError("لم تُضبَط إعدادات Firebase بعد.");

  const current = auth.currentUser;
  if (current && !current.isAnonymous) await signOut(auth);

  let credential;
  try {
    credential = auth.currentUser?.isAnonymous
      ? { user: auth.currentUser }
      : await signInAnonymously(auth);
  } catch (error) {
    if ((error as { code?: string })?.code === "auth/admin-restricted-operation") {
      throw new AuthError("الدخول بالرابط غير مفعّل في إعدادات المنصة. راجعي مشرفة المنصة.");
    }
    throw wrap(error);
  }

  const uid = credential.user.uid;

  const link = await getStudentLink(code).catch(() => null);
  if (!link || link.active !== true) {
    await signOut(auth).catch(() => {});
    throw new AuthError("هذا الرابط لم يعد صالحًا. اطلبي رابطًا جديدًا من مشرفة المنصة.");
  }

  const existing = await getUserDoc(uid).catch(() => null);
  const stale =
    existing &&
    (existing.linkCode !== code ||
      existing.role !== "parent" ||
      !(existing.studentIds ?? []).includes(link.studentId));

  if (stale) {
    await signOut(auth);
    const fresh = await signInAnonymously(auth);
    return writeLinkProfile(fresh.user.uid, code, link.studentId, link.studentName);
  }

  if (existing) return existing;

  return writeLinkProfile(uid, code, link.studentId, link.studentName);
}

async function writeLinkProfile(
  uid: string,
  code: string,
  studentId: string,
  studentName: string,
): Promise<UserDoc> {
  const profile: Omit<UserDoc, "id"> = {
    role: "parent",
    name: studentName,
    email: "",
    active: true,
    // طالبة واحدة بعينها — وهذا ما تتحقّق منه القواعد حرفيًا.
    studentIds: [studentId],
    linkCode: code,
    createdAt: new Date().toISOString(),
  };
  try {
    await saveUserDoc(uid, profile);
  } catch {
    throw new AuthError("تعذّر فتح الرابط. تأكّدي من الاتصال وأعيدي المحاولة.");
  }
  return { id: uid, ...profile };
}

export async function resetPassword(email: string): Promise<void> {
  if (!isFirebaseUsable) throw new AuthError("لم تُضبَط إعدادات Firebase بعد.");
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    throw wrap(error);
  }
}

/**
 * إنشاء حساب من لوحة الإدارة.
 * تحذير مقصود: Firebase Web SDK يسجّل دخول الحساب الجديد فورًا ويُخرج
 * المشرفة. لتفادي ذلك نستخدم تطبيقًا ثانويًا معزولًا له حالة مصادقة
 * مستقلة، فتبقى جلسة المشرفة كما هي.
 */
export async function createAccount(
  email: string,
  password: string,
  name: string,
  role: Role,
  extra: Partial<UserDoc> = {},
): Promise<string> {
  if (!isFirebaseUsable) throw new AuthError("لم تُضبَط إعدادات Firebase بعد.");
  const { initializeApp, deleteApp, getApp } = await import("firebase/app");
  const { getAuth } = await import("firebase/auth");

  const secondary = initializeApp(getApp().options, `injazi-admin-${Date.now()}`);
  const secondaryAuth = getAuth(secondary);

  // التطبيق الثانوي لا يرث اتصال المحاكي من التطبيق الأساسي: لكل نسخة
  // Auth إعدادها الخاص. بدون هذا السطر يذهب إنشاء الحسابات إلى Firebase
  // الحقيقي أثناء التطوير فيفشل، بينما يبدو كل شيء سليمًا في الإنتاج.
  //
  // الاستيراد داخل الشرط لا خارجه: import.meta.env.DEV يُستبدَل بـ false
  // وقت البناء، فيسقط هذا الفرع بكامله ولا يبقى في حزمة الإنتاج أي
  // ذكر لدوال المحاكي إطلاقًا.
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
    const { connectAuthEmulator } = await import("firebase/auth");
    connectAuthEmulator(secondaryAuth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    await updateProfile(credential.user, { displayName: name });
    await saveUserDoc(credential.user.uid, {
      role,
      name,
      email: email.trim().toLowerCase(),
      active: true,
      ...extra,
    });
    return credential.user.uid;
  } catch (error) {
    throw wrap(error);
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondary).catch(() => {});
  }
}

export type { User };
