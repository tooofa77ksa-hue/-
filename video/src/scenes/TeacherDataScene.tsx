import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { StatsSceneChrome } from "../components/StatsSceneChrome";
import { Sfx } from "../components/Sfx";
import { teachers } from "../data/schoolStats";

/**
 * Transition line (presenter voice), then teacher data table - split into
 * multiple slides so every row stays readable on a large screen. Phone
 * number and username are excluded entirely (never read from
 * data/schoolStats.ts's `teachers`, which doesn't even carry those fields).
 * TRANSITION_BEAT is a provisional word-count estimate pending this
 * section's real narration audio.
 */
const TRANSITION_BEAT = 80;
const ROWS_PER_SLIDE = 8;
const STAGGER = 12;
const HOLD_AFTER = 90;

const slides = (() => {
  const chunks: (typeof teachers[number])[][] = [];
  for (let i = 0; i < teachers.length; i += ROWS_PER_SLIDE) {
    chunks.push(teachers.slice(i, i + ROWS_PER_SLIDE));
  }
  return chunks;
})();

const slideDuration = (rows: number) => rows * STAGGER + HOLD_AFTER + 20;
const SLIDE_DURATIONS = slides.map((s) => slideDuration(s.length));
export const TEACHER_DATA_DURATION = TRANSITION_BEAT + SLIDE_DURATIONS.reduce((a, b) => a + b, 0);

const TransitionBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily, fontSize: 44, fontWeight: 800, color: brand.primaryDark, opacity: t }}>
        والآن مع بيانات المعلمات
      </div>
    </AbsoluteFill>
  );
};

const fieldSpecialty = (t: (typeof teachers)[number]) =>
  t.field === t.specialty ? t.field : `${t.field} - ${t.specialty}`;

const TeacherSlide: React.FC<{ rows: (typeof teachers[number])[]; pageLabel: string }> = ({ rows, pageLabel }) => {
  const frame = useCurrentFrame();
  const headerAppear = interpolate(frame, [0, 16], [0, 1], {
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
      <Sfx kind="whoosh" at={0} volume={0.4} />
      <div
        style={{
          width: 1620,
          background: "#fbfdfc",
          borderRadius: 24,
          padding: "24px 46px",
          boxShadow: "0 20px 60px rgba(21,68,90,0.10)",
          opacity: headerAppear,
        }}
      >
        <div style={{ fontFamily, fontSize: 20, color: brand.muted, textAlign: "left", marginBottom: 6 }}>
          {pageLabel}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr 2fr",
            fontFamily,
            fontWeight: 800,
            fontSize: 22,
            color: brand.paper,
            background: brand.primaryDark,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 18px", textAlign: "center" }}>مجال التدريس والتخصص</div>
          <div style={{ padding: "12px 0", textAlign: "center" }}>المسمى الوظيفي</div>
          <div style={{ padding: "12px 0", textAlign: "center" }}>حالة التوظيف</div>
          <div style={{ padding: "12px 18px", textAlign: "center" }}>الاسم الرباعي</div>
        </div>

        <div>
          {rows.map((t, i) => {
            const rowFrom = i * STAGGER;
            const local = frame - rowFrom;
            const appear = interpolate(local, [0, 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            return (
              <div
                key={t.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1fr 1fr 2fr",
                  fontFamily,
                  fontSize: 20,
                  color: brand.ink,
                  background: i % 2 === 0 ? "#ffffff" : "#f7faf9",
                  opacity: appear,
                  translate: `0 ${interpolate(appear, [0, 1], [10, 0])}px`,
                  borderBottom: `1px solid ${brand.border}`,
                }}
              >
                <div style={{ padding: "9px 18px", textAlign: "center" }}>{fieldSpecialty(t)}</div>
                <div style={{ padding: "9px 0", textAlign: "center" }}>{t.jobTitle}</div>
                <div style={{ padding: "9px 0", textAlign: "center" }}>{t.employmentStatus || "-"}</div>
                <div style={{ padding: "9px 18px", textAlign: "center", fontWeight: 700 }}>{t.name}</div>
                <Sfx kind="tick" at={rowFrom} volume={0.18} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const TeacherDataScene: React.FC = () => {
  let cursor = TRANSITION_BEAT;
  const slideStarts = SLIDE_DURATIONS.map((d) => {
    const start = cursor;
    cursor += d;
    return start;
  });

  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <StatsSceneChrome sectionTitle="بيانات المعلمات" />

      <Sequence from={0} durationInFrames={TRANSITION_BEAT} layout="absolute-fill">
        <TransitionBeat />
      </Sequence>

      {slides.map((rows, i) => (
        <Sequence key={i} from={slideStarts[i]} durationInFrames={SLIDE_DURATIONS[i]} layout="absolute-fill">
          <TeacherSlide rows={rows} pageLabel={`${i + 1} / ${slides.length}`} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
