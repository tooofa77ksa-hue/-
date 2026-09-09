/**
 * المعلمة تسجّل الدخول باسم مستخدم بسيط (مثل "Dalal") بلا أي ذكر لبريد
 * إلكتروني أو UID أو Firebase أمامها. داخليًا فقط، Firebase Authentication
 * لا يدعم إلا البريد الإلكتروني/كلمة المرور، فنحوّل اسم المستخدم إلى بريد
 * داخلي ثابت غير حساس (ليس Secret - مجرد اصطلاح تسمية) عبر هذه الدالة،
 * المستخدَمة من واجهة الدخول (LoginScreen) ومن سكربت create-teacher معًا،
 * حتى يتطابق البريد المُنشأ في Firebase Auth مع ما تُدخله المعلمة كاسم
 * مستخدم دائمًا.
 */
const INTERNAL_AUTH_DOMAIN = "teacher.shualat-lughati.internal";

export function usernameToInternalEmail(username: string): string {
  const normalized = username.trim().toLowerCase();
  return `${normalized}@${INTERNAL_AUTH_DOMAIN}`;
}
