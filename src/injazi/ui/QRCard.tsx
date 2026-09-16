/*
  رمز QR للروابط.
  القاعدة الحاكمة هنا: الزخرفة تحيط بالرمز ولا تلمسه إطلاقًا. الرمز
  نفسه يُرسَم أسود على أبيض بمستوى تصحيح خطأ عالٍ (H) وهامش هادئ كامل،
  فيبقى قابلًا للمسح من ورقة مطبوعة أو من الشاشة.
  التنزيل يخرج PNG بدقة الطباعة (1024px) مع الإطار المختار.
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Download, ExternalLink, Printer } from "lucide-react";
import QRCode from "qrcode";
import { ClayButton } from "@/injazi/components/ClayButton";
import { DUR, EASE_CLAY } from "@/injazi/motion/motion";
import type { LinkItem } from "@/injazi/types/models";
import { KIND_LABEL, type QrFrame } from "@/injazi/ui/qr";

type Props = {
  link: LinkItem;
  frame?: QrFrame;
  size?: number;
  showActions?: boolean;
};

export function QRCard({ link, frame = "classic", size = 168, showActions = true }: Props) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const label = useMemo(() => link.label || KIND_LABEL[link.kind], [link]);

  useEffect(() => {
    let cancelled = false;
    QRCode.toCanvas(canvas.current, link.url, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#1c1421", light: "#ffffff" },
    })
      .then(() => !cancelled && setError(null))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [link.url, size]);

  async function download() {
    const dataUrl = await renderFramedPng(link.url, frame, label);
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `qr-${label.replace(/\s+/g, "-").slice(0, 40)}.png`;
    anchor.click();
  }

  async function print() {
    const dataUrl = await renderFramedPng(link.url, frame, label);
    const win = window.open("", "_blank", "noopener,noreferrer,width=680,height=820");
    if (!win) return;
    win.document.write(
      `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${label}</title>
       <style>body{margin:0;display:grid;place-items:center;height:100vh;font-family:system-ui}
       img{width:70vmin;height:auto}</style></head>
       <body><img src="${dataUrl}" alt="${label}" onload="window.print()"></body></html>`,
    );
    win.document.close();
  }

  return (
    <motion.div
      className={`iz-qr iz-qr--${frame}`}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DUR.slow, ease: EASE_CLAY }}
    >
      <div className="iz-qr__frame" aria-hidden="true" />
      <div className="iz-qr__plate">
        <canvas ref={canvas} className="iz-qr__canvas" aria-label={`رمز QR لـ ${label}`} role="img" />
      </div>

      <p className="iz-qr__label">{label}</p>

      {error && (
        <p className="iz-field__error" role="alert">
          تعذّر توليد الرمز: {error}
        </p>
      )}

      {showActions && (
        <div className="iz-qr__actions">
          <ClayButton
            size="sm"
            variant="soft"
            icon={<ExternalLink size={16} strokeWidth={2.4} />}
            onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
          >
            فتح
          </ClayButton>
          <ClayButton
            size="sm"
            variant="ghost"
            icon={<Download size={16} strokeWidth={2.4} />}
            onClick={download}
            ariaLabel={`تنزيل رمز ${label}`}
          >
            تنزيل
          </ClayButton>
          <ClayButton
            size="sm"
            variant="ghost"
            icon={<Printer size={16} strokeWidth={2.4} />}
            onClick={print}
            ariaLabel={`طباعة رمز ${label}`}
          >
            طباعة
          </ClayButton>
        </div>
      )}
    </motion.div>
  );
}

const FRAME_COLORS: Record<QrFrame, string> = {
  classic: "#7a5fc7",
  heart: "#e4728b",
  star: "#f6b93b",
  geo: "#5ba3e0",
};

/**
 * يرسم الرمز في مربّع أبيض وسط لوحة، ثم يرسم الزخرفة حول المربّع فقط.
 * الهامش الأبيض (quiet zone) يبقى كاملًا لأن الزخرفة خارجه تمامًا.
 */
async function renderFramedPng(url: string, frame: QrFrame, label: string): Promise<string> {
  const plate = 1024;
  const pad = 130;
  const qrSize = plate - pad * 2;

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, url, {
    width: qrSize,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#1c1421", light: "#ffffff" },
  });

  const canvas = document.createElement("canvas");
  canvas.width = plate;
  canvas.height = plate + 110;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذّر تجهيز الصورة.");

  ctx.fillStyle = "#fff8f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const color = FRAME_COLORS[frame];
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 16;
  ctx.lineJoin = "round";

  if (frame !== "classic") {
    drawDecor(ctx, frame, plate, pad, color);
  }

  roundRect(ctx, pad - 34, pad - 34, qrSize + 68, qrSize + 68, 44);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, pad - 18, pad - 18, qrSize + 36, qrSize + 36, 28);
  ctx.fill();

  ctx.drawImage(qrCanvas, pad, pad, qrSize, qrSize);

  ctx.fillStyle = "#2e2438";
  ctx.font = "600 46px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.fillText(label.slice(0, 32), plate / 2, plate + 62);

  return canvas.toDataURL("image/png");
}

function drawDecor(
  ctx: CanvasRenderingContext2D,
  frame: QrFrame,
  plate: number,
  pad: number,
  color: string,
) {
  const corners: [number, number][] = [
    [pad - 62, pad - 62],
    [plate - pad + 62, pad - 62],
    [pad - 62, plate - pad + 62],
    [plate - pad + 62, plate - pad + 62],
  ];
  ctx.fillStyle = color;
  corners.forEach(([x, y]) => {
    if (frame === "heart") drawHeart(ctx, x, y, 34);
    else if (frame === "star") drawStar(ctx, x, y, 34, 16);
    else {
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.bezierCurveTo(x, y - size * 0.1, x - size, y - size * 0.15, x - size, y - size * 0.55);
  ctx.bezierCurveTo(x - size, y - size * 1.1, x, y - size * 1.05, x, y - size * 0.6);
  ctx.bezierCurveTo(x, y - size * 1.05, x + size, y - size * 1.1, x + size, y - size * 0.55);
  ctx.bezierCurveTo(x + size, y - size * 0.15, x, y - size * 0.1, x, y + size * 0.35);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, outer: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
