import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { AppUser } from "@/types/models";

export function RequireRole({ role, children }: { role: AppUser["role"]; children: React.ReactNode }) {
  const { firebaseUser, appUser, loading } = useAuth();

  if (loading) return <div className="page-loading">جارِ التحميل...</div>;
  if (!firebaseUser || !appUser) return <Navigate to="/login" replace />;
  if (appUser.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}
