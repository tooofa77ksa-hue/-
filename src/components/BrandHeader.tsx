import { useBranding } from "@/lib/useBranding";

/**
 * الهوية الرسمية - Header. الشعار هو الملف الرسمي المُستخرج من دليل
 * الهوية البصرية لوزارة التعليم (الإصدار 3، أكتوبر 2025) بلا أي تعديل
 * على ألوانه أو نسبه أو إضافة تأثيرات (Glow/Shadow ممنوعة حسب الدليل).
 * اسم اللعبة ووصفها نصوص قابلة للتعديل من /teacher (gameSettings.branding).
 */
export function BrandHeader() {
  const branding = useBranding();
  return (
    <header className="brand-header">
      <div className="brand-header__identity">
        <img
          className="brand-logo"
          src={`${import.meta.env.BASE_URL}assets/brand/ministry-logo.webp`}
          alt="شعار وزارة التعليم"
          width={160}
          height={124}
        />
        <div>
          <div className="brand-title">{branding.gameName}</div>
          <div className="brand-subtitle">{branding.gameTagline}</div>
        </div>
      </div>
    </header>
  );
}
