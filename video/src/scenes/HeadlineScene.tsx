import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { headline } from "../data/grade3";
import { CameraRig } from "../components/CameraRig";
import { SceneChrome } from "../components/SceneChrome";
import { ChangeBadge } from "../components/ChangeBadge";
import { YearTrendLine } from "../components/YearTrendLine";

export const HEADLINE_DURATION = 240;

export const HeadlineScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleIn = interpolate(frame, [8, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const points = headline.series.map((p) => ({ year: p.year, school: p.value }));

  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <SceneChrome sectionTitle="المؤشر العام" />
      <CameraRig durationInFrames={HEADLINE_DURATION} intensity={1}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
          <div style={{ width: 1560, display: "flex", flexDirection: "column", gap: 30 }}>
            <div
              style={{
                opacity: titleIn,
                translate: `0 ${interpolate(titleIn, [0, 1], [16, 0])}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontFamily, fontSize: 34, fontWeight: 800, color: brand.primaryDark, maxWidth: 1000 }}>
                {headline.title}
              </div>
              <ChangeBadge change={headline.change} decimals={1} from={22} />
            </div>

            <div
              style={{
                background: "#fbfdfc",
                borderRadius: 28,
                padding: "50px 60px 30px",
                boxShadow: "0 20px 60px rgba(21,68,90,0.10)",
              }}
            >
              <YearTrendLine
                points={points}
                entities={["school"]}
                from={40}
                width={1440}
                height={460}
                suffix="%"
                decimals={1}
                colorOverrides={{ school: brand.primary }}
              />
            </div>
          </div>
        </AbsoluteFill>
      </CameraRig>
    </AbsoluteFill>
  );
};
