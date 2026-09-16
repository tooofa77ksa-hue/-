/*
  الصلاحيات في الواجهة.
  هذه الدوال تقرّر ما يُعرض فقط. القرار الحقيقي (من يكتب ماذا) مفروض
  في Firestore/Storage Rules — إخفاء زر لا يحمي بيانات، وإظهاره خطأً
  لا يمنح صلاحية.
*/
import type { UserDoc, Visibility } from "@/injazi/types/models";

export const isAdmin = (profile: UserDoc | null): boolean =>
  profile?.role === "admin" && profile.active !== false;

export const isTeacher = (profile: UserDoc | null): boolean =>
  profile?.role === "teacher" && profile.active !== false;

export const isParent = (profile: UserDoc | null): boolean =>
  profile?.role === "parent" && profile.active !== false;

/** ولي الأمر يعدّل ملف ابنته فقط؛ المشرفة تعدّل كل الملفات. */
export function canEditStudent(profile: UserDoc | null, studentId: string): boolean {
  if (isAdmin(profile)) return true;
  return isParent(profile) && Boolean(profile?.studentIds?.includes(studentId));
}

/** المعلمة تقيّم مادتها فقط. */
export function canEvaluateSubject(profile: UserDoc | null, subjectId: string): boolean {
  if (isAdmin(profile)) return true;
  return isTeacher(profile) && Boolean(profile?.subjectIds?.includes(subjectId));
}

/** هل يُعرَض محتوى بهذه الخصوصية لهذه المستخدمة؟ */
export function canViewContent(
  profile: UserDoc | null,
  visibility: Visibility,
  studentId: string,
): boolean {
  if (visibility === "public") return true;
  if (isAdmin(profile) || isTeacher(profile)) return true;
  if (visibility === "school") return profile !== null && profile.active !== false;
  return canEditStudent(profile, studentId);
}

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  public: "ظاهر للجميع",
  school: "للمدرسة فقط",
  private: "خاص",
};
