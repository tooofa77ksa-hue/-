import React from "react";
import type { SceneSchedule } from "../timeline";
import { VoiceoverLine } from "./VoiceoverLine";

/** يشغّل كل جمل التعليق الصوتي المجدوَلة لمشهد واحد */
export const SceneVoiceover: React.FC<{ scene: SceneSchedule }> = ({ scene }) => (
  <>
    {scene.lines.map((line) => (
      <VoiceoverLine key={line.id} line={line} />
    ))}
  </>
);
