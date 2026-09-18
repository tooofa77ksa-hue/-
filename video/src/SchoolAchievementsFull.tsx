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
} from "./data/achievementsFull";

/**
 * SchoolAchievementsFull ("منجزات المدرسة") - النسخة المعتمدة النهائية،
 * مقطع واحد مدمج (يستبدل SchoolAchievements.tsx + SchoolEnvironment.tsx
 * القديمين، اللذين تُركا على القرص دون حذف كمرجع فقط - غير مسجَّلين في
 * Root.tsx). ستة أقسام بالترتيب المعتمد: منجزات المدرسة، إنجازات
 * المعلمات، المبادرات الداخلية، إنجازات الطالبات، الموهبة، ثم - بعد
 * انتقال احترافي - منجزات المدرسة قبل وبعد.
 *
 * ⚠️ توقيت مؤقت (Placeholder) بانتظار التسجيل الصوتي الجديد الأبطأ قليلًا:
 * كل معلمة، وكل عنصر، أصبح له مشهده الكامل المنفصل الخاص (لا دمج بين
 * عنصرين في مشهد واحد إطلاقًا)، بناءً على طلب صريح. الأرقام أدناه مبنية
 * على عدد كلمات نص التعليق الفعلي لكل مشهد + وقت بصري إضافي ثابت لفحص
 * الشهادة (100 إطار للبطاقة المفردة، 130 لمشاهد قبل/بعد ذات الصورتين)،
 * بمعدل قراءة أبطأ قليلًا من المعتاد (2.1 كلمة/ثانية للمحتوى، 2.3
 * للعناوين). بمجرد استلام التسجيل الحقيقي الجديد: قيسي طوله بـ ffprobe،
 * حدّدي السكتات الحقيقية بـ `ffmpeg -af silencedetect`، ثم استبدلي كل
 * *_DUR هنا بالسكتات الفعلية - بنفس الأسلوب المتبع في كامل المشروع.
 */
const INTRO_DUR = 100;
const S1_TITLE_DUR = 60;
// مدة كل شهادة محسوبة من كلمات وصفها الفعلي (٢.١ كلمة/ث) + ١٠٠ إطار فحص بصري
const S1_CARD_DUR = [643, 257, 286, 500, 371, 457, 314]; // مطابقة لترتيب schoolAchievements (1-7)
const RANK_TITLE_DUR = 170;
const RANK1_CERT_DUR = 286; // شهادة المركز الأول - مشهدها الخاص الكامل
const RANK1_TROPHY_DUR = 200; // الدرع - مشهد منفصل كامل، له حقه الخاص
const RANK2_DUR = 186;
const RANK3_DUR = 186;
const S2_TITLE_DUR = 210;
// كل معلمة مشهدها المنفصل الكامل - لا دمج بين معلمتين إطلاقًا
const TEACHER_DUR = [357, 343, 314, 357]; // مطابقة لترتيب teacherAchievements (1-4)
const S3_TITLE_DUR = 170;
const INIT_DUR = [457, 200, 443]; // مطابقة لترتيب initiatives (1-3)
const S4_TITLE_DUR = 131;
const STUDENT_DUR = 314;
const S5_TITLE_DUR = 131;
const GIFTED_DUR = [200, 186]; // مطابقة لترتيب honoredStudents (1-2)
const TRANSITION_DUR = 20;
const S6_TITLE_DUR = 223;
const ENV_DUR = [344, 301, 316, 316]; // مطابقة لترتيب environmentItems (1-4) - وقت أطول لمقارنة صورتين
const OUTRO_DUR = 564;

export const achievementsFullTotalDuration =
  INTRO_DUR +
  S1_TITLE_DUR +
  S1_CARD_DUR.reduce((a, b) => a + b, 0) +
  RANK_TITLE_DUR +
  RANK1_CERT_DUR +
  RANK1_TROPHY_DUR +
  RANK2_DUR +
  RANK3_DUR +
  S2_TITLE_DUR +
  TEACHER_DUR.reduce((a, b) => a + b, 0) +
  S3_TITLE_DUR +
  INIT_DUR.reduce((a, b) => a + b, 0) +
  S4_TITLE_DUR +
  STUDENT_DUR +
  S5_TITLE_DUR +
  GIFTED_DUR.reduce((a, b) => a + b, 0) +
  TRANSITION_DUR +
  S6_TITLE_DUR +
  ENV_DUR.reduce((a, b) => a + b, 0) +
  OUTRO_DUR;

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

