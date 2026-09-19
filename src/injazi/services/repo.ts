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
import { isMediaRef, mediaIdOf } from "@/injazi/services/mediaRef";
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
  StudentLink,
  Teacher,
  TeacherInvite,
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
  invites: `${ROOT}/invites`,
  studentLinks: `${ROOT}/studentLinks`,
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

/*
  أعلى ترتيب حالي + 1، حتى يُضاف الجديد في نهاية القائمة.
  ------------------------------------------------------------------
  الترتيب يُحسَب في المتصفّح لا في الاستعلام. السبب ليس تفضيلًا:
  Firestore يشترط فهرسًا مركّبًا لأي استعلام يجمع where على حقل مع
  orderBy على حقل آخر، وبدونه يفشل الاستعلام كله بـ FAILED_PRECONDITION
  ويعرض رابط إنشاء الفهرس. وهذا الاستدعاء يقع داخل «إضافة مشروع»
  و«إضافة شهادة» — ففشله يعني أن الحفظ لا يحدث إطلاقًا.

  والأخطر أن محاكي Firestore ينشئ الفهارس تلقائيًا ولا يشترط شيئًا،
  فهذا العطل لا يظهر في أي اختبار محلي مهما كثر — يظهر في الإنتاج وحده.
  عدد مستندات الطالبة عشرات، فحساب الأقصى في المتصفّح بلا كلفة.
*/
/*
  كل مراجع الصور داخل مستند واحد.
  ------------------------------------------------------------------
  الصورة هنا مستند مستقل في apps/injazi/media يحمل نسخة base64 كاملة
  (حتى ٧٠٠ كيلوبايت)، والمستند المرجعي لا يحمل إلا نصًّا قصيرًا.
  فحذف مشروع دون حذف صوره يترك تلك النسخ في قاعدة البيانات بلا أي
  طريق يصل إليها: مساحة محجوزة من حصة المدرسة المجانية إلى الأبد، ولا
  زرّ في المنصة كلها يحذفها. ولهذا يُجمَع المرجع من كل حقل قد يحمله.
  url وpath متطابقان على وجهة Firestore، فيُزال التكرار.
*/
function mediaRefsOf(data: Record<string, unknown>): string[] {
  const found: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === "string" && isMediaRef(value)) found.push(value);
  };
  add(data.coverUrl);
  add(data.coverPath);
  add(data.imageUrl);
  add(data.imagePath);
  add(data.photoUrl);
  add(data.photoPath);
  const attachments = Array.isArray(data.media) ? (data.media as Record<string, unknown>[]) : [];
  for (const item of attachments) {
    add(item?.url);
    add(item?.path);
  }
  return [...new Set(found)];
}

/*
  حذف صور مستند حُذف.
  ------------------------------------------------------------------
  خارج الدفعة عمدًا: قواعد الحماية قد ترفض حذف صورة رفعتها جلسة أخرى،
  ورفض واحد داخل writeBatch يُسقط الدفعة كلها — فيصير المشروع غير
  قابل للحذف إطلاقًا بسبب صورة. الترتيب هنا: يُحذف المستند المرجعي
  أولًا (وهو ما طلبته المستخدمة)، ثم تُنظَّف الصور بأفضل جهد.
*/
async function purgeMedia(references: string[]): Promise<void> {
  for (const reference of references) {
    try {
      await deleteDoc(doc(db, COL.media, mediaIdOf(reference)));
    } catch {
      /* صورة لجلسة أخرى أو محذوفة مسبقًا: لا توقف حذف صاحبها */
    }
  }
}

async function nextOrder(name: string, constraints: QueryConstraint[] = []): Promise<number> {
  const snapshot = await getDocs(query(collection(db, name), ...constraints));
  if (snapshot.empty) return 0;
  const highest = snapshot.docs.reduce(
    (max, row) => Math.max(max, (row.data().order as number) ?? 0),
    0,
  );
  return highest + 1;
}

// ------------------------------------------------------------ الطالبات

export function liveStudents(onData: (rows: Student[]) => void, onError?: (e: Error) => void) {
  return liveCollection<Student>(COL.students, [orderBy("order", "asc")], onData, onError);
}

