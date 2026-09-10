import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { staticFile } from "remotion";

/**
 * فحص وجود ملف صوتي اختياري (موسيقى/مؤثر) بطريقة تعمل في Remotion Studio
 * (متصفح) وفي الرندر (Node) على حد سواء - getAudioDurationInSeconds تجلب
 * الملف فعليًا فتفشل بأمان إن لم يكن موجودًا، فنعيد false بصمت دون أي خطأ
 * يظهر في الطرفية أو الـ Console.
 */
export async function assetExists(publicPath: string): Promise<boolean> {
  try {
    const seconds = await getAudioDurationInSeconds(staticFile(publicPath));
    return Boolean(seconds && seconds > 0);
  } catch {
    return false;
  }
}

export const SFX_FILES = {
  whoosh: "audio/sfx/whoosh.wav",
  riser: "audio/sfx/riser.wav",
  impact: "audio/sfx/impact.wav",
  tick: "audio/sfx/tick.wav",
  transitionWhoosh: "audio/sfx/transition-whoosh.wav",
  titleHit: "audio/sfx/title-hit.wav",
} as const;

export type SfxKey = keyof typeof SFX_FILES;

export const MUSIC_FILE = "audio/music/theme.mp3";

export async function resolveAssetAvailability(): Promise<{
  music: boolean;
  sfx: Record<SfxKey, boolean>;
}> {
  const sfxKeys = Object.keys(SFX_FILES) as SfxKey[];
  const [music, ...sfxResults] = await Promise.all([
    assetExists(MUSIC_FILE),
    ...sfxKeys.map((k) => assetExists(SFX_FILES[k])),
  ]);
  const sfx = Object.fromEntries(sfxKeys.map((k, i) => [k, sfxResults[i]])) as Record<SfxKey, boolean>;
  return { music, sfx };
}
