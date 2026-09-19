import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// مشروع "مرصد" مستقل تمامًا: جذره هذا المجلد وحده،
// ولا يشارك أي إعداد بناء أو استضافة مع أي مشروع آخر.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5183,
    strictPort: false,
  },
  preview: {
    port: 4183,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
  },
})
