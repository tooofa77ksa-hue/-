import { collection, onSnapshot, query, where, type Unsubscribe } from "firebase/firestore";
import { db } from "./firebase";

/** عنصر يصبح seen=false فقط عند تقييم معلمة جديد - عدّه يعادل عدد
 * التنبيهات غير المقروءة لهذه الطالبة، بلا حاجة لفهرس مركّب (حقل واحد). */
export function subscribeUnseenCount(studentId: string, cb: (count: number) => void): Unsubscribe {
  const q = query(collection(db, "students", studentId, "items"), where("seen", "==", false));
  return onSnapshot(q, (snap) => cb(snap.size));
}
