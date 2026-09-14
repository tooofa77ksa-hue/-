import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { PortfolioEditor } from "@/student/PortfolioEditor";

/** جذر الموقع "/" - خاص بحساب العائلة (ملف الطالبة). المعلمة تُحوَّل
 * دائمًا إلى "/teacher/*" حتى تعمل التنقلات الداخلية هناك (فتح ملف
 * طالبة معيّنة) بشكل صحيح - راجعي TeacherArea في App.tsx. */
export function Home() {
  const { firebaseUser, appUser, loading } = useAuth();

  if (loading) return <div className="page-loading">جارِ التحميل...</div>;
  if (!firebaseUser || !appUser) return <Navigate to="/login" replace />;
  if (appUser.role === "teacher") return <Navigate to="/teacher" replace />;
  return <PortfolioEditor />;
}
