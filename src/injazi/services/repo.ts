/*
  طبقة الوصول إلى Firestore.
  كل قراءة حيّة (onSnapshot) وكل كتابة تمر من هنا؛ لا مكوّن يستورد
  firebase/firestore مباشرة. عند غياب إعدادات Firebase لا يسقط الموقع:
  القراءات تعيد قوائم فارغة والكتابات ترمي خطأً واضحًا يلتقطه النموذج.
*/
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { db, isFirebaseUsable } from "@/injazi/firebase/client";
import { DEFAULT_SETTINGS } from "@/injazi/types/models";
import type {
  Achievement,
  ActivityLog,
  Evaluation,
  Project,
  Role,
  Settings,
  Student,
  Subject,
  Teacher,
  UserDoc,
} from "@/injazi/types/models";

/**
 * كل مجموعات "إنجازي يحكي" تحت مستند تطبيق واحد (apps/injazi/...).
 * السبب ليس تنظيميًا فقط: قاعدة البيانات نفسها تخدم "شُعلة لغتي" التي
 * تملك بالفعل مجموعتَي students وusers بمخطّط مختلف تمامًا وقواعد أمنية
 * خاصة بها. المشاركة كانت ستخلط مخطّطين، وتجعل معلمة في تطبيق معلمة في
 * الآخر. أسماء المجموعات تبقى كما هي داخل المسار.
 */
const ROOT = "apps/injazi";

export const COL = {
  users: `${ROOT}/users`,
  students: `${ROOT}/students`,
  teachers: `${ROOT}/teachers`,
  subjects: `${ROOT}/subjects`,
  projects: `${ROOT}/projects`,
  evaluations: `${ROOT}/evaluations`,
  achievements: `${ROOT}/achievements`,
  settings: `${ROOT}/settings`,
  activity: `${ROOT}/activityLogs`,
  media: `${ROOT}/media`,
} as const;

export const SETTINGS_DOC_ID = "app";

export class NotConfiguredError extends Error {
  constructor() {
    super("لم تُضبَط إعدادات Firebase بعد — أضيفي قيم .env ثم أعيدي التحميل.");
    this.name = "NotConfiguredError";
  }
}

function assertReady() {
  if (!isFirebaseUsable) throw new NotConfiguredError();
}

function now() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------- عام

/** اشتراك حيّ في مجموعة. يعيد دالة إلغاء دائمًا، حتى بلا إعدادات. */
export function liveCollection<T>(
  name: string,
  constraints: QueryConstraint[],
  onData: (rows: T[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseUsable) {
    onData([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, name), ...constraints),
    (snapshot) => onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T)),
    (error) => onError?.(error),
  );
}

/** اشتراك حيّ في مستند واحد. */
export function liveDoc<T>(
  name: string,
  id: string,
  onData: (row: T | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseUsable) {
    onData(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, name, id),
    (snapshot) => onData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null),
    (error) => onError?.(error),
  );
}

async function create<T extends object>(name: string, data: T): Promise<string> {
  assertReady();
  const ref = await addDoc(collection(db, name), { ...data, createdAt: now(), updatedAt: now() });
  return ref.id;
}

async function patch(name: string, id: string, data: Record<string, unknown>): Promise<void> {
  assertReady();
  await updateDoc(doc(db, name, id), { ...data, updatedAt: now() });
}

async function remove(name: string, id: string): Promise<void> {
  assertReady();
  await deleteDoc(doc(db, name, id));
}

/** إعادة ترتيب بالسحب: كتابة واحدة مجمّعة بدل طلب لكل عنصر. */
export async function reorder(name: string, orderedIds: string[]): Promise<void> {
  assertReady();
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => batch.update(doc(db, name, id), { order: index, updatedAt: now() }));
  await batch.commit();
}

/** أعلى ترتيب حالي + 1، حتى يُضاف الجديد في نهاية القائمة. */
async function nextOrder(name: string, constraints: QueryConstraint[] = []): Promise<number> {
  const snapshot = await getDocs(
    query(collection(db, name), ...constraints, orderBy("order", "desc"), fbLimit(1)),
  );
  if (snapshot.empty) return 0;
  return ((snapshot.docs[0].data().order as number) ?? 0) + 1;
}

// ------------------------------------------------------------ الطالبات

export function liveStudents(onData: (rows: Student[]) => void, onError?: (e: Error) => void) {
  return liveCollection<Student>(COL.students, [orderBy("order", "asc")], onData, onError);
}

export function liveStudent(id: string, onData: (row: Student | null) => void) {
  return liveDoc<Student>(COL.students, id, onData);
}

