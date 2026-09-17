/*
  بوابة الطالبة بالرابط — /s/{code}
  ------------------------------------------------------------------
  رابط واحد تفتحه الطالبة وولي أمرها معًا، فيصلان إلى ملفها مباشرة بلا
  بريد ولا كلمة مرور. الرمز في الرابط هو الإثبات، والخادم هو الذي
  يتحقّق منه — هذه الصفحة تعرض النتيجة لا أكثر.

  لا يُعرض الرمز في أي نص ولا في عنوان بديل، حتى لا ينتهي في لقطة شاشة.
*/
import { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ClayObject } from "@/injazi/components/ClayObject";
import { ClayButton } from "@/injazi/components/ClayButton";
import { EmptyState } from "@/injazi/components/EmptyState";
import { signInWithStudentLink } from "@/injazi/services/auth";

export function StudentLinkEntry() {
  const { code } = useParams<{ code: string }>();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  // الوعد محفوظ لا التشغيل ممنوع: StrictMode يفكّ التركيب ثم يعيده،
  // ومنع التشغيل الثاني وحده يضيّع النتيجة.
  const attempt = useRef<Promise<{ studentIds?: string[] }> | null>(null);

  useEffect(() => {
    if (!code) {
      setReason("الرابط ناقص.");
      return;
    }
    attempt.current ??= signInWithStudentLink(code);

    let live = true;
    attempt.current.then(
      (profile) => {
        if (!live) return;
        const id = profile.studentIds?.[0];
        if (id) setStudentId(id);
        else setReason("الرابط لا يشير إلى ملف طالبة.");
      },
      (error: unknown) => {
        if (!live) return;
        setReason(error instanceof Error ? error.message : "تعذّر فتح الرابط.");
      },
    );

    return () => {
      live = false;
    };
  }, [code]);

  if (studentId) return <Navigate to={`/student/${studentId}`} replace />;

  if (reason) {
    return (
      <div className="iz-page iz-page--narrow">
        <EmptyState
          object="star"
          tone="apricot"
          title="تعذّر فتح الرابط"
          body={reason}
          action={
            <ClayButton to="/" size="lg">
              العودة للرئيسية
            </ClayButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="iz-page iz-center">
      <ClayObject name="star" tone="gold" size={72} />
      <p className="iz-field__meter">جارٍ فتح ملفك…</p>
    </div>
  );
}
