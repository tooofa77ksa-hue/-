import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { schoolInfo } from "../data/grade3";
import { CameraRig } from "../components/CameraRig";
import { SceneChrome } from "../components/SceneChrome";
import { Sfx } from "../components/Sfx";

// Matches the narration's opening paragraph duration (see
// video/NARRATION-TIMING.md).
export const INTRO_DURATION = 424;

const Field: React.FC<{ label: string; value: string; from: number; align: "start" | "end" }> = ({
  label,
  value,
  from,
  align,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, from + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        opacity: t,
        translate: `0 ${interpolate(t, [0, 1], [16, 0])}px`,
        textAlign: align === "start" ? "right" : "left",
        fontFamily,
      }}
    >
      <div style={{ fontSize: 20, color: brand.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 30, color: brand.primaryDark, fontWeight: 800 }}>{value}</div>
    </div>
  );
};

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();

  const bannerW = interpolate(frame, [0, 20], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const cardIn = interpolate(frame, [16, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: "#f4f7f6" }}>
      <Sfx kind="whoosh" at={0} volume={0.7} />
      <SceneChrome sectionTitle="بطاقة نافس" />
      <CameraRig durationInFrames={INTRO_DURATION} intensity={0.6}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 90 }}>
          <div style={{ width: 1600, display: "flex", flexDirection: "column", gap: 28 }}>
            <div
              style={{
                width: `${bannerW}%`,
                background: brand.primary,
                borderRadius: 20,
                padding: "34px 48px",
                boxShadow: "0 20px 50px rgba(7,168,105,0.25)",
                overflow: "hidden",
              }}
            >
              <div style={{ fontFamily, fontWeight: 900, fontSize: 52, color: "#ffffff", whiteSpace: "nowrap" }}>
                بطاقة نافس
              </div>
            </div>

            <div
              style={{
                opacity: cardIn,
                translate: `0 ${interpolate(cardIn, [0, 1], [24, 0])}px`,
                background: brand.paper,
                borderRadius: 24,
                padding: "44px 56px",
                boxShadow: "0 20px 60px rgba(21,68,90,0.12)",
                display: "flex",
                flexDirection: "column",
                gap: 36,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Field label="اسم المدرسة" value={schoolInfo.schoolName} from={26} align="start" />
                <Field label="الرقم الوزاري" value={schoolInfo.ministryNumber} from={30} align="end" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Field label="إدارة التعليم" value={schoolInfo.educationAdmin} from={34} align="start" />
                <Field label="المنطقة" value={schoolInfo.region} from={38} align="end" />
              </div>
              <div style={{ height: 2, background: brand.border }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Field label="الصف" value={schoolInfo.grade} from={44} align="start" />
                <Field label="العام الدراسي" value={schoolInfo.academicYear} from={48} align="end" />
                <Field
                  label="عدد الطلبة / المختبرين"
                  value={`${schoolInfo.totalStudents} / ${schoolInfo.testedStudents}`}
                  from={52}
                  align="end"
                />
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </CameraRig>
    </AbsoluteFill>
  );
};