export async function createStudent(input: Partial<Student> & { name: string }): Promise<string> {
  assertReady();
  return create<Omit<Student, "id" | "createdAt" | "updatedAt">>(COL.students, {
    name: input.name,
    grade: input.grade ?? DEFAULT_SETTINGS.gradeLabel,
    bio: input.bio ?? "",
    photoUrl: input.photoUrl ?? null,
    photoPath: input.photoPath ?? null,
    themeId: input.themeId ?? DEFAULT_SETTINGS.defaultTheme,
    accentColor: input.accentColor ?? null,
    coverStyle: input.coverStyle ?? "arc",
    cardStyle: input.cardStyle ?? "clay",
    decorIcon: input.decorIcon ?? "Sparkles",
    hobbies: input.hobbies ?? [],
    visibility: input.visibility ?? "public",
    order: input.order ?? (await nextOrder(COL.students)),
    active: input.active ?? true,
  });
}

export const updateStudent = (id: string, data: Partial<Student>) => patch(COL.students, id, data);

/** حذف طالبة يزيل معها مشاريعها وإنجازاتها وتقييماتها — لا بيانات يتيمة. */
export async function deleteStudent(id: string): Promise<void> {
  assertReady();
  const batch = writeBatch(db);
  for (const name of [COL.projects, COL.achievements, COL.evaluations]) {
    const rows = await getDocs(query(collection(db, name), where("studentId", "==", id)));
    rows.forEach((row) => batch.delete(row.ref));
  }
  batch.delete(doc(db, COL.students, id));
  await batch.commit();
}

// ------------------------------------------------------------ المعلمات

export function liveTeachers(onData: (rows: Teacher[]) => void, onError?: (e: Error) => void) {
  return liveCollection<Teacher>(COL.teachers, [orderBy("order", "asc")], onData, onError);
}

export async function createTeacher(input: Partial<Teacher> & { name: string; email: string }) {
  assertReady();
  return create<Omit<Teacher, "id" | "createdAt" | "updatedAt">>(COL.teachers, {
    name: input.name,
    email: input.email.trim().toLowerCase(),
    subjectIds: input.subjectIds ?? [],
    photoUrl: input.photoUrl ?? null,
    photoPath: input.photoPath ?? null,
    active: input.active ?? true,
    order: input.order ?? (await nextOrder(COL.teachers)),
  });
}

export const updateTeacher = (id: string, data: Partial<Teacher>) => patch(COL.teachers, id, data);

/** حذف معلمة يفكّ ارتباطها بموادها أولًا حتى لا تبقى مادة بمعلمة محذوفة. */
export async function deleteTeacher(id: string): Promise<void> {
  assertReady();
  const batch = writeBatch(db);
  const owned = await getDocs(query(collection(db, COL.subjects), where("teacherId", "==", id)));
  owned.forEach((row) => batch.update(row.ref, { teacherId: null, updatedAt: now() }));
  batch.delete(doc(db, COL.teachers, id));
  await batch.commit();
}

// -------------------------------------------------------------- المواد

export function liveSubjects(onData: (rows: Subject[]) => void, onError?: (e: Error) => void) {
  return liveCollection<Subject>(COL.subjects, [orderBy("order", "asc")], onData, onError);
}

export async function createSubject(input: Partial<Subject> & { name: string }) {
  assertReady();
  return create<Omit<Subject, "id" | "createdAt" | "updatedAt">>(COL.subjects, {
    name: input.name,
    icon: input.icon ?? "BookOpen",
    tone: input.tone ?? "lilac",
    teacherId: input.teacherId ?? null,
    order: input.order ?? (await nextOrder(COL.subjects)),
    archived: input.archived ?? false,
  });
}

export const updateSubject = (id: string, data: Partial<Subject>) => patch(COL.subjects, id, data);
export const deleteSubject = (id: string) => remove(COL.subjects, id);

// ----------------------------------------------------------- المشاريع

export function liveProjectsByStudent(studentId: string, onData: (rows: Project[]) => void) {
  return liveCollection<Project>(
    COL.projects,
    [where("studentId", "==", studentId), orderBy("order", "asc")],
    onData,
  );
}

