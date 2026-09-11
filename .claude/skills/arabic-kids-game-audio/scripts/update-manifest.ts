/**
 * يفحص فعليًا ما هو موجود على القرص داخل public/audio/voice/ و
 * public/audio/sfx/ (لا يفترض شيئًا بناءً على ما وُلِّد في هذه الجلسة
 * فقط - حتى لو أضافت المستخدمة ملفات صوت يدويًا من موقع TTS خارجي، هذا
 * السكربت يكتشفها ويوثّقها بشكل صحيح)، ثم يكتب:
 *   - public/audio/audio-manifest.json  (مصدر حقيقة كامل قابل للقراءة برمجيًا)
 *   - public/audio/voice/README.md      (توثيق بشري لملفات الصوت البشري)
 *   - public/audio/sfx/README.md        (توثيق بشري لملفات المؤثرات)
 *
 * تشغيل مباشر: npx tsx .claude/skills/arabic-kids-game-audio/scripts/update-manifest.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { SFX_SPECS, VOICE_PHRASES } from "./lib/audioTable";
import { readGenerationLog } from "./lib/log";
import { assertProjectRoot, projectPath } from "./lib/paths";

interface ManifestVoiceEntry {
  file: string | null;
  text: string;
  event: string | null;
  exists: boolean;
  provider: string | null;
  voiceId: string | null;
  generatedAt: string | null;
}

interface ManifestSfxEntry {
  file: string | null;
  description: string;
  event: string | null;
  synthesizable: boolean;
  exists: boolean;
  provider: string | null;
  generatedAt: string | null;
}

export function updateManifest() {
  assertProjectRoot();
  const log = readGenerationLog();

  const voice: Record<string, ManifestVoiceEntry> = {};
  for (const phrase of VOICE_PHRASES) {
    const relFile = `audio/voice/${phrase.id}.mp3`;
    const absFile = projectPath("public", relFile);
    const exists = existsSync(absFile);
    const logEntry = log[`voice:${phrase.id}`];
    voice[phrase.id] = {
      file: exists ? relFile : null,
      text: phrase.text,
      event: phrase.event ?? null,
      exists,
      provider: logEntry?.provider ?? (exists ? "غير معروف (أُضيف يدويًا أو خارج هذا الـSkill)" : null),
      voiceId: logEntry?.voiceId ?? null,
      generatedAt: logEntry?.generatedAt ?? null,
    };
  }

  const sfx: Record<string, ManifestSfxEntry> = {};
  for (const spec of SFX_SPECS) {
    const relFile = `audio/sfx/${spec.id}.mp3`;
    const absFile = projectPath("public", relFile);
    const exists = existsSync(absFile);
    const logEntry = log[`sfx:${spec.id}`];
    sfx[spec.id] = {
      file: exists ? relFile : null,
      description: spec.description,
      event: spec.event ?? null,
      synthesizable: spec.synthesizable,
      exists,
      provider: logEntry?.provider ?? (exists ? "غير معروف (أُضيف يدويًا أو خارج هذا الـSkill)" : null),
      generatedAt: logEntry?.generatedAt ?? null,
    };
  }

  // خريطة الأحداث -> (صوت بشري + مؤثر) - تسهّل استبدال أي ملف لاحقًا
  // بمجرد النظر إلى event واحد بدل البحث في كل الجداول.
  const events: Record<string, { voice: string | null; sfx: string | null }> = {};
  for (const phrase of VOICE_PHRASES) {
    if (!phrase.event) continue;
    events[phrase.event] ??= { voice: null, sfx: null };
    events[phrase.event].voice = phrase.id;
  }
  for (const spec of SFX_SPECS) {
    if (!spec.event) continue;
    for (const eventName of spec.event.split("/").map((s) => s.trim())) {
      events[eventName] ??= { voice: null, sfx: null };
      events[eventName].sfx = spec.id;
    }
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    note:
      "يُعاد إنشاء هذا الملف بالكامل في كل مرة يعمل فيها update-manifest.ts - لا تعدّليه يدويًا، " +
      "عدّلي بدلًا منه الجداول في .claude/skills/arabic-kids-game-audio/scripts/lib/audioTable.ts.",
    voice,
    sfx,
    events,
  };

  const manifestDir = projectPath("public/audio");
  if (!existsSync(manifestDir)) mkdirSync(manifestDir, { recursive: true });
  writeFileSync(projectPath("public/audio/audio-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

  writeVoiceReadme(voice);
  writeSfxReadme(sfx);

  return manifest;
}

function writeVoiceReadme(voice: Record<string, ManifestVoiceEntry>) {
  const rows = Object.entries(voice)
    .map(([id, e]) => {
      const status = e.exists ? "✓ موجود" : "✗ غير موجود بعد";
      return `| \`${id}.mp3\` | ${e.text} | ${e.event ?? "—"} | ${status} | ${e.provider ?? "—"} | ${e.voiceId ?? "—"} | ${e.generatedAt ? e.generatedAt.slice(0, 10) : "—"} |`;
    })
    .join("\n");

  const content = `# فتحات الصوت البشري (Voice Slots)

هذا الملف يُنشَأ ويُحدَّث تلقائيًا بواسطة Skill \`arabic-kids-game-audio\`
(عبر \`update-manifest.ts\`) - لا تعدّليه يدويًا، بل عدّلي الجدول في
\`.claude/skills/arabic-kids-game-audio/scripts/lib/audioTable.ts\` ثم
شغّلي "ولّد أصوات اللعبة" مرة أخرى.

مصدر الحقيقة الكامل (قابل للقراءة برمجيًا) موجود في
\`public/audio/audio-manifest.json\`.

| الملف | العبارة | الحدث | الحالة | المزوّد | الصوت (Voice ID) | تاريخ التوليد |
|---|---|---|---|---|---|---|
${rows}

## كيف تعمل الملفات المفقودة

الكود (\`src/game/audio/AudioManager.ts\`) يتجاهل بصمت أي ملف غير موجود
ويكتفي بالمؤثر الصوتي المولَّف (WebAudio) وحركة الشخصية - لا صفحة بيضاء
ولا خطأ ولا صوت روبوتي بديل أبدًا. إضافة أي ملف بالاسم الصحيح هنا يُفعِّله
فورًا بلا أي تعديل على الكود.

## توليد الملفات

شغّلي من جذر المشروع (تحتاج AZURE_SPEECH_KEY + AZURE_SPEECH_REGION، أو
ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID كمتغيرات بيئة):

\`\`\`
npx tsx .claude/skills/arabic-kids-game-audio/scripts/run-all.ts
\`\`\`

لا يُسجَّل أي API Key في هذا الملف أو في audio-manifest.json إطلاقًا -
فقط اسم المزوّد والصوت المُستخدَم.
`;

  writeFileSync(projectPath("public/audio/voice/README.md"), content, "utf8");
}

function writeSfxReadme(sfx: Record<string, ManifestSfxEntry>) {
  const rows = Object.entries(sfx)
    .map(([id, e]) => {
      const status = e.exists ? "✓ موجود" : e.synthesizable ? "✗ غير موجود بعد" : "✗ يحتاج مصدرًا خارجيًا (لا يُولَّد برمجيًا)";
      return `| \`${id}.mp3\` | ${e.description} | ${e.event ?? "—"} | ${status} | ${e.provider ?? "—"} | ${e.generatedAt ? e.generatedAt.slice(0, 10) : "—"} |`;
    })
    .join("\n");

  const content = `# مؤثرات صوتية (SFX)

يُنشَأ ويُحدَّث تلقائيًا بواسطة Skill \`arabic-kids-game-audio\`. مصدر
الحقيقة الكامل في \`public/audio/audio-manifest.json\`.

معظم هذه المؤثرات موّلَفة برمجيًا (PCM خالص، بلا أي ملف/مكتبة خارجية) عبر
\`.claude/skills/arabic-kids-game-audio/scripts/generate-sfx.ts\` بنفس
أسلوب \`src/game/audio/sfxSynth.ts\` تمامًا (نغمات قصيرة لطيفة، بلا Buzzer
عقابي) لكن مُصدَّرة كملف MP3 حقيقي.

| الملف | الوصف | الحدث | الحالة | المزوّد | تاريخ التوليد |
|---|---|---|---|---|---|
${rows}

## applause_short.mp3

استُثني عمدًا من التوليد البرمجي: تصفيق "مُصطنَع" بنغمات بسيطة يبدو رديئًا
وغير طبيعي بوضوح. إن رغبتِ إضافته، استخدمي تسجيلًا حقيقيًا أو مكتبة
مؤثرات مرخّصة، وسجّلي هنا **يدويًا** مصدره ورخصته عند إضافته (لا تحذفي
هذا القسم عند إعادة تشغيل update-manifest.ts - أضيفي الملف فقط وشغّلي
السكربت، سيتحول الصف أعلاه إلى "✓ موجود" تلقائيًا).

## آلية الاحتياط (Fallback)

\`src/game/audio/AudioManager.ts\` يحاول تحميل كل ملف هنا أولًا؛ إن كان
غير موجود، يستخدم المؤثر المولَّف حيًّا من \`sfxSynth.ts\` بلا أي انقطاع
أو خطأ - إضافة/حذف أي ملف هنا آمن تمامًا في أي وقت.
`;

  writeFileSync(projectPath("public/audio/sfx/README.md"), content, "utf8");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const manifest = updateManifest();
  const voiceCount = Object.values(manifest.voice).filter((v) => v.exists).length;
  const sfxCount = Object.values(manifest.sfx).filter((s) => s.exists).length;
  console.log(
    `[update-manifest] تم الكتابة: public/audio/audio-manifest.json ` +
      `(صوت بشري: ${voiceCount}/${Object.keys(manifest.voice).length}, ` +
      `مؤثرات: ${sfxCount}/${Object.keys(manifest.sfx).length}) + README.md لكل من voice وsfx`
  );
}
