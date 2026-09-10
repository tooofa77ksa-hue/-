import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { staticFile } from "remotion";
import { estimateDurationSeconds } from "./estimateDuration";
import type { VoiceoverLine } from "../data/voiceover-scripts";

export interface ResolvedVoiceLine {
  id: string;
  seconds: number;
  source: "audio-file" | "estimated";
}

/**
 * يقرأ مدة ملف الصوت الفعلية إن وُجد داخل public/audio/voice/{id}.mp3،
 * وإلا يعود بصمت إلى تقدير مبني على عدد الكلمات (estimateDurationSeconds)
 * دون أي خطأ يوقف Studio أو الرندر - يطابق نمط "فتحات الصوت" المستخدم في
 * تطبيق شُعلة لغتي الشقيق داخل هذا المستودع.
 */
export async function resolveVoiceLine(line: VoiceoverLine): Promise<ResolvedVoiceLine> {
  try {
    const seconds = await getAudioDurationInSeconds(staticFile(`audio/voice/${line.id}.mp3`));
    if (seconds && seconds > 0) {
      return { id: line.id, seconds, source: "audio-file" };
    }
  } catch {
    // الملف غير موجود بعد - نستخدم التقدير أدناه بصمت (سلوك متعمَّد وليس خطأ)
  }
  return { id: line.id, seconds: estimateDurationSeconds(line.text), source: "estimated" };
}

export async function resolveAllVoiceLines(
  lines: VoiceoverLine[],
): Promise<Record<string, ResolvedVoiceLine>> {
  const resolved = await Promise.all(lines.map(resolveVoiceLine));
  return Object.fromEntries(resolved.map((r) => [r.id, r]));
}
