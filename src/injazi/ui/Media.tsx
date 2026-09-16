/*
  عرض الصور.
  ------------------------------------------------------------------
  يخفي الفرق بين الصورة المحفوظة داخل Firestore ("iz-media://{id}")
  والرابط العادي ("https://…")، فتبقى بقية الواجهة كما هي، ولو فُعِّل
  التخزين السحابي لاحقًا تعمل الصور القديمة والجديدة معًا بلا ترحيل.
  منطق التحويل في useMediaSrc.ts.
*/
import { useMediaSrc } from "@/injazi/ui/useMediaSrc";

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** يُعرض ريثما تصل الصورة أو عند غيابها (حرف الاسم مثلًا). */
  fallback?: React.ReactNode;
  loading?: "lazy" | "eager";
};

export function Media({ src, alt, className, fallback = null, loading = "lazy" }: Props) {
  const resolved = useMediaSrc(src);
  if (!resolved) return <>{fallback}</>;
  return <img src={resolved} alt={alt} className={className} loading={loading} decoding="async" />;
}
