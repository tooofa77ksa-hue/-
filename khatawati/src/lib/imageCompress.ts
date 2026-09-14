/**
 * نحفظ الصور كـ data URL مضغوط داخل مستند Firestore مباشرة (بلا
 * Firebase Storage) حتى يبقى المشروع كله على الخطة المجانية بدون أي
 * تكلفة. نضغط على حجم الصورة إلى حد أقصى للعرض (500px) وجودة JPEG
 * معتدلة حتى يبقى الناتج تحت حد حجم الحقل في قواعد الأمان (900 كيلوبايت).
 */
export function compressImageToDataUrl(file: File, maxDimension = 500, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذّر قراءة الملف"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("الملف ليس صورة صالحة"));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("تعذّر معالجة الصورة"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
