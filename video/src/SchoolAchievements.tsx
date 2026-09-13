import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { brand, fontFamily } from "./brand/tokens";
import { StatsSceneChrome } from "./components/StatsSceneChrome";
import { Sfx } from "./components/Sfx";
import {
  competitionName,
  competitionRanks,
  honoredStudents,
  schoolAchievements,
  teacherAchievements,
} from "./data/achievements";

/**
 * Standalone composition "SchoolAchievements" ("منجزات المدرسة") - a
 * completely separate video from Grade3Nafs/Grade6Nafs/SchoolStats.
 *
 * FULL REBUILD (replaces the previous 2-section version entirely, per
 * explicit user request - not a patch on top of it) with the new 4-section
 * order: منجزات المدرسة (6 real certificate images) -> مسابقة قادمون
 * (existing verified results, redesigned) -> منجزات المعلمات (3 real
 * teacher achievement photos/certificates) -> الموهوبات (existing tala/
 * reyman certificates, shortened on-screen names per this request).
 * Reuses StatsSceneChrome/brand tokens/Sfx exactly as-is - no new design
 * system, no new libraries.
 *
 * Narration: real ElevenLabs recording (same voice as the rest of the
 * project), public/audio/achievements-narration.mp3, 60.317s measured via
 * ffprobe (1810 frames, ceil) - right at the edge of the user's 45-60s
 * budget. Section boundaries below are computed from each paragraph's word
 * count as a share of the full 105-word script, applied to the real 1810-
 * frame length (same word-count-proportional methodology as every other
 * narrated scene in this project - no forced alignment/timestamps are
 * available in this environment, see OrgStatsScene.tsx for the same
 * approach). Within each section, the title reveal takes a fixed 24
 * frames and the remaining span is split evenly across that section's
 * items (they are not individually called out in the narration - it is a
 * spoken summary while the items cascade visually, per explicit user
 * instruction "لا تجعل المذيعة تقرأ نص كل شهادة"). The whole scene's
 * length equals the audio's length exactly - no added silence at the end.
 *
 * IMPORTANT correction: a first pass used a uniform words-per-second rate
 * across all 4 paragraphs, which the user correctly flagged as out of
 * sync. The real recording is NOT uniform - "وتواصل المدرسة... قادمون"
 * is read much faster than the comma-heavy paragraph 1 list. Since this
 * environment blocks both the ElevenLabs Scribe API and any local
 * Whisper model download (huggingface.co/openaipublic.azureedge.net are
 * both proxy-denied), there is no word-level transcript available -
 * instead, the actual pauses between paragraphs were found locally via
 * `ffmpeg -af silencedetect` (no network needed) on the real file, and
 * the 4 most prominent pauses (>0.5s, clearly longer than the small
 * mid-sentence comma pauses) were taken as the paragraph boundaries:
 * ~1.1s/1.8s (title -> paragraph 1), ~29.6s/30.1s (paragraph 1 -> 2),
 * ~34.1s/34.6s (paragraph 2 -> 3), ~48.5s/49.1s (paragraph 3 -> 4). The
 * *_BEAT constants below are derived from those real boundaries (in
 * frames), not from word-count averaging - this should track the actual
 * recording far more closely.
 *
 * Full narration script (as recorded, in order - opens with the section
 * title spoken aloud, per explicit user request):
 * "منجزات المدرسة. حققت المدرسة حضورًا فاعلًا في عدد من المبادرات والفعاليات التعليمية
 * والمجتمعية، ونالت شهادات شكر وتقدير من الإدارة العامة للتعليم بمحافظة
 * جدة، ومكتب تعليم السلامة، ومركز التنمية الاجتماعية بمحافظة جدة، إلى
 * جانب مشاركاتها في معارض التعليم، واليوم الوطني، ومبادرة نوابغ المستقبل،
 * وورشة التفكير التصميمي. وتواصل المدرسة حضورها المتميز في مسابقة قادمون،
 * محققة عددًا من المراكز المتقدمة في الأعوام الدراسية المختلفة. وامتدت
 * المنجزات إلى الكادر التعليمي، حيث حققت المعلمتان حنان آل عوض وفوزية
 * الحربي تميزًا في المعلم المتميز، إلى جانب مشاركة المعلمة حنان العمري
 * الفاعلة في أسبوع الفضاء العالمي. وفي مجال الموهبة، حظيت طالبات المدرسة
 * بتكريم مستحق، ومن بينهن تالا المالكي وريمان، تقديرًا لتميزهن ومواهبهن."
 */
const S1_TITLE_BEAT = 34; // "منجزات المدرسة" - ends at the real 1.12s pause
const S1_CARD_BEATS = [142, 142, 142, 142, 142, 143]; // 6 certificates, span=853f (real pause at 29.56s)
const S2_TITLE_BEAT = 24; // "قادمون"
const S2_RANK_BEATS = [28, 28, 28, 28]; // 4 ranks, span=112f (real para2 is spoken fast, pause at 34.09s)
const S3_TITLE_BEAT = 24; // "منجزات المعلمات"
const S3_CARD_BEATS = [136, 136, 135]; // 3 teachers, span=407f (real pause at 48.46s)
const S4_TITLE_BEAT = 24; // "الموهوبات"
const S4_STUDENT_BEATS = [166, 166]; // 2 students, span=332f (to the real 60.317s end)

