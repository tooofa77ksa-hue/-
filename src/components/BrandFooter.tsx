import { useBranding } from "@/lib/useBranding";

// نصوص الفوتر (اسم المدرسة/المديرة/الوكيلة/المصممة) قابلة للتعديل بالكامل
// من /teacher عبر gameSettings.branding - القالب فقط ثابت في الكود.
export function BrandFooter() {
  const branding = useBranding();
  return (
    <footer className="brand-footer">
      <p className="brand-footer__line">{branding.schoolName}</p>
      <p className="brand-footer__line">
        المديرة: {branding.principalName} | الوكيلة: {branding.deputyName}
      </p>
      <p className="brand-footer__credit">تصميم المعلمة: {branding.designerCredit}</p>
    </footer>
  );
}
