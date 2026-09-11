/**
 * المنسّق الرئيسي لـSkill "arabic-kids-game-audio" - هذا هو السكربت الذي
 * يشغّله Claude عند طلب "ولّد أصوات اللعبة" أو "ولّد حزمة أصوات شُعلة
 * لغتي كاملة". ينفّذ بالترتيب:
 *   1-2) توليد SFX القابلة للتوليف + توليد الصوت البشري (TTS إن توفر مزوّد)
 *   3-6) الحفظ بأسماء ثابتة داخل public/audio/{voice,sfx}/ (يحدث ضمن كل خطوة)
 *   7)   تحديث public/audio/audio-manifest.json + كلا الـREADME
 *        (AudioManager.ts نفسه لا يحتاج تعديلًا في كل تشغيل - التكامل
 *        مبني فيه سلفًا ليقرأ هذه الملفات تلقائيًا بمجرد وجودها)
 *   8)   التحقق من سلامة كل ملف MP3
 *   9)   npm run build
 *   10)  تقرير نهائي مختصر
 *
 * تشغيل: npx tsx .claude/skills/arabic-kids-game-audio/scripts/run-all.ts [--force]
 */
import { generateSfx } from "./generate-sfx";
import { generateVoice } from "./generate-voice";
import { verifyAudioFiles, runBuild } from "./verify-and-build";
import { assertProjectRoot } from "./lib/paths";

async function main() {
  assertProjectRoot();
  const force = process.argv.includes("--force");

  console.log("========== [1/5] توليد المؤثرات الصوتية (SFX) ==========");
  const sfxResults = generateSfx(force);
  sfxResults.forEach((r) => console.log(`  ${r.id.padEnd(16)} ${r.status}`));

  console.log("\n========== [2/5] توليد الصوت البشري (Voice/TTS) ==========");
  const voiceResults = await generateVoice(force);
  voiceResults.forEach((r) => console.log(`  ${r.id.padEnd(18)} ${r.status}${r.provider ? ` (${r.provider})` : ""}`));

  console.log("\n========== [3/5] تحديث المانفست وملفات README ==========");
  const { manifest, problems } = verifyAudioFiles();
  console.log("  ✓ تم تحديث public/audio/audio-manifest.json + README.md (voice وsfx)");

  console.log("\n========== [4/5] التحقق من سلامة الملفات ==========");
  if (problems.length > 0) {
    problems.forEach((p) => console.error(`  ⨯ ${p}`));
  } else {
    console.log("  ✓ كل الملفات الموجودة صالحة");
  }

  console.log("\n========== [5/5] Build المشروع ==========");
  const build = runBuild();
  console.log(build.ok ? "  ✓ Build نجح" : "  ⨯ Build فشل");
  if (!build.ok) console.error(build.output);

  const voiceExisting = Object.values(manifest.voice).filter((v) => v.exists).length;
  const voiceTotal = Object.keys(manifest.voice).length;
  const sfxExisting = Object.values(manifest.sfx).filter((s) => s.exists).length;
  const sfxTotal = Object.keys(manifest.sfx).length;
  const noProvider = voiceResults.some((r) => r.status === "no-provider");

  console.log("\n===== التقرير النهائي =====");
  console.log(`الصوت البشري: ${voiceExisting}/${voiceTotal}`);
  console.log(`المؤثرات:     ${sfxExisting}/${sfxTotal}`);
  console.log(`Build:        ${build.ok ? "نجح" : "فشل"}`);
  if (noProvider) {
    console.log("\nلتفعيل الصوت البشري: أضيفي AZURE_SPEECH_KEY (مع AZURE_SPEECH_REGION) كمتغيرات بيئة ثم أعيدي الطلب.");
  }
  if (sfxExisting < sfxTotal) {
    console.log("applause_short.mp3 يحتاج مصدرًا مرخصًا خارجيًا - لم يُولَّد برمجيًا عمدًا (راجع public/audio/sfx/README.md).");
  }
  console.log("اختبري الأصوات داخل اللعبة الآن عبر /play (أي ملف مضاف يعمل تلقائيًا بلا أي تعديل كود إضافي).");
  console.log("============================");

  if (!build.ok) process.exitCode = 1;
}

main();
