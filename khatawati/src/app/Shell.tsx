import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { BackgroundMusic } from "@/components/BackgroundMusic";

export function Shell({ children }: { children: ReactNode }) {
  const { appUser, signOut } = useAuth();

  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__brand">
          <span className="shell__brand-badge">خطواتي</span>
          <span className="shell__school">الابتدائية الخامسة والستون بعد المائة</span>
        </div>
        {appUser && (
          <button type="button" className="shell__signout" onClick={() => signOut()}>
            تسجيل الخروج
          </button>
        )}
      </header>
      <main className="shell__main">{children}</main>
      <BackgroundMusic />
    </div>
  );
}
