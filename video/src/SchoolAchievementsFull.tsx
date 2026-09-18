import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { brand, fontFamily } from "./brand/tokens";
import { StatsSceneChrome } from "./components/StatsSceneChrome";
import { Sfx } from "./components/Sfx";
import { CategoryIcon } from "./components/CategoryIcon";
import {
  schoolAchievements,
  competitionName,
  competitionRanks,
  teacherAchievements,
  initiatives,
  studentAchievements,
  honoredStudents,
  environmentItems,
  type TeacherAchievement,
  type CompetitionRank,
} from "./data/achievementsFull";

/**
 * SchoolAchievementsFull ("منجزات المدرسة") - النسخة المعتمدة النهائية،
 * مقطع واحد مدمج (يستبدل SchoolAchievements.tsx + SchoolEnvironment.tsx
 * القديمين، اللذين تُركا على القرص دون حذف كمرجع فقط - غير مسجَّلين في
 * Root.tsx). ستة أقسام بالترتيب المعتمد: منجزات المدرسة، إنجازات
 * المعلمات، المبادرات الداخلية، إنجازات الطالبات، الموهبة، ثم - بعد
 * انتقال احترافي - منجزات المدرسة قبل وبعد.
 *
 * التوقيت مبني على التسجيل الصوتي الحقيقي (audio/achievements-full-narration.mp3،
 * 278.18 ثانية، صوت Layla - ElevenLabs). المنهجية: قُسِّم نص التعليق الفعلي
 * إلى مقاطع مطابقة لكل بطاقة/عنصر مرئي، حُسب عدد كلمات كل مقطع، ثم استُخدمت
 * نسبة الكلمات التراكمية لتقدير زمن بداية كل مقطع، وأخيرًا طابقنا كل تقدير مع
 * أقرب سكتة صمت حقيقية من `ffmpeg -af silencedetect=noise=-30dB:d=0.35`
 * (نفس أسلوب SchoolAchievements.tsx الأصلي). كل رقم إطار أدناه مشتق من هذه
 * المطابقة الفعلية - لا تخمين. حيث كانت جملتان تُنطقان معًا (مثل حنان آل عوض
 * وفوزية الحربي، أو شهادة المركز الأول + الدرع)، عُرضتا كبطاقة واحدة مشتركة
 * بدل تقسيمهما إلى مشاهد منفصلة قصيرة جدًا لا تكفي لعرض احترافي.
 */

// ===== مقدمة (تظهر فوق أول 5 ثوانٍ من التعليق دون تأخير الصوت) =====
const INTRO_FROM = 0;
const INTRO_DUR = 90; // "منجزات المدرسة" - العنوان الرئيسي
const S1_TITLE_FROM = 90;
const S1_TITLE_DUR = 60; // "أولًا: منجزات المدرسة"

// ===== أولًا: منجزات المدرسة (7 شهادات) =====
const S1_CARD_FROM = [150, 629, 960, 1165, 1727, 2009, 2571];
const S1_CARD_DUR = [479, 331, 205, 562, 282, 562, 170];

// ===== مسابقة قادمون =====
const RANK_TITLE_FROM = 2741;
const RANK_TITLE_DUR = 164;
const RANK1_FROM = 2905;
const RANK1_DUR = 241;
const RANK1_TROPHY_LOCAL = 222; // نقطة ظهور الدرع داخل بطاقة المركز الأول (لحظة نطق "ودرعًا")
const RANK2_FROM = 3146;
const RANK2_DUR = 115;
const RANK3_FROM = 3261;
const RANK3_DUR = 116;

// ===== ثانيًا: إنجازات المعلمات =====
const S2_TITLE_FROM = 3377;
const S2_TITLE_DUR = 172;
const TEACHER_PAIR_FROM = 3549; // حنان آل عوض + فوزية الحربي معًا (نُطقتا في جملة واحدة)
const TEACHER_PAIR_DUR = 294;
const TEACHER_SINGLE_FROM = [3843, 4219]; // حنان العمري، عبير المطيري
const TEACHER_SINGLE_DUR = [376, 234];

