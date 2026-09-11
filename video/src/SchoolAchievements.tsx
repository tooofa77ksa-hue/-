import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { brand, fontFamily } from "./brand/tokens";
import { StatsSceneChrome } from "./components/StatsSceneChrome";
import { Sfx } from "./components/Sfx";
import { competitionName, competitionRanks, honoredStudents } from "./data/achievements";

/**
 * Standalone composition "SchoolAchievements" ("منجزات المدرسة") - a
 * completely separate video from Grade3Nafs/Grade6Nafs/SchoolStats. Built
 * entirely in this new file plus data/achievements.ts; no existing
 * composition, scene, or Root.tsx entry for another video was touched
 * beyond additively registering this one new <Composition>. Reuses
 * StatsSceneChrome/brand tokens/Sfx exactly as-is - no new design system.
 *
 * Narration: ONE continuous ElevenLabs recording of the full script (same
 * voice as the rest of the project), public/audio/achievements-narration.mp3,
 * 29.57s (887 frames). Its actual pace came out slower than the originally
 * planned ~3.1 words/sec, so per the user's own instruction ("اضبط المدة
 * فعليًا حسب طول التعليق الصوتي") the real recording's length governs -
 * the scene now runs ~30s total rather than the initially-targeted 14-20s,
 * since the voice was never sped up or cut to force-fit that window.
 * Per-beat frame counts below are the original word-count proportions
 * rescaled to this real audio length (same methodology as
 * NARRATION-TIMING.md - no forced alignment available in this environment).
 */
const TITLE_BEAT = 35; // "منجزات المدرسة" (2 words)
const SECTION1_TITLE_BEAT = 70; // "الفوز في مسابقة قادمون" (4 words)
const RANK_BEATS = [122, 157, 87, 87]; // one per competitionRanks entry, in order
const SECTION2_TITLE_BEAT = 87; // "كما تم تكريم الطالبات الموهوبات" (5 words)
const STUDENT_BEATS = [139, 104]; // one per honoredStudents entry, in order
const FINAL_HOLD = 18;

export const achievementsTotalDuration =
  TITLE_BEAT +
  SECTION1_TITLE_BEAT +
  RANK_BEATS.reduce((a, b) => a + b, 0) +
  SECTION2_TITLE_BEAT +
  STUDENT_BEATS.reduce((a, b) => a + b, 0) +
  FINAL_HOLD;

const TrophyIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path
      d="M20 10h24v12a12 12 0 0 1-24 0V10Z"
      fill={color}
    />
    <path d="M20 14h-6a2 2 0 0 0-2 2v2a8 8 0 0 0 8 8" stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round" />
    <path d="M44 14h6a2 2 0 0 1 2 2v2a8 8 0 0 1-8 8" stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round" />
    <rect x="29" y="34" width="6" height="10" fill={color} />
    <path d="M18 50h28l-3-6H21l-3 6Z" fill={color} />
  </svg>
);

const StarIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path
      d="M32 6l7.2 15.6L56 24l-12 11.8L47.2 52 32 43.6 16.8 52 20 35.8 8 24l16.8-2.4L32 6Z"
      fill={color}
    />
  </svg>
);

