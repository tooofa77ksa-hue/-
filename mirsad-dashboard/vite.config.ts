import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const resolvePath = (p: string) => fileURLToPath(new URL(p, import.meta.url))

const REAL_DATA = 'src/data/school-data.json'
const EMPTY_DATA = 'src/data/school-data.empty.json'

/**
 * مشروع «قياس اتجاه المتعلمين» مستقل تمامًا: جذره هذا المجلد وحده،
 * ولا يشارك أي إعداد بناء أو استضافة مع أي مشروع آخر.
 *
 * قرار أمني مبني في البناء نفسه لا في الواجهة:
 * حين تكتمل متغيّرات Firebase (أي أن هذه نسخة تُنشر ويفتحها العامة)
 * تُستبدل بيانات المدرسة الحقيقية ببنية فارغة قبل التحزيم، فلا يدخل
 * اسم طالبة واحدة ملف JavaScript الذي يُنزّله أي زائر. الإدارة تقرأ
 * الأسماء من قاعدة البيانات بعد دخول بحساب يحمل صلاحية admin،
 * وقواعد firestore.rules هي التي تسمح بذلك أو تمنعه.
 *
 * النتيجة: لا يمكن نشر نسخة تكشف الأسماء حتى بالخطأ.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const willDeploy = Boolean(env.VITE_MIRSAD_FIREBASE_PROJECT_ID?.trim())
  const hasRealData = existsSync(resolvePath(REAL_DATA))

  if (willDeploy && hasRealData) {
    // eslint-disable-next-line no-console
    console.log('\n🔒 نسخة منشورة: استُبعدت بيانات الطالبات من ملفات المتصفّح.\n')
  }

  /**
   * يعترض طلب ملف بيانات المدرسة ويحوّله إلى البنية الفارغة.
   * اعتراض عند حل المسار (لا مجرد alias نصّي) كي يعمل مهما كان شكل
   * الاستيراد — بما في ذلك import.meta.glob.
   */
  const stripSchoolData = {
    name: 'qiyas-strip-school-data',
    enforce: 'pre' as const,
    resolveId(source: string, importer?: string) {
      if (!willDeploy) return null
      const target = resolvePath(`./${REAL_DATA}`)
      if (source === target) return resolvePath(`./${EMPTY_DATA}`)
      if (!importer) return null
      try {
        if (fileURLToPath(new URL(source, `file://${importer}`)) === target) {
          return resolvePath(`./${EMPTY_DATA}`)
        }
      } catch {
        return null
      }
      return null
    },
  }

  return {
    plugins: [stripSchoolData, react()],
    server: {
      port: 5183,
      strictPort: false,
    },
    preview: {
      port: 4183,
    },
    build: {
      outDir: 'dist',
      sourcemap: !willDeploy,
      target: 'es2020',
    },
  }
})