// ===== ثالثًا: المبادرات الداخلية =====
const S3_TITLE_FROM = 4453;
const S3_TITLE_DUR = 150;
const INIT1_FROM = 4603;
const INIT1_DUR = 570;
const INIT_REST_FROM = [5173, 5265]; // منصة الرياضيات، تطبيق أثر
const INIT_REST_DUR = [92, 510];

// ===== رابعًا: إنجازات الطالبات =====
const S4_TITLE_FROM = 5775;
const S4_TITLE_DUR = 90;
const STUDENT1_FROM = 5865;
const STUDENT1_DUR = 184;

// ===== خامسًا: الموهبة =====
const S5_TITLE_FROM = 6049;
const S5_TITLE_DUR = 256;
const GIFTED_FROM = [6305, 6451];
const GIFTED_DUR = [146, 113];

// ===== انتقال احترافي (يظهر فوق آخر ثانيتين من قسم الموهبة، دون تأخير الصوت) =====
const TRANSITION_FROM = 6544;
const TRANSITION_DUR = 20;

// ===== سادسًا: منجزات المدرسة قبل وبعد =====
const S6_TITLE_FROM = 6564;
const S6_TITLE_DUR = 127;
const ENV_FROM = [6691, 7060, 7360, 7594];
const ENV_DUR = [369, 300, 234, 195];

// ===== خاتمة (تمتد بعد نهاية التعليق الصوتي بثانيتين ونصف لإعطاء وقت هدوء قبل الإغلاق) =====
const OUTRO_FROM = 7789;
const OUTRO_DUR = 631;

export const achievementsFullTotalDuration = OUTRO_FROM + OUTRO_DUR;

