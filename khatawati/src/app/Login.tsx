import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export function Login() {
  const { signIn, error, firebaseUser, appUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setBusy(true);
    try {
      await signIn(username, password);
      navigate("/", { replace: true });
    } catch {
      /* رسالة الخطأ تُعرض من useAuth().error */
    } finally {
      setBusy(false);
    }
  };

  // إذا صار الحساب جاهزًا بعد أن استقرت الصفحة على /login (مثلًا Home
  // حوّلت هنا مؤقتًا قبل أن يكتمل تحميل appUser من Firestore)، ارجعي
  // تلقائيًا بمجرد اكتماله - بدون هذا الحارس يبقى المستخدم "عالق" على
  // شاشة الدخول رغم أن الدخول نجح فعليًا.
  if (firebaseUser && appUser) return <Navigate to="/" replace />;

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-card__badge">خطواتي</div>
        <h1>تسجيل الدخول</h1>
        <p className="login-card__hint">اكتبي اسم المستخدم وكلمة السر اللي أعطتك إياها المعلمة</p>
        <form onSubmit={handleSubmit}>
          <label>
            اسم المستخدم
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="مثال: nadeen"
            />
          </label>
          <label>
            كلمة السر
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && <div className="login-card__error">{error}</div>}
          <button type="submit" disabled={busy}>
            {busy ? "جارِ الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
