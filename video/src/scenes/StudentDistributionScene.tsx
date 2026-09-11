import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { brand, fontFamily } from "../brand/tokens";
import { StatsSceneChrome } from "../components/StatsSceneChrome";
import { Sfx } from "../components/Sfx";
import { studentDistribution, studentDistributionTotal } from "../data/schoolStats";

/**
 * Transition line only (presenter voice, public/audio/school-stats/line4.mp3
 * - 143 frames at 30fps), then the table fills in on its own with no
 * narration - matches "لا أريد قراءة صوتية لكل بيانات الجدول".
 */
const LINE4_FRAMES = 143; // line4.mp3, 4.780s
const TRANSITION_BEAT = 5 + LINE4_FRAMES + 12;
const TABLE_BEAT = 360;
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
      <Sequence from={5} layout="none">
        <Audio src={staticFile("audio/school-stats/line4.mp3")} />
      </Sequence>
      <div style={{ fontFamily, fontSize: 44, fontWeight: 800, color: brand.primaryDark, opacity: t }}>
        وننتقل الآن إلى بيانات الطالبات وتوزيعهن على الفصول
      </div>
    </AbsoluteFill>
  );
};

type Row = { grade: string; section: string; value: number; kind: "section" | "total" };

const buildRows = (): Row[] => {
  const rows: Row[] = [];
  for (const g of studentDistribution) {
    rows.push({ grade: g.grade, section: "1", value: g.section1, kind: "section" });
    rows.push({ grade: g.grade, section: "2", value: g.section2, kind: "section" });
    rows.push({ grade: g.grade, section: "مجموع المرحلة", value: g.total, kind: "total" });
  }
  return rows;
};

const TableBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = buildRows();
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
          width: 1500,
          background: "#fbfdfc",
          borderRadius: 22,
          padding: "20px 44px",
          boxShadow: "0 20px 60px rgba(21,68,90,0.10)",
          opacity: headerAppear,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            fontFamily,
            fontWeight: 800,
            fontSize: 21,
            color: brand.paper,
            background: brand.primaryDark,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "8px 0", textAlign: "center" }}>عدد الطالبات</div>
          <div style={{ padding: "8px 0", textAlign: "center" }}>الفصل</div>
          <div style={{ padding: "8px 0", textAlign: "center" }}>الصف</div>
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
            const isTotal = row.kind === "total";
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  fontFamily,
                  fontSize: 19,
                  fontWeight: isTotal ? 800 : 500,
                  color: isTotal ? brand.primaryDark : brand.ink,
                  background: isTotal ? "#eef6f2" : i % 6 < 3 ? "#ffffff" : "#f7faf9",
                  opacity: appear,
                  translate: `0 ${interpolate(appear, [0, 1], [10, 0])}px`,
                  borderBottom: `1px solid ${brand.border}`,
                }}
              >
                <div style={{ padding: "6px 0", textAlign: "center" }}>{row.value}</div>
                <div style={{ padding: "6px 0", textAlign: "center" }}>{row.section}</div>
                <div style={{ padding: "6px 0", textAlign: "center" }}>{showGradeLabel ? row.grade : ""}</div>
                <Sfx kind="tick" at={rowFrom} volume={0.18} />
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            marginTop: 10,
            fontFamily,
            fontWeight: 900,
            fontSize: 24,
            color: brand.paper,
            background: brand.primary,
            borderRadius: 10,
            opacity: grandTotalAppear,
            scale: grandTotalAppear,
          }}
        >
          <div style={{ padding: "10px 0", textAlign: "center" }}>{studentDistributionTotal}</div>
          <div style={{ padding: "10px 0", textAlign: "center" }}>مجموع الطالبات الكلي</div>
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
