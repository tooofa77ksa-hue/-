// طبقة وصول موحّدة لبيانات Firestore، تُستخدم من /teacher (قراءة/كتابة كاملة)
// ومن /play (قراءة الأسئلة المنشورة فقط عبر Security Rules).
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db, isFirebaseUsable } from "./firebase";
import { STARTER_QUESTIONS, STARTER_SET, STARTER_SET_ID } from "./starterData";
import type {
  AppUser,
  AudioSettings,
  Attempt,
  GameMode,
  GameSettings,
  Group,
  Question,
  QuestionSet,
  SkillKey,
  Skill,
  Student,
  TestSession,
} from "@/types/models";

// دوال بدل ثوابت على مستوى الوحدة عمدًا: استدعاء collection(db, ...) يقرأ
// خصائص db فورًا، وإن كانت db كائن Proxy بديل بسبب فشل تهيئة Firebase
// (انظر firebase.ts) فسيرمي الخطأ حينها. كثابت على مستوى الوحدة كان هذا
// يحدث أثناء استيراد الملف قبل أن يبدأ React بالعرض إطلاقًا (شاشة بيضاء
// لا يلتقطها أي ErrorBoundary) - كدالة، لا يُستدعى إلا داخل مكوّنات React
// (useEffect)، فيصبح الخطأ قابلًا للالتقاط بأمان.
const questionsCol = () => collection(db, "questions");
const questionSetsCol = () => collection(db, "questionSets");
const skillsCol = () => collection(db, "skills");
const studentsCol = () => collection(db, "students");
const groupsCol = () => collection(db, "groups");
const testSessionsCol = () => collection(db, "testSessions");
const attemptsCol = () => collection(db, "attempts");

function withId<T>(d: { id: string; data: () => any }): T {
  return { id: d.id, ...d.data() } as T;
}

