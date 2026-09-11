/** كل السكربتات يجب تشغيلها من جذر المشروع (cwd = جذر repo شُعلة لغتي)،
 * تمامًا مثل بقية سكربتات المشروع (npm run seed... إلخ). هذا الفحص يمنع
 * كتابة ملفات في مكان خاطئ لو نُفِّذ السكربت من مجلد مختلف بالخطأ. */
import { existsSync } from "fs";
import { resolve } from "path";

export const PROJECT_ROOT = process.cwd();

export function assertProjectRoot() {
  const marker = resolve(PROJECT_ROOT, "src/game/audio/AudioManager.ts");
  if (!existsSync(marker)) {
    console.error(
      `[arabic-kids-game-audio] يجب تشغيل هذا السكربت من جذر مشروع "شُعلة لغتي" (لم يُعثر على ${marker}). ` +
        `نفّذي الأمر من مجلد المشروع الرئيسي.`
    );
    process.exit(1);
  }
}

export function projectPath(...segments: string[]): string {
  return resolve(PROJECT_ROOT, ...segments);
}
