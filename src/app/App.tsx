import { Suspense, lazy, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { BrandHeader } from "@/components/BrandHeader";
import { BrandFooter } from "@/components/BrandFooter";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { useBranding } from "@/lib/useBranding";

// تقسيم الحزم: Phaser لا يُحمَّل إلا داخل /play، ولوحة المعلمة لا تُحمَّل
// إلا داخل /teacher.
const PlayApp = lazy(() => import("@/play/PlayApp"));
const TeacherApp = lazy(() => import("@/teacher/TeacherApp"));
// "إنجازي يحكي" قسم مستقل بهويته البصرية ورموزه وحركته؛ لا يُحمَّل أي
// من ذلك (ولا Motion ولا Three ولا Lottie) قبل دخول /injazi فعلًا.
const InjaziApp = lazy(() => import("@/injazi/InjaziApp"));

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      جارٍ التحميل...
    </div>
  );
}

function Home() {
  const branding = useBranding();
  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, textAlign: "center" }}>
      <h1 style={{ color: "var(--brand-primary-dark)" }}>{branding.gameName}</h1>
      <p>{branding.gameTagline}</p>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 24 }}>
        <Link
          to="/play"
          style={{
            background: "var(--brand-primary)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          ابدئي اللعب
        </Link>
        <Link
          to="/teacher"
          style={{
            background: "#fff",
            color: "var(--brand-primary-dark)",
            border: "2px solid var(--brand-primary)",
            padding: "12px 24px",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          دخول المعلمة
        </Link>
      </div>
      <div style={{ marginTop: 20 }}>
        <Link
          to="/injazi"
          style={{
            display: "inline-block",
            color: "var(--brand-primary-dark)",
            padding: "10px 18px",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 700,
            border: "2px dashed var(--brand-border)",
          }}
        >
          إنجازي يحكي · دفتر إنجازات الصف الرابع
        </Link>
      </div>
    </div>
  );
}

function DocumentTitleSync() {
  const branding = useBranding();
  useEffect(() => {
    document.title = branding.gameName;
  }, [branding.gameName]);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <DocumentTitleSync />
        <BackgroundMusic />
        <BrandHeader />
        <main className="app-main">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/play/*" element={<PlayApp />} />
              <Route path="/injazi/*" element={<InjaziApp />} />
              <Route path="/teacher/*" element={<TeacherApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <BrandFooter />
      </div>
    </HashRouter>
  );
}
