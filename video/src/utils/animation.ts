import { Easing, interpolate } from "remotion";
import { easings } from "../styles/tokens";

/** interpolate مع Clamp دائمًا + منحنى ناعم افتراضي - لتفادي تكرار نفس الإعدادات */
export function timedReveal(
  frame: number,
  startFrame: number,
  durationInFrames: number,
  options?: { from?: number; to?: number; easing?: readonly [number, number, number, number] },
): number {
  const { from = 0, to = 1, easing = easings.standard } = options ?? {};
  return interpolate(frame, [startFrame, startFrame + durationInFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...easing),
  });
}

/** يحوّل قيمة 0..1 إلى إزاحة دخول ناعمة (بدون Bounce) */
export function enterOffset(progress: number, distance: number): number {
  return (1 - progress) * distance;
}
