/*
  إنجازي يحكي — جذر التطبيق.
  كل شيء داخل .injazi: الرموز، الخط، الحركة. الصفحات الثقيلة (لوحة
  الإدارة، بوابة المعلمات) محمَّلة بـ lazy فلا يدفع ولي أمر يفتح ملف
  ابنته ثمن شاشات لن يراها.
  إعدادات المنصة تُحقَن كمتغيّرات CSS على الجذر، فتغيير اللون الأساسي
  أو استدارة البطاقات من اللوحة يسري على كل الشاشات بلا إعادة نشر.
*/
import { Suspense, lazy, useEffect } from "react";
import type { CSSProperties } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { ClayObject } from "@/injazi/components/ClayObject";
import { ToastHost } from "@/injazi/components/ToastHost";
import { SiteHeader } from "@/injazi/app/SiteHeader";
import { RequireRole } from "@/injazi/app/RequireRole";
import { LoginPage } from "@/injazi/pages/LoginPage";
import { PublicHome } from "@/injazi/pages/PublicHome";
import { StudentPortfolio } from "@/injazi/pages/StudentPortfolio";
import { ensureDisplayFont } from "@/injazi/lib/displayFont";
import { useSettings } from "@/injazi/hooks/useLive";
import "@/injazi/styles/tailwind.css";
import "@/injazi/styles/tokens.css";
import "@/injazi/styles/injazi.css";

const TeacherPortal = lazy(() =>
  import("@/injazi/pages/TeacherPortal").then((m) => ({ default: m.TeacherPortal })),
);
const AdminLayout = lazy(() =>
  import("@/injazi/pages/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const AdminHome = lazy(() =>
  import("@/injazi/pages/admin/AdminHome").then((m) => ({ default: m.AdminHome })),
);
const AdminStudents = lazy(() =>
  import("@/injazi/pages/admin/AdminStudents").then((m) => ({ default: m.AdminStudents })),
);
const AdminTeachers = lazy(() =>
  import("@/injazi/pages/admin/AdminTeachers").then((m) => ({ default: m.AdminTeachers })),
);
const AdminSubjects = lazy(() =>
  import("@/injazi/pages/admin/AdminSubjects").then((m) => ({ default: m.AdminSubjects })),
);
const AdminSettings = lazy(() =>
  import("@/injazi/pages/admin/AdminSettings").then((m) => ({ default: m.AdminSettings })),
);

function Loading() {
  return (
    <div className="iz-page iz-center">
      <ClayObject name="star" tone="gold" size={72} />
      <p className="iz-field__meter">جارٍ التحميل…</p>
    </div>
  );
}

export default function InjaziApp() {
  const location = useLocation();
  const settings = useSettings();

  useEffect(() => {
    ensureDisplayFont();
  }, []);

  // الطبقات العائمة تعيش في <body> خارج شجرة .injazi، فتُكتب رموز
  // الإعدادات على الجذر أيضًا كي ترث النوافذ لون المنصة واستدارتها.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--iz-accent", settings.primaryColor);
    root.style.setProperty("--iz-gold", settings.secondaryColor);
    root.style.setProperty("--iz-r-lg", `${settings.cardRadius}px`);
  }, [settings.primaryColor, settings.secondaryColor, settings.cardRadius]);

  const rootStyle = {
    "--iz-accent": settings.primaryColor,
    "--iz-gold": settings.secondaryColor,
    "--iz-r-lg": `${settings.cardRadius}px`,
  } as CSSProperties;

  return (
    <div className={`injazi injazi--bg-${settings.background}`} dir="rtl" style={rootStyle}>
      <div className="iz-sky-wash" aria-hidden="true" />
      <SiteHeader />

      <main className="iz-main">
        <Suspense fallback={<Loading />}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route index element={<PublicHome />} />
              <Route path="student/:studentId" element={<StudentPortfolio />} />

              <Route path="login" element={<LoginPage intent="parent" />} />
              <Route path="teacher/login" element={<LoginPage intent="teacher" />} />
              <Route path="admin/login" element={<LoginPage intent="admin" />} />

              <Route
                path="teacher"
                element={
                  <RequireRole roles={["teacher", "admin"]}>
                    <TeacherPortal />
                  </RequireRole>
                }
              />

              <Route
                path="admin"
                element={
                  <RequireRole roles={["admin"]}>
                    <AdminLayout />
                  </RequireRole>
                }
              >
                <Route index element={<AdminHome />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="teachers" element={<AdminTeachers />} />
                <Route path="subjects" element={<AdminSubjects />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<PublicHome />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>

      <footer className="iz-footer">
        <p>{settings.schoolName}</p>
        <p className="iz-footer__muted">
          {settings.gradeLabel} · {settings.tagline}
        </p>
      </footer>

      <ToastHost />
    </div>
  );
}
