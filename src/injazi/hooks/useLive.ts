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
import { readErrorMessage } from "@/injazi/lib/firestoreError";
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
        setError(readErrorMessage(err, "list"));
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
  /** فشل قراءة ملف الصلاحيات — لا يعني غيابه. */
  error: string | null;
};

/** الجلسة الحالية + دور المستخدمة من users/{uid}. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    uid: null,
    profile: null,
    loading: isFirebaseUsable,
    error: null,
  });

  useEffect(() => {
    if (!isFirebaseUsable) {
      setState({ uid: null, profile: null, loading: false, error: null });
      return;
    }

    let stopProfile: (() => void) | undefined;

    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopProfile?.();
      stopProfile = undefined;

      if (!user) {
        setState({ uid: null, profile: null, loading: false, error: null });
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
      stopProfile = liveDoc<UserDoc>(
        COL.users,
        user.uid,
        (profile) => setState({ uid: user.uid, profile, loading: false, error: null }),
        /*
          أخطر موضع في الملف كله: بدون هذا المعالج كان فشل قراءة ملف
          الصلاحيات يُبقي loading=true إلى الأبد — فتعلق شاشة «جارٍ
          التحقق من الصلاحية…»، ويبقى profile فارغًا فتختفي كل أزرار
          التعديل من ملف الطالبة بلا أي سبب ظاهر.
        */
        (err) =>
          setState({
            uid: user.uid,
            profile: null,
            loading: false,
            error: readErrorMessage(err, "session"),
          }),
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

/*
  الوسيط الثاني (onError) كان يُهمَل في هذه الأربعة وحدها — وهي بالذات
  بيانات الطالبة والمعلمة. فكان رفض الصلاحية أو نقص الفهرس أو انقطاع
  الشبكة يُنتج قائمة فارغة صامتة: «لا توجد مشاريع بعد» بينما السبب شيء
  آخر تمامًا. تمريره هنا يوصلها بمترجم الأخطاء الذي كان موجودًا ولا
  يُستدعى.
*/
export const useStudentProjects = (studentId: string) =>
  useLiveList<Project>(
    (onData, onError) => liveProjectsByStudent(studentId, onData, onError),
    [studentId],
  );

export const useStudentAchievements = (studentId: string) =>
  useLiveList<Achievement>(
    (onData, onError) => liveAchievements(studentId, onData, onError),
    [studentId],
  );

export const useStudentEvaluations = (studentId: string) =>
  useLiveList<Evaluation>(
    (onData, onError) => liveEvaluationsByStudent(studentId, onData, onError),
    [studentId],
  );

export const useProjectsForSubjects = (subjectIds: string[]) =>
  useLiveList<Project>(
    (onData, onError) => liveProjectsBySubjects(subjectIds, onData, onError),
    [subjectIds.join(",")],
  );

export function useStudent(id: string): Loadable<Student | null> {
  const [data, setData] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    return liveStudent(
      id,
      (row) => {
        setData(row);
        setLoading(false);
      },
      /* بدون هذا كان فشل قراءة مستند الطالبة يترك loading=true إلى
         الأبد: هيكل تحميل دائم لا ينتهي ولا يقول شيئًا. */
      (err) => {
        setError(readErrorMessage(err, "student"));
        setLoading(false);
      },
    );
  }, [id]);

  return { data, loading, error };
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