/** Small radial burst behind an icon, plus a handful of outward-fading spark dots. */
const CelebrationBurst: React.FC<{ from: number; strong?: boolean; color: string }> = ({ from, strong, color }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const count = strong ? 10 : 6;
  const radius = interpolate(local, [0, 18], [0, strong ? 130 : 90], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const fade = interpolate(local, [0, 6, 18], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = interpolate(local, [0, 5, 16], [0, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  if (local < 0 || local > 20) return null;
  const dots = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 160,
          height: 160,
          marginLeft: -80,
          marginTop: -80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${brand.paper} 0%, transparent 70%)`,
          opacity: flash,
        }}
      />
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `calc(50% + ${d.x}px)`,
            top: `calc(50% + ${d.y}px)`,
            width: strong ? 10 : 7,
            height: strong ? 10 : 7,
            borderRadius: "50%",
            background: i % 2 === 0 ? color : brand.gold,
            opacity: fade,
            translate: "-50% -50%",
          }}
        />
      ))}
    </div>
  );
};

const SectionTitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.45} />
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 46,
          color: brand.primaryDark,
          opacity: t,
          translate: `0 ${interpolate(t, [0, 1], [12, 0])}px`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const RankBeat: React.FC<{ rank: string; grade: string; year: string; standout?: boolean }> = ({
  rank,
  grade,
  year,
  standout,
}) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.15)),
    output: "perceptual-scale",
  });
  const shine = interpolate(frame, [10, 26, 42], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const color = standout ? brand.gold : brand.primary;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.4} />
      <Sfx kind="impact" at={10} volume={standout ? 0.7 : 0.5} />
      {standout && <Sfx kind="tick" at={16} volume={0.5} />}
      {standout && <Sfx kind="impact" at={20} volume={0.5} />}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <CelebrationBurst from={8} strong={standout} color={color} />
        <div
          style={{
            position: "relative",
            width: standout ? 190 : 150,
            height: standout ? 190 : 150,
            borderRadius: "50%",
            background: standout ? "#fdf8ee" : "#eef6f2",
            border: `3px solid ${standout ? brand.gold : brand.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: appear,
            scale: appear,
          }}
        >
          <TrophyIcon color={color} size={standout ? 96 : 74} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `linear-gradient(120deg, transparent 30%, ${brand.paper} 50%, transparent 70%)`,
              opacity: shine * 0.7,
            }}
          />
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: standout ? 56 : 42,
            color: brand.primaryDark,
            opacity: appear,
          }}
        >
          المركز {rank}
        </div>
        <div style={{ fontFamily, fontWeight: 700, fontSize: 28, color: brand.muted, opacity: appear }}>{grade}</div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 20,
            color: brand.paper,
            background: color,
            borderRadius: 999,
            padding: "6px 20px",
            opacity: appear,
          }}
        >
          {year}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StudentBeat: React.FC<{ name: string; achievement: string; standout?: boolean }> = ({
  name,
  achievement,
  standout,
}) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.15)),
    output: "perceptual-scale",
  });
  const shine = interpolate(frame, [10, 26, 42], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const color = standout ? brand.gold : brand.teal;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.4} />
      <Sfx kind="impact" at={10} volume={standout ? 0.6 : 0.45} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <CelebrationBurst from={8} strong={standout} color={color} />
        <div
          style={{
            position: "relative",
            width: standout ? 170 : 140,
            height: standout ? 170 : 140,
            borderRadius: "50%",
            background: standout ? "#fdf8ee" : "#eef6f2",
            border: `3px solid ${standout ? brand.gold : brand.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: appear,
            scale: appear,
          }}
        >
          <StarIcon color={color} size={standout ? 78 : 60} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `linear-gradient(120deg, transparent 30%, ${brand.paper} 50%, transparent 70%)`,
              opacity: shine * 0.7,
            }}
          />
        </div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 44, color: brand.primaryDark, opacity: appear }}>
          {name}
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: standout ? 24 : 20,
            color: brand.paper,
            background: color,
            borderRadius: 999,
            padding: "8px 24px",
            opacity: appear,
          }}
        >
          {achievement}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TitleBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 60,
          color: brand.primaryDark,
          opacity: t,
          scale: interpolate(t, [0, 1], [0.9, 1]),
        }}
      >
        منجزات المدرسة
      </div>
    </AbsoluteFill>
  );
};

export const SchoolAchievements: React.FC = () => {
  let cursor = 0;
  const titleFrom = cursor;
  cursor += TITLE_BEAT;
  const section1From = cursor;
  cursor += SECTION1_TITLE_BEAT;
  const rankFroms = RANK_BEATS.map((d) => {
    const start = cursor;
    cursor += d;
    return start;
  });
  const section2From = cursor;
  cursor += SECTION2_TITLE_BEAT;
  const studentFroms = STUDENT_BEATS.map((d) => {
    const start = cursor;
    cursor += d;
    return start;
  });

  return (
    <AbsoluteFill style={{ background: brand.paper, fontFamily, direction: "rtl" }}>
      <StatsSceneChrome sectionTitle="منجزات المدرسة" />
      <Audio src={staticFile("audio/achievements-narration.mp3")} />

      <Sequence from={titleFrom} durationInFrames={TITLE_BEAT} layout="absolute-fill">
        <TitleBeat />
      </Sequence>

      <Sequence from={section1From} durationInFrames={SECTION1_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text={`الفوز في ${competitionName}`} />
      </Sequence>

      {competitionRanks.map((r, i) => (
        <Sequence key={i} from={rankFroms[i]} durationInFrames={RANK_BEATS[i]} layout="absolute-fill">
          <RankBeat rank={r.rank} grade={r.grade} year={r.year} standout={r.standout} />
        </Sequence>
      ))}

      <Sequence from={section2From} durationInFrames={SECTION2_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text="تكريم الطالبات الموهوبات" />
      </Sequence>

      {honoredStudents.map((s, i) => (
        <Sequence key={s.name} from={studentFroms[i]} durationInFrames={STUDENT_BEATS[i]} layout="absolute-fill">
          <StudentBeat name={s.name} achievement={s.achievement} standout={s.standout} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
