import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * باركود QR فعلي وقابل للمسح 100% (مربّع قياسي داخليًا بمستوى تصحيح
 * أخطاء عالٍ H) - لا نُشوِّه شكل المربعات نفسها إلى قلب لأن ذلك يكسر
 * إمكانية المسح (يحذف أنماط الزوايا الثلاثة الضرورية للقراءة). بدل ذلك
 * نضع المربع داخل بطاقة قلب ملوّنة كإطار زخرفي خلفه - قلب واضح للعين،
 * ومربع مسح سليم 100% للكاميرا.
 */
export function HeartQr({ value, color = "#e0568c", size = 160 }: { value: string; color?: string; size?: number }) {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 1,
      color: { dark: "#241022", light: "#ffffff" },
    })
      .then((svg) => {
        if (!cancelled) setSvgMarkup(svg);
      })
      .catch(() => {
        if (!cancelled) setSvgMarkup(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="heart-qr" style={{ width: size, height: size * 1.12 }}>
      <svg className="heart-qr__heart" viewBox="0 0 100 100" aria-hidden="true">
        <path
          d="M50 92 C50 92 6 58 6 31 C6 12 23 2 40 10 C45 13 50 22 50 22 C50 22 55 13 60 10 C77 2 94 12 94 31 C94 58 50 92 50 92 Z"
          fill={color}
        />
      </svg>
      <div className="heart-qr__panel">
        {svgMarkup ? (
          <div className="heart-qr__code" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
        ) : (
          <div className="heart-qr__loading">...</div>
        )}
      </div>
    </div>
  );
}
