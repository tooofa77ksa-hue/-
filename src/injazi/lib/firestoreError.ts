/*
  ترجمة أخطاء Firestore إلى عربية تفهمها طالبة في الرابع الابتدائي.
  ==================================================================
  رمز الخطأ هو المعلومة كلها: permission-denied عطل صلاحية،
  unavailable عطل شبكة، failed-precondition إعداد ناقص في قاعدة
  البيانات — ثلاثة أعطال مختلفة تمامًا وثلاثة علاجات مختلفة تمامًا.
  وحين يصل إلى الشاشة نصّ Firestore الإنجليزي (أو لا يصل شيء أصلًا)
  يضيع الفرق بينها، فتصير كلها «لا يعمل» — وهذا وحده ما حوّل أعطالًا
  صغيرة إلى أيام من التخمين.

  ولذلك: رسالة عربية واحدة للمستخدمة، والرمز الأصلي في طرفية المطوّر.

  ملاحظة: أخطاء المشروع نفسه (MediaError, UploadError, AuthError,
  NotConfiguredError) تحمل رسائل عربية مكتوبة بعناية أصلًا، فتُعاد كما
  هي ولا تُستبدَل برسالة عامة.
*/

/** رمز الخطأ إن كان خطأ Firestore. */
function codeOf(error: unknown): string {
  return (error as { code?: string })?.code ?? "";
}

function translate(code: string): string | null {
  switch (code) {
    case "permission-denied":
      return "لا تملكين صلاحية هذه العملية. إن كنتِ قد فتحتِ رابطكِ من قبل، افتحيه من جديد.";
    case "unavailable":
    case "deadline-exceeded":
    case "iz/timeout":
      return "تعذّر الوصول إلى الخادم. تحقّقي من الاتصال ثم أعيدي المحاولة.";
    case "failed-precondition":
      return "تعذّرت العملية بسبب إعداد ناقص في قاعدة البيانات. أبلغي المشرفة.";
    case "unauthenticated":
      return "انتهت الجلسة. افتحي رابطكِ من جديد.";
    case "not-found":
      return "لم نجد هذا السجل — ربما حُذف من جهاز آخر.";
    case "resource-exhausted":
      return "تجاوزت المنصة حصّتها اليومية. أعيدي المحاولة لاحقًا وأبلغي المشرفة.";
    case "aborted":
    case "cancelled":
      return "توقّفت العملية قبل أن تكتمل. أعيدي المحاولة.";
    default:
      return null;
  }
}

/**
 * رسالة تُعرض للمستخدمة.
 * @param where وسم قصير يظهر في طرفية المطوّر فقط، لتحديد مصدر العطل.
 */
export function firestoreErrorMessage(error: unknown, where: string, fallback: string): string {
  const code = codeOf(error);
  const raw = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`[Firestore:${where}]`, code || "(بلا رمز)", raw);

  const known = translate(code);
  if (known) return known;

  // خطأ من طبقات المشروع نفسها: رسالته عربية ومكتوبة لهذا الموضع.
  if (!code && error instanceof Error && error.message.trim()) return error.message;

  return fallback;
}

/** الصيغة المختصرة لأخطاء القراءة الحيّة. */
export const readErrorMessage = (error: unknown, where: string) =>
  firestoreErrorMessage(
    error,
    where,
    "تعذّر تحميل البيانات. حدّثي الصفحة، وإن تكرّر أبلغي المشرفة.",
  );

/** والصيغة المختصرة لأخطاء الحفظ. */
export const writeErrorMessage = (error: unknown, where: string) =>
  firestoreErrorMessage(error, where, "تعذّر الحفظ. أعيدي المحاولة، وإن تكرّر أبلغي المشرفة.");