const fadeUp = (frame: number, from = 0, dur = 16, dist = 14) => ({
  opacity: interpolate(frame, [from, from + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  y: interpolate(frame, [from, from + dur], [dist, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
});

/**
 * شارة الأيقونة - تظهر كـ"ختم اعتماد" بعد استقرار البطاقة تمامًا (لا قبلها
 * ولا معها)، بدوران بسيط ينحل إلى الصفر ودفعة خفيفة (Overshoot صغير جدًا،
 * وليس ارتدادًا مبالغًا فيه) - يوحي بختم رسمي يُطبَع على الوثيقة.
 */
const IconBadge: React.FC<{ kind: Parameters<typeof CategoryIcon>[0]["kind"]; color?: string; startFrame?: number }> = ({
  kind,
  color = brand.primary,
  startFrame = 20,
}) => {
  const frame = useCurrentFrame();
  const stamp = interpolate(frame, [startFrame, startFrame + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.15)),
  });
  const rotate = interpolate(frame, [startFrame, startFrame + 16], [-10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: "absolute",
        top: -16,
        right: -16,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: brand.paper,
        border: `2px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 18px rgba(21,68,90,0.18)",
        opacity: stamp,
        transform: `scale(${stamp}) rotate(${rotate}deg)`,
      }}
    >
      <CategoryIcon kind={kind} color={color} size={30} />
    </div>
  );
};

/** إدراج صورة الدرع الحقيقية داخل بطاقة المركز الأول، تظهر بالضبط عند نطق "ودرعًا". */
const TrophyInset: React.FC<{ image: string; startFrame: number }> = ({ image, startFrame }) => {
  const frame = useCurrentFrame();
  const stamp = interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.15)),
  });
  const rotate = interpolate(frame, [startFrame, startFrame + 18], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: "absolute",
        bottom: -26,
        left: -26,
        width: 176,
        height: 132,
        borderRadius: 14,
        overflow: "hidden",
        background: brand.paper,
        border: `3px solid ${brand.gold}`,
        boxShadow: "0 12px 26px rgba(21,68,90,0.24)",
        opacity: stamp,
        transform: `scale(${stamp}) rotate(${rotate}deg)`,
      }}
    >
      <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
};

const SectionTitle: React.FC<{ text: string; sub?: string }> = ({ text, sub }) => {
  const frame = useCurrentFrame();
  const t = fadeUp(frame, 0, 16, 16);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.4} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: t.opacity, translate: `0 ${t.y}px` }}>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 50, color: brand.primaryDark }}>{text}</div>
        {sub && <div style={{ fontFamily, fontWeight: 700, fontSize: 24, color: brand.muted }}>{sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

/**
 * تتابع كشف "رسمي" هادئ بلا ارتداد: 1) الإطار يتلاشى ويتوسّع بنعومة
 * (Fade+Scale، بلا Wipe حاد) 2) خط تمييز علوي رفيع "ينسدل" كشريط افتتاح
 * وثيقة رسمية 3) تكبير بطيء مستمر طوال مدة العرض (Ken Burns) يمنح حياة
 * بصرية هادئة دون إلهاء 4) الختم (IconBadge) يظهر بعد استقرار الإطار.
 */
const RevealCard: React.FC<{
  width: number;
  height: number;
  children: React.ReactNode;
  icon?: Parameters<typeof CategoryIcon>[0]["kind"];
  iconColor?: string;
  holdFrames?: number;
}> = ({ width, height, children, icon, iconColor, holdFrames = 200 }) => {
  const frame = useCurrentFrame();
  const frameIn = interpolate(frame, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const accentIn = interpolate(frame, [4, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const zoom = interpolate(frame, [0, holdFrames], [1, 1.045], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.ease) });
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          width,
          height,
          borderRadius: 16,
          overflow: "hidden",
          background: brand.paper,
          border: `2px solid ${brand.border}`,
          boxShadow: "0 22px 55px rgba(21,68,90,0.16)",
          opacity: frameIn,
          transform: `scale(${0.94 + frameIn * 0.06})`,
        }}
      >
        <div style={{ width: "100%", height: "100%", transform: `scale(${zoom})` }}>{children}</div>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: brand.primary,
            transform: `scaleX(${accentIn})`,
            transformOrigin: "right",
          }}
        />
      </div>
      {icon && <IconBadge kind={icon} color={iconColor} startFrame={22} />}
    </div>
  );
};

const CaptionPill: React.FC<{ text: string; startFrame?: number; color?: string }> = ({ text, startFrame = 24, color = brand.primary }) => {
  const frame = useCurrentFrame();
  const t = fadeUp(frame, startFrame, 14, 10);
  return (
    <div
      style={{
        fontFamily,
        fontWeight: 800,
        fontSize: 24,
        color: brand.paper,
        background: color,
        borderRadius: 999,
        padding: "8px 26px",
        textAlign: "center",
        maxWidth: 920,
        opacity: t.opacity,
        translate: `0 ${t.y}px`,
      }}
    >
      {text}
    </div>
  );
};

/** ============== القسم الأول: منجزات المدرسة ============== */
const SchoolAchievementCard: React.FC<{ image: string; caption: string; icon: Parameters<typeof CategoryIcon>[0]["kind"]; holdFrames: number }> = ({
  image,
  caption,
  icon,
  holdFrames,
}) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Sfx kind="whoosh" at={0} volume={0.32} />
    <Sfx kind="tick" at={4} volume={0.18} />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      <RevealCard width={840} height={560} icon={icon} holdFrames={holdFrames}>
        <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </RevealCard>
      <CaptionPill text={caption} />
    </div>
  </AbsoluteFill>
);

/** بطاقة المركز الأول - شهادة + إدراج صورة الدرع الحقيقية عند نطق "ودرعًا". */
const RankOneCard: React.FC<{ rank: CompetitionRank; trophyImage: string; trophyStartFrame: number; holdFrames: number }> = ({
  rank,
  trophyImage,
  trophyStartFrame,
  holdFrames,
}) => {
  const frame = useCurrentFrame();
  const t = fadeUp(frame, 0, 16, 12);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <Sfx kind="impact" at={10} volume={0.5} />
      <Sfx kind="impact" at={trophyStartFrame} volume={0.4} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ opacity: t.opacity, translate: `0 ${t.y}px`, display: "flex", alignItems: "center", gap: 14 }}>
          <CategoryIcon kind="trophy" color={brand.gold} size={40} />
          <div style={{ fontFamily, fontWeight: 900, fontSize: 44, color: brand.primaryDark }}>المركز {rank.rank}</div>
        </div>
        <div style={{ position: "relative" }}>
          <RevealCard width={500} height={640} holdFrames={holdFrames}>
            <Img src={staticFile(rank.image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </RevealCard>
          <TrophyInset image={trophyImage} startFrame={trophyStartFrame} />
        </div>
        <div style={{ display: "flex", gap: 14, opacity: t.opacity }}>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 22, color: brand.muted }}>{rank.grade}</div>
          <div style={{ fontFamily, fontWeight: 800, fontSize: 16, color: brand.paper, background: brand.gold, borderRadius: 999, padding: "4px 16px" }}>
            {rank.year}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const RankCard: React.FC<{ rank: string; grade: string; year: string; image: string; holdFrames: number }> = ({
  rank,
  grade,
  year,
  image,
  holdFrames,
}) => {
  const frame = useCurrentFrame();
  const t = fadeUp(frame, 0, 16, 12);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <Sfx kind="impact" at={10} volume={0.35} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ opacity: t.opacity, translate: `0 ${t.y}px`, display: "flex", alignItems: "center", gap: 14 }}>
          <CategoryIcon kind="trophy" color={brand.primary} size={36} />
          <div style={{ fontFamily, fontWeight: 900, fontSize: 36, color: brand.primaryDark }}>المركز {rank}</div>
        </div>
        <RevealCard width={460} height={580} holdFrames={holdFrames}>
          <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </RevealCard>
        <div style={{ display: "flex", gap: 14, opacity: t.opacity }}>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 22, color: brand.muted }}>{grade}</div>
          <div style={{ fontFamily, fontWeight: 800, fontSize: 16, color: brand.paper, background: brand.primary, borderRadius: 999, padding: "4px 16px" }}>
            {year}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** ============== القسم الثاني: إنجازات المعلمات ============== */
/** حنان آل عوض وفوزية الحربي كُرِّمتا معًا في جملة واحدة - بطاقة مشتركة واحدة بدل مقطعين قصيرين جدًا. */
const TeacherPairCard: React.FC<{ a: TeacherAchievement; b: TeacherAchievement; holdFrames: number }> = ({ a, b, holdFrames }) => {
  const frame = useCurrentFrame();
  const textT = fadeUp(frame, 30, 16, 10);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <Sfx kind="tick" at={4} volume={0.18} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "row-reverse", gap: 30 }}>
          <RevealCard width={440} height={400} icon="medal" holdFrames={holdFrames}>
            <Img src={staticFile(a.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </RevealCard>
          <RevealCard width={440} height={400} icon="medal" holdFrames={holdFrames}>
            <Img src={staticFile(b.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </RevealCard>
        </div>
        <div style={{ opacity: textT.opacity, translate: `0 ${textT.y}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 30, color: brand.primaryDark }}>
            {a.name} · {b.name}
          </div>
          <div
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: 20,
              color: brand.paper,
              background: brand.teal,
              borderRadius: 999,
              padding: "6px 22px",
              textAlign: "center",
              maxWidth: 840,
            }}
          >
            {a.achievement}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TeacherCard: React.FC<{ image: string; name: string; achievement: string; holdFrames: number }> = ({ image, name, achievement, holdFrames }) => {
  const frame = useCurrentFrame();
  const textT = fadeUp(frame, 28, 16, 10);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <Sfx kind="tick" at={4} volume={0.18} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <RevealCard width={580} height={480} icon="medal" holdFrames={holdFrames}>
          <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </RevealCard>
        <div style={{ opacity: textT.opacity, translate: `0 ${textT.y}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 32, color: brand.primaryDark }}>{name}</div>
          <div
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: 20,
              color: brand.paper,
              background: brand.teal,
              borderRadius: 999,
              padding: "6px 22px",
              textAlign: "center",
              maxWidth: 760,
            }}
          >
            {achievement}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** ============== القسم الثالث: المبادرات الداخلية ============== */
const InitiativeCard: React.FC<{
  title: string;
  owner: string;
  description: string;
  image: string;
  icon: Parameters<typeof CategoryIcon>[0]["kind"];
  holdFrames: number;
}> = ({ title, owner, description, image, icon, holdFrames }) => {
  const frame = useCurrentFrame();
  const textT = fadeUp(frame, 28, 16, 10);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, maxWidth: 520, opacity: textT.opacity, translate: `0 ${textT.y}px` }}>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 36, color: brand.primaryDark, textAlign: "right" }}>{title}</div>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 20, color: brand.teal, textAlign: "right" }}>{owner}</div>
          <div style={{ fontFamily, fontWeight: 500, fontSize: 22, color: brand.muted, textAlign: "right", lineHeight: 1.6 }}>{description}</div>
        </div>
        <RevealCard width={560} height={460} icon={icon} holdFrames={holdFrames}>
          <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#f4f5f4" }} />
        </RevealCard>
      </div>
    </AbsoluteFill>
  );
};

/** ============== القسم الرابع: إنجازات الطالبات ============== */
const StudentAchievementCard: React.FC<{ name: string; competition: string; result: string; year: string; image: string; holdFrames: number }> = ({
  name,
  competition,
  result,
  year,
  image,
  holdFrames,
}) => {
  const frame = useCurrentFrame();
  const textT = fadeUp(frame, 28, 16, 10);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <Sfx kind="impact" at={12} volume={0.4} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <RevealCard width={420} height={560} icon="camera" holdFrames={holdFrames}>
          <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </RevealCard>
        <div style={{ opacity: textT.opacity, translate: `0 ${textT.y}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 32, color: brand.primaryDark }}>{name}</div>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 20, color: brand.muted }}>{competition}</div>
          <div style={{ fontFamily, fontWeight: 800, fontSize: 20, color: brand.paper, background: brand.gold, borderRadius: 999, padding: "6px 22px" }}>
            {result} - {year}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** ============== القسم الخامس: الموهبة ============== */
