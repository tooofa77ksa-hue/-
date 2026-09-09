import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function DashboardLayout() {
  const { appUser, signOut } = useAuth();

  return (
    <div className="teacher-layout">
      <aside className="teacher-sidebar">
        <div className="teacher-sidebar__title">شُعلة لغتي</div>
        <div className="teacher-sidebar__user">{appUser?.displayName || appUser?.email}</div>
        <nav>
          <NavLink to="/teacher" end>
            الرئيسية والإحصاءات
          </NavLink>
          <NavLink to="/teacher/questions">الأسئلة</NavLink>
          <NavLink to="/teacher/sets">مجموعات الأسئلة</NavLink>
          <NavLink to="/teacher/settings">إعدادات اللعبة والصوت</NavLink>
        </nav>
        <button className="teacher-sidebar__logout" onClick={() => signOut()}>
          تسجيل الخروج
        </button>
      </aside>
      <main className="teacher-content">
        <Outlet />
      </main>
    </div>
  );
}
