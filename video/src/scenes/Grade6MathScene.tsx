import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { CameraRig } from "../components/CameraRig";
import { Grade6SceneChrome } from "../components/Grade6SceneChrome";
import { ChangeBadge } from "../components/ChangeBadge";
import { YearTrendLine, TrendPoint } from "../components/YearTrendLine";
import { DistributionBar } from "../components/DistributionBar";
import { Sfx } from "../components/Sfx";
import { math } from "../data/grade6";

// Beat lengths mirror the narration's word distribution within the math
// paragraph (see video/NARRATION-TIMING-grade6.md). The script doesn't
// narrate the distribution levels for math, so that chart appears as a
// silent supporting visual during the average-score beat.
const PROFICIENCY_BEAT = 604;
const AVERAGE_BEAT = 359;
export const MATH_DURATION = PROFICIENCY_BEAT + AVERAGE_BEAT;

const PROFICIENCY_TIMINGS = [
  { yearFrame: 0, valueFrame: 170 }, // "...نسبة الإتقان 37.5 بالمئة عام 2023"
  { yearFrame: 170, valueFrame: 302 }, // "...74.4 بالمئة عام 2025"
  { yearFrame: 302, valueFrame: 604 }, // "...83 بالمئة، بزيادة 8.6 نقطة"
];
const PROFICIENCY_BADGE_FRAME = 570;

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
  const points = math.proficiency.series.map((p) => ({ year: p.year, school: p.value }));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.5} />
      <div style={{ width: 1500, display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardTitle text={math.proficiency.title} from={10} />
          <ChangeBadge change={math.proficiency.change} decimals={1} from={PROFICIENCY_BADGE_FRAME} />
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
    <div style={{ width: 1500, display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <CardTitle text="متوسط درجة الطلبة" from={10} />
        <ChangeBadge change={math.averageScore.change} decimals={2} from={18} />
      </div>
      <div style={{ background: "#fbfdfc", borderRadius: 24, padding: "36px 50px 20px", boxShadow: "0 20px 60px rgba(21,68,90,0.10)" }}>
        <YearTrendLine
          points={math.averageScore.series as unknown as TrendPoint[]}
          entities={["school", "admin", "kingdom"]}
          from={15}
          width={1380}
          height={300}
          suffix=""
          decimals={2}
        />
      </div>
      <div style={{ marginTop: 4 }}>
        <DistributionBar distribution={math.distribution} from={150} width={1500} />
      </div>
    </div>
  </AbsoluteFill>
);

export const Grade6MathScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <Grade6SceneChrome sectionTitle="الرياضيات" />
      <CameraRig durationInFrames={MATH_DURATION} intensity={1}>
        <Sequence  durationInFrames={PROFICIENCY_BEAT} layout="absolute-fill">
          <ProficiencyBeat />
        </Sequence>
        <Sequence from={PROFICIENCY_BEAT} durationInFrames={AVERAGE_BEAT} layout="absolute-fill">
          <AverageScoreBeat />
        </Sequence>
      </CameraRig>
    </AbsoluteFill>
  );
};
