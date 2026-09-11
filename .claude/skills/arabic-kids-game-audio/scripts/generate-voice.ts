/**
 * يولّد ملفات الصوت البشري (Voice) داخل public/audio/voice/. يجرّب سلسلة
 * مزوّدين بالترتيب ويتوقف عند أول مزوّد يعمل فعليًا (ليس فقط "مُهيَّأ" -
 * بل تأكّد أنه يستجيب حقًا عبر اختبار اتصال قصير أولًا)، ولا يطلب مفتاح
 * API إلا بعد إثبات فشل كل الخيارات المجانية:
 *
 *   1) Edge/Bing Neural TTS (edge-tts) - بلا أي مفتاح، نفس محرّك Azure
 *      العصبي بالضبط، الصوت الافتراضي ar-SA-ZariyahNeural.
 *   2) Azure Speech (AZURE_SPEECH_KEY + AZURE_SPEECH_REGION) - إن كانت
 *      الخطوة (1) غير متاحة (مثلًا سياسة شبكة بيئة التشغيل تحجب
 *      bing.com لكنها تسمح بـ *.tts.speech.microsoft.com الخاص بحساب
 *      مدفوع).
 *   3) ElevenLabs (ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID).
 *   4) Google Cloud Text-to-Speech (GOOGLE_TTS_API_KEY) - بديل إضافي
 *      عملي لأن *.googleapis.com غالبًا مسموح به في بيئات تعتمد على
 *      Firebase أصلًا (كما هو الحال في هذا المشروع نفسه)، حتى لو كانت
 *      bing.com/elevenlabs.io/tts.speech.microsoft.com محجوبة بالكامل.
 *
 * كل مزوّد يُعيد PCM خام (لا MP3 مباشرة) ليمرّ عبر خط تطبيع مستوى موحّد
 * (lib/normalize.ts) قبل الترميز النهائي إلى MP3 حقيقي عبر lamejs - بنفس
 * الأسلوب المستخدم تمامًا لملفات SFX، فلا يوجد أي مفتاح API داخل هذا
 * الكود إطلاقًا - كل شيء يُقرأ من process.env فقط.
 *
 * تشغيل مباشر: npx tsx .claude/skills/arabic-kids-game-audio/scripts/generate-voice.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { VOICE_PHRASES } from "./lib/audioTable";
import { synthesizeEdgeTts } from "./lib/edgeTts";
import { encodeMp3 } from "./lib/mp3";
import { normalizePeakInt16, VOICE_TARGET_PEAK } from "./lib/normalize";
import { recordGeneration } from "./lib/log";
import { assertProjectRoot, projectPath } from "./lib/paths";

export type VoiceGenStatus = "generated" | "skipped-exists" | "failed" | "no-provider";

export interface VoiceGenResult {
  id: string;
  status: VoiceGenStatus;
  provider?: string;
  error?: string;
}

interface PcmResult {
  pcm: Int16Array;
  sampleRate: number;
}

interface Provider {
  name: string;
  voiceId: string;
  requiresKey: boolean;
  synthesize(text: string): Promise<PcmResult>;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label}: timeout ${ms}ms`)), ms)),
  ]);
}

/** الاختيار الأول والافتراضي - بلا أي مفتاح، صوت ar-SA-ZariyahNeural. */
function getEdgeTtsProvider(): Provider {
  const voiceId = process.env.EDGE_TTS_VOICE || "ar-SA-ZariyahNeural";
  return {
    name: "edge-tts (Microsoft Neural, no key)",
    voiceId,
    requiresKey: false,
    async synthesize(text: string): Promise<PcmResult> {
      return withTimeout(synthesizeEdgeTts(text, voiceId), 15000, "edge-tts");
    },
  };
}

function getAzureProvider(): Provider | null {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return null;
  const voiceId = process.env.AZURE_SPEECH_VOICE || "ar-SA-ZariyahNeural";
  const rate = process.env.AZURE_SPEECH_RATE || "+5%";
  return {
    name: "azure",
    voiceId,
    requiresKey: true,
    async synthesize(text: string): Promise<PcmResult> {
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
          "X-Microsoft-OutputFormat": "raw-24khz-16bit-mono-pcm",
          "User-Agent": "arabic-kids-game-audio-skill",
        },
        body: ssml,
      });
      if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${await res.text().catch(() => res.statusText)}`);
      const buf = Buffer.from(await res.arrayBuffer());
      return { pcm: bufferToInt16LE(buf), sampleRate: 24000 };
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
    requiresKey: true,
    async synthesize(text: string): Promise<PcmResult> {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_24000`, {
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
      const buf = Buffer.from(await res.arrayBuffer());
      return { pcm: bufferToInt16LE(buf), sampleRate: 24000 };
    },
  };
}

