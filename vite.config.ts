import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// إعدادات Vite: تقسيم الحزم بحيث لا يُحمَّل Phaser إلا داخل /play
// ولا يُحمَّل Dashboard إلا داخل /teacher (Code splitting عبر React.lazy في المسارات)
export default defineConfig({
  plugins: [react()],
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