export const achievementsTotalDuration =
  S1_TITLE_BEAT +
  S1_CARD_BEATS.reduce((a, b) => a + b, 0) +
  S2_TITLE_BEAT +
  S2_RANK_BEATS.reduce((a, b) => a + b, 0) +
  S3_TITLE_BEAT +
  S3_CARD_BEATS.reduce((a, b) => a + b, 0) +
  S4_TITLE_BEAT +
  S4_STUDENT_BEATS.reduce((a, b) => a + b, 0);

const TrophyIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path d="M20 10h24v12a12 12 0 0 1-24 0V10Z" fill={color} />
    <path d="M20 14h-6a2 2 0 0 0-2 2v2a8 8 0 0 0 8 8" stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round" />
    <path d="M44 14h6a2 2 0 0 1 2 2v2a8 8 0 0 1-8 8" stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round" />
    <rect x="29" y="34" width="6" height="10" fill={color} />
    <path d="M18 50h28l-3-6H21l-3 6Z" fill={color} />
  </svg>
);

const StarIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path d="M32 6l7.2 15.6L56 24l-12 11.8L47.2 52 32 43.6 16.8 52 20 35.8 8 24l16.8-2.4L32 6Z" fill={color} />
  </svg>
);

const SectionTitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.45} />
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 46,
          color: brand.primaryDark,
          opacity: t,
          translate: `0 ${interpolate(t, [0, 1], [12, 0])}px`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Certificate card: mask-reveal (RTL wipe) + light zoom, image as the main element, caption as a supporting strip below. */
const CertificateCard: React.FC<{ image: string; caption: string }> = ({ image, caption }) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const zoom = interpolate(frame, [0, 30], [1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const captionT = interpolate(frame, [10, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.35} />
      <Sfx kind="tick" at={4} volume={0.2} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 880,
            height: 560,
            borderRadius: 16,
            overflow: "hidden",
            background: brand.paper,
            border: `2px solid ${brand.border}`,
            boxShadow: "0 22px 55px rgba(21,68,90,0.16)",
            clipPath: `inset(0 0 0 ${100 - reveal * 100}%)`,
          }}
        >
          <Img
            src={staticFile(image)}
            style={{ width: "100%", height: "100%", objectFit: "contain", scale: String(zoom) }}
          />
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 26,
            color: brand.paper,
            background: brand.primary,
            borderRadius: 999,
            padding: "8px 28px",
            textAlign: "center",
            maxWidth: 900,
            opacity: captionT,
            translate: `0 ${interpolate(captionT, [0, 1], [10, 0])}px`,
          }}
        >
          {caption}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Teacher achievement card: photo + name + achievement badge, same visual language as CertificateCard. */
