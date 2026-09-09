// طبقة وصول موحّدة لبيانات Firestore، تُستخدم من /teacher (قراءة/كتابة كاملة)
// ومن /play (قراءة الأسئلة المنشورة فقط عبر Security Rules).
import {
  addDoc,
  collection,
  deleteDoc,
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
  GameSettings,
  Question,
  QuestionSet,
  Skill,
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

function withId<T>(d: { id: string; data: () => any }): T {
  return { id: d.id, ...d.data() } as T;
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
    ...input,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

export async function updateQuestion(id: string, patch: Partial<QuestionInput>): Promise<void> {
  await updateDoc(doc(db, "questions", id), { ...patch, updatedAt: Date.now() });
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

export { serverTimestamp };