export function liveStudent(
  id: string,
  onData: (row: Student | null) => void,
  onError?: (e: Error) => void,
) {
  return liveDoc<Student>(COL.students, id, onData, onError);
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

/**
 * حذف طالبة يزيل معها مشاريعها وإنجازاتها وتقييماتها وصورها ورابطها —
 * لا بيانات يتيمة. الرابط بالذات: مستنده هو السرّ والصلاحية معًا،
 * وبقاؤه بعد حذف صاحبته يعني جلسة تُمنح صلاحية على ملف لم يعد موجودًا.
 */
export async function deleteStudent(id: string): Promise<void> {
  assertReady();
  const student = await getDoc(doc(db, COL.students, id));
  const images = student.exists() ? mediaRefsOf(student.data()) : [];

  const batch = writeBatch(db);
  for (const name of [COL.projects, COL.achievements, COL.evaluations]) {
    const rows = await getDocs(query(collection(db, name), where("studentId", "==", id)));
    rows.forEach((row) => {
      images.push(...mediaRefsOf(row.data()));
      batch.delete(row.ref);
    });
  }
  const links = await getDocs(query(collection(db, COL.studentLinks), where("studentId", "==", id)));
  links.forEach((row) => batch.delete(row.ref));
  batch.delete(doc(db, COL.students, id));
  await batch.commit();

  await purgeMedia([...new Set(images)]);
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
  // وصورتها تُحذف معها كغيرها: كان هذا المسار وحده يترك نسخة base64
  // كاملة في مخزن الصور بلا أي مرجع إليها.
  const ref = doc(db, COL.teachers, id);
  const snapshot = await getDoc(ref);
  const images = snapshot.exists() ? mediaRefsOf(snapshot.data()) : [];

  const batch = writeBatch(db);
  const owned = await getDocs(query(collection(db, COL.subjects), where("teacherId", "==", id)));
  owned.forEach((row) => batch.update(row.ref, { teacherId: null, updatedAt: now() }));
  batch.delete(ref);
  await batch.commit();

  await purgeMedia(images);
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

export function liveProjectsByStudent(
  studentId: string,
  onData: (rows: Project[]) => void,
  onError?: (e: Error) => void,
) {
  // where + orderBy على حقلين مختلفين يستلزم فهرسًا مركّبًا؛ الترتيب هنا
  // في المتصفّح فلا يتوقّف عرض ملف الطالبة على فهرس لم يُنشأ.
  //
  // ومعالج الخطأ ليس زينة: بدونه كان رفض الصلاحية أو نقص الفهرس أو
  // انقطاع الشبكة يُنتج قائمة فارغة صامتة تقول «لا توجد مشاريع بعد» —
  // وهي أسوأ رسالة ممكنة، لأنها كذب يبدو طبيعيًا.
  return liveCollection<Project>(
    COL.projects,
    [where("studentId", "==", studentId)],
    (rows) => onData([...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))),
    onError,
  );
}

export function liveProjectsBySubjects(
  subjectIds: string[],
  onData: (rows: Project[]) => void,
  onError?: (e: Error) => void,
) {
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
    onError,
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
    archived: input.archived ?? false,
    order: input.order ?? (await nextOrder(COL.projects, [where("studentId", "==", input.studentId)])),
  });
}

export const updateProject = (id: string, data: Partial<Project>) => patch(COL.projects, id, data);

/*
  الأرشفة تفضَّل على الحذف: العمل المدرسي يُخفى أحيانًا ثم يُطلب مرة
  أخرى، والحذف لا رجعة فيه. الحذف يبقى متاحًا لمن يريده صراحةً.
*/
export const archiveProject = (id: string, archived: boolean) =>
  patch(COL.projects, id, { archived });

/** حذف مشروع يزيل معه تقييماته وصوره — لا نصّ ولا صورة ولا سجل يتيم. */
export async function deleteProject(id: string): Promise<void> {
  assertReady();
  const ref = doc(db, COL.projects, id);
  const snapshot = await getDoc(ref);
  const images = snapshot.exists() ? mediaRefsOf(snapshot.data()) : [];

  const batch = writeBatch(db);
  const evaluations = await getDocs(query(collection(db, COL.evaluations), where("projectId", "==", id)));
  evaluations.forEach((row) => batch.delete(row.ref));
  batch.delete(ref);
  await batch.commit();

  await purgeMedia(images);
}

// --------------------------------------------------------- التقييمات

export function liveEvaluationsByStudent(
  studentId: string,
  onData: (rows: Evaluation[]) => void,
  onError?: (e: Error) => void,
) {
  return liveCollection<Evaluation>(
    COL.evaluations,
    [where("studentId", "==", studentId)],
    onData,
    onError,
  );
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

export function liveAchievements(
  studentId: string,
  onData: (rows: Achievement[]) => void,
  onError?: (e: Error) => void,
) {
  return liveCollection<Achievement>(
    COL.achievements,
    [where("studentId", "==", studentId)],
    (rows) => onData([...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))),
    onError,
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
    // الحقول الاختيارية تُكتب بقيمة فارغة لا تُترك غائبة: الدالة تبني
    // قائمة حقول صريحة، فكل حقل جديد لا يُذكر هنا يسقط صامتًا عند
    // الإنشاء ويظهر فقط عند أول تعديل — عطل يصعب تفسيره للمستخدمة.
    issuer: input.issuer ?? "",
    category: input.category ?? "",
    fileUrl: input.fileUrl ?? null,
    fileName: input.fileName ?? "",
    visibility: input.visibility ?? "public",
    archived: input.archived ?? false,
    order: input.order ?? (await nextOrder(COL.achievements, [where("studentId", "==", input.studentId)])),
  });
}

export const updateAchievement = (id: string, data: Partial<Achievement>) =>
  patch(COL.achievements, id, data);