/** Firestore يرفض أي حقل بقيمة undefined صراحة (خطأ عند addDoc/setDoc) -
 * حقول اختيارية مثل groupId/skill في TestSession/Attempt/Student تُكتب
 * أحيانًا بقيمة undefined ببساطة لأنها غير منطبقة (مثال: اختبار فردي بلا
 * مجموعة). هذه الدالة تحذف تلك المفاتيح تمامًا قبل الكتابة، فتُعامَل
 * كحقل غير موجود بدل أن تُسبِّب فشل الكتابة بالكامل. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as T;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
}

// ---------- المستخدم / الدور ----------
export async function getAppUser(uid: string): Promise<AppUser | null> {
  if (!isFirebaseUsable) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as AppUser;
}

// ---------- الأسئلة: قراءة حيّة للعبة (منشور + مفعّل فقط) ----------
// عمدًا بلا orderBy على مستوى Firestore: تجميع أكثر من شرط مساواة مع
// ترتيب على حقل مختلف يتطلب فهرسًا مركّبًا يدويًا (Composite Index) -
// بما أن حجم الأسئلة صغير (عشرات وليس آلاف)، الترتيب يتم في الذاكرة بعد
// الجلب، فلا حاجة لإنشاء أي فهرس يدويًا من Firebase Console إطلاقًا.
export function subscribePublishedQuestions(
  onData: (questions: Question[]) => void,
  gameMode?: string
): Unsubscribe {
  if (!isFirebaseUsable) {
    onData([]);
    return () => {};
  }
  const clauses = [where("published", "==", true), where("active", "==", true)];
  if (gameMode) clauses.push(where("gameMode", "==", gameMode));
  const q = query(questionsCol(), ...clauses);
  return onSnapshot(q, (snap) => {
    const questions = snap.docs.map((d) => withId<Question>(d));
    questions.sort((a, b) => a.order - b.order);
    onData(questions);
  });
}

// ---------- الأسئلة: إدارة كاملة للمعلمة ----------
export function subscribeAllQuestions(onData: (questions: Question[]) => void): Unsubscribe {
  if (!isFirebaseUsable) {
    onData([]);
    return () => {};
  }
  const q = query(questionsCol(), orderBy("order", "asc"));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => withId<Question>(d))));
}

export type QuestionInput = Omit<Question, "id" | "createdAt" | "updatedAt">;

export async function createQuestion(input: QuestionInput): Promise<string> {
  const ref = await addDoc(questionsCol(), {
    ...stripUndefined(input),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

export async function updateQuestion(id: string, patch: Partial<QuestionInput>): Promise<void> {
  await updateDoc(doc(db, "questions", id), { ...stripUndefined(patch), updatedAt: Date.now() });
}

export async function deleteQuestion(id: string): Promise<void> {
  await deleteDoc(doc(db, "questions", id));
}

export async function duplicateQuestion(q: Question, createdBy: string): Promise<string> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = q;
  return createQuestion({
    ...rest,
    published: false,
    order: q.order + 1,
    createdBy,
  });
}

export async function setPublished(id: string, published: boolean): Promise<void> {
  await updateQuestion(id, { published });
}

export async function setActive(id: string, active: boolean): Promise<void> {
  await updateQuestion(id, { active });
}

// ---------- مجموعات الأسئلة ----------
export function subscribeQuestionSets(onData: (sets: QuestionSet[]) => void): Unsubscribe {
  if (!isFirebaseUsable) {
    onData([]);
    return () => {};
  }
  const q = query(questionSetsCol(), orderBy("order", "asc"));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => withId<QuestionSet>(d))));
}

export type QuestionSetInput = Omit<QuestionSet, "id" | "createdAt" | "updatedAt">;

export async function createQuestionSet(input: QuestionSetInput): Promise<string> {
  const ref = await addDoc(questionSetsCol(), {
    ...input,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

export async function updateQuestionSet(
  id: string,
  patch: Partial<QuestionSetInput>
): Promise<void> {
  await updateDoc(doc(db, "questionSets", id), { ...patch, updatedAt: Date.now() });
}

export async function deleteQuestionSet(id: string): Promise<void> {
  await deleteDoc(doc(db, "questionSets", id));
}

// ---------- المهارات ----------
export async function fetchSkills(): Promise<Skill[]> {
  if (!isFirebaseUsable) return [];
  const snap = await getDocs(query(skillsCol(), orderBy("order", "asc")));
  return snap.docs.map((d) => withId<Skill>(d));
}

export function subscribeSkills(onData: (skills: Skill[]) => void): Unsubscribe {
  if (!isFirebaseUsable) {
    onData([]);
    return () => {};
  }
  const q = query(skillsCol(), orderBy("order", "asc"));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => withId<Skill>(d))));
}

// ---------- إعدادات اللعبة والصوت (وثيقة واحدة singleton) ----------
// دوال لنفس سبب questionsCol/questionSetsCol/skillsCol أعلاه.
const gameSettingsDoc = () => doc(db, "gameSettings", "default");
const audioSettingsDoc = () => doc(db, "audioSettings", "default");

export async function getGameSettings(): Promise<GameSettings | null> {
  if (!isFirebaseUsable) return null;
  const snap = await getDoc(gameSettingsDoc());
  return snap.exists() ? (snap.data() as GameSettings) : null;
}

export function subscribeGameSettings(onData: (s: GameSettings | null) => void): Unsubscribe {
  if (!isFirebaseUsable) {
    onData(null);
    return () => {};
  }
  return onSnapshot(gameSettingsDoc(), (snap) => onData(snap.exists() ? (snap.data() as GameSettings) : null));
}

export async function updateGameSettings(patch: Partial<GameSettings>): Promise<void> {
  await setDoc(gameSettingsDoc(), { ...patch, updatedAt: Date.now() }, { merge: true });
}

export async function getAudioSettings(): Promise<AudioSettings | null> {
  if (!isFirebaseUsable) return null;
  const snap = await getDoc(audioSettingsDoc());
  return snap.exists() ? (snap.data() as AudioSettings) : null;
}

export function subscribeAudioSettings(onData: (s: AudioSettings | null) => void): Unsubscribe {
  if (!isFirebaseUsable) {
    onData(null);
    return () => {};
  }
  return onSnapshot(audioSettingsDoc(), (snap) => onData(snap.exists() ? (snap.data() as AudioSettings) : null));
}

export async function updateAudioSettings(patch: Partial<AudioSettings>): Promise<void> {
  await setDoc(audioSettingsDoc(), { ...patch, updatedAt: Date.now() }, { merge: true });
}

/**
 * استيراد الأسئلة النموذجية (أستعد لأنافس) من متصفح المعلمة مباشرة بعد
 * تسجيل الدخول - بديل عن سكربت seed.ts لمن لا يستطيع تشغيل Admin SDK
 * (لا Terminal، لا مفتاح خدمة). يستخدم نفس مسار الكتابة الذي تختبره
 * قواعد الأمان لأي معلمة مصرَّح لها. آمن لإعادة التشغيل: يتخطى الاستيراد
 * كليًا إن كانت المجموعة موجودة أصلًا فلا يكرر الأسئلة ولا يطمس تعديلات
 * سابقة.
 */
