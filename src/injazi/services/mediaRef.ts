/*
  شكل مرجع الصورة وحده — بلا أي اعتماد على Firestore.
  ------------------------------------------------------------------
  مفصول عن services/media.ts لسبب واحد: طبقة المستودع (repo.ts) تحتاج
  أن تعرف أيّ الحقول يحمل صورة كي تحذفها مع صاحبها، وmedia.ts يستورد
  repo.ts أصلًا (لأسماء المجموعات) — فاستيراده منه كان يُغلق حلقة
  استيراد. ثلاثة أسطر بلا تبعيات تكسر الحلقة وتبقي المعرفة في مكان
  واحد بدل نسخها في ملفين يفترقان مع الوقت.
*/

/** بادئة تميّز مرجع الصورة المحفوظة في Firestore عن أي رابط عادي. */
export const MEDIA_PREFIX = "iz-media://";

export const isMediaRef = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.startsWith(MEDIA_PREFIX);

/** معرّف مستند الصورة من مرجعها. */
export const mediaIdOf = (reference: string): string => reference.slice(MEDIA_PREFIX.length);
