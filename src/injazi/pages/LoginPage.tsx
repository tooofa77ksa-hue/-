/*
  صفحة الدخول.
  بوابة واحدة لكل الأدوار: النظام يقرأ الدور من users/{uid} بعد الدخول
  ويوجّه — ثلاث صفحات دخول بثلاثة منطقٍ كانت ستعني ثلاثة أماكن للخطأ.
  المسار الذي جاءت منه المستخدمة يُحفظ ويُعاد إليه بعد الدخول.
*/
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, LogIn, Mail } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { ClayObject } from "@/injazi/components/ClayObject";
import { Field, Notice, TextInput } from "@/injazi/ui/primitives";
import { resetPassword, signIn } from "@/injazi/services/auth";
import { useSession, useSettings } from "@/injazi/hooks/useLive";
import { showToast } from "@/injazi/lib/toast";
import { pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";
import type { Role } from "@/injazi/types/models";

const HOME_FOR: Record<Role, string> = {
  admin: "/admin",
  teacher: "/teacher",
  parent: "/",
  viewer: "/",
};

export function LoginPage({ intent = "parent" }: { intent?: Role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const { profile, loading } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;

  // مسجّلة الدخول أصلًا؟ لا تُعرض عليها صفحة دخول من جديد.
  useEffect(() => {
    if (!loading && profile) navigate(from ?? HOME_FOR[profile.role], { replace: true });
  }, [loading, profile, from, navigate]);

  const copy =
    intent === "teacher"
      ? { title: "بوابة المعلمات", hint: "ادخلي لعرض مادتكِ وتقييم مشاريع الطالبات." }
      : intent === "admin"
        ? { title: "لوحة الإدارة", hint: "ادخلي لإدارة الطالبات والمعلمات والمواد والإعدادات." }
        : { title: "دخول ولي الأمر", hint: "ادخلي لتعديل ملف ابنتكِ وإضافة مشاريعها." };

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const account = await signIn(email, password);
      if (!account) {
        setError("لا يوجد ملف صلاحيات لهذا الحساب. راجعي إدارة المنصة.");
        return;
      }
      showToast(`أهلًا ${account.name}`);
      navigate(from ?? HOME_FOR[account.role], { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تسجيل الدخول.");
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email.trim()) {
      setError("اكتبي بريدكِ الإلكتروني أولًا ثم اضغطي «نسيت كلمة المرور».");
      return;
    }
    setResetting(true);
    setError(null);
    try {
      await resetPassword(email);
      showToast("أُرسل رابط إعادة التعيين إلى بريدكِ", "info");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إرسال الرابط.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <motion.div
      className="iz-page iz-page--narrow iz-login"
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <motion.div className="iz-login__card" variants={staggerContainer}>
        <motion.div className="iz-login__mark" variants={riseItem}>
          <ClayObject name={intent === "admin" ? "crown" : intent === "teacher" ? "book" : "star"} tone="gold" size={78} />
        </motion.div>

        <motion.h1 className="iz-login__title" variants={riseItem}>
          {copy.title}
        </motion.h1>
        <motion.p className="iz-login__hint" variants={riseItem}>
          {copy.hint}
        </motion.p>

        <motion.form
          className="iz-login__form"
          variants={riseItem}
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field label="البريد الإلكتروني">
            <TextInput
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              inputMode="email"
              required
              placeholder="name@example.com"
            />
          </Field>

          <Field label="كلمة المرور">
            <TextInput
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              minLength={6}
            />
          </Field>

          {error && <Notice tone="danger">{error}</Notice>}

          <ClayButton
            type="submit"
            size="lg"
            block
            loading={busy}
            icon={<LogIn size={19} strokeWidth={2.4} />}
            disabled={!email.trim() || password.length < 6}
          >
            دخول
          </ClayButton>

          <div className="iz-login__links">
            <button type="button" className="iz-linkish" onClick={forgot} disabled={resetting}>
              <KeyRound size={15} strokeWidth={2.4} aria-hidden="true" />
              {resetting ? "جارٍ الإرسال…" : "نسيت كلمة المرور"}
            </button>
            <Link className="iz-linkish" to="/">
              <Mail size={15} strokeWidth={2.4} aria-hidden="true" />
              العودة للرئيسية
            </Link>
          </div>
        </motion.form>

        <motion.p className="iz-login__foot" variants={riseItem}>
          {settings.schoolName}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
