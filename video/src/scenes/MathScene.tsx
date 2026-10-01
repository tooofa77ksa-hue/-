import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { CameraRig } from "../components/CameraRig";
import { SceneChrome } from "../components/SceneChrome";
import { ChangeBadge } from "../components/ChangeBadge";
import { YearTrendLine, TrendPoint } from "../components/YearTrendLine";
import { DistributionBar } from "../components/DistributionBar";
import { Callout } from "../components/Callout";
import { Sfx } from "../components/Sfx";
import { math } from "../data/grade3";

// Beat lengths mirror the narration's word distribution within the math
// paragraph (see video/NARRATION-TIMING.md): proficiency trend gets the
// sentences that actually walk through 2023/2025/2026, average score and
// the distribution note get their own shorter beats.
const PROFICIENCY_BEAT = 618;
const AVERAGE_BEAT = 231;
const DISTRIBUTION_BEAT = 347;
export const MATH_DURATION = PROFICIENCY_BEAT + AVERAGE_BEAT + DISTRIBUTION_BEAT;

const PROFICIENCY_TIMINGS = [
  { yearFrame: 0, valueFrame: 174 }, // "...نسبة الإتقان 48.9 بالمئة عام 2023"
  { yearFrame: 174, valueFrame: 309 }, // "...30.6 بالمئة عام 2025"
  { yearFrame: 309, valueFrame: 618 }, // "...52.1 بالمئة، بزيادة 21.5 نقطة"
];
const PROFICIENCY_BADGE_FRAME = 580;

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
    <div style={{ width: 1500, display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <CardTitle text="متوسط درجة الطلبة" from={10} />
        <ChangeBadge change={math.averageScore.change} decimals={2} from={18} />
      </div>
      <div style={{ background: "#fbfdfc", borderRadius: 28, padding: "50px 60px 30px", boxShadow: "0 20px 60px rgba(21,68,90,0.10)" }}>
        <YearTrendLine
          points={math.averageScore.series as unknown as TrendPoint[]}
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
        <DistributionBar distribution={math.distribution} from={20} width={1340} />
      </div>
      <Callout text="نحو ربع الطالبات لا يزلن ضمن المستوى المنخفض جدًا" from={130} tone="warning" />
    </div>
  </AbsoluteFill>
);

export const MathScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <SceneChrome sectionTitle="الرياضيات" />
      <CameraRig durationInFrames={MATH_DURATION} intensity={1}>
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
