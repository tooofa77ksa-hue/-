import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthContext";
import { usernameToInternalEmail } from "@/lib/usernameAuth";

export function LoginScreen() {
  const { signIn, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(usernameToInternalEmail(username), password);
    } catch {
      /* الخطأ معروض بالفعل عبر AuthContext */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>دخول المعلمة</h1>
        <p className="login-card__hint">هذه اللوحة مخصصة للمعلمة/الإدارة فقط. لا يوجد تسجيل عام.</p>

        <label>
          اسم المستخدم
          <input
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label>
          كلمة المرور
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="login-card__error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>
    </div>
  );
}
