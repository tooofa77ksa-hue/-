import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import type { LineSchedule } from "../timeline";

/** يشغّل جملة تعليق صوتي واحدة عند توفر ملفها الفعلي فقط - بلا أي خطأ صامت أو ظاهر إن لم يوجد */
export const VoiceoverLine: React.FC<{ line: LineSchedule }> = ({ line }) => {
  if (line.source !== "audio-file") return null;
  return (
    <Sequence from={line.sceneRelativeStart} durationInFrames={line.durationInFrames} layout="none">
      <Audio src={staticFile(`audio/voice/${line.id}.mp3`)} />
    </Sequence>
  );
};
