/*
  رفع الملفات.
  ------------------------------------------------------------------
  الوجهة الافتراضية هي Firestore (services/media.ts) لا Cloud Storage،
  لأن الأخير صار يتطلب بطاقة بنكية منذ فبراير ٢٠٢٦ وهذه المنصة مدرسية
  مجانية بالكامل. الدوال هنا تحتفظ بالواجهة نفسها، فلو فُعِّل التخزين
  السحابي يومًا يكفي قلب MEDIA_BACKEND.
  الصور تُضغَط وتُحوَّل إلى WebP في المتصفح قبل الرفع: أولياء الأمور
  يرفعون من الجوال، وصورة 4MB من الكاميرا تصبح ~150KB دون فرق مرئي —
  وهذا وحده أكبر مكسب أداء في المشروع.
*/
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, storage, isStorageUsable } from "@/injazi/firebase/client";
import { deleteMedia, isMediaRef, saveMedia } from "@/injazi/services/media";
import type { MediaKind } from "@/injazi/types/models";

/**
 * "firestore" = مجاني بلا بطاقة (صور فقط).
 * "storage"   = Cloud Storage (يتطلب خطة Blaze، ويدعم PDF والفيديو).
 * التبديل لا يكسر البيانات القديمة: مكوّن Media يعرض الشكلين معًا.
 */
export const MEDIA_BACKEND: "firestore" | "storage" = "firestore";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const DOC_MIMES = ["application/pdf"];
const VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"];
const AUDIO_MIMES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac"];

export class UploadError extends Error {}

export function kindOf(mime: string): MediaKind {
  if (IMAGE_MIMES.includes(mime)) return "image";
  if (DOC_MIMES.includes(mime)) return "pdf";
  if (VIDEO_MIMES.includes(mime)) return "video";
  return "file";
}

/** فحص النوع والحجم قبل أي عمل — نفس الحدود مطبّقة في Storage Rules. */
export function validate(file: File, accept: "image" | "media" | "audio"): void {
  // على وجهة Firestore تُقبل الصور وحدها: حد المستند مليون بايت لا يتسع
  // لملف PDF أو فيديو. البديل مبنيّ أصلًا وأفضل: رابط Drive/YouTube مع
  // رمز QR يُولَّد تلقائيًا.
  const allowed =
    MEDIA_BACKEND === "firestore"
      ? IMAGE_MIMES
      : accept === "image"
        ? IMAGE_MIMES
        : accept === "audio"
          ? AUDIO_MIMES
          : [...IMAGE_MIMES, ...DOC_MIMES, ...VIDEO_MIMES];

  if (!allowed.includes(file.type)) {
    if (MEDIA_BACKEND === "firestore" && accept !== "image") {
      throw new UploadError(
        "هنا تُرفع الصور فقط. لملفات PDF والفيديو: ارفعيها على Google Drive أو YouTube وألصقي الرابط في قسم «روابط» — يُولَّد له رمز QR تلقائيًا.",
      );
    }
    throw new UploadError(`نوع الملف غير مدعوم: ${file.type || "غير معروف"}`);
  }
  const max = accept === "image" ? MAX_IMAGE_BYTES : accept === "audio" ? MAX_AUDIO_BYTES : MAX_FILE_BYTES;
  if (file.size > max) {
    throw new UploadError(`حجم الملف أكبر من الحد المسموح (${Math.round(max / 1024 / 1024)} ميجابايت).`);
  }
}

/**
 * ضغط صورة وتحويلها إلى WebP بأطول ضلع محدَّد.
 * يعيد الملف الأصلي كما هو إذا فشل الترميز (GIF متحرك مثلًا) — الرفع
 * أهم من الضغط.
 */
