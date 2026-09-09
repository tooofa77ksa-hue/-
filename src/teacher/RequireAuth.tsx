import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { LoginScreen } from "./LoginScreen";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { firebaseUser, appUser, loading, signOut } = useAuth();

  if (loading) {
    return <div className="teacher-loading">جارٍ التحقق من الحساب...</div>;
  }

  if (!firebaseUser) {
    return <LoginScreen />;
  }

  if (!appUser || (appUser.role !== "teacher" && appUser.role !== "admin")) {
    return (
      <div className="teacher-forbidden">
        <h2>غير مصرح لك بالدخول</h2>
        <p>هذا الحساب غير مسجَّل كمعلمة أو إدارة. تواصلي مع المسؤول لمنحك الصلاحية.</p>
        <button onClick={() => signOut()}>تسجيل الخروج</button>
      </div>
    );
  }

  return <>{children}</>;
}
