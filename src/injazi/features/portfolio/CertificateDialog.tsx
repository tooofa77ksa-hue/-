/*
  شهادة التميّز — المعاينة والتحميل.
  ==================================================================
  تُرسَم الشهادة على لوحة بمقاس الطباعة الكامل، وتُعرض مصغّرة داخل
  النافذة. ما تراه الطالبة هو الملف نفسه لا تقريبًا له.

  التحميل PDF أولًا لأنه ما طُلب للطباعة والإرسال، وصورة PNG بجانبه
  لأن إرسال صورة في الواتساب أسهل من إرسال ملف على جوّال الأم.
*/
import { useEffect, useRef, useState } from "react";
import { Download, FileImage, Loader2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { Modal } from "@/injazi/ui/Modal";
import { Notice } from "@/injazi/ui/primitives";
import {
  buildPdf,
  drawCertificate,
  downloadBlob,
  ensureFonts,
  safeFileName,
  type CertificateData,
} from "@/injazi/lib/certificate";

type Props = {
  open: boolean;
  data: CertificateData;
  onClose: () => void;
};

export function CertificateDialog({ open, data, onClose }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const [error, setError] = useState<string | null>(null);

  /*
    الرسم بعد تحميل الخطوط لا قبله: الرسم المبكّر يُخرج الشهادة بخطّ
    النظام الاحتياطي، وهي لا تُعاد رسمها تلقائيًا بعد وصول الخط.
  */
  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    let live = true;
    setError(null);
    (async () => {
      try {
        await ensureFonts();
        if (!live || !canvas.current) return;
        drawCertificate(canvas.current, data);
        setReady(true);
      } catch {
        if (live) setError("تعذّر تجهيز الشهادة. أعيدي فتح النافذة.");
      }
    })();
    return () => {
      live = false;
    };
  }, [open, data]);

  function toBlob(type: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!canvas.current) return reject(new Error("no canvas"));
      canvas.current.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("no blob"))),
        type,
        quality,
      );
    });
  }

  async function savePdf() {
    if (!canvas.current || busy) return;
    setBusy("pdf");
    setError(null);
    try {
      const jpeg = await toBlob("image/jpeg", 0.95);
      const bytes = new Uint8Array(await jpeg.arrayBuffer());
      const pdf = buildPdf(bytes, canvas.current.width, canvas.current.height);
      downloadBlob(pdf, `injazi-${safeFileName(data.studentName)}.pdf`);
    } catch {
      setError("تعذّر إنشاء ملف PDF. جرّبي تحميل الصورة بدلًا منه.");
    } finally {
      setBusy(null);
    }
  }

  async function savePng() {
    if (busy) return;
    setBusy("png");
    setError(null);
    try {
      const png = await toBlob("image/png");
      downloadBlob(png, `injazi-${safeFileName(data.studentName)}.png`);
    } catch {
      setError("تعذّر تحميل الصورة.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal
      open={open}
      title="شهادة التميّز"
      onClose={onClose}
      size="lg"
      busy={busy !== null}
      footer={
        <>
          <ClayButton variant="soft" onClick={onClose} disabled={busy !== null}>
            إغلاق
          </ClayButton>
          <ClayButton
            variant="soft"
            icon={busy === "png" ? <Loader2 size={17} className="iz-spin" /> : <FileImage size={17} strokeWidth={2.4} />}
            onClick={savePng}
            disabled={!ready || busy !== null}
          >
            صورة
          </ClayButton>
          <ClayButton
            icon={busy === "pdf" ? <Loader2 size={17} className="iz-spin" /> : <Download size={17} strokeWidth={2.5} />}
            onClick={savePdf}
            disabled={!ready || busy !== null}
          >
            تحميل PDF
          </ClayButton>
        </>
      }
    >
      {error && <Notice tone="danger">{error}</Notice>}

      <p className="iz-field__meter" style={{ marginBottom: 12 }}>
        شهادتك جاهزة باسمك. حمّليها PDF لطباعتها، أو صورةً لإرسالها.
      </p>

      <div className="iz-cert">
        <canvas ref={canvas} className="iz-cert__canvas" aria-label={`شهادة تميّز باسم ${data.studentName}`} />
        {!ready && (
          <div className="iz-cert__wait">
            <Loader2 size={30} className="iz-spin" aria-hidden="true" />
            <span>جارٍ تجهيز شهادتك…</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
