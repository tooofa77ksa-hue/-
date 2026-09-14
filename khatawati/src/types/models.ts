export type Subject = "lughati" | "riyadiyat";
export type ItemSection = "certificate" | "achievement" | Subject;
export type ItemKind = "image" | "link";

export interface AppUser {
  uid: string;
  role: "family" | "teacher";
  displayName: string;
  /** للعائلة فقط: معرّف الطالبة المرتبطة بهذا الحساب. */
  studentId?: string;
  /** للمعلمة فقط: المادة التي تصحح فيها فقط. */
  subject?: Subject;
}

export interface Student {
  id: string;
  /** الاسم الحقيقي - لا يمكن للعائلة تعديله. */
  name: string;
  /** الاسم المعروض في الملف - تقدر العائلة تغيّره بكيفها. */
  nickname: string;
  color: string;
  /** صورة مضغوطة كـ data URL (لا نستخدم Firebase Storage). */
  photoUrl: string | null;
  bio: string;
  interests: string;
  familyUid: string;
  createdAt: number;
  updatedAt: number;
}

export interface ItemRating {
  stars: number;
  comment: string;
  ratedByUid: string;
  ratedBySubject: Subject;
  ratedAt: number;
}

export interface PortfolioItem {
  id: string;
  section: ItemSection;
  kind: ItemKind;
  /** رابط خارجي، أو data URL لصورة مضغوطة. */
  url: string;
  title: string;
  createdAt: number;
  rating: ItemRating | null;
  /** false بعد تقييم جديد حتى تفتحه العائلة - يُستخدَم للتنبيه. */
  seen: boolean;
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  lughati: "لغتي",
  riyadiyat: "رياضيات",
};

export const SECTION_LABELS: Record<ItemSection, string> = {
  certificate: "شهاداتي",
  achievement: "إنجازاتي",
  lughati: "أعمالي - لغتي",
  riyadiyat: "أعمالي - رياضيات",
};
