import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { brand, fontFamily } from "../brand/tokens";
import { StatsSceneChrome } from "../components/StatsSceneChrome";
import { Sfx } from "../components/Sfx";
import { studentDistribution, studentDistributionTotal } from "../data/schoolStats";

/**
 * Transition line only (presenter voice, public/audio/school-stats/line4.mp3),
 * then the table fills in on its own with no narration - matches "لا أريد
 * قراءة صوتية لكل بيانات الجدول". Per explicit user request, the narrated
 * beat's duration is exactly its audio's length (audio starts at frame 0,
 * no silent lead-in/hold), and the silent table beat is trimmed to just
 * past its last reveal animation, not held longer than needed to read it.
 */
const LINE4_FRAMES = 144; // line4.mp3, 4.780s -> ceil(143.41)
const TRANSITION_BEAT = LINE4_FRAMES;
const TABLE_BEAT = 200; // 12 صفوف (بدون صفوف "مجموع المرحلة" الفرعية) × STAGGER=11 + مهلة استقرار قصيرة
export const STUDENT_DISTRIBUTION_DURATION = TRANSITION_BEAT + TABLE_BEAT;

const TransitionBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sequence from={0} layout="none">
        <Audio src={staticFile("audio/school-stats/line4.mp3")} />
      </Sequence>
      <div style={{ fontFamily, fontSize: 48, fontWeight: 800, color: brand.primaryDark, opacity: t }}>
        وننتقل الآن إلى بيانات الطالبات وتوزيعهن على الفصول
      </div>
    </AbsoluteFill>
  );
};

const TableBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = studentDistribution;
  const STAGGER = 11;
  const headerAppear = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const grandTotalFrame = rows.length * STAGGER + 10;
  const grandTotalAppear = interpolate(frame, [grandTotalFrame, grandTotalFrame + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 118,
        bottom: 64,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 1700,
          background: "#fbfdfc",
          borderRadius: 22,
          padding: "16px 44px",
          boxShadow: "0 20px 60px rgba(21,68,90,0.10)",
          opacity: headerAppear,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.7fr 0.7fr 0.9fr 0.9fr 0.9fr",
            fontFamily,
            fontWeight: 800,
            fontSize: 34,
            color: brand.paper,
            background: brand.primaryDark,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "6px 0", textAlign: "center" }}>الصف</div>
          <div style={{ padding: "6px 0", textAlign: "center" }}>الفصل</div>
          <div style={{ padding: "6px 0", textAlign: "center" }}>سعودية</div>
          <div style={{ padding: "6px 0", textAlign: "center" }}>غير سعودية</div>
          <div style={{ padding: "6px 0", textAlign: "center" }}>المجموع</div>
        </div>

        <div>
          {rows.map((row, i) => {
            const rowFrom = i * STAGGER;
            const local = frame - rowFrom;
            const appear = interpolate(local, [0, 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const showGradeLabel = row.section === "1";
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.7fr 0.7fr 0.9fr 0.9fr 0.9fr",
                  fontFamily,
                  fontSize: 34,
                  fontWeight: 500,
                  color: brand.ink,
                  background: i % 4 < 2 ? "#ffffff" : "#f7faf9",
                  opacity: appear,
                  translate: `0 ${interpolate(appear, [0, 1], [10, 0])}px`,
                  borderBottom: `1px solid ${brand.border}`,
                }}
              >
                <div style={{ padding: "5px 0", textAlign: "center", fontWeight: 700 }}>{showGradeLabel ? row.grade : ""}</div>
                <div style={{ padding: "5px 0", textAlign: "center" }}>{row.section}</div>
                <div style={{ padding: "5px 0", textAlign: "center" }}>{row.saudi}</div>
                <div style={{ padding: "5px 0", textAlign: "center" }}>{row.nonSaudi}</div>
                <div style={{ padding: "5px 0", textAlign: "center", fontWeight: 800 }}>{row.total}</div>
                <Sfx kind="tick" at={rowFrom} volume={0.18} />
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.7fr 0.7fr 0.9fr 0.9fr 0.9fr",
            marginTop: 8,
            fontFamily,
            fontWeight: 900,
            fontSize: 38,
            color: brand.paper,
            background: brand.primary,
            borderRadius: 10,
            opacity: grandTotalAppear,
            scale: grandTotalAppear,
          }}
        >
          <div style={{ padding: "6px 0", textAlign: "center", gridColumn: "1 / 3" }}>المجموع الكلي</div>
          <div style={{ padding: "6px 0", textAlign: "center" }}>{studentDistributionTotal.saudi}</div>
          <div style={{ padding: "6px 0", textAlign: "center" }}>{studentDistributionTotal.nonSaudi}</div>
          <div style={{ padding: "6px 0", textAlign: "center" }}>{studentDistributionTotal.total}</div>
        </div>
        <Sfx kind="impact" at={grandTotalFrame} volume={0.5} />
      </div>
    </div>
  );
};

export const StudentDistributionScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <StatsSceneChrome sectionTitle="توزيع الطالبات على الفصول" />
      <Sfx kind="whoosh" at={0} volume={0.5} />

      <Sequence from={0} durationInFrames={TRANSITION_BEAT} layout="absolute-fill">
        <TransitionBeat />
      </Sequence>

      <Sequence from={TRANSITION_BEAT} durationInFrames={TABLE_BEAT} layout="absolute-fill">
        <TableBeat />
      </Sequence>
    </AbsoluteFill>
  );
};
