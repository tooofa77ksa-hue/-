/*
  مواد الصف الرابع الابتدائي
  ------------------------------------------------------------------
  لكل مادة جسم صلصالي ولون من العائلة نفسها — بحيث تُعرَف المادة من
  شكلها ولونها قبل قراءة اسمها، وهو ما يحتاجه قارئ في التاسعة.
  الاقتران (مادة ↔ جسم ↔ لون) يُعرَّف هنا فقط ولا يُكرَّر في أي شاشة.
*/
import type { ClayName, ClayTone } from "@/injazi/components/ClayObject";

export type Subject = {
  id: string;
  name: string;
  /** السؤال الذي يفتح الحكاية — يظهر في البطاقة وفي شاشة الكتابة. */
  prompt: string;
  object: ClayName;
  tone: ClayTone;
  /** عدد النجوم الذي يُتوَّج عنده إنجاز المادة. */
  starGoal: number;
};

export const SUBJECTS: Subject[] = [
  {
    id: "lughati",
    name: "لغتي",
    prompt: "احكِ عن نصٍّ قرأتِه أو جملةٍ كتبتِها",
    object: "pencil",
    tone: "lilac",
    starGoal: 5,
  },
  {
    id: "riyadiyat",
    name: "الرياضيات",
    prompt: "احكِ عن مسألةٍ حللتِها بنفسكِ",
    object: "calculator",
    tone: "sky",
    starGoal: 5,
  },
  {
    id: "uloom",
    name: "العلوم",
    prompt: "احكِ عن تجربةٍ جرّبتِها ولاحظتِ نتيجتها",
    object: "microscope",
    tone: "mint",
    starGoal: 5,
  },
  {
    id: "islamiyya",
    name: "الدراسات الإسلامية",
    prompt: "احكِ عن آيةٍ أو حديثٍ حفظتِه وفهمتِ معناه",
    object: "book",
    tone: "apricot",
    starGoal: 5,
  },
  {
    id: "ijtimaiyya",
    name: "الدراسات الاجتماعية",
    prompt: "احكِ عن مكانٍ أو حدثٍ تعرّفتِ عليه",
    object: "globe",
    tone: "rose",
    starGoal: 5,
  },
  {
    id: "nashat",
    name: "النشاط المدرسي",
    prompt: "احكِ عن نشاطٍ شاركتِ فيه مع زميلاتكِ",
    object: "bag",
    tone: "lemon",
    starGoal: 5,
  },
];

export function findSubject(id: string | undefined): Subject | undefined {
  return SUBJECTS.find((subject) => subject.id === id);
}
