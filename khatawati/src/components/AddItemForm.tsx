import { useState, type FormEvent } from "react";
import { compressImageToDataUrl } from "@/lib/imageCompress";

const URL_PATTERN = /^https?:\/\/.+/i;

export function AddItemForm({
  onAdd,
  busy,
}: {
  onAdd: (input: { kind: "image" | "link"; url: string; title: string }) => Promise<void>;
  busy?: boolean;
}) {
  const [mode, setMode] = useState<"image" | "link">("link");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setLink("");
    setFile(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("اكتبي عنوان بسيط للعمل");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "link") {
        if (!URL_PATTERN.test(link.trim())) {
          setError("الرابط لازم يبدأ بـ https:// أو http://");
          setSubmitting(false);
          return;
        }
        await onAdd({ kind: "link", url: link.trim(), title: title.trim() });
      } else {
        if (!file) {
          setError("اختاري صورة");
          setSubmitting(false);
          return;
        }
        const dataUrl = await compressImageToDataUrl(file);
        await onAdd({ kind: "image", url: dataUrl, title: title.trim() });
      }
      reset();
    } catch {
      setError("صار خطأ، حاولي مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <div className="add-item-form__mode">
        <button type="button" className={mode === "link" ? "is-active" : ""} onClick={() => setMode("link")}>
          🔗 رابط
        </button>
        <button type="button" className={mode === "image" ? "is-active" : ""} onClick={() => setMode("image")}>
          🖼️ صورة
        </button>
      </div>
      <input
        placeholder="عنوان بسيط (مثل: قصتي القصيرة)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      {mode === "link" ? (
        <input placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
      ) : (
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      )}
      {error && <div className="add-item-form__error">{error}</div>}
      <button type="submit" disabled={submitting || busy} className="add-item-form__submit">
        {submitting ? "جارِ الإضافة..." : "+ إضافة"}
      </button>
    </form>
  );
}
