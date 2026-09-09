import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// إعدادات Vite: تقسيم الحزم بحيث لا يُحمَّل Phaser إلا داخل /play
// ولا يُحمَّل Dashboard إلا داخل /teacher (Code splitting عبر React.lazy في المسارات)
//
// base: عند النشر على GitHub Pages يُخدَّم الموقع من مسار فرعي
// (https://<owner>.github.io/<repo>/) وليس من جذر النطاق، لذا يُضبَط عبر
// VITE_BASE_PATH وقت البناء فقط (workflow النشر يضبطها)؛ التطوير المحلي
// يبقى دائمًا على الجذر "/" بلا أي تأثير.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  // مطابق لـ tsconfig.app.json (paths: "@/*") - بدون هذا، الإنتاج
  // (vite build) كان يحل المسار @ تلقائيًا بينما خادم التطوير (vite dev)
  // لا يحلّه (يعتمدان على مسارات حل مختلفة)، فيفشل npm run dev فقط.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2020",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/phaser")) return "phaser";
          if (id.includes("node_modules/firebase")) return "firebase";
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) return "react-vendor";
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5173,
  },
});
