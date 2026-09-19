/*
  خطّافات القراءة الحيّة.
  كل شاشة تشترك في ما تحتاجه فقط؛ الاشتراك يُلغى عند الخروج، فلا يبقى
  مستمع Firestore معلّقًا بعد مغادرة الصفحة.
*/
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseUsable } from "@/injazi/firebase/client";
import {
  COL,
  liveAchievements,
  liveActivity,
  liveDoc,
  liveEvaluationsByStudent,
  liveInvites,
  liveProjectsByStudent,
  liveProjectsBySubjects,
  liveSettings,
  liveStudent,
  liveStudentLinks,
  liveStudents,
  liveSubjects,
  liveTeachers,
  liveUsers,
} from "@/injazi/services/repo";
import { DEFAULT_SETTINGS } from "@/injazi/types/models";
import type {
  Achievement,
  ActivityLog,
  Evaluation,
  Project,
  Settings,
  Student,
  StudentLink,
  Subject,
  Teacher,
  TeacherInvite,
  UserDoc,
} from "@/injazi/types/models";

export type Loadable<T> = { data: T; loading: boolean; error: string | null };

/*
  رسالة الخطأ كما تقرؤها طالبة في الرابع الابتدائي.
  ------------------------------------------------------------------
  رسائل Firestore إنجليزية وتحمل روابط لوحة تحكّم المطوّر (رابط إنشاء
  فهرس مثلًا). ظهورها في ملف الطالبة ليس قبحًا فحسب: هو تسريب لتفاصيل
  البنية التحتية إلى شاشة طفلة، ولا يفيدها بشيء. فتُترجَم هنا عند
  الحدّ، مرة واحدة، فلا يمكن لأي شاشة أن تعرض النصّ الخام.
  والنصّ الأصلي يبقى في طرفية المطوّر للتشخيص.
*/
function humanizeQueryError(err: Error): string {
  const code = (err as { code?: string }).code ?? "";
  // eslint-disable-next-line no-console
  console.error("[Firestore]", code, err.message);

  if (code === "permission-denied") {
    return "لا تملكين صلاحية عرض هذا المحتوى.";
  }
  if (code === "unavailable" || code === "deadline-exceeded") {
    return "تعذّر الوصول إلى الخادم. تحقّقي من الاتصال ثم حدّثي الصفحة.";
  }
  if (code === "failed-precondition") {
    return "تعذّر تحميل هذا القسم بسبب إعداد ناقص في قاعدة البيانات. أبلغي المشرفة.";
  }
  if (code === "unauthenticated") {
    return "انتهت الجلسة. افتحي رابطكِ من جديد.";
  }
  return "تعذّر تحميل البيانات. حدّثي الصفحة، وإن تكرّر أبلغي المشرفة.";
}

function useLiveList<T>(
  subscribe: (onData: (rows: T[]) => void, onError?: (e: Error) => void) => () => void,
  deps: unknown[] = [],
): Loadable<T[]> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribe(
      (rows) => {
        setData(rows);
        setLoading(false);
      },
      (err) => {
        setError(humanizeQueryError(err));
        setLoading(false);
      },
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

// ------------------------------------------------------------ المصادقة

export type SessionState = {
  uid: string | null;
  profile: UserDoc | null;
  loading: boolean;
};

/** الجلسة الحالية + دور المستخدمة من users/{uid}. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    uid: null,
    profile: null,
    loading: isFirebaseUsable,
  });

  useEffect(() => {
    if (!isFirebaseUsable) {
      setState({ uid: null, profile: null, loading: false });
      return;
    }

    let stopProfile: (() => void) | undefined;

    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopProfile?.();
      stopProfile = undefined;

      if (!user) {
        setState({ uid: null, profile: null, loading: false });
        return;
      }

      /*
        الدور لا يُقرأ من الرمز المميّز بل من المستند، حتى يسري تعطيل
        الحساب أو تغيير الدور فورًا دون انتظار تجديد الجلسة.

        والاشتراك حيّ لا قراءة واحدة: ملف الصلاحيات قد يُكتب بعد تسجيل
        الدخول بلحظة (المعلمة الداخلة برابطها تُنشئ ملفها بنفسها)، وقد
        تعطّله المشرفة أثناء الجلسة. قراءة واحدة عند الدخول كانت تترك
        الترويسة تعرض «دخول» لمعلمة داخلة فعلًا.
      */
      stopProfile = liveDoc<UserDoc>(COL.users, user.uid, (profile) =>
        setState({ uid: user.uid, profile, loading: false }),
      );
    });

    return () => {
      stopProfile?.();
      stopAuth();
    };
  }, []);

  return state;
}

// ------------------------------------------------------------ المجموعات

export const useStudents = () => useLiveList<Student>(liveStudents);
export const useTeachers = () => useLiveList<Teacher>(liveTeachers);
export const useSubjects = () => useLiveList<Subject>(liveSubjects);
export const useUsers = () => useLiveList<UserDoc>(liveUsers);
/** للمشرفة وحدها: القواعد ترفض تعداد الروابط لأي دور آخر. */
export const useInvites = () => useLiveList<TeacherInvite>(liveInvites);
/** للمشرفة وحدها كذلك: لا تعداد لروابط الطالبات لأي دور آخر. */
export const useStudentLinks = () => useLiveList<StudentLink>(liveStudentLinks);
export const useActivity = () => useLiveList<ActivityLog>(liveActivity);

export const useStudentProjects = (studentId: string) =>
  useLiveList<Project>((onData) => liveProjectsByStudent(studentId, onData), [studentId]);

export const useStudentAchievements = (studentId: string) =>
  useLiveList<Achievement>((onData) => liveAchievements(studentId, onData), [studentId]);

export const useStudentEvaluations = (studentId: string) =>
  useLiveList<Evaluation>((onData) => liveEvaluationsByStudent(studentId, onData), [studentId]);

export const useProjectsForSubjects = (subjectIds: string[]) =>
  useLiveList<Project>((onData) => liveProjectsBySubjects(subjectIds, onData), [subjectIds.join(",")]);

export function useStudent(id: string): Loadable<Student | null> {
  const [data, setData] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    return liveStudent(id, (row) => {
      setData(row);
      setLoading(false);
    });
  }, [id]);

  return { data, loading, error: null };
}

export function useSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => liveSettings(setSettings), []);
  return settings;
}

/** فهرسة سريعة بالمعرّف — تُستخدم لربط المشروع بمادته والمادة بمعلمتها. */
export function useIndex<T extends { id: string }>(rows: T[]): Record<string, T> {
  return useMemo(() => Object.fromEntries(rows.map((row) => [row.id, row])), [rows]);
}
