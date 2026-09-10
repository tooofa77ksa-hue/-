import { voiceoverById } from "./data/voiceover-scripts";
import type { ResolvedVoiceLine } from "./audio/getVoiceDuration";
import { layout } from "./styles/tokens";

/**
 * ============================================================
 *  الملف المركزي لترتيب مشاهد الفيديو (Timeline Modular)
 * ============================================================
 * لإضافة قسم جديد مستقبلًا (إحصاءات مدرسة، إنجازات، مرافق...):
 *   1) أضيفي مشهدًا جديدًا في compositions/scenes/<اسم المشهد>.
 *   2) أضيفي نصوص التعليق الصوتي له في data/voiceover-scripts.ts.
 *   3) أضيفي عنصرًا واحدًا هنا في SCENE_DEFINITIONS بترتيب ظهوره.
 *   4) اربطي المكوّن الفعلي في src/Root.tsx ضمن SCENE_COMPONENTS.
 * لا حاجة لتعديل أي توقيت سابق - كل مشهد يحسب توقيته من مدة صوته الفعلية.
 */
export interface SceneDefinition {
  id: string;
  voiceoverIds: string[];
  /** إطارات صامتة قبل بداية أول جملة (لدخول العناصر البصرية بهدوء) */
  leadIn: number;
  /** إطارات صامتة بعد نهاية آخر جملة (للقطة ختامية/Summary قبل الانتقال) */
  leadOut: number;
  /** إطارات فاصلة بين كل جملتين متتاليتين داخل نفس المشهد */
  gapBetweenLines: number;
}

export const SCENE_DEFINITIONS: SceneDefinition[] = [
  { id: "intro", voiceoverIds: ["intro_01"], leadIn: 20, leadOut: 18 },
  {
    id: "nafesThird",
    voiceoverIds: [
      "third_intro_01",
      "third_trend_2023",
      "third_trend_2025",
      "third_trend_2026",
      "third_compare_01",
      "third_subject_math_01",
      "third_subject_reading_01",
      "third_summary_01",
    ],
    leadIn: 18,
    leadOut: 34,
    gapBetweenLines: 8,
  },
  { id: "transition", voiceoverIds: ["transition_01"], leadIn: 8, leadOut: 14, gapBetweenLines: 0 },
  {
    id: "nafesSixth",
    voiceoverIds: [
      "sixth_intro_01",
      "sixth_trend_2023",
      "sixth_trend_2025",
      "sixth_trend_2026",
      "sixth_compare_01",
      "sixth_subject_science_01",
      "sixth_subject_math_01",
      "sixth_subject_reading_01",
      "sixth_summary_01",
    ],
    leadIn: 18,
    leadOut: 34,
    gapBetweenLines: 8,
  },
  { id: "outro", voiceoverIds: ["outro_01"], leadIn: 16, leadOut: 40, gapBetweenLines: 0 },
].map((s) => ({ gapBetweenLines: 12, ...s }));

export interface LineSchedule {
  id: string;
  text: string;
  /** إطار بداية الجملة نسبة إلى بداية المشهد نفسه */
  sceneRelativeStart: number;
  durationInFrames: number;
  source: ResolvedVoiceLine["source"];
}

export interface SceneSchedule {
  id: string;
  startFrame: number;
  durationInFrames: number;
  lines: LineSchedule[];
}

export interface Timeline {
  scenes: SceneSchedule[];
  totalDurationInFrames: number;
  fps: number;
}

/**
 * يبني الجدول الزمني الكامل بالإطارات من مدد الصوت الفعلية (بالثواني).
 * يُستدعى من Root.tsx داخل calculateMetadata قبل الرندر، بحيث تُحسب مدة كل
 * مشهد وكل جملة من الصوت الحقيقي وليس من رقم ثابت مسبقًا.
 */
export function buildTimeline(
  resolved: Record<string, ResolvedVoiceLine>,
  fps: number = layout.fps,
): Timeline {
  let cursor = 0;
  const scenes: SceneSchedule[] = SCENE_DEFINITIONS.map((def) => {
    let localCursor = def.leadIn;
    const lines: LineSchedule[] = def.voiceoverIds.map((id, index) => {
      const r = resolved[id];
      const text = voiceoverById[id]?.text ?? "";
      const durationInFrames = Math.round((r?.seconds ?? 2) * fps);
      const start = localCursor;
      localCursor += durationInFrames + (index < def.voiceoverIds.length - 1 ? def.gapBetweenLines : 0);
      return { id, text, sceneRelativeStart: start, durationInFrames, source: r?.source ?? "estimated" };
    });
    const sceneDuration = localCursor + def.leadOut;
    const schedule: SceneSchedule = {
      id: def.id,
      startFrame: cursor,
      durationInFrames: sceneDuration,
      lines,
    };
    cursor += sceneDuration;
    return schedule;
  });

  return { scenes, totalDurationInFrames: cursor, fps };
}

export function getScene(timeline: Timeline, id: string): SceneSchedule {
  const scene = timeline.scenes.find((s) => s.id === id);
  if (!scene) {
    throw new Error(`Scene "${id}" not found in timeline - check SCENE_DEFINITIONS in timeline.ts`);
  }
  return scene;
}
