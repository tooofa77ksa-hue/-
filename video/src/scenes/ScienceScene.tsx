import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { CameraRig } from "../components/CameraRig";
import { Grade6SceneChrome } from "../components/Grade6SceneChrome";
import { ChangeBadge } from "../components/ChangeBadge";
import { YearTrendLine, TrendPoint } from "../components/YearTrendLine";
import { DistributionBar } from "../components/DistributionBar";
import { Callout } from "../components/Callout";
import { Sfx } from "../components/Sfx";
import { science } from "../data/grade6";

// Beat lengths mirror the narration's word distribution within the science
// paragraph (see video/NARRATION-TIMING-grade6.md).
const PROFICIENCY_BEAT = 585;
const AVERAGE_BEAT = 264;
const DISTRIBUTION_BEAT = 265;
export const SCIENCE_DURATION = PROFICIENCY_BEAT + AVERAGE_BEAT + DISTRIBUTION_BEAT;

const PROFICIENCY_TIMINGS = [
  { yearFrame: 0, valueFrame: 189 }, // "...نسبة الإتقان 45 بالمئة فقط عام 2023"
  { yearFrame: 189, valueFrame: 321 }, // "...81.4 بالمئة عام 2025"
  { yearFrame: 321, valueFrame: 585 }, // "...89.4 بالمئة، بزيادة 8 نقاط"
];
const PROFICIENCY_BADGE_FRAME = 550;

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

const ProficiencyBeat: React.FC = () => {
  const points = science.proficiency.series.map((p) => ({ year: p.year, school: p.value }));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.5} />
      <div style={{ width: 1500, display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardTitle text={science.proficiency.title} from={10} />
          <ChangeBadge change={science.proficiency.change} decimals={0} from={PROFICIENCY_BADGE_FRAME} />
        </div>
        <div style={{ background: "#fbfdfc", borderRadius: 28, padding: "50px 60px 30px", boxShadow: "0 20px 60px rgba(21,68,90,0.10)" }}>
          <YearTrendLine
            points={points}
            entities={["school"]}
            from={0}
            pointTimings={PROFICIENCY_TIMINGS}
            width={1380}
            height={420}
            suffix="%"
            decimals={1}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const AverageScoreBeat: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Sfx kind="whoosh" at={0} volume={0.5} />
    <div style={{ width: 1500, display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <CardTitle text="متوسط درجة الطلبة" from={10} />
        <ChangeBadge change={science.averageScore.change} decimals={2} from={18} />
      </div>
      <div style={{ background: "#fbfdfc", borderRadius: 28, padding: "50px 60px 30px", boxShadow: "0 20px 60px rgba(21,68,90,0.10)" }}>
        <YearTrendLine
          points={science.averageScore.series as unknown as TrendPoint[]}
          entities={["school", "admin", "kingdom"]}
          from={15}
          width={1380}
          height={420}
          suffix=""
          decimals={2}
        />
      </div>
    </div>
  </AbsoluteFill>
);

const DistributionBeat: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Sfx kind="whoosh" at={0} volume={0.5} />
    <div style={{ width: 1440, display: "flex", flexDirection: "column", gap: 30 }}>
      <CardTitle text="توزيع الطلبة على مستويات الأداء" from={10} />
      <div style={{ background: "#fbfdfc", borderRadius: 28, padding: "40px 50px", boxShadow: "0 20px 60px rgba(21,68,90,0.10)" }}>
        <DistributionBar distribution={science.distribution} from={20} width={1340} />
      </div>
      <Callout text="34% من الطالبات في المستوى المرتفع من الأداء" from={130} tone="neutral" />
    </div>
  </AbsoluteFill>
);

export const ScienceScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <Grade6SceneChrome sectionTitle="العلوم" />
      <CameraRig durationInFrames={SCIENCE_DURATION} intensity={1}>
        <Sequence  durationInFrames={PROFICIENCY_BEAT} layout="absolute-fill">
          <ProficiencyBeat />
        </Sequence>
        <Sequence from={PROFICIENCY_BEAT} durationInFrames={AVERAGE_BEAT} layout="absolute-fill">
          <AverageScoreBeat />
        </Sequence>
        <Sequence from={PROFICIENCY_BEAT + AVERAGE_BEAT} durationInFrames={DISTRIBUTION_BEAT} layout="absolute-fill">
          <DistributionBeat />
        </Sequence>
      </CameraRig>
    </AbsoluteFill>
  );
};
