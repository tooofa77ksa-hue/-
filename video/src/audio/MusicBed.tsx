import React from "react";
import { Audio, staticFile } from "remotion";
import type { Timeline } from "../timeline";
import { MUSIC_FILE } from "./checkAssetExists";

const BASE_VOLUME = 0.5;
const DUCKED_VOLUME = 0.14;
const FADE_FRAMES = 18;

function speechIntensityAt(frame: number, timeline: Timeline): number {
  let intensity = 0;
  for (const scene of timeline.scenes) {
    for (const line of scene.lines) {
      const start = scene.startFrame + line.sceneRelativeStart;
      const end = start + line.durationInFrames;
      let local = 0;
      if (frame >= start && frame <= end) {
        local = 1;
      } else if (frame < start && frame >= start - FADE_FRAMES) {
        local = 1 - (start - frame) / FADE_FRAMES;
      } else if (frame > end && frame <= end + FADE_FRAMES) {
        local = 1 - (frame - end) / FADE_FRAMES;
      }
      if (local > intensity) intensity = local;
    }
  }
  return intensity;
}

/**
 * موسيقى خلفية Instrumental بمستوى منخفض ثابت، تُخفَض تلقائيًا (Ducking) في
 * كل مرة تكون فيها المذيعة تتحدث، وترتفع قليلًا فقط في الفواصل/الانتقالات.
 * يُشغَّل الملف فقط إن كان متوفرًا فعليًا (available) - لا صوت اصطناعي بديل.
 */
export const MusicBed: React.FC<{ timeline: Timeline; available: boolean }> = ({
  timeline,
  available,
}) => {
  if (!available) return null;
  return (
    <Audio
      src={staticFile(MUSIC_FILE)}
      volume={(frame) => {
        const speech = speechIntensityAt(frame, timeline);
        return DUCKED_VOLUME + (BASE_VOLUME - DUCKED_VOLUME) * (1 - speech);
      }}
    />
  );
};
