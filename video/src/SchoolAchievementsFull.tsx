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
 * ⚠️ توقيت مؤقت (Placeholder): لم يصل ملف الصوت الحقيقي بعد. كل *_BEAT
 * أدناه رقم تقديري ثابت لكل عنصر (وليس مبنيًا على سكتات صوت حقيقي كبقية
 * ملفات هذا المشروع). بمجرد استلام التسجيل الفعلي: قيسي طوله بـ ffprobe،
 * حدّدي السكتات الحقيقية بين الفقرات بـ `ffmpeg -af silencedetect`، ثم
 * حدّثي كل *_BEAT هنا لتطابق تلك السكتات بالضبط - بنفس الأسلوب المستخدم
 * في SchoolAchievements.tsx الأصلي. لا تغييرات أخرى مطلوبة على التصميم.
 */
const INTRO_BEAT = 90;
const S1_TITLE_BEAT = 40;
const S1_CARD_BEAT = 128; // × 7 شهادات
const S1_RANK_TITLE_BEAT = 36;
const S1_RANK_BEAT = 110; // × 3 مراكز
const S1_TROPHY_BEAT = 90; // درع المركز الأول فقط
const S2_TITLE_BEAT = 36;
const S2_CARD_BEAT = 140; // × 4 معلمات
const S3_TITLE_BEAT = 36;
const S3_CARD_BEAT = 170; // × 3 مبادرات
const S4_TITLE_BEAT = 36;
const S4_CARD_BEAT = 160; // × 1 طالبة
const S5_TITLE_BEAT = 36;
const S5_CARD_BEAT = 190; // × 2 موهوبة
const TRANSITION_BEAT = 26;
const S6_TITLE_BEAT = 50;
const S6_ITEM_BEAT = 280; // × 4 قبل/بعد
const OUTRO_BEAT = 150;

export const achievementsFullTotalDuration =
  INTRO_BEAT +
  S1_TITLE_BEAT +
  schoolAchievements.length * S1_CARD_BEAT +
  S1_RANK_TITLE_BEAT +
  competitionRanks.length * S1_RANK_BEAT +
  S1_TROPHY_BEAT +
  S2_TITLE_BEAT +
  teacherAchievements.length * S2_CARD_BEAT +
  S3_TITLE_BEAT +
  initiatives.length * S3_CARD_BEAT +
  S4_TITLE_BEAT +
  studentAchievements.length * S4_CARD_BEAT +
  S5_TITLE_BEAT +
  honoredStudents.length * S5_CARD_BEAT +
  TRANSITION_BEAT +
  S6_TITLE_BEAT +
  environmentItems.length * S6_ITEM_BEAT +
  OUTRO_BEAT;

