/*
  الإدخال الأول — بضغطة واحدة.
  ------------------------------------------------------------------
  بدل ثماني تعبئات للطالبات وخمس للمعلمات وخمس للمواد (١٨ نموذجًا)،
  تُنشأ كلها دفعة واحدة بالأسماء المتّفق عليها، وكل مادة مرتبطة
  بمعلمتها مباشرة.

  ثلاثة قيود يفرضها المكوّن على نفسه:
    • لا يظهر إلا والمنصة فارغة تمامًا (لا طالبة ولا مادة ولا معلمة)،
      فلا يمكن استدعاؤه بالخطأ بعد بدء الاستخدام فيُضاعف البيانات.
    • يعيد التحقّق من الفراغ لحظة الضغط لا لحظة العرض: بين الاثنين قد
      تكون مشرفة أخرى أدخلت البيانات من جهاز آخر.
    • لا يُنشئ حسابات دخول للمعلمات — تُنشأ لاحقًا ببريد كل معلمة
      الحقيقي، ولا يجوز أن تُخترع هنا.

  الكتابة من العميل بصلاحية المشرفة، وقواعد الأمان هي التي تسمح بها؛
  لا مسار خلفي ولا مفتاح خدمة.
*/
import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { Notice } from "@/injazi/ui/primitives";
import { createStudent, createSubject, createTeacher, logActivity } from "@/injazi/services/repo";
import { showToast } from "@/injazi/lib/toast";
import type { Student, Subject, Teacher, UserDoc } from "@/injazi/types/models";

/** الترتيب هو ترتيب ظهورهنّ في المعرض. */
const STUDENTS = [
  { name: "نادين الشمراني", themeId: "sunny", decorIcon: "Star" },
  { name: "لانا الشهري", themeId: "sky", decorIcon: "Rocket" },
  { name: "تالا القريقري", themeId: "lavender", decorIcon: "Sparkles" },
  { name: "ندى السهلي", themeId: "mint", decorIcon: "Leaf" },
  { name: "جنى الشريف", themeId: "peach", decorIcon: "Music" },
  { name: "ريتاج عواجي", themeId: "sunny", decorIcon: "Palette" },
  { name: "روز الحمراني", themeId: "pink", decorIcon: "Heart" },
  { name: "مريم باشماخ", themeId: "lavender", decorIcon: "Flower2" },
];

const SUBJECTS = [
  { name: "الرياضيات", icon: "Calculator", tone: "sky", teacher: "سميرة الشريف" },
  { name: "لغتي", icon: "PenLine", tone: "lilac", teacher: "دلال السناني" },
  { name: "العلوم", icon: "Microscope", tone: "mint", teacher: "حنان" },
  { name: "الدراسات الإسلامية", icon: "BookOpen", tone: "apricot", teacher: "بدرية السفري" },
  { name: "English", icon: "Languages", tone: "rose", teacher: "عائشة" },
];

const GRADE = "الصف الرابع / 2";

type Props = {
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  profile: UserDoc | null;
};

export function FirstRunImport({ students, teachers, subjects, profile }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const empty = students.length === 0 && teachers.length === 0 && subjects.length === 0;
  if (!empty || done) return null;

  async function run() {
    if (busy) return;
    // الفحص الثاني: العرض قديم بطبيعته، والضغط هو اللحظة الحقيقية.
    if (students.length || teachers.length || subjects.length) {
      setError("توجد بيانات بالفعل — حدّثي الصفحة.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      for (const [index, student] of STUDENTS.entries()) {
        await createStudent({
          name: student.name,
          grade: GRADE,
          themeId: student.themeId,
          decorIcon: student.decorIcon,
          order: index,
        });
      }

      // المعلمة قبل مادتها: المادة تحمل معرّف معلمتها لا اسمها.
      for (const [index, subject] of SUBJECTS.entries()) {
        const teacherId = await createTeacher({
          name: subject.teacher,
          email: "",
          order: index,
        });
        await createSubject({
          name: subject.name,
          icon: subject.icon,
          tone: subject.tone,
          teacherId,
          order: index,
        });
      }

      await logActivity(
        "data.import",
        `أدخلت ${profile?.name ?? "المشرفة"} البيانات الأولى: ${STUDENTS.length} طالبات و${SUBJECTS.length} مواد`,
        profile?.name ?? "المشرفة",
        profile?.role ?? "admin",
      );

      setDone(true);
      showToast("تمّ إدخال البيانات الأولى");
    } catch (err) {
      setError(
        err instanceof Error
          ? `تعذّر الإدخال: ${err.message}`
          : "تعذّر الإدخال. تأكّدي من اتصالك وأعيدي المحاولة.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="iz-firstrun">
      <span className="iz-firstrun__mark" aria-hidden="true">
        <Sparkles size={26} strokeWidth={2.2} />
      </span>

      <div className="iz-firstrun__text">
        <h2 className="iz-firstrun__title">ابدئي بضغطة واحدة</h2>
        <p className="iz-firstrun__body">
          المنصة فارغة. اضغطي الزر لتُدخَل الطالبات الثماني والمواد الخمس ومعلماتهنّ
          دفعة واحدة — ثم عدّلي ما شئت.
        </p>

        <ul className="iz-firstrun__list">
          <li><Check size={15} strokeWidth={2.6} /> ٨ طالبات بأسمائهنّ وثيماتهنّ</li>
          <li><Check size={15} strokeWidth={2.6} /> ٥ مواد، كل واحدة مرتبطة بمعلمتها</li>
          <li><Check size={15} strokeWidth={2.6} /> ٥ معلمات (حسابات الدخول تُنشأ لاحقًا ببريد كل معلمة)</li>
        </ul>

        {error && <Notice tone="danger">{error}</Notice>}

        <ClayButton onClick={run} loading={busy} icon={<Sparkles size={17} strokeWidth={2.4} />}>
          إدخال البيانات الأولى
        </ClayButton>
      </div>
    </section>
  );
}
