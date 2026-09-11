import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { CameraRig } from "../components/CameraRig";
import { SceneChrome } from "../components/SceneChrome";
import { ChangeBadge } from "../components/ChangeBadge";
import { YearTrendLine, TrendPoint } from "../components/YearTrendLine";
import { DistributionBar } from "../components/DistributionBar";
import { Callout } from "../components/Callout";
import { Sfx } from "../components/Sfx";
import { reading } from "../data/grade3";

// Beat lengths mirror the narration's word distribution within the reading
// paragraph (see video/NARRATION-TIMING.md). Reading's distribution levels
// aren't spoken in the script, so that chart appears as a silent supporting
// visual during the closing beat rather than being narration-synced.
const PROFICIENCY_BEAT = 617;
const CLOSING_BEAT = 444;
export const READING_DURATION = PROFICIENCY_BEAT + CLOSING_BEAT;

const PROFICIENCY_TIMINGS = [
  { yearFrame: 77, valueFrame: 231 }, // "نسبة الإتقان بدأت من 63.8 بالمئة عام 2023"
  { yearFrame: 231, valueFrame: 347 }, // "وتراجعت إلى 53.1 بالمئة عام 2025"
  { yearFrame: 347, valueFrame: 617 }, // "...31.3 بالمئة فقط، بانخفاض قدره 19.7 نقطة"
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
  const points = reading.proficiency.series.map((p) => ({ year: p.year, school: p.value }));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.5} />
      <div style={{ width: 1500, display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardTitle text={reading.proficiency.title} from={10} />
          <ChangeBadge change={reading.proficiency.change} decimals={1} from={PROFICIENCY_BADGE_FRAME} />
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

const ClosingBeat: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Sfx kind="whoosh" at={0} volume={0.5} />
    <div style={{ width: 1500, display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <CardTitle text="متوسط درجة الطلبة" from={10} />
        <ChangeBadge change={reading.averageScore.change} decimals={2} from={18} />
      </div>
      <div style={{ background: "#fbfdfc", borderRadius: 24, padding: "36px 50px 20px", boxShadow: "0 20px 60px rgba(21,68,90,0.10)" }}>
        <YearTrendLine
          points={reading.averageScore.series as unknown as TrendPoint[]}
          entities={["school", "admin", "kingdom"]}
          from={15}
          width={1380}
          height={300}
          suffix=""
          decimals={2}
        />
      </div>
      <div style={{ marginTop: 4 }}>
        <DistributionBar distribution={reading.distribution} from={160} width={1500} />
      </div>
      <Callout text="نسبة الإتقان تراجعت بوضوح — مؤشر يحتاج تدخلاً عاجلاً" from={280} tone="warning" />
    </div>
  </AbsoluteFill>
);

export const ReadingScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <SceneChrome sectionTitle="القراءة" />
      <CameraRig durationInFrames={READING_DURATION} intensity={1}>
        <Sequence  durationInFrames={PROFICIENCY_BEAT} layout="absolute-fill">
          <ProficiencyBeat />
        </Sequence>
        <Sequence from={PROFICIENCY_BEAT} durationInFrames={CLOSING_BEAT} layout="absolute-fill">
          <ClosingBeat />
        </Sequence>
      </CameraRig>
    </AbsoluteFill>
  );
};
