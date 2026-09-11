import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { StatsSceneChrome } from "../components/StatsSceneChrome";
import { CountUpNumber } from "../components/CountUpNumber";
import { Sfx } from "../components/Sfx";
import { headlineStats } from "../data/schoolStats";

/**
 * Three beats (employees -> students -> classes), one statistic at a time,
 * each narrated. Durations below are a provisional word-count estimate
 * (same methodology as NARRATION-TIMING.md) pending the real narration
 * audio for this section - only this scene's frame counts need adjusting
 * once that audio arrives, nothing else in the project.
 */
const EMPLOYEES_BEAT = 130;
const STUDENTS_BEAT = 130;
const CLASSES_BEAT = 130;
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
  from: number;
}> = ({ title, value, icon, from }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const appear = interpolate(local, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.1)),
    output: "perceptual-scale",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={from} volume={0.5} />
      <Sfx kind="impact" at={from + 40} volume={0.4} />
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
          <CountUpNumber value={value} decimals={0} from={16} durationInFrames={28} />
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
          from={0}
        />
      </Sequence>

      <Sequence from={studentsFrom} durationInFrames={STUDENTS_BEAT} layout="absolute-fill">
        <StatBeat
          title="عدد الطالبات"
          value={headlineStats.studentCount}
          icon={<PeopleIcon color={brand.teal} />}
          from={0}
        />
      </Sequence>

      <Sequence from={classesFrom} durationInFrames={CLASSES_BEAT} layout="absolute-fill">
        <StatBeat
          title="عدد الفصول"
          value={headlineStats.classCount}
          icon={<ClassroomIcon color={brand.blue} />}
          from={0}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
