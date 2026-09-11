import { staticFile, Sequence } from "remotion";
import { Audio } from "@remotion/media";

type SfxKind = "whoosh" | "tick" | "impact";

const files: Record<SfxKind, string> = {
  whoosh: staticFile("audio/whoosh.wav"),
  tick: staticFile("audio/tick.wav"),
  impact: staticFile("audio/impact.wav"),
};

/** Plays a short sound effect once, starting at local frame `at`. */
export const Sfx: React.FC<{ kind: SfxKind; at: number; volume?: number }> = ({
  kind,
  at,
  volume = 1,
}) => {
  if (at < 0) return null;
  return (
    <Sequence from={at} layout="none">
      <Audio src={files[kind]} volume={volume} />
    </Sequence>
  );
};

/** Plays a rapid sequence of ticks, one per data point revealed during a count-up. */
export const TickBurst: React.FC<{ from: number; durationInFrames: number; count: number; volume?: number }> = ({
  from,
  durationInFrames,
  count,
  volume = 0.5,
}) => {
  const ticks = Array.from({ length: count }, (_, i) => Math.round(from + (i / (count - 1 || 1)) * durationInFrames));
  return (
    <>
      {ticks.map((t, i) => (
        <Sfx key={i} kind="tick" at={t} volume={volume} />
      ))}
    </>
  );
};
