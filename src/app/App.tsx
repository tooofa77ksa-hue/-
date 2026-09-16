import { Suspense, lazy, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { BrandHeader } from "@/components/BrandHeader";
import { BrandFooter } from "@/components/BrandFooter";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { useBranding } from "@/lib/useBranding";

// تقسيم الحزم: Phaser لا يُحمَّل إلا داخل /lughati/play، ولوحة المعلمة
// لا تُحمَّل إلا داخل /lughati/teacher، و"إنجازي يحكي" (Motion/Three/
// Lottie/Tailwind) لا يُحمَّل داخل مسارات شُعلة لغتي إطلاقًا.
const PlayApp = lazy(() => import("@/play/PlayApp"));
const TeacherApp = lazy(() => import("@/teacher/TeacherApp"));
const InjaziApp = lazy(() => import("@/injazi/InjaziApp"));

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      جارٍ التحميل...
    </div>
  );
}

function LughatiHome() {
  const branding = useBranding();
  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, textAlign: "center" }}>
      <h1 style={{ color: "var(--brand-primary-dark)" }}>{branding.gameName}</h1>
      <p>{branding.gameTagline}</p>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 24 }}>
        <Link
          to="/lughati/play"
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
          to="/lughati/teacher"
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
          to="/"
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
          إنجازي يحكي · ملف الإنجاز الرقمي
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

/**
 * شُعلة لغتي — المشروع السابق كما هو، منقولًا تحت /lughati دون أي تغيير
 * في شاشاته أو منطقه. النقل لازم لأن "إنجازي يحكي" يحتاج الجذر (/)
 * ومسار /teacher لبوابة المعلمات، وهما ما كان يشغلهما هذا التطبيق.
 */
function LughatiApp() {
  return (
    <div className="app-shell">
      <DocumentTitleSync />
      <BackgroundMusic />
      <BrandHeader />
      <main className="app-main">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route index element={<LughatiHome />} />
            <Route path="play/*" element={<PlayApp />} />
            <Route path="teacher/*" element={<TeacherApp />} />
            <Route path="*" element={<Navigate to="/lughati" replace />} />
          </Routes>
        </Suspense>
      </main>
      <BrandFooter />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/lughati/*" element={<LughatiApp />} />
          {/* روابط قديمة محفوظة: #/play كان جذر لعبة شُعلة لغتي */}
          <Route path="/play/*" element={<Navigate to="/lughati/play" replace />} />
          <Route path="/injazi/*" element={<Navigate to="/" replace />} />
          <Route path="/*" element={<InjaziApp />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