export function liveProjectsBySubjects(subjectIds: string[], onData: (rows: Project[]) => void) {
  if (subjectIds.length === 0) {
    onData([]);
    return () => {};
  }
  // Firestore يحدّ "in" بعشر قيم — عدد مواد المعلمة أقل من ذلك دائمًا،
  // ونقتطع احتياطًا بدل أن يفشل الاستعلام صامتًا.
  return liveCollection<Project>(
    COL.projects,
    [where("subjectId", "in", subjectIds.slice(0, 10))],
    (rows) => onData([...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  );
}

export async function createProject(input: Partial<Project> & { studentId: string; subjectId: string; title: string }) {
  assertReady();
  return create<Omit<Project, "id" | "createdAt" | "updatedAt">>(COL.projects, {
    studentId: input.studentId,
    subjectId: input.subjectId,
    title: input.title,
    description: input.description ?? "",
    date: input.date ?? new Date().toISOString().slice(0, 10),
    coverUrl: input.coverUrl ?? null,
    coverPath: input.coverPath ?? null,
    media: input.media ?? [],
    links: input.links ?? [],
    visibility: input.visibility ?? "public",
    order: input.order ?? (await nextOrder(COL.projects, [where("studentId", "==", input.studentId)])),
  });
}

export const updateProject = (id: string, data: Partial<Project>) => patch(COL.projects, id, data);

export async function deleteProject(id: string): Promise<void> {
  assertReady();
  const batch = writeBatch(db);
  const evaluations = await getDocs(query(collection(db, COL.evaluations), where("projectId", "==", id)));
  evaluations.forEach((row) => batch.delete(row.ref));
  batch.delete(doc(db, COL.projects, id));
  await batch.commit();
}

// --------------------------------------------------------- التقييمات

export function liveEvaluationsByStudent(studentId: string, onData: (rows: Evaluation[]) => void) {
  return liveCollection<Evaluation>(COL.evaluations, [where("studentId", "==", studentId)], onData);
}

/** تقييم واحد لكل (مشروع × معلمة): المعرّف مركّب فيصبح الحفظ idempotent. */
export async function saveEvaluation(
  input: Omit<Evaluation, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  assertReady();
  const id = `${input.projectId}_${input.teacherId}`;
  const ref = doc(db, COL.evaluations, id);
  const existing = await getDoc(ref);
  await setDoc(
    ref,
    {
      ...input,
      createdAt: existing.exists() ? (existing.data().createdAt as string) : now(),
      updatedAt: now(),
    },
    { merge: true },
  );
  return id;
}

export const deleteEvaluation = (id: string) => remove(COL.evaluations, id);

// -------------------------------------------------- الإنجازات والشهادات

export function liveAchievements(studentId: string, onData: (rows: Achievement[]) => void) {
  return liveCollection<Achievement>(
    COL.achievements,
    [where("studentId", "==", studentId), orderBy("order", "asc")],
    onData,
  );
}

export async function createAchievement(
  input: Partial<Achievement> & { studentId: string; title: string; kind: Achievement["kind"] },
) {
  assertReady();
  return create<Omit<Achievement, "id" | "createdAt" | "updatedAt">>(COL.achievements, {
    studentId: input.studentId,
    kind: input.kind,
    title: input.title,
    description: input.description ?? "",
    date: input.date ?? new Date().toISOString().slice(0, 10),
    imageUrl: input.imageUrl ?? null,
    imagePath: input.imagePath ?? null,
    visibility: input.visibility ?? "public",
    order: input.order ?? (await nextOrder(COL.achievements, [where("studentId", "==", input.studentId)])),
  });
}

export const updateAchievement = (id: string, data: Partial<Achievement>) =>
  patch(COL.achievements, id, data);
export const deleteAchievement = (id: string) => remove(COL.achievements, id);

// ------------------------------------------------------------ الإعدادات

export function liveSettings(onData: (row: Settings) => void): Unsubscribe {
  return liveDoc<Settings>(COL.settings, SETTINGS_DOC_ID, (row) =>
    onData({ ...DEFAULT_SETTINGS, ...(row ?? {}) }),
  );
}

export async function saveSettings(data: Partial<Settings>): Promise<void> {
  assertReady();
  await setDoc(doc(db, COL.settings, SETTINGS_DOC_ID), { ...data, updatedAt: now() }, { merge: true });
}

// ------------------------------------------------------------ المستخدمات

export function liveUsers(onData: (rows: UserDoc[]) => void, onError?: (e: Error) => void) {
  return liveCollection<UserDoc>(COL.users, [], onData, onError);
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  if (!isFirebaseUsable) return null;
  const snapshot = await getDoc(doc(db, COL.users, uid));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as UserDoc) : null;
}

export async function saveUserDoc(uid: string, data: Partial<UserDoc>): Promise<void> {
  assertReady();
  await setDoc(doc(db, COL.users, uid), { ...data, createdAt: data.createdAt ?? now() }, { merge: true });
}

export const deleteUserDoc = (uid: string) => remove(COL.users, uid);

// ------------------------------------------------------------ سجل النشاط

export function liveActivity(onData: (rows: ActivityLog[]) => void, onError?: (e: Error) => void) {
  return liveCollection<ActivityLog>(
    COL.activity,
    [orderBy("at", "desc"), fbLimit(40)],
    onData,
    onError,
  );
}

/** تسجيل النشاط لا يجوز أن يُفشل العملية الأصلية، فأخطاؤه تُبتلع عمدًا. */
export async function logActivity(
  kind: string,
  message: string,
  actorName: string,
  actorRole: Role | "guest",
): Promise<void> {
  if (!isFirebaseUsable) return;
  try {
    await addDoc(collection(db, COL.activity), { kind, message, actorName, actorRole, at: now() });
  } catch {
    /* السجل مساعد للإدارة، وليس جزءًا من نجاح الحفظ */
  }
}
