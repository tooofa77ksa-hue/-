import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { StatsSceneChrome } from "../components/StatsSceneChrome";
import { CountUpNumber } from "../components/CountUpNumber";
import { Sfx } from "../components/Sfx";
import { transferredStudents, repeatingStudents } from "../data/orgStats";

/**
 * مشهد مستقل خاص بالطالبات المنقولات من/إلى المدرسة + المعيدات - فُصل عن
 * OrgStatsScene بناءً على طلب صريح من المستخدمة: ما تبغى أي شيء "يروح
 * ويجي" (يختفي) داخل الهيكل التنظيمي - كل حاجة تبقى ظاهرة. بما إن الوقت
 * الصوتي المتاح لـ"الطالبات" في OrgStatsScene ضيق جدًا (جملة قصيرة واحدة
 * قبل الانتقال للحالة الاقتصادية)، حصل هذا المحتوى على مشهد كامل خاص به
 * بدل ما يُحشر بجانبها - زي باقي أجزاء الفيديو (كل قسم مشهد مستقل ثابت لا
 * يختفي شيء منه). بدون تسجيل صوتي بعد - ظهور بصري صامت فقط، نفس أسلوب
 * جدول توزيع الفصول في StudentDistributionScene.
 */
const FROM_START = 20;
const TO_START = 55;
const REPEATING_START = 90;
const HOLD_AFTER = 110;
export const TRANSFERRED_STUDENTS_DURATION = REPEATING_START + HOLD_AFTER;

const StudentsIcon = () => (
  <svg width={44} height={44} viewBox="0 0 48 48" fill="none" stroke={brand.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="15" r="6" />
    <path d="M4 40c0-8 5-13 12-13s12 5 12 13" />
    <circle cx="35" cy="14" r="5" strokeOpacity={0.6} />
    <path d="M26 40c1-7 5-11 9-11s8 4 9 11" strokeOpacity={0.6} />
  </svg>
);

const BigCard: React.FC<{ x: number; label: string; value: number; from: number; accent: string }> = ({ x, label, value, from, accent }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const t = interpolate(local, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
    output: "perceptual-scale",
  });
  if (local < -2) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x - 280,
        top: 420,
        width: 560,
        opacity: t,
        scale: 0.88 + t * 0.12,
        translate: `0 ${interpolate(t, [0, 1], [16, 0])}px`,
      }}
    >
      <Sfx kind="tick" at={from} volume={0.2} />
      <Sfx kind="impact" at={from + 18} volume={0.35} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          background: "#fbfdfc",
          border: `1.5px solid ${brand.border}`,
          borderTop: `5px solid ${accent}`,
          borderRadius: 18,
          boxShadow: "0 14px 36px rgba(21,68,90,0.12)",
          padding: "28px 24px",
        }}
      >
        <div style={{ width: 78, height: 78, borderRadius: "50%", background: "#eef6f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <StudentsIcon />
        </div>
        <div style={{ fontFamily, fontWeight: 700, fontSize: 34, color: brand.muted, textAlign: "center" }}>{label}</div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 76, color: brand.primaryDark }}>
          <CountUpNumber value={value} decimals={0} from={from} durationInFrames={20} />
        </div>
      </div>
    </div>
  );
};

export const TransferredStudentsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleT = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const repeatT = interpolate(frame - REPEATING_START, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <StatsSceneChrome sectionTitle="الطالبات المنقولات" />
      <Sfx kind="whoosh" at={0} volume={0.4} />

      <div
        style={{
          position: "absolute",
          top: 180,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily,
          fontWeight: 800,
          fontSize: 48,
          color: brand.primaryDark,
          opacity: titleT,
        }}
      >
        الطالبات المنقولات من وإلى المدرسة
      </div>

      <BigCard x={960 + 360} label="الطالبات المنقولات من المدرسة" value={transferredStudents.from} from={FROM_START} accent={brand.teal} />
      <BigCard x={960 - 360} label="الطالبات المنقولات إلى المدرسة" value={transferredStudents.to} from={TO_START} accent={brand.primary} />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 760,
          transform: `translateX(-50%) translateY(${interpolate(repeatT, [0, 1], [10, 0])}px)`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: repeatT,
          background: "#f3f5f4",
          borderRadius: 999,
          padding: "10px 26px",
          whiteSpace: "nowrap",
        }}
      >
        <Sfx kind="tick" at={REPEATING_START} volume={0.18} />
        <span style={{ fontFamily, fontWeight: 700, fontSize: 32, color: brand.muted }}>
          {repeatingStudents} طالبات معيدات
        </span>
      </div>
    </AbsoluteFill>
  );
};
