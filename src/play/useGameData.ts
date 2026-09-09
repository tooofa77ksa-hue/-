import { useEffect, useState } from "react";
import {
  subscribeAudioSettings,
  subscribeGameSettings,
  subscribePublishedQuestions,
} from "@/lib/repo";
import type { AudioSettings, GameMode, GameSettings, Question } from "@/types/models";

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  useEffect(() => subscribeGameSettings(setSettings), []);
  return settings;
}

export function useAudioSettings() {
  const [settings, setSettings] = useState<AudioSettings | null>(null);
  useEffect(() => subscribeAudioSettings(setSettings), []);
  return settings;
}

/** أسئلة منشورة ومفعّلة حيّة (Real-time) لنمط لعب معيّن. أي نشر/تعديل/حذف
 * تفعله المعلمة من /teacher ينعكس هنا فورًا بدون أي تعديل على الكود. */
export function usePublishedQuestions(gameMode: GameMode | undefined) {
  const [questions, setQuestions] = useState<Question[] | null>(null);

  useEffect(() => {
    if (!gameMode) {
      setQuestions(null);
      return;
    }
    setQuestions(null);
    return subscribePublishedQuestions(setQuestions, gameMode);
  }, [gameMode]);

  return questions;
}
