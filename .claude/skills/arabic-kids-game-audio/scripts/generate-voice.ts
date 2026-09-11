/**
 * يولّد ملفات الصوت البشري (Voice) داخل public/audio/voice/ عبر مزوّد
 * TTS حقيقي مهيّأ في متغيرات البيئة. لا يوجد أي مفتاح API داخل هذا الكود
 * إطلاقًا - كل شيء يُقرأ من process.env فقط.
 *
 * ترتيب الأولوية:
 *   1) Azure Speech (AZURE_SPEECH_KEY + AZURE_SPEECH_REGION) - الصوت
 *      الافتراضي ar-SA-ZariyahNeural (يمكن تغييره عبر AZURE_SPEECH_VOICE).
 *   2) ElevenLabs (ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID).
 *
 * إن لم يوجد أي مزوّد مهيّأ إطلاقًا: يتوقف توليد الصوت البشري فقط (بقية
 * خطوات الـSkill - SFX والـmanifest والـbuild - تستمر عادةً)، وتُطبَع
 * رسالة واحدة قصيرة باسم متغير البيئة المطلوب فقط، بدون شرح مطوّل. هذا
 * قرار مقصود: لا صوت بشري روبوتي بديل أبدًا (Web Speech API ممنوع صراحة)
 * لأنه يخالف معيار الجودة المطلوب لهذا المشروع.
 *
 * تشغيل مباشر: npx tsx .claude/skills/arabic-kids-game-audio/scripts/generate-voice.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { VOICE_PHRASES } from "./lib/audioTable";
import { recordGeneration } from "./lib/log";
import { assertProjectRoot, projectPath } from "./lib/paths";

export type VoiceGenStatus = "generated" | "skipped-exists" | "failed" | "no-provider";

export interface VoiceGenResult {
  id: string;
  status: VoiceGenStatus;
  provider?: string;
  error?: string;
}

interface Provider {
  name: string;
  voiceId: string;
  synthesize(text: string): Promise<Buffer>;
}

function getAzureProvider(): Provider | null {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return null;
  const voiceId = process.env.AZURE_SPEECH_VOICE || "ar-SA-ZariyahNeural";
  // نسبة سرعة خفيفة فقط (لا تزيد عن %8) لإضفاء حيوية بلا الإخلال بوضوح
  // العربية الفصحى - راجعي طلب المستخدمة الأصلي: "لا مد كلمات مبالغ".
  const rate = process.env.AZURE_SPEECH_RATE || "+5%";
  return {
    name: "azure",
    voiceId,
    async synthesize(text: string): Promise<Buffer> {
      const ssml =
        `<speak version="1.0" xml:lang="ar-SA">` +
        `<voice name="${voiceId}">` +
        `<prosody rate="${rate}">${escapeXml(text)}</prosody>` +
        `</voice></speak>`;
      const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          "User-Agent": "arabic-kids-game-audio-skill",
        },
        body: ssml,
      });
      if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${await res.text().catch(() => res.statusText)}`);
      return Buffer.from(await res.arrayBuffer());
    },
  };
}

function getElevenLabsProvider(): Provider | null {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voiceId) return null;
  return {
    name: "elevenlabs",
    voiceId,
    async synthesize(text: string): Promise<Buffer> {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
        }),
      });
      if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${await res.text().catch(() => res.statusText)}`);
      return Buffer.from(await res.arrayBuffer());
    },
  };
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function resolveProvider(): Provider | null {
  return getAzureProvider() ?? getElevenLabsProvider();
}

export async function generateVoice(force = false): Promise<VoiceGenResult[]> {
  assertProjectRoot();
  const provider = resolveProvider();

  if (!provider) {
    console.log(
      "[generate-voice] لا يوجد مزوّد TTS مهيّأ - أضيفي متغير البيئة AZURE_SPEECH_KEY " +
        "(مع AZURE_SPEECH_REGION) لتفعيل توليد الصوت البشري. تخطّي هذه الخطوة فقط، وبقية الخطوات تستمر."
    );
    return VOICE_PHRASES.map((p) => ({ id: p.id, status: "no-provider" as const }));
  }

  const voiceDir = projectPath("public/audio/voice");
  if (!existsSync(voiceDir)) mkdirSync(voiceDir, { recursive: true });

  const results: VoiceGenResult[] = [];
  for (const phrase of VOICE_PHRASES) {
    const outPath = projectPath("public/audio/voice", `${phrase.id}.mp3`);
    if (existsSync(outPath) && !force) {
      results.push({ id: phrase.id, status: "skipped-exists" });
      continue;
    }
    try {
      const audio = await provider.synthesize(phrase.text);
      writeFileSync(outPath, audio);
      recordGeneration({
        id: phrase.id,
        kind: "voice",
        provider: provider.name,
        voiceId: provider.voiceId,
        generatedAt: new Date().toISOString(),
      });
      results.push({ id: phrase.id, status: "generated", provider: provider.name });
    } catch (err) {
      results.push({ id: phrase.id, status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const force = process.argv.includes("--force");
  generateVoice(force).then((results) => {
    console.log("\n[generate-voice] النتيجة:");
    for (const r of results) {
      const label =
        r.status === "generated"
          ? `✓ تم التوليد (${r.provider})`
          : r.status === "skipped-exists"
            ? "↷ موجود مسبقًا (استخدمي --force لإعادة التوليد)"
            : r.status === "no-provider"
              ? "⨯ لا يوجد مزوّد"
              : `⨯ فشل: ${r.error}`;
      console.log(`  ${r.id.padEnd(18)} ${label}`);
    }
    const anyFailed = results.some((r) => r.status === "failed");
    if (anyFailed) process.exitCode = 1;
  });
}
