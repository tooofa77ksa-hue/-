/*
  مخزن الصور داخل Firestore — بلا Cloud Storage وبلا تكلفة.
  ==================================================================
  لماذا؟ منذ فبراير ٢٠٢٦ صار Cloud Storage يتطلب ربط بطاقة بنكية مهما
  كان حجم الاستخدام. هذه المنصة لمدرسة ابتدائية، والقرار أن تبقى مجانية
  بالكامل — فتُحفَظ الصور داخل قاعدة البيانات نفسها (الخطة المجانية
  تعطي ١ جيجابايت، وصورة مضغوطة ~١٥٠ كيلوبايت، أي ما يكفي مئات الطالبات).

  ثلاثة قرارات تصميمية تستحق الشرح:

  1) كل صورة في مستند مستقل (apps/injazi/media/{id})، لا داخل مستند
     الطالبة. لو حُشرت الصورة في مستند الطالبة لحمَّلت الصفحة الرئيسية
     صور الطالبات كاملةً مع كل قراءة، ولاقترب المستند من حد
     المليون بايت. المستند المرجعي يحمل معرّفًا فقط.

  2) المرجع يُخزَّن كنص "iz-media://{id}" لا كرابط. هذا يبقي الحقل
     نفسه (photoUrl) صالحًا للرابط العادي أيضًا، فلو فُعِّل Cloud
     Storage لاحقًا تعمل الروابط القديمة والجديدة معًا بلا ترحيل.

  3) حد المستند في Firestore ~١ ميجابايت، وترميز base64 يزيد الحجم
     الثلث. لذلك الحد الفعلي للصورة ~٧٠٠ كيلوبايت، ويُضغَط تلقائيًا
     على مراحل حتى ينزل تحته قبل أي محاولة حفظ.
*/
import { addDoc, collection, deleteDoc, doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseUsable } from "@/injazi/firebase/client";
import { COL } from "@/injazi/services/repo";
import { MEDIA_PREFIX, isMediaRef, mediaIdOf } from "@/injazi/services/mediaRef";

// شكل المرجع يعيش في mediaRef.ts (بلا تبعيات) ويُعاد تصديره من هنا حتى
// يبقى كل مستورِد قديم عاملًا كما هو.
export { MEDIA_PREFIX, isMediaRef };

/** الحد الآمن للبايتات قبل الترميز (مستند Firestore ~1MiB). */
export const MAX_MEDIA_BYTES = 700 * 1024;

const IMAGE_MIMES = ["image/webp", "image/jpeg", "image/png", "image/avif"];

export class MediaError extends Error {}

const idOf = mediaIdOf;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new MediaError("تعذّرت قراءة الصورة."));
    reader.readAsDataURL(blob);
  });
}

/**
 * يُرمّز اللوحة بالصيغة المطلوبة، ويعيد ما خرج فعلًا.
 * ------------------------------------------------------------------
 * canvas.toBlob حين لا يدعم المتصفّح الصيغة المطلوبة **لا يفشل**: يعود
 * بـ PNG صامتًا، وPNG يتجاهل مُعامل الجودة ويبقى ضخمًا لصورة فوتوغرافية.
 * فتفشل كل مراحل الضغط مهما صغّرنا الأبعاد، وتُقال للمستخدمة «الصورة
 * كبيرة» وصورتها ليست كبيرة — المتصفّح فقط لا يعرف WebP.
 * ولذلك نفحص نوع الناتج لا نفترضه.
 */
async function encode(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number,
): Promise<Blob | null> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality),
  );
  return blob;
}

/**
 * يضغط الصورة على مراحل حتى تنزل تحت الحد.
 * التنازل عن الأبعاد قبل الجودة مقصود: تصغير صورة ٤٠٠٠ بكسل إلى ١٤٠٠
 * لا يُلاحَظ في بطاقة أو ملف إنجاز، بينما خفض الجودة يظهر كتشويش.
 *
 * JPEG هو شبكة الأمان: مدعوم في كل متصفّح منذ عقدين، ويضغط الصور
 * الفوتوغرافية جيدًا. WebP أفضل حجمًا فنبدأ به، فإن لم يدعمه المتصفّح
 * انتقلنا إلى JPEG بدل أن نلوم صورة الطالبة.
 */
