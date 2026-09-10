import type { SceneSchedule, LineSchedule } from "../../../timeline";

export function findLine(scene: SceneSchedule, id: string): LineSchedule {
  const line = scene.lines.find((l) => l.id === id);
  if (!line) {
    throw new Error(`Voiceover line "${id}" not scheduled in scene "${scene.id}" - check timeline.ts`);
  }
  return line;
}

/** فهرس آخر عنصر بدأ توقيته عند/قبل الإطار الحالي (يبقى الإبراز ثابتًا حتى يبدأ التالي) */
export function activeIndexAt(frame: number, starts: number[]): number {
  let active = -1;
  for (let i = 0; i < starts.length; i++) {
    if (frame >= starts[i]) active = i;
  }
  return active;
}
