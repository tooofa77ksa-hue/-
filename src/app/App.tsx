import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BrandHeader } from "@/components/BrandHeader";
import { BrandFooter } from "@/components/BrandFooter";

// تقسيم الحزم: Phaser لا يُحمَّل إلا داخل /play، ولوحة المعلمة لا تُحمَّل
// إلا داخل /teacher.
const PlayApp = lazy(() => import("@/play/PlayApp"));
const TeacherApp = lazy(() => import("@/teacher/TeacherApp"));

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      جارٍ التحميل...
    </div>
  );
}

function Home() {
  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, textAlign: "center" }}>
      <h1 style={{ color: "var(--brand-primary-dark)" }}>شُعلة لغتي</h1>
      <p>منصة تعليمية تفاعلية لمادة لغتي - الصف الثالث الابتدائي</p>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 24 }}>
        <a
          href="/play"
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
        </a>
        <a
          href="/teacher"
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
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <BrandHeader />
        <main className="app-main">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/play/*" element={<PlayApp />} />
              <Route path="/teacher/*" element={<TeacherApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <BrandFooter />
      </div>
    </BrowserRouter>
  );
}