const GiftedCard: React.FC<{ shortName: string; achievement: string; standout?: boolean; certificate: string; holdFrames: number }> = ({
  shortName,
  achievement,
  standout,
  certificate,
  holdFrames,
}) => {
  const frame = useCurrentFrame();
  const color = standout ? brand.gold : brand.teal;
  const t = fadeUp(frame, 0, 16, 12);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <Sfx kind="impact" at={10} volume={standout ? 0.5 : 0.38} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ opacity: t.opacity, translate: `0 ${t.y}px`, display: "flex", alignItems: "center", gap: 12 }}>
          <CategoryIcon kind="star" color={color} size={38} />
          <div style={{ fontFamily, fontWeight: 900, fontSize: 32, color: brand.primaryDark }}>{shortName}</div>
        </div>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 18, color: brand.paper, background: color, borderRadius: 999, padding: "5px 18px", opacity: t.opacity }}>
          {achievement}
        </div>
        <RevealCard width={620} height={420} holdFrames={holdFrames}>
          <Img src={staticFile(certificate)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </RevealCard>
      </div>
    </AbsoluteFill>
  );
};

/** ============== انتقال احترافي بين المنجزات والبيئة ============== */
const SectionTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, TRANSITION_DUR], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: brand.primaryDark, opacity: interpolate(t, [0, 0.5, 1], [0, 1, 0]) }}>
      <Sfx kind="whoosh" at={2} volume={0.5} />
    </AbsoluteFill>
  );
};