const TeacherCard: React.FC<{ image: string; name: string; achievement: string }> = ({ image, name, achievement }) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const zoom = interpolate(frame, [0, 30], [1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const textT = interpolate(frame, [10, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.35} />
      <Sfx kind="tick" at={4} volume={0.2} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 620,
            height: 500,
            borderRadius: 16,
            overflow: "hidden",
            background: brand.paper,
            border: `2px solid ${brand.border}`,
            boxShadow: "0 22px 55px rgba(21,68,90,0.16)",
            clipPath: `inset(0 0 0 ${100 - reveal * 100}%)`,
          }}
        >
          <Img
            src={staticFile(image)}
            style={{ width: "100%", height: "100%", objectFit: "cover", scale: String(zoom) }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: textT,
            translate: `0 ${interpolate(textT, [0, 1], [10, 0])}px`,
          }}
        >
          <div style={{ fontFamily, fontWeight: 900, fontSize: 32, color: brand.primaryDark }}>{name}</div>
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 22,
              color: brand.paper,
              background: brand.teal,
              borderRadius: 999,
              padding: "6px 22px",
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            {achievement}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const RankBeat: React.FC<{ rank: string; grade: string; year: string; standout?: boolean }> = ({
  rank,
  grade,
  year,
  standout,
}) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.1)),
    output: "perceptual-scale",
  });
  const shine = interpolate(frame, [8, 22, 36], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const color = standout ? brand.gold : brand.primary;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.35} />
      <Sfx kind="impact" at={8} volume={standout ? 0.55 : 0.4} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div
          style={{
            position: "relative",
            width: standout ? 170 : 136,
            height: standout ? 170 : 136,
            borderRadius: "50%",
            background: standout ? "#fdf8ee" : "#eef6f2",
            border: `3px solid ${standout ? brand.gold : brand.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: appear,
            scale: appear,
          }}
        >
          <TrophyIcon color={color} size={standout ? 86 : 66} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `linear-gradient(120deg, transparent 30%, ${brand.paper} 50%, transparent 70%)`,
              opacity: shine * 0.6,
            }}
          />
        </div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: standout ? 46 : 36, color: brand.primaryDark, opacity: appear }}>
          المركز {rank}
        </div>
        <div style={{ fontFamily, fontWeight: 700, fontSize: 24, color: brand.muted, opacity: appear }}>{grade}</div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 18,
            color: brand.paper,
            background: color,
            borderRadius: 999,
            padding: "5px 18px",
            opacity: appear,
          }}
        >
          {year}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StudentBeat: React.FC<{ shortName: string; achievement: string; standout?: boolean; certificate: string }> = ({
  shortName,
  achievement,
  standout,
  certificate,
}) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.1)),
    output: "perceptual-scale",
  });
  const color = standout ? brand.gold : brand.teal;

  const CERT_FROM = 6;
  const CERT_DURATION = 22;
  const certT = interpolate(frame, [CERT_FROM, CERT_FROM + CERT_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.35} />
      <Sfx kind="impact" at={8} volume={standout ? 0.5 : 0.4} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: standout ? 100 : 86,
            height: standout ? 100 : 86,
            borderRadius: "50%",
            background: standout ? "#fdf8ee" : "#eef6f2",
            border: `3px solid ${standout ? brand.gold : brand.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: appear,
            scale: appear,
          }}
        >
          <StarIcon color={color} size={standout ? 48 : 40} />
        </div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 32, color: brand.primaryDark, opacity: appear }}>
          {shortName}
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 18,
            color: brand.paper,
            background: color,
            borderRadius: 999,
            padding: "5px 18px",
            opacity: appear,
          }}
        >
          {achievement}
        </div>
        <div
          style={{
            marginTop: 4,
            width: 760,
            height: 480,
            overflow: "hidden",
            opacity: certT,
            translate: `0 ${interpolate(certT, [0, 1], [60, 0])}px`,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 14,
              border: `2px solid ${brand.border}`,
              boxShadow: "0 20px 50px rgba(21,68,90,0.18)",
              overflow: "hidden",
              background: brand.paper,
            }}
          >
            <Img src={staticFile(certificate)} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SchoolAchievements: React.FC = () => {
  let cursor = 0;
  const s1TitleFrom = cursor;
  cursor += S1_TITLE_BEAT;
  const schoolFroms = S1_CARD_BEATS.map((d) => {
    const start = cursor;
    cursor += d;
    return start;
  });
  const s2TitleFrom = cursor;
  cursor += S2_TITLE_BEAT;
  const rankFroms = S2_RANK_BEATS.map((d) => {
    const start = cursor;
    cursor += d;
    return start;
  });
  const s3TitleFrom = cursor;
  cursor += S3_TITLE_BEAT;
  const teacherFroms = S3_CARD_BEATS.map((d) => {
    const start = cursor;
    cursor += d;
    return start;
  });
  const s4TitleFrom = cursor;
  cursor += S4_TITLE_BEAT;
  const studentFroms = S4_STUDENT_BEATS.map((d) => {
    const start = cursor;
    cursor += d;
    return start;
  });

  return (
    <AbsoluteFill style={{ background: brand.paper, fontFamily, direction: "rtl" }}>
      <StatsSceneChrome sectionTitle="منجزات المدرسة" />
      <Audio src={staticFile("audio/achievements-narration.mp3")} />

      <Sequence from={s1TitleFrom} durationInFrames={S1_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text="منجزات المدرسة" />
      </Sequence>
      {schoolAchievements.map((a, i) => (
        <Sequence key={a.image} from={schoolFroms[i]} durationInFrames={S1_CARD_BEATS[i]} layout="absolute-fill">
          <CertificateCard image={a.image} caption={a.caption} />
        </Sequence>
      ))}

      <Sequence from={s2TitleFrom} durationInFrames={S2_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text={competitionName} />
      </Sequence>
      {competitionRanks.map((r, i) => (
        <Sequence key={i} from={rankFroms[i]} durationInFrames={S2_RANK_BEATS[i]} layout="absolute-fill">
          <RankBeat rank={r.rank} grade={r.grade} year={r.year} standout={r.standout} />
        </Sequence>
      ))}

      <Sequence from={s3TitleFrom} durationInFrames={S3_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text="منجزات المعلمات" />
      </Sequence>
      {teacherAchievements.map((t, i) => (
        <Sequence key={t.name} from={teacherFroms[i]} durationInFrames={S3_CARD_BEATS[i]} layout="absolute-fill">
          <TeacherCard image={t.image} name={t.name} achievement={t.achievement} />
        </Sequence>
      ))}

      <Sequence from={s4TitleFrom} durationInFrames={S4_TITLE_BEAT} layout="absolute-fill">
        <SectionTitle text="الموهوبات" />
      </Sequence>
      {honoredStudents.map((s, i) => (
        <Sequence key={s.shortName} from={studentFroms[i]} durationInFrames={S4_STUDENT_BEATS[i]} layout="absolute-fill">
          <StudentBeat shortName={s.shortName} achievement={s.achievement} standout={s.standout} certificate={s.certificate} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
