import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { TeacherDashboard } from "@/teacher/TeacherDashboard";
import { Shell } from "./Shell";
import { Home } from "./Home";
import { Login } from "./Login";

/** "/teacher/*" - حارس دور مستقل بمساره الخاص (وليس فرعًا داخل Home)
 * حتى يعمل التوجيه الداخلي لـ TeacherDashboard (فتح ملف طالبة معيّنة
 * عبر ":studentId") بشكل صحيح؛ Routes المتداخل يحتاج مسارًا أبًا ثابتًا
 * لحل المسارات النسبية بداخله. */
function TeacherArea() {
  const { firebaseUser, appUser, loading } = useAuth();
  if (loading) return <div className="page-loading">جارِ التحميل...</div>;
  if (!firebaseUser || !appUser) return <Navigate to="/login" replace />;
  if (appUser.role !== "teacher") return <Navigate to="/" replace />;
  return <TeacherDashboard />;
}

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Shell>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/teacher/*" element={<TeacherArea />} />
            <Route path="/*" element={<Home />} />
          </Routes>
        </Shell>
      </HashRouter>
    </AuthProvider>
  );
}