export async function importStarterQuestions(createdBy: string): Promise<"imported" | "already-imported"> {
  const setRef = doc(db, "questionSets", STARTER_SET_ID);
  const existing = await getDoc(setRef);
  if (existing.exists()) return "already-imported";

  await setDoc(setRef, {
    ...STARTER_SET,
    order: 1,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy,
  });

  await Promise.all(
    STARTER_QUESTIONS.map((q, i) =>
      setDoc(doc(db, "questions", `sample-q-${String(i + 1).padStart(2, "0")}`), {
        ...q,
        questionSetId: STARTER_SET_ID,
        feedback: { correct: "ممتازة! إجابة صحيحة", incorrect: "حاولي مرة أخرى" },
        published: true,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy,
      })
    )
  );

  return "imported";
}

// ------------------------------------------------------------------
// الطالبات: الاسم فقط. تُدار حصرًا من /teacher (Security Rules تمنع أي
// وصول عام - انظر firestore.rules).
// ------------------------------------------------------------------
export function subscribeStudents(onData: (students: Student[]) => void): Unsubscribe {
  if (!isFirebaseUsable) {
    onData([]);
    return () => {};
  }
  const q = query(studentsCol(), orderBy("name", "asc"));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => withId<Student>(d))));
}

export type StudentInput = Omit<Student, "id" | "createdAt" | "updatedAt">;

export async function createStudent(input: StudentInput): Promise<string> {
  const ref = await addDoc(studentsCol(), {
    ...stripUndefined(input),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

export async function updateStudent(id: string, patch: Partial<StudentInput>): Promise<void> {
  await updateDoc(doc(db, "students", id), { ...stripUndefined(patch), updatedAt: Date.now() });
}

export async function deleteStudent(id: string): Promise<void> {
  await deleteDoc(doc(db, "students", id));
}

// ------------------------------------------------------------------
// المجموعات: تحوي فقط الاسم. عضوية الطالبات محفوظة على وثيقة الطالبة
// نفسها (Student.groupId) لا داخل المجموعة، لتفادي تكرار البيانات.
// ------------------------------------------------------------------
export function subscribeGroups(onData: (groups: Group[]) => void): Unsubscribe {
  if (!isFirebaseUsable) {
    onData([]);
    return () => {};
  }
  const q = query(groupsCol(), orderBy("name", "asc"));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => withId<Group>(d))));
}

export type GroupInput = Omit<Group, "id" | "createdAt" | "updatedAt">;