export const archiveAchievement = (id: string, archived: boolean) =>
  patch(COL.achievements, id, { archived });
/** وحذف الإنجاز يزيل صورته معه، للسبب نفسه. */
export async function deleteAchievement(id: string): Promise<void> {
  assertReady();
  const ref = doc(db, COL.achievements, id);
  const snapshot = await getDoc(ref);
  const images = snapshot.exists() ? mediaRefsOf(snapshot.data()) : [];
  await deleteDoc(ref);
  await purgeMedia(images);
}

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

/**
 * كتابة ملف صلاحيات.
 * createdAt يُكتب عند الإنشاء وحده: كان يُعاد ضبطه مع كل تعديل جزئي
 * تحت merge، فيضيع تاريخ أول دخول ويبدو كل حساب قديم جديدًا.
 */
export async function saveUserDoc(uid: string, data: Partial<UserDoc>): Promise<void> {
  assertReady();
  const ref = doc(db, COL.users, uid);
  const payload: Record<string, unknown> = { ...data };
  if (data.createdAt) {
    payload.createdAt = data.createdAt;
  } else {
    /*
      «تعذّرت القراءة» ليست «المستند غير موجود».
      ابتلاع الخطأ هنا كان سيُعيد ختم createdAt على ملف قائم عند أي
      انقطاع لحظي — وهو العطل نفسه الذي يعالجه هذا التغيير. فعند فشل
      القراءة لا يُكتب الحقل إطلاقًا: merge يُبقي القديم كما هو.
    */
    let exists: boolean | null = null;
    try {
      exists = (await getDoc(ref)).exists();
    } catch {
      exists = null;
    }
    if (exists === false) payload.createdAt = now();
  }
  await setDoc(ref, payload, { merge: true });
}

export const deleteUserDoc = (uid: string) => remove(COL.users, uid);

// ------------------------------------------------------- روابط المعلمات

/**
 * رمز الدعوة: ١٦ بايت من مولّد التشفير في المتصفح (١٢٨ بت) بصيغة
 * base64url. هو معرّف المستند وهو السر في آن واحد — ولذلك لا يُشتق من
 * الاسم ولا من الوقت ولا من Math.random: كلها قابلة للتخمين.
 */
export function newInviteCode(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function liveInvites(onData: (rows: TeacherInvite[]) => void, onError?: (e: Error) => void) {
  return liveCollection<TeacherInvite>(COL.invites, [], onData, onError);
}

export async function getInvite(code: string): Promise<TeacherInvite | null> {
  if (!isFirebaseUsable) return null;
  const snapshot = await getDoc(doc(db, COL.invites, code));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as TeacherInvite) : null;
}

/**
 * ينشئ رابطًا جديدًا لمعلمة. إن كان لها رابط سابق فالمتوقّع أن تحذفه
 * المشرفة أولًا — رابطان صالحان في آن واحد يجعلان الإلغاء وهمًا.
 */
export async function createInvite(input: {
  teacherId: string;
  teacherName: string;
  subjectIds: string[];
}): Promise<string> {
  assertReady();
  const code = newInviteCode();
  await setDoc(doc(db, COL.invites, code), {
    teacherId: input.teacherId,
    teacherName: input.teacherName,
    subjectIds: input.subjectIds,
    active: true,
    createdAt: now(),
    updatedAt: now(),
  });
  return code;
}

/** تحديث مواد الرابط حين تتغيّر مواد المعلمة — القواعد تقارن الاثنين. */
export const updateInvite = (code: string, data: Partial<TeacherInvite>) =>
  patch(COL.invites, code, data);

/** الإلغاء حذف لا تعطيل: مستند غير موجود يقطع الصلاحية بلا التباس. */
export const revokeInvite = (code: string) => remove(COL.invites, code);

// ------------------------------------------------------- روابط الطالبات

export function liveStudentLinks(
  onData: (rows: StudentLink[]) => void,
  onError?: (e: Error) => void,
) {
  return liveCollection<StudentLink>(COL.studentLinks, [], onData, onError);
}

export async function getStudentLink(code: string): Promise<StudentLink | null> {
  if (!isFirebaseUsable) return null;
  const snapshot = await getDoc(doc(db, COL.studentLinks, code));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as StudentLink) : null;
}

/** رابط واحد لكل طالبة: تفتحه هي وولي أمرها معًا. */
export async function createStudentLink(input: {
  studentId: string;
  studentName: string;
}): Promise<string> {
  assertReady();
  const code = newInviteCode();
  await setDoc(doc(db, COL.studentLinks, code), {
    studentId: input.studentId,
    studentName: input.studentName,
    active: true,
    createdAt: now(),
    updatedAt: now(),
  });
  return code;
}

export const updateStudentLink = (code: string, data: Partial<StudentLink>) =>
  patch(COL.studentLinks, code, data);

export const revokeStudentLink = (code: string) => remove(COL.studentLinks, code);

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
