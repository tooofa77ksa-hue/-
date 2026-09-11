/** سجلّ توليد صغير (public/audio/.generation-log.json) يسجّل فقط: أي
 * ملف، بأي مزوّد/صوت، ومتى - لأغراض التوثيق في README ومانفست الصوت.
 * لا يُسجَّل هنا أي API Key إطلاقًا. الملفات المضافة يدويًا (مثلًا سجّلتها
 * المستخدمة بنفسها عبر موقع TTS خارجي) لن تظهر في هذا السجل، وهذا
 * متوقَّع وآمن - update-manifest.ts يتعامل مع غيابها بلطف. */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { projectPath } from "./paths";

export interface GenerationLogEntry {
  id: string;
  kind: "voice" | "sfx";
  provider: string;
  voiceId?: string;
  generatedAt: string;
}

const LOG_PATH = projectPath("public/audio/.generation-log.json");

export function readGenerationLog(): Record<string, GenerationLogEntry> {
  if (!existsSync(LOG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(LOG_PATH, "utf8"));
  } catch {
    return {};
  }
}

export function recordGeneration(entry: GenerationLogEntry) {
  const log = readGenerationLog();
  log[`${entry.kind}:${entry.id}`] = entry;
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + "\n", "utf8");
}