const fadeUp = (frame: number, from = 0, dur = 16, dist = 14) => ({
  opacity: interpolate(frame, [from, from + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  y: interpolate(frame, [from, from + dur], [dist, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
});

const IconBadge: React.FC<{ kind: Parameters<typeof CategoryIcon>[0]["kind"]; color?: string }> = ({
  kind,
  color = brand.primary,
}) => (
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
    }}
  >
    <CategoryIcon kind={kind} color={color} size={30} />
  </div>
);

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

const RevealCard: React.FC<{ width: number; height: number; children: React.ReactNode; icon?: Parameters<typeof CategoryIcon>[0]["kind"]; iconColor?: string }> = ({
  width,
  height,
  children,
  icon,
  iconColor,
}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const zoom = interpolate(frame, [0, 30], [1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
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
          clipPath: `inset(0 0 0 ${100 - reveal * 100}%)`,
          transform: `scale(${zoom})`,
        }}
      >
        {children}
      </div>
      {icon && <IconBadge kind={icon} color={iconColor} />}
    </div>
  );
};

const CaptionPill: React.FC<{ text: string; startFrame?: number; color?: string }> = ({ text, startFrame = 10, color = brand.primary }) => {
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
const SchoolAchievementCard: React.FC<{ image: string; caption: string; icon: Parameters<typeof CategoryIcon>[0]["kind"] }> = ({
  image,
  caption,
  icon,
}) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Sfx kind="whoosh" at={0} volume={0.32} />
    <Sfx kind="tick" at={4} volume={0.18} />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      <RevealCard width={840} height={560} icon={icon}>
        <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </RevealCard>
      <CaptionPill text={caption} />
    </div>
  </AbsoluteFill>
);

const RankCard: React.FC<{ rank: string; grade: string; year: string; image: string; standout?: boolean }> = ({
  rank,
  grade,
  year,
  image,
  standout,
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
        <RevealCard width={500} height={640}>
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

const TrophyCard: React.FC = () => {
  const frame = useCurrentFrame();
  const t = fadeUp(frame, 0, 16, 12);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 36, color: brand.primaryDark, opacity: t.opacity, translate: `0 ${t.y}px` }}>
          درع المركز الأول
        </div>
        <RevealCard width={620} height={560}>
          <Img src={staticFile("achievements/qadimoon-rank1-trophy.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </RevealCard>
      </div>
    </AbsoluteFill>
  );
};

/** ============== القسم الثاني: إنجازات المعلمات ============== */
const TeacherCard: React.FC<{ image: string; name: string; achievement: string }> = ({ image, name, achievement }) => {
  const frame = useCurrentFrame();
  const textT = fadeUp(frame, 10, 14, 10);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <Sfx kind="tick" at={4} volume={0.18} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <RevealCard width={580} height={480} icon="medal">
          <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </RevealCard>
        <div style={{ opacity: textT.opacity, translate: `0 ${textT.y}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 32, color: brand.primaryDark }}>{name}</div>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 20, color: brand.paper, background: brand.teal, borderRadius: 999, padding: "6px 22px", textAlign: "center", maxWidth: 760 }}>
            {achievement}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** ============== القسم الثالث: المبادرات الداخلية ============== */
const InitiativeCard: React.FC<{ title: string; owner: string; description: string; image: string; icon: Parameters<typeof CategoryIcon>[0]["kind"] }> = ({
  title,
  owner,
  description,
  image,
  icon,
}) => {
  const frame = useCurrentFrame();
  const textT = fadeUp(frame, 10, 14, 10);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, maxWidth: 520, opacity: textT.opacity, translate: `0 ${textT.y}px` }}>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 36, color: brand.primaryDark, textAlign: "right" }}>{title}</div>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 20, color: brand.teal, textAlign: "right" }}>{owner}</div>
          <div style={{ fontFamily, fontWeight: 500, fontSize: 22, color: brand.muted, textAlign: "right", lineHeight: 1.6 }}>{description}</div>
        </div>
        <RevealCard width={560} height={460} icon={icon}>
          <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#f4f5f4" }} />
        </RevealCard>
      </div>
    </AbsoluteFill>
  );
};

/** ============== القسم الرابع: إنجازات الطالبات ============== */
const StudentAchievementCard: React.FC<{ name: string; competition: string; result: string; year: string; image: string }> = ({
  name,
  competition,
  result,
  year,
  image,
}) => {
  const frame = useCurrentFrame();
  const textT = fadeUp(frame, 10, 14, 10);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.32} />
      <Sfx kind="impact" at={12} volume={0.4} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <RevealCard width={420} height={560} icon="camera">
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
const GiftedCard: React.FC<{ shortName: string; achievement: string; standout?: boolean; certificate: string }> = ({
  shortName,
  achievement,
  standout,
  certificate,
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
        <RevealCard width={620} height={420}>
          <Img src={staticFile(certificate)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </RevealCard>
      </div>
    </AbsoluteFill>
  );
};

/** ============== انتقال احترافي بين المنجزات والبيئة ============== */
const SectionTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, TRANSITION_BEAT], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: brand.primaryDark, opacity: interpolate(t, [0, 0.5, 1], [0, 1, 0]) }}>
      <Sfx kind="whoosh" at={2} volume={0.5} />
    </AbsoluteFill>
  );
};

/** ============== القسم السادس: منجزات المدرسة قبل وبعد - Split Screen حقيقي ============== */
const BeforeAfterSplit: React.FC<{ title: string; before: string; after: string }> = ({ title, before, after }) => {
  const frame = useCurrentFrame();
  const titleT = fadeUp(frame, 0, 16, 12);
  const panelT = interpolate(frame, [6, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const zoom = interpolate(frame, [0, S6_ITEM_BEAT], [1, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
  cursor += INTRO_BEAT;

  const s1TitleFrom = cursor;
  cursor += S1_TITLE_BEAT;
  const schoolFroms = schoolAchievements.map(() => {
    const start = cursor;
    cursor += S1_CARD_BEAT;
    return start;
  });
  const s1RankTitleFrom = cursor;
  cursor += S1_RANK_TITLE_BEAT;
  const rankFroms = competitionRanks.map(() => {
    const start = cursor;
    cursor += S1_RANK_BEAT;
    return start;
  });
  const trophyFrom = cursor;
  cursor += S1_TROPHY_BEAT;

  const s2TitleFrom = cursor;
  cursor += S2_TITLE_BEAT;
  const teacherFroms = teacherAchievements.map(() => {
    const start = cursor;
    cursor += S2_CARD_BEAT;
    return start;
  });

  const s3TitleFrom = cursor;
  cursor += S3_TITLE_BEAT;
  const initiativeFroms = initiatives.map(() => {
    const start = cursor;
    cursor += S3_CARD_BEAT;
    return start;
  });

  const s4TitleFrom = cursor;
  cursor += S4_TITLE_BEAT;
  const studentFroms = studentAchievements.map(() => {
    const start = cursor;
    cursor += S4_CARD_BEAT;
    return start;
  });

  const s5TitleFrom = cursor;
  cursor += S5_TITLE_BEAT;
  const giftedFroms = honoredStudents.map(() => {
    const start = cursor;
    cursor += S5_CARD_BEAT;
    return start;
  });

  const transitionFrom = cursor;
  cursor += TRANSITION_BEAT;

  const s6TitleFrom = cursor;
  cursor += S6_TITLE_BEAT;
  const envFroms = environmentItems.map(() => {
    const start = cursor;
    cursor += S6_ITEM_BEAT;
    return start;
  });

  const outroFrom = cursor;

  const chromeTitleAt = (frame: number): string => {
    if (frame < s1RankTitleFrom + competitionRanks.length * S1_RANK_BEAT + S1_TROPHY_BEAT) return "منجزات المدرسة";
    if (frame < s3TitleFrom) return "إنجازات المعلمات والموظفات";
    if (frame < s4TitleFrom) return "المبادرات الداخلية النوعية";
    if (frame < s5TitleFrom) return "إنجازات الطالبات";
    if (frame < transitionFrom) return "الموهبة";
    return "منجزات المدرسة - قبل وبعد";
  };

  return (
    <AbsoluteFill style={{ background: brand.paper, fontFamily, direction: "rtl" }}>
      <Audio src={staticFile("audio/achievements-full-narration.mp3")} />

      {[s1TitleFrom, s3TitleFrom, s4TitleFrom, s5TitleFrom, transitionFrom, achievementsFullTotalDuration].map((boundary, i, arr) => {
        const start = i === 0 ? introFrom : arr[i - 1];
        return (
          <Sequence key={i} from={start} durationInFrames={boundary - start} layout="absolute-fill">
            <StatsSceneChrome sectionTitle={chromeTitleAt(start)} />
          </Sequence>
        );
      })}

      <Sequence from={introFrom} durationInFrames={S1_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text="منجزات المدرسة" sub="توثيق لأبرز المنجزات والشهادات والمبادرات وأعمال التطوير" />
      </Sequence>

      <Sequence from={s1TitleFrom} durationInFrames={S1_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text="أولًا: منجزات المدرسة" />
      </Sequence>
      {schoolAchievements.map((a, i) => (
        <Sequence key={a.image} from={schoolFroms[i]} durationInFrames={S1_CARD_BEAT} layout="absolute-fill">
          <SchoolAchievementCard image={a.image} caption={a.caption} icon={a.icon} />
        </Sequence>
      ))}

      <Sequence from={s1RankTitleFrom} durationInFrames={S1_RANK_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text={competitionName} sub="1447هـ" />
      </Sequence>
      {competitionRanks.map((r, i) => (
        <Sequence key={i} from={rankFroms[i]} durationInFrames={S1_RANK_BEAT} layout="absolute-fill">
          <RankCard rank={r.rank} grade={r.grade} year={r.year} image={r.image} standout={r.standout} />
        </Sequence>
      ))}
      <Sequence from={trophyFrom} durationInFrames={S1_TROPHY_BEAT} layout="absolute-fill">
        <TrophyCard />
      </Sequence>

      <Sequence from={s2TitleFrom} durationInFrames={S2_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text="ثانيًا: إنجازات المعلمات والموظفات" />
      </Sequence>
      {teacherAchievements.map((t, i) => (
        <Sequence key={t.name} from={teacherFroms[i]} durationInFrames={S2_CARD_BEAT} layout="absolute-fill">
          <TeacherCard image={t.image} name={t.name} achievement={t.achievement} />
        </Sequence>
      ))}

      <Sequence from={s3TitleFrom} durationInFrames={S3_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text="ثالثًا: المبادرات الداخلية" />
      </Sequence>
      {initiatives.map((it, i) => (
        <Sequence key={it.title} from={initiativeFroms[i]} durationInFrames={S3_CARD_BEAT} layout="absolute-fill">
          <InitiativeCard title={it.title} owner={it.owner} description={it.description} image={it.image} icon={it.icon} />
        </Sequence>
      ))}

      <Sequence from={s4TitleFrom} durationInFrames={S4_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text="رابعًا: إنجازات الطالبات" />
      </Sequence>
      {studentAchievements.map((s, i) => (
        <Sequence key={s.name} from={studentFroms[i]} durationInFrames={S4_CARD_BEAT} layout="absolute-fill">
          <StudentAchievementCard name={s.name} competition={s.competition} result={s.result} year={s.year} image={s.image} />
        </Sequence>
      ))}

      <Sequence from={s5TitleFrom} durationInFrames={S5_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text="خامسًا: الموهبة" />
      </Sequence>
      {honoredStudents.map((s, i) => (
        <Sequence key={s.shortName} from={giftedFroms[i]} durationInFrames={S5_CARD_BEAT} layout="absolute-fill">
          <GiftedCard shortName={s.shortName} achievement={s.achievement} standout={s.standout} certificate={s.certificate} />
        </Sequence>
      ))}

      <Sequence from={transitionFrom} durationInFrames={TRANSITION_BEAT} layout="absolute-fill">
        <SectionTransition />
      </Sequence>

      <Sequence from={s6TitleFrom} durationInFrames={S6_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text="سادسًا: منجزات المدرسة - قبل وبعد" />
      </Sequence>
      {environmentItems.map((item, i) => (
        <Sequence key={item.title} from={envFroms[i]} durationInFrames={S6_ITEM_BEAT} layout="absolute-fill">
          <BeforeAfterSplit title={item.title} before={item.before} after={item.after} />
        </Sequence>
      ))}

      <Sequence from={outroFrom} durationInFrames={OUTRO_BEAT} layout="absolute-fill">
        <OutroCard />
      </Sequence>
    </AbsoluteFill>
  );
};
