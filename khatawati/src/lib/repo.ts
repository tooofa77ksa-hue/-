import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { AppUser, ItemSection, PortfolioItem, Student, Subject } from "@/types/models";

const studentsCol = () => collection(db, "students");
const studentDoc = (studentId: string) => doc(db, "students", studentId);
const itemsCol = (studentId: string) => collection(db, "students", studentId, "items");
const itemDoc = (studentId: string, itemId: string) => doc(db, "students", studentId, "items", itemId);

export async function getAppUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<AppUser, "uid">) };
}

export async function getStudent(studentId: string): Promise<Student | null> {
  const snap = await getDoc(studentDoc(studentId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Student, "id">) };
}

export function subscribeStudent(studentId: string, cb: (student: Student | null) => void): Unsubscribe {
  return onSnapshot(studentDoc(studentId), (snap) => {
    cb(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Student, "id">) } : null);
  });
}

export async function listAllStudents(): Promise<Student[]> {
  const snap = await getDocs(query(studentsCol(), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) }));
}

export interface StudentProfilePatch {
  nickname: string;
  color: string;
  photoUrl: string | null;
  bio: string;
  interests: string;
}

export async function updateStudentProfile(studentId: string, patch: StudentProfilePatch): Promise<void> {
  const current = await getStudent(studentId);
  if (!current) throw new Error("الطالبة غير موجودة");
  await setDoc(
    studentDoc(studentId),
    {
      name: current.name,
      familyUid: current.familyUid,
      createdAt: current.createdAt,
      nickname: patch.nickname,
      color: patch.color,
      photoUrl: patch.photoUrl,
      bio: patch.bio,
      interests: patch.interests,
      updatedAt: Date.now(),
    },
    { merge: false }
  );
}

export function subscribeItems(
  studentId: string,
  section: ItemSection | null,
  cb: (items: PortfolioItem[]) => void
): Unsubscribe {
  const base = section
    ? query(itemsCol(studentId), where("section", "==", section), orderBy("createdAt", "desc"))
    : query(itemsCol(studentId), orderBy("createdAt", "desc"));
  return onSnapshot(base, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PortfolioItem, "id">) })));
  });
}

export async function addItem(
  studentId: string,
  input: { section: ItemSection; kind: "image" | "link"; url: string; title: string }
): Promise<void> {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await setDoc(itemDoc(studentId, id), {
    section: input.section,
    kind: input.kind,
    url: input.url,
    title: input.title,
    createdAt: Date.now(),
    rating: null,
    seen: true,
  });
}

export async function deleteItem(studentId: string, itemId: string): Promise<void> {
  await deleteDoc(itemDoc(studentId, itemId));
}

export async function markItemSeen(studentId: string, itemId: string): Promise<void> {
  await updateDoc(itemDoc(studentId, itemId), { seen: true });
}

export async function rateItem(
  studentId: string,
  itemId: string,
  input: { stars: number; comment: string },
  teacherUid: string,
  subject: Subject
): Promise<void> {
  await updateDoc(itemDoc(studentId, itemId), {
    rating: {
      stars: input.stars,
      comment: input.comment,
      ratedByUid: teacherUid,
      ratedBySubject: subject,
      ratedAt: Date.now(),
    },
    seen: false,
  });
}