const RankCard: React.FC<{ rank: string; grade: string; year: string; image: string; standout?: boolean; holdFrames: number }> = ({
  rank,
  grade,
  year,
  image,
  standout,
  holdFrames,
}) => {
  const frame = useCurrentFrame();
  const t = fadeUp(frame, 0, 16, 12);
  const color = standout ? brand.gold : brand.primary;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <Sfx kind="impact" at={10} volume={standout ? 0.5 : 0.35} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ opacity: t.opacity, translate: `0 ${t.y}px`, display: "flex", alignItems: "center", gap: 14 }}>
          <CategoryIcon kind="trophy" color={color} size={40} />
          <div style={{ fontFamily, fontWeight: 900, fontSize: standout ? 44 : 36, color: brand.primaryDark }}>
            المركز {rank}
          </div>
        </div>
        <RevealCard width={500} height={640} holdFrames={holdFrames}>
          <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </RevealCard>
        <div style={{ display: "flex", gap: 14, opacity: t.opacity }}>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 22, color: brand.muted }}>{grade}</div>
          <div style={{ fontFamily, fontWeight: 800, fontSize: 16, color: brand.paper, background: color, borderRadius: 999, padding: "4px 16px" }}>
            {year}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TrophyCard: React.FC<{ holdFrames: number }> = ({ holdFrames }) => {
  const frame = useCurrentFrame();
  const t = fadeUp(frame, 0, 16, 12);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <Sfx kind="impact" at={10} volume={0.4} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 36, color: brand.primaryDark, opacity: t.opacity, translate: `0 ${t.y}px` }}>
          درع المركز الأول
        </div>
        <RevealCard width={620} height={560} holdFrames={holdFrames}>
          <Img src={staticFile("achievements/qadimoon-rank1-trophy.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </RevealCard>
      </div>
    </AbsoluteFill>
  );
};

