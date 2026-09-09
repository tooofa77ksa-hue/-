/**
 * الهوية الرسمية - Header. الشعار هو الملف الرسمي المُستخرج من دليل
 * الهوية البصرية لوزارة التعليم (الإصدار 3، أكتوبر 2025) بلا أي تعديل
 * على ألوانه أو نسبه أو إضافة تأثيرات (Glow/Shadow ممنوعة حسب الدليل).
 */
export function BrandHeader() {
  return (
    <header className="brand-header">
      <div className="brand-header__identity">
        <img
          className="brand-logo"
          src="/assets/brand/ministry-logo.webp"
          alt="شعار وزارة التعليم"
          width={160}
          height={124}
        />
        <div>
          <div className="brand-title">شُعلة لغتي</div>
          <div className="brand-subtitle">منصة تعليمية تفاعلية - لغتي - الصف الثالث الابتدائي</div>
        </div>
      </div>
    </header>
  );
}
