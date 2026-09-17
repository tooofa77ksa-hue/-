/*
  بوابة المعلمة بالرابط — /t/{code}
  ------------------------------------------------------------------
  لا نموذج ولا بريد ولا كلمة مرور: تفتح المعلمة رابطها فتدخل. الرمز في
  الرابط هو الإثبات، والقواعد الأمنية هي التي تتحقّق منه على الخادم؛ هذه
  الصفحة تعرض النتيجة لا أكثر.

  حالتان فقط تُعرضان: «جارٍ الفتح» ثم إما الانتقال إلى البوابة أو سبب
  واضح للفشل. لا نعرض الرمز نفسه في أي نص ولا نضعه في عنوان بديل، حتى
  لا ينتهي في لقطة شاشة تُرسَل في مجموعة.
*/
import { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ClayObject } from "@/injazi/components/ClayObject";
import { ClayButton } from "@/injazi/components/ClayButton";
import { EmptyState } from "@/injazi/components/EmptyState";
import { signInWithInvite } from "@/injazi/services/auth";

export function TeacherInvite() {
  const { code } = useParams<{ code: string }>();
  const [state, setState] = useState<"working" | "done" | "failed">("working");
  const [reason, setReason] = useState("");
  /*
    StrictMode يركّب المكوّن ثم يفكّه ثم يعيد تركيبه في التطوير. الدخول
    عملية كتابة فلا يصحّ تكرارها (هويتان مجهولتان لفتحة واحدة)، لكن منع
    التشغيل الثاني وحده يضيّع النتيجة: تفكيك التركيب الأول يلغي متابعته.
    فنحفظ الوعد نفسه — يُنفَّذ مرة، ويتابعه كل تركيب.
  */
  const attempt = useRef<Promise<unknown> | null>(null);

  useEffect(() => {
    if (!code) {
      setReason("الرابط ناقص.");
      setState("failed");
      return;
    }

    attempt.current ??= signInWithInvite(code);

    let live = true;
    attempt.current.then(
      () => {
        if (live) setState("done");
      },
      (error: unknown) => {
        if (!live) return;
        setReason(error instanceof Error ? error.message : "تعذّر فتح الرابط.");
        setState("failed");
      },
    );

    return () => {
      live = false;
    };
  }, [code]);

  if (state === "done") return <Navigate to="/teacher" replace />;

  if (state === "failed") {
    return (
      <div className="iz-page iz-page--narrow">
        <EmptyState
          object="book"
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
      <p className="iz-field__meter">جارٍ فتح بوابتك…</p>
    </div>
  );
}
