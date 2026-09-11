import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { CameraRig } from "../components/CameraRig";
import { SceneChrome } from "../components/SceneChrome";
import { ChangeBadge } from "../components/ChangeBadge";
import { YearTrendLine, TrendPoint } from "../components/YearTrendLine";
import { DistributionBar } from "../components/DistributionBar";
import { Sfx } from "../components/Sfx";

const DIST_BEAT = 135;
const AVG_BEAT = 195;
const PROF_BEAT = 195;
export const SUBJECT_DURATION = DIST_BEAT + AVG_BEAT + PROF_BEAT;

type Distribution = { veryLow: number; low: number; medium: number; high: number };
type YearPoint = { year: number; value: number };
type ThreeWayPoint = { year: number; school: number; admin: number; kingdom: number };

const CardTitle: React.FC<{ text: string; from: number }> = ({ text, from }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, from + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        fontFamily,
        fontSize: 32,
        fontWeight: 800,
        color: brand.primaryDark,
        opacity: t,
        translate: `0 ${interpolate(t, [0, 1], [14, 0])}px`,
      }}
    >
      {text}
    </div>
  );
};

const DistributionBeat: React.FC<{ distribution: Distribution }> = ({ distribution }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Sfx kind="whoosh" at={0} volume={0.5} />
    <div style={{ width: 1440, display: "flex", flexDirection: "column", gap: 34 }}>
      <CardTitle text="توزيع الطلبة على مستويات الأداء" from={10} />
      <div style={{ background: "#fbfdfc", borderRadius: 28, padding: "40px 50px", boxShadow: "0 20px 60px rgba(21,68,90,0.10)" }}>
        <DistributionBar distribution={distribution} from={30} width={1340} />
      </div>
    </div>
  </AbsoluteFill>
);

const AverageScoreBeat: React.FC<{ change: number; series: ThreeWayPoint[] }> = ({ change, series }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Sfx kind="whoosh" at={0} volume={0.5} />
    <div style={{ width: 1500, display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <CardTitle text="متوسط درجة الطلبة" from={10} />
        <ChangeBadge change={change} decimals={2} from={18} />
      </div>
      <div style={{ background: "#fbfdfc", borderRadius: 28, padding: "50px 60px 30px", boxShadow: "0 20px 60px rgba(21,68,90,0.10)" }}>
        <YearTrendLine points={series as unknown as TrendPoint[]} entities={["school", "admin", "kingdom"]} from={40} width={1380} height={420} suffix="" decimals={2} />
      </div>
    </div>
  </AbsoluteFill>
);

const ProficiencyBeat: React.FC<{ title: string; change: number; series: YearPoint[] }> = ({ title, change, series }) => {
  const points = series.map((p) => ({ year: p.year, school: p.value }));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.5} />
      <div style={{ width: 1500, display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardTitle text={title} from={10} />
          <ChangeBadge change={change} decimals={1} from={18} />
        </div>
        <div style={{ background: "#fbfdfc", borderRadius: 28, padding: "50px 60px 30px", boxShadow: "0 20px 60px rgba(21,68,90,0.10)" }}>
          <YearTrendLine points={points} entities={["school"]} from={40} width={1380} height={420} suffix="%" decimals={1} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SubjectScene: React.FC<{
  subjectTitle: string;
  distribution: Distribution;
  averageScore: { change: number; series: ThreeWayPoint[] };
  proficiency: { title: string; change: number; series: YearPoint[] };
}> = ({ subjectTitle, distribution, averageScore, proficiency }) => {
  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <SceneChrome sectionTitle={subjectTitle} />
      <CameraRig durationInFrames={SUBJECT_DURATION} intensity={1}>
        <Sequence  durationInFrames={DIST_BEAT} layout="absolute-fill">
          <DistributionBeat distribution={distribution} />
        </Sequence>
        <Sequence from={DIST_BEAT} durationInFrames={AVG_BEAT} layout="absolute-fill">
          <AverageScoreBeat change={averageScore.change} series={averageScore.series} />
        </Sequence>
        <Sequence from={DIST_BEAT + AVG_BEAT} durationInFrames={PROF_BEAT} layout="absolute-fill">
          <ProficiencyBeat title={proficiency.title} change={proficiency.change} series={proficiency.series} />
        </Sequence>
      </CameraRig>
    </AbsoluteFill>
  );
};
