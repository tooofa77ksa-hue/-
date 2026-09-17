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
        setError(err.message);
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