export async function compressImage(file: File, maxEdge = 1600, quality = 0.82): Promise<Blob> {
  if (!IMAGE_MIMES.includes(file.type) || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export type UploadResult = { url: string; path: string; size: number; mime: string };

/** رفع مع تقدّم حقيقي — شريط التقدّم في الواجهة يعكس البايتات لا مؤقتًا. */
export async function uploadFile(
  path: string,
  data: Blob,
  onProgress?: (percent: number) => void,
  meta?: { studentId?: string | null; name?: string },
): Promise<UploadResult> {
  if (MEDIA_BACKEND === "firestore") {
    // لا تقدّم فعلي بالبايتات هنا (الحفظ كتابة واحدة)، فنُظهر مرحلتين
    // صادقتين: بدء الضغط ثم الاكتمال — لا شريط وهمي يتحرك بلا معنى.
    onProgress?.(10);
    const saved = await saveMedia(data, { name: meta?.name ?? "image", studentId: meta?.studentId });
    onProgress?.(100);
    return { url: saved.ref, path: saved.ref, size: saved.size, mime: saved.mime };
  }

  return uploadToCloudStorage(path, data, onProgress);
}

function uploadToCloudStorage(
  path: string,
  data: Blob,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  if (!isStorageUsable) {
    return Promise.reject(new UploadError("Firebase Storage غير مهيّأ — أضيفي قيم .env."));
  }
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), data, { contentType: data.type });
    task.on(
      "state_changed",
      (snapshot) =>
        onProgress?.(Math.round((snapshot.bytesTransferred / Math.max(snapshot.totalBytes, 1)) * 100)),
      (error) => reject(new UploadError(error.message)),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path, size: task.snapshot.totalBytes, mime: data.type });
      },
    );
  });
}

/** حذف ملف. غياب الملف ليس خطأً — الهدف أن يختفي، وقد اختفى. */
export async function deleteFile(path: string | null | undefined): Promise<void> {
  if (!path) return;
  // الشكل يحدّد الوجهة، لا الإعداد: مرجع Firestore يُحذف من Firestore
  // حتى بعد تبديل الوجهة، فلا تبقى صورة قديمة بلا طريقة لحذفها.
  if (isMediaRef(path)) {
    await deleteMedia(path);
    return;
  }
  if (!isStorageUsable) return;
  try {
    await deleteObject(ref(storage, path));
  } catch {
    /* ملف محذوف مسبقًا أو صلاحية قراءة فقط: لا يوقف تحديث المستند */
  }
}

/**
 * مسار الرفع: <النطاق>/<uid المالك>/<النوع>/<اسم فريد>
 *
 * وجود uid الرافع كجزء ثابت من المسار ليس تنظيمًا بل هو آلية الحماية
 * نفسها: قواعد Storage تقارنه بـ request.auth.uid مباشرة، فلا تحتاج
 * قراءة من Firestore للتحقق من الملكية. وهذا مقصود لسببين:
 *   • محاكي Storage لا ينفّذ firestore.get() داخل القواعد، فأي قاعدة
 *     تعتمد عليه تكون غير قابلة للاختبار محليًا وتكسر الرفع في التطوير
 *     كليًا — تحقّقنا من ذلك عمليًا عبر المتصفح والمحاكي معًا.
 *   • ربط الملف بطالبة بعينها محسوم أصلًا في Firestore: لا أحد يستطيع
 *     كتابة مستند طالبة أخرى، فلا يمكن إظهار ملف مرفوع في ملف غيرها
 *     مهما كان مساره.
 */
export function makePath(scope: string, kind: string, fileName: string): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new UploadError("يلزم تسجيل الدخول قبل رفع أي ملف.");
  const safe = fileName.replace(/[^\w.\-\u0600-\u06FF]/g, "_").slice(-60);
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return `${scope}/${uid}/${kind}/${unique}-${safe}`;
}

/** نطاق ملفات طالبة بعينها. */
export const studentScope = (studentId: string) => `students/${studentId}`;

/** نطاق ملفات المنصة (الشعار، الأغنية، صور المعلمات). */
export const PLATFORM_SCOPE = "platform";