export async function createGroup(input: GroupInput): Promise<string> {
  const ref = await addDoc(groupsCol(), {
    ...input,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

export async function updateGroup(id: string, patch: Partial<GroupInput>): Promise<void> {
  await updateDoc(doc(db, "groups", id), { ...patch, updatedAt: Date.now() });
}

/** حذف مجموعة بدون حذف الطالبات: يفكّ ارتباط كل طالبة بها أولًا. */
export async function deleteGroup(id: string, memberStudentIds: string[]): Promise<void> {
  await Promise.all(
    memberStudentIds.map((sid) =>
      updateDoc(doc(db, "students", sid), { groupId: deleteField(), updatedAt: Date.now() })
    )
  );
  await deleteDoc(doc(db, "groups", id));
}

export async function moveStudentToGroup(studentId: string, groupId: string | undefined): Promise<void> {
  if (groupId) {
    await updateStudent(studentId, { groupId });
  } else {
    await updateDoc(doc(db, "students", studentId), { groupId: deleteField(), updatedAt: Date.now() });
  }
}

// ------------------------------------------------------------------
// جلسات الاختبار: تُنشئها المعلمة فقط، تُشارك برابط يحوي معرّف الجلسة.
// انظر firestore.rules: get متاح للجميع، أما list فللمعلمة فقط - لذلك لا
// تُستخدم subscribeTestSessions إلا من /teacher.
// ------------------------------------------------------------------
export function subscribeTestSessions(onData: (sessions: TestSession[]) => void): Unsubscribe {
  if (!isFirebaseUsable) {
    onData([]);
    return () => {};
  }
  const q = query(testSessionsCol(), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => withId<TestSession>(d))));
}

export type TestSessionInput = Omit<TestSession, "id" | "createdAt">;

export async function createTestSession(input: TestSessionInput): Promise<string> {
  const ref = await addDoc(testSessionsCol(), {
    ...stripUndefined(input),
    createdAt: Date.now(),
  });
  return ref.id;
}

/** جلب جلسة بمعرّفها المباشر - هذا هو "فتح رابط الاختبار" من طرف الطالبة،
 * لا يتطلب تسجيل دخول (get مسموح للجميع حسب القواعد). */
export async function getTestSession(sessionId: string): Promise<TestSession | null> {
  if (!isFirebaseUsable) return null;
  const snap = await getDoc(doc(db, "testSessions", sessionId));
  return snap.exists() ? withId<TestSession>(snap) : null;
}

export async function setSessionActive(sessionId: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, "testSessions", sessionId), { active });
}

export async function deleteTestSession(sessionId: string): Promise<void> {
  await deleteDoc(doc(db, "testSessions", sessionId));
}

// ------------------------------------------------------------------
// النتائج (attempts): تُكتب من طرف الطالبة عند إنهاء اختبار رسمي مرتبط
// بجلسة (وليس اللعب العام - انظر AttemptAnswer/Attempt في models.ts).
// قواعد الأمان تتحقق من أن الجلسة موجودة ونشطة وأن الطالبة من مشاركيها.
// ------------------------------------------------------------------
export type AttemptInput = Omit<Attempt, "id" | "createdAt">;

// معرّف حتمي (لا عشوائي) لكل محاولة: نفس الطالبة في نفس الجلسة تكتب دائمًا
// على نفس المستند. قواعد الأمان (firestore.rules) تفرض هذا الشكل بالضبط
// وتعتمد عليه: أي محاولة ثانية لنفس الطالبة تصبح "تعديلًا" لا "إنشاءً" من
// منظور Firestore، فتُرفض تلقائيًا (لا يمكن إلا للمعلمة التعديل) - يمنع
// إغراق القاعدة بمحاولات متكررة لنفس الجلسة.
function attemptDocId(sessionId: string, studentId: string): string {
  return `${sessionId}_${studentId}`;
}

export async function createAttempt(input: AttemptInput): Promise<string> {
  const id = attemptDocId(input.sessionId, input.studentId);
  await setDoc(doc(attemptsCol(), id), {
    ...stripUndefined(input),
    createdAt: Date.now(),
  });
  return id;
}

export function subscribeAttempts(onData: (attempts: Attempt[]) => void): Unsubscribe {
  if (!isFirebaseUsable) {
    onData([]);
    return () => {};
  }
  const q = query(attemptsCol(), orderBy("completedAt", "desc"));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => withId<Attempt>(d))));
}

export async function deleteAttempt(id: string): Promise<void> {
  await deleteDoc(doc(db, "attempts", id));
}

/** يبني قائمة الأسئلة الفعلية لجلسة اختبار وفق معرّفاتها المحفوظة فيها،
 * محافظًا على نفس ترتيب questionIds. تُستخدم من شاشة لعب الجلسة الرسمية. */
export async function getQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (!isFirebaseUsable || ids.length === 0) return [];
  const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, "questions", id))));
  const byId = new Map<string, Question>();
  snaps.forEach((s) => {
    if (s.exists()) byId.set(s.id, withId<Question>(s));
  });
  return ids.map((id) => byId.get(id)).filter((q): q is Question => Boolean(q));
}

export type { GameMode, SkillKey };

export { serverTimestamp };
