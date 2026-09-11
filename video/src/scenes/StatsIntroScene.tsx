import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { brand, fontFamily } from "../brand/tokens";
import { StatsSceneChrome } from "../components/StatsSceneChrome";
import { CountUpNumber } from "../components/CountUpNumber";
import { Sfx } from "../components/Sfx";
import { headlineStats } from "../data/schoolStats";

/**
 * Three beats (employees -> students -> classes), one statistic at a time,
 * each narrated by a real ElevenLabs line (same voice as grade-3/6),
 * public/audio/school-stats/line1.mp3, line2.mp3, line3.mp3. Beat durations
 * are each line's real measured length (30fps) plus an 8-frame lead-in
 * before the audio starts and a 20-frame hold after it ends, matching this
 * project's established word-count-proportional timing approach (no forced
 * alignment available in this environment).
 */
const LEAD_IN = 8;
const HOLD_AFTER = 20;
const LINE1_FRAMES = 104; // line1.mp3, 3.474s
const LINE2_FRAMES = 133; // line2.mp3, 4.441s
const LINE3_FRAMES = 107; // line3.mp3, 3.579s

const EMPLOYEES_BEAT = LEAD_IN + LINE1_FRAMES + HOLD_AFTER;
const STUDENTS_BEAT = LEAD_IN + LINE2_FRAMES + HOLD_AFTER;
const CLASSES_BEAT = LEAD_IN + LINE3_FRAMES + HOLD_AFTER;
export const STATS_INTRO_DURATION = EMPLOYEES_BEAT + STUDENTS_BEAT + CLASSES_BEAT;

const PeopleIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
    <circle cx="34" cy="30" r="14" fill={color} opacity={0.9} />
    <path d="M10 78c0-15 11-24 24-24s24 9 24 24" fill={color} opacity={0.9} />
    <circle cx="66" cy="24" r="11" fill={color} opacity={0.45} />
    <path d="M50 66c2-11 10-17 20-17s17 6 19 17" fill={color} opacity={0.45} />
  </svg>
);

const ClassroomIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
    <rect x="10" y="14" width="76" height="52" rx="6" stroke={color} strokeWidth="5" fill="none" />
    <line x1="10" y1="30" x2="86" y2="30" stroke={color} strokeWidth="4" />
    <path d="M20 66v14M40 66v14M60 66v14M76 66v14" stroke={color} strokeWidth="5" strokeLinecap="round" />
    <rect x="30" y="40" width="10" height="10" fill={color} opacity={0.5} />
    <rect x="48" y="40" width="10" height="10" fill={color} opacity={0.5} />
  </svg>
);

const StatBeat: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  audioSrc: string;
  countFrom: number;
  countDuration: number;
}> = ({ title, value, icon, audioSrc, countFrom, countDuration }) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.1)),
    output: "perceptual-scale",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.5} />
      <Sfx kind="impact" at={countFrom + countDuration} volume={0.4} />
      <Sequence from={LEAD_IN} layout="none">
        <Audio src={staticFile(audioSrc)} />
      </Sequence>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          opacity: appear,
          scale: appear,
        }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "#eef6f2",
            border: `3px solid ${brand.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
        <div style={{ fontFamily, fontSize: 34, fontWeight: 800, color: brand.primaryDark }}>{title}</div>
        <div style={{ fontFamily, fontSize: 108, fontWeight: 900, color: brand.primary }}>
          <CountUpNumber value={value} decimals={0} from={countFrom} durationInFrames={countDuration} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const StatsIntroScene: React.FC = () => {
  const employeesFrom = 0;
  const studentsFrom = employeesFrom + EMPLOYEES_BEAT;
  const classesFrom = studentsFrom + STUDENTS_BEAT;

  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <StatsSceneChrome sectionTitle="الإحصاءات العامة" />

      <Sequence from={employeesFrom} durationInFrames={EMPLOYEES_BEAT} layout="absolute-fill">
        <StatBeat
          title="عدد الموظفات"
          value={headlineStats.employeeCount}
          icon={<PeopleIcon color={brand.primary} />}
          audioSrc="audio/school-stats/line1.mp3"
          countFrom={24}
          countDuration={80}
        />
      </Sequence>

      <Sequence from={studentsFrom} durationInFrames={STUDENTS_BEAT} layout="absolute-fill">
        <StatBeat
          title="عدد الطالبات"
          value={headlineStats.studentCount}
          icon={<PeopleIcon color={brand.teal} />}
          audioSrc="audio/school-stats/line2.mp3"
          countFrom={30}
          countDuration={100}
        />
      </Sequence>

      <Sequence from={classesFrom} durationInFrames={CLASSES_BEAT} layout="absolute-fill">
        <StatBeat
          title="عدد الفصول"
          value={headlineStats.classCount}
          icon={<ClassroomIcon color={brand.blue} />}
          audioSrc="audio/school-stats/line3.mp3"
          countFrom={24}
          countDuration={80}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
