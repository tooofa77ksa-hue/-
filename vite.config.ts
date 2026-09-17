import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// إعدادات Vite: تقسيم الحزم بحيث لا يُحمَّل Phaser إلا داخل /play
// ولا يُحمَّل Dashboard إلا داخل /teacher (Code splitting عبر React.lazy في المسارات)
//
// base: عند النشر على GitHub Pages يُخدَّم الموقع من مسار فرعي
// (https://<owner>.github.io/<repo>/) وليس من جذر النطاق، لذا يُضبَط عبر
// VITE_BASE_PATH وقت البناء فقط (workflow النشر يضبطها)؛ التطوير المحلي
// يبقى دائمًا على الجذر "/" بلا أي تأثير.
/*
  متغيّر بيئة فارغ يحجب قيمة الملف.
  Vite يقدّم process.env على ملفات .env، فمتغيّر تُمرّره منصّة النشر
  فارغًا (كما تفعل Vercel مع قيمة ذات بادئة عامة محفوظة كـ Secret:
  تمنع تمريرها للمتصفّح) يُلغي القيمة الصحيحة في .env.production ويصل
  التطبيق بلا إعدادات. الفراغ ليس قيمة، فنحذفه ليقرأ Vite الملف.
*/
for (const key of Object.keys(process.env)) {
  if (key.startsWith("VITE_") && process.env[key]?.trim() === "") {
    delete process.env[key];
  }
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react(), tailwindcss()],
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
          // حزم "إنجازي يحكي" الثقيلة تُعزَل كلٌّ على حدة: three لا يُطلب
          // إلا عند تشغيل مشهد البطل، وlottie لا يُطلب إلا عند لحظة
          // نجاح/نجمة/تاج. وضعها في حزمة القسم كان سيُحمّل الهاتف ما
          // لا يعرضه أصلًا.
          if (
            id.includes("node_modules/three/") ||
            id.includes("node_modules/@react-three/") ||
            id.includes("node_modules/three-stdlib/")
          ) {
            return "three";
          }
          if (id.includes("node_modules/lottie-web")) return "lottie";
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
