/**
 * يتحقق أن كل ملف موجود في المانفست هو MP3 صالح فعليًا (لا حجم صفري، لا
 * تلف)، ثم يُشغّل npm run build (البناء الحقيقي للمشروع - نفس الأمر الذي
 * تستخدمه بقية جلسات العمل)، ويطبع تقريرًا نهائيًا واحدًا يلخّص كل شيء:
 * ما تولَّد فعليًا مقابل ما بقي ناقصًا وسببه.
 *
 * تشغيل مباشر: npx tsx .claude/skills/arabic-kids-game-audio/scripts/verify-and-build.ts
 */
import { readFileSync, statSync } from "fs";
import { execSync } from "child_process";
import { updateManifest } from "./update-manifest";
import { assertProjectRoot, projectPath } from "./lib/paths";

function isPlausibleMp3(absPath: string): boolean {
  const stat = statSync(absPath);
  if (stat.size < 200) return false; // ملف MP3 حقيقي حتى لو قصير جدًا لن يكون أصغر من هذا
  const head = readFileSync(absPath, { encoding: null, flag: "r" }).subarray(0, 3);
  // MPEG frame sync (0xFFEx..0xFFFx) أو وسم ID3 - كلاهما يدل على MP3 صالح
  const isMpegSync = head[0] === 0xff && (head[1] & 0xe0) === 0xe0;
  const isId3 = head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33; // "ID3"
  return isMpegSync || isId3;
}

export function verifyAudioFiles() {
  const manifest = updateManifest();
  const problems: string[] = [];

  for (const [id, entry] of Object.entries(manifest.voice)) {
    if (!entry.exists || !entry.file) continue;
    const abs = projectPath("public", entry.file);
    if (!isPlausibleMp3(abs)) problems.push(`voice/${id}.mp3 ليس MP3 صالحًا أو تالف`);
  }
  for (const [id, entry] of Object.entries(manifest.sfx)) {
    if (!entry.exists || !entry.file) continue;
    const abs = projectPath("public", entry.file);
    if (!isPlausibleMp3(abs)) problems.push(`sfx/${id}.mp3 ليس MP3 صالحًا أو تالف`);
  }

  return { manifest, problems };
}

export function runBuild(): { ok: boolean; output: string } {
  try {
    const output = execSync("npm run build", { cwd: projectPath("."), encoding: "utf8", stdio: "pipe" });
    return { ok: true, output };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message: string };
    return { ok: false, output: (e.stdout ?? "") + (e.stderr ?? "") + e.message };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  assertProjectRoot();
  const { manifest, problems } = verifyAudioFiles();

  console.log("[verify-and-build] فحص سلامة الملفات...");
  if (problems.length > 0) {
    console.error("[verify-and-build] مشاكل:");
    problems.forEach((p) => console.error(`  ⨯ ${p}`));
    process.exitCode = 1;
  } else {
    console.log("  ✓ كل الملفات الموجودة صالحة");
  }

  console.log("\n[verify-and-build] تشغيل npm run build...");
  const build = runBuild();
  if (build.ok) {
    console.log("  ✓ Build نجح");
  } else {
    console.error("  ⨯ Build فشل:\n" + build.output);
    process.exitCode = 1;
  }

  const voiceExisting = Object.values(manifest.voice).filter((v) => v.exists).length;
  const voiceTotal = Object.keys(manifest.voice).length;
  const sfxExisting = Object.values(manifest.sfx).filter((s) => s.exists).length;
  const sfxTotal = Object.keys(manifest.sfx).length;

  console.log("\n===== التقرير النهائي =====");
  console.log(`الصوت البشري (Voice): ${voiceExisting}/${voiceTotal} ملف موجود`);
  console.log(`المؤثرات (SFX):       ${sfxExisting}/${sfxTotal} ملف موجود`);
  if (voiceExisting < voiceTotal) {
    console.log(
      "الصوت البشري الناقص يحتاج AZURE_SPEECH_KEY (أو ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID) " +
        "كمتغير بيئة، ثم إعادة تشغيل run-all.ts."
    );
  }
  if (sfxExisting < sfxTotal) {
    console.log("applause_short.mp3 يحتاج مصدرًا مرخصًا خارجيًا (لا يُولَّد برمجيًا) - أضيفيه يدويًا لاحقًا إن رغبتِ.");
  }
  console.log("============================");
}
