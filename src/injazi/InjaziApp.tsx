/*
  إنجازي يحكي — جذر القسم
  ------------------------------------------------------------------
  كل ما يخص القسم يعيش داخل .injazi: الرموز، الخط، الحركة. لا يتسرب
  شيء إلى شُعلة لغتي ولا إلى لوحة المعلمة.
  انتقال الصفحات يُدار هنا بـ AnimatePresence mode="wait" حتى لا
  تتراكب صفحتان أثناء التبديل (تراكبهما يُربك القارئ الصغير ويقفز
  بالتخطيط).
*/
import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { InjaziNav } from "@/injazi/components/InjaziNav";
import { ToastHost } from "@/injazi/components/ToastHost";
import { ensureDisplayFont } from "@/injazi/lib/displayFont";
import { HomeScreen } from "@/injazi/screens/HomeScreen";
import { JournalScreen } from "@/injazi/screens/JournalScreen";
import { TellScreen } from "@/injazi/screens/TellScreen";
import "@/injazi/styles/tokens.css";
import "@/injazi/styles/injazi.css";

export default function InjaziApp() {
  const location = useLocation();

  useEffect(() => {
    ensureDisplayFont();
  }, []);

  return (
    <div className="injazi" dir="rtl">
      <div className="iz-sky-wash" aria-hidden="true" />
      <InjaziNav />

      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route index element={<HomeScreen />} />
          <Route path="journal" element={<JournalScreen />} />
          <Route path="tell/:subjectId" element={<TellScreen />} />
          <Route path="*" element={<HomeScreen />} />
        </Routes>
      </AnimatePresence>

      <ToastHost />
    </div>
  );
}
