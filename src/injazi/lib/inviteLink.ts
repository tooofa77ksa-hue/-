/*
  رابط دخول المعلمة.
  فُصل عن مكوّن الصفحة لأنه لا يخصّها وحدها، ولأن تصدير دالة من ملف
  مكوّنات يكسر التحديث السريع في التطوير.
*/

/**
 * الرابط الكامل كما تفتحه المعلمة. يُبنى من عنوان الصفحة الحالية لا من
 * ثابت في الكود، فيصحّ على أي نطاق تُرفع عليه المنصة دون تعديل.
 */
export function inviteUrl(code: string): string {
  return `${window.location.origin}${window.location.pathname}#/t/${code}`;
}

/**
 * نسخ إلى الحافظة.
 * navigator.clipboard غير متاح على اتصال غير آمن ولا في بعض متصفّحات
 * الجوال داخل التطبيقات، ولا يصحّ أن يفشل النسخ صامتًا — فالبديل القديم
 * موجود، والقيمة المعادة تقول ما حدث فعلًا.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* نسقط إلى البديل أدناه */
  }

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "0";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, text.length);
    const okay = document.execCommand("copy");
    document.body.removeChild(field);
    return okay;
  } catch {
    return false;
  }
}

/** رابط ملف الطالبة — تفتحه هي وولي أمرها معًا. */
export function studentUrl(code: string): string {
  return `${window.location.origin}${window.location.pathname}#/s/${code}`;
}
