/*
  المصادقة.
  بوابة واحدة لكل الأدوار: النظام يقرأ الدور من users/{uid} بعد الدخول
  ويوجّه المستخدمة إلى مكانها، فلا حاجة لثلاث صفحات دخول منفصلة المنطق.
*/
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, isFirebaseUsable } from "@/injazi/firebase/client";
import { getUserDoc, saveUserDoc } from "@/injazi/services/repo";
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
    default:
      return "تعذّر إتمام العملية. حاولي مرة أخرى.";
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
