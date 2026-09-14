/**
 * كل حساب (طالبة/عائلة أو معلمة) يسجّل الدخول باسم مستخدم بسيط فقط
 * (مثل "nadeen" أو "dalal") بلا أي ذكر لبريد إلكتروني. داخليًا فقط،
 * Firebase Authentication لا يدعم إلا البريد/كلمة المرور، فنحوّل اسم
 * المستخدم إلى بريد داخلي ثابت غير حساس عبر هذه الدالة، المستخدَمة من
 * شاشة الدخول ومن سكربت seed معًا حتى يتطابق البريد دائمًا.
 */
const INTERNAL_AUTH_DOMAIN = "khatawati.internal";

export function usernameToInternalEmail(username: string): string {
  const normalized = username.trim().toLowerCase();
  return `${normalized}@${INTERNAL_AUTH_DOMAIN}`;
}