/** ============== القسم السادس: منجزات المدرسة قبل وبعد - Split Screen حقيقي ============== */
const BeforeAfterSplit: React.FC<{ title: string; before: string; after: string; holdFrames: number }> = ({ title, before, after, holdFrames }) => {
  const frame = useCurrentFrame();
  const titleT = fadeUp(frame, 0, 16, 12);
  const panelT = interpolate(frame, [6, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const zoom = interpolate(frame, [0, holdFrames], [1, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const panel = (label: string, src: string, side: "right" | "left", accent: string) => (
    <div
      style={{
        position: "relative",
        width: 720,
        height: 620,
        borderRadius: 16,
        overflow: "hidden",
        background: "#f4f5f4",
        border: `2px solid ${brand.border}`,
        boxShadow: "0 22px 55px rgba(21,68,90,0.16)",
        opacity: panelT,
        translate: `${side === "right" ? (1 - panelT) * 40 : (1 - panelT) * -40}px 0`,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "contain", transform: side === "left" ? `scale(${zoom})` : undefined }}
      />
      <div
        style={{
          position: "absolute",
          top: 16,
          [side]: 16,
          fontFamily,
          fontWeight: 800,
          fontSize: 22,
          color: brand.paper,
          background: accent,
          borderRadius: 999,
          padding: "6px 22px",
        } as React.CSSProperties}
      >
        {label}
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <Sfx kind="tick" at={24} volume={0.2} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 34, color: brand.primaryDark, opacity: titleT.opacity, translate: `0 ${titleT.y}px` }}>
          {title}
        </div>
        <div style={{ display: "flex", flexDirection: "row-reverse", gap: 24 }}>
          {panel("قبل", before, "right", brand.muted)}
          {panel("بعد", after, "left", brand.primary)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const t = fadeUp(frame, 0, 20, 16);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.4} />
      <Sfx kind="impact" at={18} volume={0.35} />
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 36,
          color: brand.primaryDark,
          textAlign: "center",
          maxWidth: 1420,
          lineHeight: 1.7,
          opacity: t.opacity,
          translate: `0 ${t.y}px`,
        }}
      >
        هذه نماذج من أبرز الجهود والمنجزات التي تحققت في المدرسة، ثمرةً للعمل التكاملي وتكاتف الجهود، وسعيًا مستمرًا نحو تطوير البيئة التعليمية، ودعم الطالبات، وتفعيل التقنية، وتحسين جودة التجربة المدرسية
      </div>
    </AbsoluteFill>
  );
};