/** بديل إضافي عملي: مسموح به شبكيًا غالبًا (googleapis.com) حتى في بيئات
 * تحجب bing.com/elevenlabs.io بالكامل - لكنه يبقى يحتاج مفتاح API حقيقي
 * (لا يوجد وصول مجهول لخدمات Google Cloud). */
function getGoogleCloudTtsProvider(): Provider | null {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) return null;
  const voiceId = process.env.GOOGLE_TTS_VOICE || "ar-XA-Wavenet-A";
  return {
    name: "google-cloud-tts",
    voiceId,
    requiresKey: true,
    async synthesize(text: string): Promise<PcmResult> {
      const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: "ar-XA", name: voiceId, ssmlGender: "FEMALE" },
          audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 },
        }),
      });
      if (!res.ok) throw new Error(`Google Cloud TTS ${res.status}: ${await res.text().catch(() => res.statusText)}`);
      const json = (await res.json()) as { audioContent?: string };
      if (!json.audioContent) throw new Error("Google Cloud TTS: استجابة بلا audioContent");
      const wav = Buffer.from(json.audioContent, "base64");
      // LINEAR16 من Google Cloud TTS يعود كملف WAV كامل (ترويسة RIFF 44 بايت ثم PCM خام)
      const pcmStart = wav.length > 44 && wav.toString("ascii", 0, 4) === "RIFF" ? 44 : 0;
      return { pcm: bufferToInt16LE(wav.subarray(pcmStart)), sampleRate: 24000 };
    },
  };
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function bufferToInt16LE(buf: Buffer): Int16Array {
  const evenLen = buf.length - (buf.length % 2);
  const out = new Int16Array(evenLen / 2);
  for (let i = 0; i < out.length; i++) out[i] = buf.readInt16LE(i * 2);
  return out;
}

/** يختبر كل مزوّد بعبارة قصيرة واحدة بالترتيب، ويستقرّ على أول مزوّد
 * يستجيب فعليًا بصوت غير فارغ - حتى لا تختلط أصوات مختلفة بين الملفات،
 * ولتفادي اختبار 14 عبارة كاملة مقابل مزوّد لا يعمل أصلًا. */
async function pickWorkingProvider(candidates: Provider[]): Promise<Provider | null> {
  for (const provider of candidates) {
    try {
      console.log(`[generate-voice] تجربة الاتصال بـ ${provider.name}...`);
      const probe = await provider.synthesize("اختبار");
      if (probe.pcm.length > 200) {
        console.log(`[generate-voice] ✓ ${provider.name} يعمل - سيُستخدَم لكل العبارات`);
        return provider;
      }
      console.log(`[generate-voice] ⨯ ${provider.name} أعاد صوتًا فارغًا تقريبًا`);
    } catch (err) {
      console.log(`[generate-voice] ⨯ ${provider.name} فشل: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return null;
}

export async function generateVoice(force = false): Promise<VoiceGenResult[]> {
  assertProjectRoot();

  const candidates: Provider[] = [
    getEdgeTtsProvider(),
    getAzureProvider(),
    getElevenLabsProvider(),
    getGoogleCloudTtsProvider(),
  ].filter((p): p is Provider => p !== null);

  const provider = await pickWorkingProvider(candidates);

  if (!provider) {
    console.log(
      "\n[generate-voice] جُرِّبت كل الخيارات بلا مفتاح (edge-tts) وكل المزوّدين المهيَّئين بمفتاح - لا أحد منها " +
        "استجاب فعليًا (راجعي الأسطر أعلاه لسبب فشل كل واحد). لتفعيل الصوت البشري: أضيفي متغير البيئة " +
        "AZURE_SPEECH_KEY (مع AZURE_SPEECH_REGION) - أو GOOGLE_TTS_API_KEY كبديل غالبًا يعمل شبكيًا في بيئات " +
        "قائمة على Firebase مثل هذه."
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
      const { pcm, sampleRate } = await provider.synthesize(phrase.text);
      const normalized = normalizePeakInt16(pcm, VOICE_TARGET_PEAK);
      const mp3 = encodeMp3(normalized, sampleRate);
      writeFileSync(outPath, mp3);
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
              ? "⨯ لا يوجد مزوّد يعمل"
              : `⨯ فشل: ${r.error}`;
      console.log(`  ${r.id.padEnd(18)} ${label}`);
    }
    const anyFailed = results.some((r) => r.status === "failed");
    if (anyFailed) process.exitCode = 1;
  });
}