export async function fitForFirestore(source: Blob): Promise<Blob> {
  if (source.size <= MAX_MEDIA_BYTES && IMAGE_MIMES.includes(source.type)) return source;

  const steps: { edge: number; quality: number }[] = [
    { edge: 1400, quality: 0.82 },
    { edge: 1100, quality: 0.78 },
    { edge: 900, quality: 0.72 },
    { edge: 700, quality: 0.66 },
    { edge: 560, quality: 0.6 },
    { edge: 420, quality: 0.55 },
  ];

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch {
    throw new MediaError("تعذّرت قراءة الصورة — جرّبي صيغة أخرى (JPG أو PNG).");
  }

  try {
    for (const step of steps) {
      const scale = Math.min(1, step.edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new MediaError("تعذّر تجهيز الصورة.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      let blob = await encode(canvas, "image/webp", step.quality);

      // خرج بغير ما طلبنا ⇒ المتصفّح لا يُرمّز WebP. ننتقل إلى JPEG
      // لبقية المراحل بدل تكرار محاولة تعود بـ PNG ضخم في كل مرة.
      if (!blob || blob.type !== "image/webp") {
        blob = await encode(canvas, "image/jpeg", step.quality);
      }

      if (blob && blob.size <= MAX_MEDIA_BYTES && IMAGE_MIMES.includes(blob.type)) {
        return blob;
      }
    }
  } finally {
    bitmap.close?.();
  }

  throw new MediaError(
    `تعذّر تصغير الصورة تحت ${Math.round(MAX_MEDIA_BYTES / 1024)} كيلوبايت. ` +
      "جرّبي التقاط صورة بجودة أقل، أو أرسليها من تطبيق يضغطها (واتساب مثلًا) ثم ارفعيها.",
  );
}

export type SavedMedia = { ref: string; size: number; mime: string };

/** يرفض الوعد بعد المهلة بدل انتظار لا ينتهي. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(Object.assign(new Error("انتهت المهلة"), { code: "iz/timeout" }));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * يحفظ الصورة ويعيد مرجعها.
 * ownerUid و studentId يُخزَّنان لأن القواعد الأمنية تبني عليهما قرار
 * الحذف — لا يمكن لأحد حذف صورة غيره.
 */
export async function saveMedia(
  blob: Blob,
  meta: { name: string; studentId?: string | null },
): Promise<SavedMedia> {
  if (!isFirebaseUsable) throw new MediaError("لم تُضبَط إعدادات Firebase بعد.");
  const uid = auth.currentUser?.uid;
  if (!uid) throw new MediaError("يلزم تسجيل الدخول قبل رفع أي صورة.");

  const fitted = await fitForFirestore(blob);
  const dataUrl = await blobToDataUrl(fitted);

  /*
    سبب الفشل يُقال لا يُبتلع.
    الكتابة هنا قد ترفضها القواعد (جلسة بلا ملف صلاحيات، أو حجم يتجاوز
    الحد)، وخطأ Firestore بنصّه الإنجليزي لا يعني المشرفة شيئًا — لكن
    رمزه يحسم التشخيص في ثانية بدل ساعة تخمين. فنُترجم المعروف، ونُرفق
    الرمز فيما عداه.
  */
  /*
    مهلة صريحة على تأكيد الخادم.
    addDoc لا يُحلّ إلا بعد أن يؤكّد الخادم الكتابة، لكنه حين ينقطع
    الاتصال لا يرفض: يضع الكتابة في طابور محلّي وينتظر إلى ما لا نهاية.
    فتبقى الصورة «قيد الرفع» بلا خطأ ولا نجاح، وتظنّ صاحبة الشاشة أن
    شيئًا لم يحدث — ثم تحفظ، فيُكتب «بلا صورة». الصمت هنا أسوأ من
    الخطأ، فنجعل للانتظار حدًّا ينطق.
  */
  const ACK_TIMEOUT_MS = 20000;
  let created;
  try {
    created = await withTimeout(addDoc(collection(db, COL.media), {
      ownerUid: uid,
      studentId: meta.studentId ?? null,
      name: meta.name.slice(-80),
      mime: fitted.type,
      size: fitted.size,
      data: dataUrl,
      createdAt: new Date().toISOString(),
    }), ACK_TIMEOUT_MS);
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "";
    if (code === "iz/timeout") {
      throw new MediaError(
        "لم يؤكّد الخادم حفظ الصورة خلال ٢٠ ثانية — غالبًا ضعف في الاتصال. " +
          "تحقّقي من الشبكة وأعيدي المحاولة؛ لم يُحفظ شيء.",
      );
    }
    if (code === "permission-denied") {
      throw new MediaError(
        "رُفضت الصورة من قواعد الحماية. تأكّدي أنكِ داخلة بحسابكِ أو من رابط الطالبة، " +
          "ثم أعيدي المحاولة.",
      );
    }
    if (code === "unavailable" || code === "deadline-exceeded") {
      throw new MediaError("تعذّر الوصول إلى الخادم — تحقّقي من الاتصال وأعيدي المحاولة.");
    }
    throw new MediaError(
      `تعذّر حفظ الصورة${code ? ` (${code})` : ""}. حجم الصورة بعد الضغط: ${Math.round(fitted.size / 1024)} كيلوبايت.`,
    );
  }

  return { ref: `${MEDIA_PREFIX}${created.id}`, size: fitted.size, mime: fitted.type };
}

/** حذف صورة. غياب المستند ليس خطأً — الهدف أن تختفي، وقد اختفت. */
export async function deleteMedia(reference: string | null | undefined): Promise<void> {
  if (!isMediaRef(reference) || !isFirebaseUsable) return;
  try {
    await deleteDoc(doc(db, COL.media, idOf(reference as string)));
  } catch {
    /* محذوفة مسبقًا أو بلا صلاحية: لا توقف تحديث المستند المرجعي */
  }
}

// ---------------------------------------------------------------- القراءة

/**
 * ذاكرة مؤقتة داخل الصفحة.
 * بدونها تُقرأ صورة الطالبة من Firestore مع كل إعادة رسم لبطاقتها،
 * فتستهلك حصة القراءات اليومية بلا داعٍ وتُظهر وميضًا عند كل تحديث.
 */
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

export async function resolveMedia(reference: string): Promise<string | null> {
  const id = idOf(reference);
  const cached = cache.get(id);
  if (cached) return cached;

  const pending = inflight.get(id);
  if (pending) return pending;

  const request = (async () => {
    try {
      const snapshot = await getDoc(doc(db, COL.media, id));
      const data = snapshot.exists() ? (snapshot.data().data as string) : null;
      if (data) cache.set(id, data);
      return data;
    } catch {
      return null;
    } finally {
      inflight.delete(id);
    }
  })();

  inflight.set(id, request);
  return request;
}
