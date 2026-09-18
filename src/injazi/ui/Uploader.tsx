/*
  رفع الملفات + قصّ الصور.
  ثلاث حالات واضحة دائمًا: اختيار، تقدّم فعلي بالبايتات، ثم نجاح بحركة
  Lottie قصيرة. الصور تمرّ على القصّ قبل الرفع، فترفع الأم صورة من
  الجوال وتخرج بصورة مربّعة مضغوطة دون أدوات خارجية.
*/
import { Suspense, lazy, useCallback, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ImagePlus, Upload } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { LottieMoment } from "@/injazi/components/LottieMoment";
import { Modal } from "@/injazi/ui/Modal";
import { DUR, EASE_CLAY } from "@/injazi/motion/motion";
import {
  compressImage,
  kindOf,
  makePath,
  uploadFile,
  validate,
  type UploadResult,
} from "@/injazi/services/storage";
import type { MediaKind } from "@/injazi/types/models";

// react-easy-crop لا يُحمَّل إلا عند فتح نافذة القصّ فعلًا.
const Cropper = lazy(() => import("react-easy-crop"));

type Area = { x: number; y: number; width: number; height: number };

export type UploadedFile = UploadResult & { name: string; kind: MediaKind };

type Props = {
  /** نطاق الملكية: studentScope(id) أو PLATFORM_SCOPE. */
  scope: string;
  /** المجلد داخل النطاق (profile، projects/covers، settings/audio…). */
  kind: string;
  accept?: "image" | "media" | "audio";
  multiple?: boolean;
  /** يفتح نافذة القصّ للصور — يُستخدَم لصورة الطالبة والغلاف. */
  crop?: boolean;
  cropAspect?: number;
  label?: string;
  onUploaded: (files: UploadedFile[]) => void | Promise<void>;
  /**
   * يُبلَّغ بفشل الرفع أو بزواله.
   * موجود لأن الخطأ داخل هذا المكوّن وحده يبقى سطرًا صغيرًا قد يمرّ دون
   * أن تراه صاحبة الشاشة، ثم تضغط «حفظ» فيُكتب «بلا صورة» وكأن شيئًا لم
   * يكن. النموذج المحيط يحتاج أن يعرف ليمنع ذلك.
   */
  onError?: (message: string | null) => void;
};

export function Uploader({
  scope,
  kind,
  accept = "media",
  multiple = false,
  crop = false,
  cropAspect = 1,
  label = "ارفعي ملفًا",
  onUploaded,
  onError,
}: Props) {
  const input = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** يضبط الخطأ محليًا ويُبلّغ النموذج المحيط في الوقت نفسه. */
  function fail(message: string | null) {
    setError(message);
    onError?.(message);
  }
  const [done, setDone] = useState(false);
  const [cropSource, setCropSource] = useState<{ url: string; file: File } | null>(null);

  const acceptAttr =
    accept === "image"
      ? "image/*"
      : accept === "audio"
        ? "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac"
        : "image/*,application/pdf,video/mp4,video/webm,video/quicktime";

  const push = useCallback(
    async (blob: Blob, name: string) => {
      const path = makePath(scope, kind, name);
      // studentId يُشتق من النطاق ويُخزَّن مع الصورة، فتبني عليه القواعد
      // الأمنية قرار من يملك حذفها.
      const studentId = scope.startsWith("students/") ? scope.split("/")[1] : null;
      const result = await uploadFile(path, blob, setProgress, { studentId, name });
      return { ...result, name, kind: kindOf(blob.type) } satisfies UploadedFile;
    },
    [scope, kind],
  );

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    fail(null);
    setDone(false);

    try {
      files.forEach((file) => validate(file, accept));
    } catch (err) {
      fail(err instanceof Error ? err.message : "ملف غير مقبول.");
      return;
    }

    if (crop && files[0].type.startsWith("image/")) {
      setCropSource({ url: URL.createObjectURL(files[0]), file: files[0] });
      return;
    }

    setProgress(0);
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of files) {
        const blob = file.type.startsWith("image/") ? await compressImage(file) : file;
        uploaded.push(await push(blob, file.name));
      }
      await onUploaded(uploaded);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch (err) {
      fail(err instanceof Error ? err.message : "فشل الرفع.");
    } finally {
      setProgress(null);
    }
  }

  async function finishCrop(blob: Blob) {
    const source = cropSource;
    setCropSource(null);
    if (!source) return;
    URL.revokeObjectURL(source.url);
    setProgress(0);
    fail(null);
    try {
      const uploaded = await push(blob, source.file.name.replace(/\.\w+$/, ".webp"));
      await onUploaded([uploaded]);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch (err) {
      fail(err instanceof Error ? err.message : "فشل الرفع.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="iz-uploader">
      <input
        ref={input}
        type="file"
        accept={acceptAttr}
        multiple={multiple}
        onChange={handleFiles}
        className="iz-visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      <ClayButton
        variant="soft"
        icon={accept === "image" ? <ImagePlus size={18} strokeWidth={2.4} /> : <Upload size={18} strokeWidth={2.4} />}
        onClick={() => input.current?.click()}
        loading={progress !== null}
      >
        {progress !== null ? `جارٍ الرفع ${progress}%` : label}
      </ClayButton>

      <AnimatePresence>
        {progress !== null && (
          <motion.div
            className="iz-progress"
            initial={{ opacity: 0, scaleX: 0.9 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base, ease: EASE_CLAY }}
          >
            <span className="iz-progress__bar" style={{ width: `${progress}%` }} />
          </motion.div>
        )}
        {done && (
          <motion.div
            key="done"
            className="iz-uploader__done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <LottieMoment name="success" size={44} label="تم الرفع" />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="iz-field__error" role="alert">
          {error}
        </p>
      )}

      {cropSource && (
        <CropDialog
          src={cropSource.url}
          aspect={cropAspect}
          onCancel={() => {
            URL.revokeObjectURL(cropSource.url);
            setCropSource(null);
          }}
          onDone={finishCrop}
        />
      )}
    </div>
  );
}

function CropDialog({
  src,
  aspect,
  onCancel,
  onDone,
}: {
  src: string;
  aspect: number;
  onCancel: () => void;
  onDone: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply() {
    if (!area) return;
    setBusy(true);
    const blob = await cropToBlob(src, area);
    setBusy(false);
    onDone(blob);
  }

  return (
    <Modal
      open
      title="اضبطي الصورة"
      onClose={onCancel}
      footer={
        <>
          <ClayButton variant="soft" onClick={onCancel} disabled={busy}>
            إلغاء
          </ClayButton>
          <ClayButton onClick={apply} loading={busy}>
            حفظ الصورة
          </ClayButton>
        </>
      }
    >
      <div className="iz-crop">
        <Suspense fallback={<div className="iz-crop__loading">جارٍ فتح المحرّر…</div>}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_: Area, pixels: Area) => setArea(pixels)}
          />
        </Suspense>
      </div>
      <label className="iz-field">
        <span className="iz-field__label">تكبير</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="iz-range"
        />
      </label>
    </Modal>
  );
}

/** القصّ يتم على لوحة canvas ثم يُرمَّز WebP — لا خادم ولا مكتبة رفع. */
async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = src;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const size = Math.min(1200, Math.round(area.width));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = Math.round((area.height / area.width) * size);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("تعذّر تجهيز الصورة.");
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86),
  );
  if (!blob) throw new Error("تعذّر تجهيز الصورة.");
  return blob;
}
