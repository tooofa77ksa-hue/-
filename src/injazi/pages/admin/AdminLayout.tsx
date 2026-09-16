/*
  هيكل لوحة الإدارة.
  تبويب أفقي قابل للتمرير على الجوال (المشرفة قد تدخل من جوالها) مع
  مؤشّر منزلق واحد بدل تلوين/إلغاء تلوين رابطين.
*/
import { motion } from "motion/react";
import { NavLink, Outlet } from "react-router-dom";
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { signOutUser } from "@/injazi/services/auth";
import { useSession } from "@/injazi/hooks/useLive";
import { showToast } from "@/injazi/lib/toast";
import { DUR, EASE_CLAY } from "@/injazi/motion/motion";

const TABS = [
  { to: "/admin", label: "نظرة عامة", icon: LayoutDashboard, end: true },
  { to: "/admin/students", label: "الطالبات", icon: Users, end: false },
  { to: "/admin/teachers", label: "المعلمات", icon: GraduationCap, end: false },
  { to: "/admin/subjects", label: "المواد", icon: BookOpen, end: false },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings, end: false },
];

export function AdminLayout() {
  const { profile } = useSession();

  return (
    <div className="iz-admin">
      <header className="iz-admin__bar">
        <div className="iz-admin__identity">
          <strong>لوحة الإدارة</strong>
          <span>{profile?.name}</span>
        </div>
        <ClayButton
          variant="ghost"
          size="sm"
          icon={<LogOut size={16} strokeWidth={2.4} />}
          onClick={async () => {
            await signOutUser();
            showToast("تم تسجيل الخروج", "info");
          }}
        >
          خروج
        </ClayButton>
      </header>

      <nav className="iz-tabs" aria-label="أقسام الإدارة">
        {TABS.map(({ to, label, icon: TabIcon, end }) => (
          <NavLink key={to} to={to} end={end} className="iz-tab">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="iz-admin-tab"
                    className="iz-tab__pill"
                    transition={{ duration: DUR.base, ease: EASE_CLAY }}
                  />
                )}
                <span className="iz-tab__content">
                  <TabIcon size={17} strokeWidth={2.4} aria-hidden="true" />
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