export const SchoolAchievementsFull: React.FC = () => {
  const teacherPairA = teacherAchievements[0];
  const teacherPairB = teacherAchievements[1];
  const teacherRest = teacherAchievements.slice(2);

  const initFirst = initiatives[0];
  const initRest = initiatives.slice(1);

  const chromeTitleAt = (frame: number): string => {
    if (frame < S2_TITLE_FROM) return "منجزات المدرسة";
    if (frame < S3_TITLE_FROM) return "إنجازات المعلمات والموظفات";
    if (frame < S4_TITLE_FROM) return "المبادرات الداخلية النوعية";
    if (frame < S5_TITLE_FROM) return "إنجازات الطالبات";
    if (frame < S6_TITLE_FROM) return "الموهبة";
    return "منجزات المدرسة - قبل وبعد";
  };

  return (
    <AbsoluteFill style={{ background: brand.paper, fontFamily, direction: "rtl" }}>
      <Audio src={staticFile("audio/achievements-full-narration.mp3")} />

      {[S2_TITLE_FROM, S3_TITLE_FROM, S4_TITLE_FROM, S5_TITLE_FROM, S6_TITLE_FROM, achievementsFullTotalDuration].map((boundary, i, arr) => {
        const start = i === 0 ? INTRO_FROM : arr[i - 1];
        return (
          <Sequence key={i} from={start} durationInFrames={boundary - start} layout="absolute-fill">
            <StatsSceneChrome sectionTitle={chromeTitleAt(start)} />
          </Sequence>
        );
      })}

      <Sequence from={INTRO_FROM} durationInFrames={INTRO_DUR} layout="absolute-fill">
        <SectionTitle text="منجزات المدرسة" sub="توثيق لأبرز المنجزات والشهادات والمبادرات وأعمال التطوير" />
      </Sequence>

      <Sequence from={S1_TITLE_FROM} durationInFrames={S1_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="أولًا: منجزات المدرسة" />
      </Sequence>
      {schoolAchievements.map((a, i) => (
        <Sequence key={a.image} from={S1_CARD_FROM[i]} durationInFrames={S1_CARD_DUR[i]} layout="absolute-fill">
          <SchoolAchievementCard image={a.image} caption={a.caption} icon={a.icon} holdFrames={S1_CARD_DUR[i]} />
        </Sequence>
      ))}

      <Sequence from={RANK_TITLE_FROM} durationInFrames={RANK_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text={competitionName} sub="1447هـ" />
      </Sequence>
      <Sequence from={RANK1_FROM} durationInFrames={RANK1_DUR} layout="absolute-fill">
        <RankOneCard
          rank={competitionRanks[0]}
          trophyImage="achievements/qadimoon-rank1-trophy.jpg"
          trophyStartFrame={RANK1_TROPHY_LOCAL}
          holdFrames={RANK1_DUR}
        />
      </Sequence>
      <Sequence from={RANK2_FROM} durationInFrames={RANK2_DUR} layout="absolute-fill">
        <RankCard rank={competitionRanks[1].rank} grade={competitionRanks[1].grade} year={competitionRanks[1].year} image={competitionRanks[1].image} holdFrames={RANK2_DUR} />
      </Sequence>
      <Sequence from={RANK3_FROM} durationInFrames={RANK3_DUR} layout="absolute-fill">
        <RankCard rank={competitionRanks[2].rank} grade={competitionRanks[2].grade} year={competitionRanks[2].year} image={competitionRanks[2].image} holdFrames={RANK3_DUR} />
      </Sequence>

      <Sequence from={S2_TITLE_FROM} durationInFrames={S2_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="ثانيًا: إنجازات المعلمات والموظفات" />
      </Sequence>
      <Sequence from={TEACHER_PAIR_FROM} durationInFrames={TEACHER_PAIR_DUR} layout="absolute-fill">
        <TeacherPairCard a={teacherPairA} b={teacherPairB} holdFrames={TEACHER_PAIR_DUR} />
      </Sequence>
      {teacherRest.map((t, i) => (
        <Sequence key={t.name} from={TEACHER_SINGLE_FROM[i]} durationInFrames={TEACHER_SINGLE_DUR[i]} layout="absolute-fill">
          <TeacherCard image={t.image} name={t.name} achievement={t.achievement} holdFrames={TEACHER_SINGLE_DUR[i]} />
        </Sequence>
      ))}

      <Sequence from={S3_TITLE_FROM} durationInFrames={S3_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="ثالثًا: المبادرات الداخلية" />
      </Sequence>
      <Sequence from={INIT1_FROM} durationInFrames={INIT1_DUR} layout="absolute-fill">
        <InitiativeCard title={initFirst.title} owner={initFirst.owner} description={initFirst.description} image={initFirst.image} icon={initFirst.icon} holdFrames={INIT1_DUR} />
      </Sequence>
      {initRest.map((it, i) => (
        <Sequence key={it.title} from={INIT_REST_FROM[i]} durationInFrames={INIT_REST_DUR[i]} layout="absolute-fill">
          <InitiativeCard title={it.title} owner={it.owner} description={it.description} image={it.image} icon={it.icon} holdFrames={INIT_REST_DUR[i]} />
        </Sequence>
      ))}

      <Sequence from={S4_TITLE_FROM} durationInFrames={S4_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="رابعًا: إنجازات الطالبات" />
      </Sequence>
      <Sequence from={STUDENT1_FROM} durationInFrames={STUDENT1_DUR} layout="absolute-fill">
        <StudentAchievementCard
          name={studentAchievements[0].name}
          competition={studentAchievements[0].competition}
          result={studentAchievements[0].result}
          year={studentAchievements[0].year}
          image={studentAchievements[0].image}
          holdFrames={STUDENT1_DUR}
        />
      </Sequence>

      <Sequence from={S5_TITLE_FROM} durationInFrames={S5_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="خامسًا: الموهبة" />
      </Sequence>
      {honoredStudents.map((s, i) => (
        <Sequence key={s.shortName} from={GIFTED_FROM[i]} durationInFrames={GIFTED_DUR[i]} layout="absolute-fill">
          <GiftedCard shortName={s.shortName} achievement={s.achievement} standout={s.standout} certificate={s.certificate} holdFrames={GIFTED_DUR[i]} />
        </Sequence>
      ))}

      <Sequence from={TRANSITION_FROM} durationInFrames={TRANSITION_DUR} layout="absolute-fill">
        <SectionTransition />
      </Sequence>

      <Sequence from={S6_TITLE_FROM} durationInFrames={S6_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="سادسًا: منجزات المدرسة - قبل وبعد" />
      </Sequence>
      {environmentItems.map((item, i) => (
        <Sequence key={item.title} from={ENV_FROM[i]} durationInFrames={ENV_DUR[i]} layout="absolute-fill">
          <BeforeAfterSplit title={item.title} before={item.before} after={item.after} holdFrames={ENV_DUR[i]} />
        </Sequence>
      ))}

      <Sequence from={OUTRO_FROM} durationInFrames={OUTRO_DUR} layout="absolute-fill">
        <OutroCard />
      </Sequence>
    </AbsoluteFill>
  );
};
