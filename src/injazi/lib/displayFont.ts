/*
  خط العناوين
  ------------------------------------------------------------------
  "Baloo Bhaijaan 2" خط عربي مستدير يمنح القسم شخصيته اللُعبية، بينما
  يبقى Tajawal (المحمَّل أصلًا للمنصة) لنصوص القراءة الطويلة.

  يُحقَن عند دخول القسم فقط، لا في index.html: بقية المنصة (شُعلة لغتي)
  لا يجب أن تدفع ثمن خطٍّ لا تستخدمه. والحقن بـ JS بدل @import يجعله
  غير معطِّل للعرض، و display=swap يضمن ظهور النص فورًا بخط بديل.
*/
const LINK_ID = "injazi-display-font";
const HREF =
  "https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@500;600;800&display=swap";

export function ensureDisplayFont() {
  if (typeof document === "undefined") return;
  if (document.getElementById(LINK_ID)) return;

  const link = document.createElement("link");
  link.id = LINK_ID;
  link.rel = "stylesheet";
  link.href = HREF;
  document.head.appendChild(link);
}
