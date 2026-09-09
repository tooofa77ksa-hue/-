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
import { db } from "./firebase";
import type {
  AppUser,
  AudioSettings,
  GameSettings,
  Question,
  QuestionSet,
  Skill,
} from "@/types/models";

const questionsCol = collection(db, "questions");
const questionSetsCol = collection(db, "questionSets");
const skillsCol = collection(db, "skills");

function withId<T>(d: { id: string; data: () => any }): T {
  return { id: d.id, ...d.data() } as T;
}

// ---------- المستخدم / الدور ----------
export async function getAppUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as AppUser;
}

// ---------- الأسئلة: قراءة حيّة للعبة (منشور + مفعّل فقط) ----------
export function subscribePublishedQuestions(
  onData: (questions: Question[]) => void,
  gameMode?: string
): Unsubscribe {
  const clauses = [where("published", "==", true), where("active", "==", true)];
  if (gameMode) clauses.push(where("gameMode", "==", gameMode));
  const q = query(questionsCol, ...clauses, orderBy("order", "asc"));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => withId<Question>(d)));
  });
}

// ---------- الأسئلة: إدارة كاملة للمعلمة ----------
export function subscribeAllQuestions(onData: (questions: Question[]) => void): Unsubscribe {
  const q = query(questionsCol, orderBy("order", "asc"));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => withId<Question>(d))));
}

export type QuestionInput = Omit<Question, "id" | "createdAt" | "updatedAt">;

export async function createQuestion(input: QuestionInput): Promise<string> {
  const ref = await addDoc(questionsCol, {
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
  const q = query(questionSetsCol, orderBy("order", "asc"));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => withId<QuestionSet>(d))));
}

export type QuestionSetInput = Omit<QuestionSet, "id" | "createdAt" | "updatedAt">;

export async function createQuestionSet(input: QuestionSetInput): Promise<string> {
  const ref = await addDoc(questionSetsCol, {
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
  const snap = await getDocs(query(skillsCol, orderBy("order", "asc")));
  return snap.docs.map((d) => withId<Skill>(d));
}

export function subscribeSkills(onData: (skills: Skill[]) => void): Unsubscribe {
  const q = query(skillsCol, orderBy("order", "asc"));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => withId<Skill>(d))));
}

// ---------- إعدادات اللعبة والصوت (وثيقة واحدة singleton) ----------
const GAME_SETTINGS_DOC = doc(db, "gameSettings", "default");
const AUDIO_SETTINGS_DOC = doc(db, "audioSettings", "default");

export async function getGameSettings(): Promise<GameSettings | null> {
  const snap = await getDoc(GAME_SETTINGS_DOC);
  return snap.exists() ? (snap.data() as GameSettings) : null;
}

export function subscribeGameSettings(onData: (s: GameSettings | null) => void): Unsubscribe {
  return onSnapshot(GAME_SETTINGS_DOC, (snap) => onData(snap.exists() ? (snap.data() as GameSettings) : null));
}

export async function updateGameSettings(patch: Partial<GameSettings>): Promise<void> {
  await setDoc(GAME_SETTINGS_DOC, { ...patch, updatedAt: Date.now() }, { merge: true });
}

export async function getAudioSettings(): Promise<AudioSettings | null> {
  const snap = await getDoc(AUDIO_SETTINGS_DOC);
  return snap.exists() ? (snap.data() as AudioSettings) : null;
}

export function subscribeAudioSettings(onData: (s: AudioSettings | null) => void): Unsubscribe {
  return onSnapshot(AUDIO_SETTINGS_DOC, (snap) => onData(snap.exists() ? (snap.data() as AudioSettings) : null));
}

export async function updateAudioSettings(patch: Partial<AudioSettings>): Promise<void> {
  await setDoc(AUDIO_SETTINGS_DOC, { ...patch, updatedAt: Date.now() }, { merge: true });
}

export { serverTimestamp };