/** ============== القسم الثاني: إنجازات المعلمات ============== */
/** كل معلمة لها بطاقتها ومشهدها المنفصل الكامل - لا دمج بين معلمتين. */
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
  let cursor = 0;
  const introFrom = cursor;
  cursor += INTRO_DUR;

  const s1TitleFrom = cursor;
  cursor += S1_TITLE_DUR;
  const schoolFroms = schoolAchievements.map((_, i) => {
    const start = cursor;
    cursor += S1_CARD_DUR[i];
    return start;
  });

  const rankTitleFrom = cursor;
  cursor += RANK_TITLE_DUR;
  const rank1From = cursor;
  cursor += RANK1_CERT_DUR;
  const trophyFrom = cursor;
  cursor += RANK1_TROPHY_DUR;
  const rank2From = cursor;
  cursor += RANK2_DUR;
  const rank3From = cursor;
  cursor += RANK3_DUR;

  const s2TitleFrom = cursor;
  cursor += S2_TITLE_DUR;
  const teacherFroms = teacherAchievements.map((_, i) => {
    const start = cursor;
    cursor += TEACHER_DUR[i];
    return start;
  });

  const s3TitleFrom = cursor;
  cursor += S3_TITLE_DUR;
  const initiativeFroms = initiatives.map((_, i) => {
    const start = cursor;
    cursor += INIT_DUR[i];
    return start;
  });

  const s4TitleFrom = cursor;
  cursor += S4_TITLE_DUR;
  const studentFrom = cursor;
  cursor += STUDENT_DUR;

  const s5TitleFrom = cursor;
  cursor += S5_TITLE_DUR;
  const giftedFroms = honoredStudents.map((_, i) => {
    const start = cursor;
    cursor += GIFTED_DUR[i];
    return start;
  });

  const transitionFrom = cursor;
  cursor += TRANSITION_DUR;

  const s6TitleFrom = cursor;
  cursor += S6_TITLE_DUR;
  const envFroms = environmentItems.map((_, i) => {
    const start = cursor;
    cursor += ENV_DUR[i];
    return start;
  });

  const outroFrom = cursor;

  const chromeTitleAt = (frame: number): string => {
    if (frame < s2TitleFrom) return "منجزات المدرسة";
    if (frame < s3TitleFrom) return "إنجازات المعلمات والموظفات";
    if (frame < s4TitleFrom) return "المبادرات الداخلية النوعية";
    if (frame < s5TitleFrom) return "إنجازات الطالبات";
    if (frame < transitionFrom) return "الموهبة";
    return "منجزات المدرسة - قبل وبعد";
  };

  return (
    <AbsoluteFill style={{ background: brand.paper, fontFamily, direction: "rtl" }}>
      <Audio src={staticFile("audio/achievements-full-narration.mp3")} />

      {[s2TitleFrom, s3TitleFrom, s4TitleFrom, s5TitleFrom, transitionFrom, achievementsFullTotalDuration].map((boundary, i, arr) => {
        const start = i === 0 ? introFrom : arr[i - 1];
        return (
          <Sequence key={i} from={start} durationInFrames={boundary - start} layout="absolute-fill">
            <StatsSceneChrome sectionTitle={chromeTitleAt(start)} />
          </Sequence>
        );
      })}

      <Sequence from={introFrom} durationInFrames={INTRO_DUR} layout="absolute-fill">
        <SectionTitle text="منجزات المدرسة" sub="توثيق لأبرز المنجزات والشهادات والمبادرات وأعمال التطوير" />
      </Sequence>

      <Sequence from={s1TitleFrom} durationInFrames={S1_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="أولًا: منجزات المدرسة" />
      </Sequence>
      {schoolAchievements.map((a, i) => (
        <Sequence key={a.image} from={schoolFroms[i]} durationInFrames={S1_CARD_DUR[i]} layout="absolute-fill">
          <SchoolAchievementCard image={a.image} caption={a.caption} icon={a.icon} holdFrames={S1_CARD_DUR[i]} />
        </Sequence>
      ))}

      <Sequence from={rankTitleFrom} durationInFrames={RANK_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text={competitionName} sub="1447هـ" />
      </Sequence>
      <Sequence from={rank1From} durationInFrames={RANK1_CERT_DUR} layout="absolute-fill">
        <RankCard
          rank={competitionRanks[0].rank}
          grade={competitionRanks[0].grade}
          year={competitionRanks[0].year}
          image={competitionRanks[0].image}
          standout={competitionRanks[0].standout}
          holdFrames={RANK1_CERT_DUR}
        />
      </Sequence>
      <Sequence from={trophyFrom} durationInFrames={RANK1_TROPHY_DUR} layout="absolute-fill">
        <TrophyCard holdFrames={RANK1_TROPHY_DUR} />
      </Sequence>
      <Sequence from={rank2From} durationInFrames={RANK2_DUR} layout="absolute-fill">
        <RankCard rank={competitionRanks[1].rank} grade={competitionRanks[1].grade} year={competitionRanks[1].year} image={competitionRanks[1].image} holdFrames={RANK2_DUR} />
      </Sequence>
      <Sequence from={rank3From} durationInFrames={RANK3_DUR} layout="absolute-fill">
        <RankCard rank={competitionRanks[2].rank} grade={competitionRanks[2].grade} year={competitionRanks[2].year} image={competitionRanks[2].image} holdFrames={RANK3_DUR} />
      </Sequence>

      <Sequence from={s2TitleFrom} durationInFrames={S2_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="ثانيًا: إنجازات المعلمات والموظفات" />
      </Sequence>
      {teacherAchievements.map((t, i) => (
        <Sequence key={t.name} from={teacherFroms[i]} durationInFrames={TEACHER_DUR[i]} layout="absolute-fill">
          <TeacherCard image={t.image} name={t.name} achievement={t.achievement} holdFrames={TEACHER_DUR[i]} />
        </Sequence>
      ))}

      <Sequence from={s3TitleFrom} durationInFrames={S3_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="ثالثًا: المبادرات الداخلية" />
      </Sequence>
      {initiatives.map((it, i) => (
        <Sequence key={it.title} from={initiativeFroms[i]} durationInFrames={INIT_DUR[i]} layout="absolute-fill">
          <InitiativeCard title={it.title} owner={it.owner} description={it.description} image={it.image} icon={it.icon} holdFrames={INIT_DUR[i]} />
        </Sequence>
      ))}

      <Sequence from={s4TitleFrom} durationInFrames={S4_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="رابعًا: إنجازات الطالبات" />
      </Sequence>
      <Sequence from={studentFrom} durationInFrames={STUDENT_DUR} layout="absolute-fill">
        <StudentAchievementCard
          name={studentAchievements[0].name}
          competition={studentAchievements[0].competition}
          result={studentAchievements[0].result}
          year={studentAchievements[0].year}
          image={studentAchievements[0].image}
          holdFrames={STUDENT_DUR}
        />
      </Sequence>

      <Sequence from={s5TitleFrom} durationInFrames={S5_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="خامسًا: الموهبة" />
      </Sequence>
      {honoredStudents.map((s, i) => (
        <Sequence key={s.shortName} from={giftedFroms[i]} durationInFrames={GIFTED_DUR[i]} layout="absolute-fill">
          <GiftedCard shortName={s.shortName} achievement={s.achievement} standout={s.standout} certificate={s.certificate} holdFrames={GIFTED_DUR[i]} />
        </Sequence>
      ))}

      <Sequence from={transitionFrom} durationInFrames={TRANSITION_DUR} layout="absolute-fill">
        <SectionTransition />
      </Sequence>

      <Sequence from={s6TitleFrom} durationInFrames={S6_TITLE_DUR} layout="absolute-fill">
        <SectionTitle text="سادسًا: منجزات المدرسة - قبل وبعد" />
      </Sequence>
      {environmentItems.map((item, i) => (
        <Sequence key={item.title} from={envFroms[i]} durationInFrames={ENV_DUR[i]} layout="absolute-fill">
          <BeforeAfterSplit title={item.title} before={item.before} after={item.after} holdFrames={ENV_DUR[i]} />
        </Sequence>
      ))}

      <Sequence from={outroFrom} durationInFrames={OUTRO_DUR} layout="absolute-fill">
        <OutroCard />
      </Sequence>
    </AbsoluteFill>
  );
};
