import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { brand, fontFamily } from "../brand/tokens";
import { StatsSceneChrome } from "../components/StatsSceneChrome";
import { CountUpNumber } from "../components/CountUpNumber";
import { Sfx } from "../components/Sfx";
import { headlineStats } from "../data/schoolStats";
import { adminsCount, economicCasesCount, healthCases, socialCasesCount, supervisoryRoles, teacherLicense } from "../data/orgStats";

/**
 * "الخريطة التنظيمية والإحصائية" - أول مشهد في هذا الفيديو (يحل محل
 * StatsIntroScene). خريطة واحدة متراكمة (نفس أسلوب FacilitiesScene: عمود
 * فقري يمتد تدريجيًا وبطاقات تتوالى بالظهور وتبقى على الشاشة)، مقسّمة إلى
 * 5 مجموعات مترابطة كما طلب المستخدم بالضبط: الهيئة الإشرافية، ثم
 * المعلمات+الإداريات، ثم الطالبات+الفصول، ثم الاقتصادية+الاجتماعية، ثم
 * الصحية+السكر+الصرع.
 *
 * التوقيت: مبني على الصوت الحقيقي (public/audio/school-stats/org-stats-line
 * .mp3، نفس صوت "Layla" المستخدم في بقية المشروع)، طوله الفعلي 41.404
 * ثانية = 1243 فريمًا (ceil). هذا أطول من الهدف المبدئي (18-25 ثانية) الذي
 * ذكرته المستخدمة - لم يُقصَّ أو يُسرَّع الصوت لإجباره على مدة أقصر (نفس
 * قاعدة "عدم التلاعب بالصوت" المتبعة في كل المشروع)، بل استُخدم طوله
 * الحقيقي كما هو وأُعيد توزيع ظهور العناصر بالتناسب مع مواضع الكلمات في كل
 * جملة من النص (نفس منهجية عدد الكلمات في NARRATION-TIMING.md لكن مُطبَّقة
 * مباشرة على طول الصوت الحقيقي بدل تقدير أولي). لا يوجد أي مهلة صامتة
 * إضافية بعد نهاية الصوت - مدة المشهد بالكامل = مدة الصوت بالضبط.
 */
const REVEAL_DURATION = 18; // ~0.6s icon->label->count entrance
const COUNT_DURATION = 20; // ~0.67s count-up
const AUDIO_SRC = "audio/school-stats/org-stats-line.mp3";

export const ORG_STATS_DURATION = 1243; // ceil(41.404s * 30fps), the narration's exact length

const ITEM_START = {
  groupTitle: 0,
  director: 129,
  deputy: 172,
  guidance: 215,
  teachers: 258,
  licensed: 355,
  notLicensed: 468,
  admins: 549,
  students: 613,
  classes: 742,
  economic: 839,
  social: 952,
  health: 1033,
  sugar: 1130,
  epilepsy: 1195,
} as const;

// ---- Layout (1920x1080, chrome header=118 / footer=64) ----
const SPINE_TOP = 210;
const SPINE_BOTTOM = 960;
const ROW_TITLE_Y = 160;
const ROW_ROLES_Y = 245;
const ROW_TEACH_ADMIN_Y = 375;
const ROW_STUDENTS_Y = 555;
const ROW_ECON_SOCIAL_Y = 705;
const ROW_HEALTH_Y = 855;

// ---- Icons: unified single-color line icons, same visual language as FacilitiesScene ----
const IC = brand.primary;
const iconProps = { width: 34, height: 34, viewBox: "0 0 48 48", fill: "none", stroke: IC, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const DirectorIcon = () => (
  <svg {...iconProps}><circle cx="24" cy="16" r="8" /><path d="M8 42c0-10 7-16 16-16s16 6 16 16" /><path d="M24 4v4M17 6l2 3M31 6l-2 3" /></svg>
);
const DeputyIcon = () => (
  <svg {...iconProps}><circle cx="24" cy="17" r="7.5" /><path d="M9 42c0-9 7-15 15-15s15 6 15 15" /><path d="M17 26l4 4 9-9" /></svg>
);
const GuidanceIcon = () => (
  <svg {...iconProps}><path d="M6 10h36v22H20l-8 8v-8H6z" /><path d="M14 19h20M14 25h12" /></svg>
);
const TeachersGroupIcon = () => (
  <svg {...iconProps}><circle cx="17" cy="16" r="6" /><path d="M6 40c0-8 5-13 11-13s11 5 11 13" /><circle cx="34" cy="14" r="5" strokeOpacity={0.55} /><path d="M26 40c1-7 5-11 10-11s9 4 10 11" strokeOpacity={0.55} /></svg>
);
const LicenseIcon = () => (
  <svg width={22} height={22} viewBox="0 0 48 48" fill="none" stroke={IC} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="12" width="38" height="26" rx="3" /><circle cx="16" cy="25" r="5" /><path d="M26 21h13M26 29h13" /><path d="M13 44l3-4 3 4" /></svg>
);
const NoLicenseIcon = () => (
  <svg width={22} height={22} viewBox="0 0 48 48" fill="none" stroke={brand.muted} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="12" width="38" height="26" rx="3" /><path d="M18 31l8-11M18 20l8 11" /></svg>
);
const AdminsIcon = () => (
  <svg {...iconProps}><circle cx="20" cy="14" r="6.5" /><path d="M8 40c0-8.5 5.5-14 12-14s12 5.5 12 14" /><rect x="30" y="22" width="14" height="12" rx="2" strokeOpacity={0.55} /><path d="M33 22v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeOpacity={0.55} /></svg>
);
const StudentsGroupIcon = () => (
  <svg {...iconProps}><circle cx="16" cy="15" r="6" /><path d="M4 40c0-8 5-13 12-13s12 5 12 13" /><circle cx="35" cy="14" r="5" strokeOpacity={0.6} /><path d="M26 40c1-7 5-11 9-11s8 4 9 11" strokeOpacity={0.6} /></svg>
);
const ClassesGroupIcon = () => (
  <svg {...iconProps}><rect x="6" y="10" width="36" height="26" rx="3" /><path d="M6 20h36" /><path d="M14 36v6M34 36v6" /><rect x="14" y="24" width="6" height="6" strokeOpacity={0.6} /><rect x="28" y="24" width="6" height="6" strokeOpacity={0.6} /></svg>
);
const EconomicIcon = () => (
  <svg {...iconProps}><rect x="5" y="14" width="38" height="24" rx="4" /><path d="M5 21h38" /><circle cx="33" cy="29" r="3.6" /></svg>
);
const SocialIcon = () => (
  <svg {...iconProps}><circle cx="16" cy="15" r="6" /><circle cx="32" cy="15" r="6" strokeOpacity={0.6} /><path d="M6 40c0-7.5 4.5-12.5 10-12.5s10 5 10 12.5" /><path d="M22 40c0-7.5 4.5-12.5 10-12.5s10 5 10 12.5" strokeOpacity={0.6} /></svg>
);
const HealthIcon = () => (
  <svg {...iconProps}><circle cx="24" cy="24" r="18" /><path d="M24 15v18M15 24h18" /></svg>
);
const SugarIcon = () => (
  <svg width={22} height={22} viewBox="0 0 48 48" fill="none" stroke={IC} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M24 6c8 11 13 18 13 25a13 13 0 0 1-26 0c0-7 5-14 13-25Z" /></svg>
);
const EpilepsyIcon = () => (
  <svg width={22} height={22} viewBox="0 0 48 48" fill="none" stroke={IC} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 26h8l4-12 8 22 4-16 4 6h12" /></svg>
);

const GroupTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [ITEM_START.groupTitle, ITEM_START.groupTitle + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: ROW_TITLE_Y,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily,
        fontWeight: 800,
        fontSize: 32,
        color: brand.primaryDark,
        opacity: t,
      }}
    >
      الهيئة الإشرافية
    </div>
  );
};

/** Central spine, growing continuously with overall scene progress. */
const Spine: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [10, 1200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const len = SPINE_BOTTOM - SPINE_TOP;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <line
        x1={960}
        y1={SPINE_TOP}
        x2={960}
        y2={SPINE_TOP + len * draw}
        stroke={brand.border}
        strokeWidth={3}
      />
    </svg>
  );
};

const Pill: React.FC<{ label: string; x: number; y: number; from: number; icon: React.ReactNode }> = ({ label, x, y, from, icon }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const t = interpolate(local, [0, REVEAL_DURATION], [0, 1], {
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
        left: x - 150,
        top: y,
        width: 300,
        opacity: t,
        scale: 0.85 + t * 0.15,
        translate: `0 ${interpolate(t, [0, 1], [10, 0])}px`,
      }}
    >
      <Sfx kind="tick" at={from} volume={0.2} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "#fbfdfc",
          border: `1.5px solid ${brand.border}`,
          borderRadius: 999,
          boxShadow: "0 10px 26px rgba(21,68,90,0.10)",
          padding: "12px 22px",
        }}
      >
        {icon}
        <span style={{ fontFamily, fontWeight: 800, fontSize: 20, color: brand.primaryDark }}>{label}</span>
      </div>
    </div>
  );
};

const SubBadge: React.FC<{ label: string; x: number; y: number; from: number; icon: React.ReactNode; muted?: boolean }> = ({
  label,
  x,
  y,
  from,
  icon,
  muted,
}) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const t = interpolate(local, [0, REVEAL_DURATION], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  if (local < -2) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translateX(-50%) translateY(${interpolate(t, [0, 1], [8, 0])}px)`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        opacity: t,
        background: muted ? "#f3f5f4" : "#eaf7f1",
        borderRadius: 999,
        padding: "6px 14px",
        whiteSpace: "nowrap",
      }}
    >
      <Sfx kind="tick" at={from} volume={0.15} />
      {icon}
      <span style={{ fontFamily, fontWeight: 700, fontSize: 16, color: muted ? brand.muted : brand.primaryDark }}>{label}</span>
    </div>
  );
};

const StatCard: React.FC<{
  x: number;
  y: number;
  w: number;
  label: string;
  value: number;
  from: number;
  icon: React.ReactNode;
}> = ({ x, y, w, label, value, from, icon }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const t = interpolate(local, [0, REVEAL_DURATION], [0, 1], {
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
        left: x - w / 2,
        top: y,
        width: w,
        opacity: t,
        scale: 0.88 + t * 0.12,
        translate: `0 ${interpolate(t, [0, 1], [12, 0])}px`,
      }}
    >
      <Sfx kind="tick" at={from} volume={0.2} />
      <Sfx kind="impact" at={from + COUNT_DURATION} volume={0.3} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "#fbfdfc",
          border: `1.5px solid ${brand.border}`,
          borderRadius: 18,
          boxShadow: "0 10px 26px rgba(21,68,90,0.10)",
          padding: "16px 24px",
        }}
      >
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#eef6f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 19, color: brand.muted }}>{label}</div>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 42, color: brand.primary }}>
            <CountUpNumber value={value} decimals={0} from={from} durationInFrames={COUNT_DURATION} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const OrgStatsScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <StatsSceneChrome sectionTitle="الهيكل الإشرافي والإحصاءات العامة" />
      <Sequence from={0} layout="none">
        <Audio src={staticFile(AUDIO_SRC)} />
      </Sequence>
      <Sfx kind="whoosh" at={0} volume={0.4} />

      <Spine />
      <GroupTitle />

      <Pill label={supervisoryRoles[0]} x={960 + 280} y={ROW_ROLES_Y} from={ITEM_START.director} icon={<DirectorIcon />} />
      <Pill label={supervisoryRoles[1]} x={960} y={ROW_ROLES_Y} from={ITEM_START.deputy} icon={<DeputyIcon />} />
      <Pill label={supervisoryRoles[2]} x={960 - 280} y={ROW_ROLES_Y} from={ITEM_START.guidance} icon={<GuidanceIcon />} />

      <StatCard
        x={960 + 260}
        y={ROW_TEACH_ADMIN_Y}
        w={440}
        label="المعلمات"
        value={teacherLicense.total}
        from={ITEM_START.teachers}
        icon={<TeachersGroupIcon />}
      />
      <SubBadge
        label={`${teacherLicense.licensed} حاصلات على الرخصة`}
        x={960 + 260 + 80}
        y={ROW_TEACH_ADMIN_Y + 110}
        from={ITEM_START.licensed}
        icon={<LicenseIcon />}
      />
      <SubBadge
        label={`${teacherLicense.notLicensed} بدون رخصة`}
        x={960 + 260 - 80}
        y={ROW_TEACH_ADMIN_Y + 110}
        from={ITEM_START.notLicensed}
        icon={<NoLicenseIcon />}
        muted
      />

      <StatCard
        x={960 - 260}
        y={ROW_TEACH_ADMIN_Y}
        w={380}
        label="الإداريات"
        value={adminsCount}
        from={ITEM_START.admins}
        icon={<AdminsIcon />}
      />

      <StatCard
        x={960 + 260}
        y={ROW_STUDENTS_Y}
        w={380}
        label="الطالبات"
        value={headlineStats.studentCount}
        from={ITEM_START.students}
        icon={<StudentsGroupIcon />}
      />
      <StatCard
        x={960 - 260}
        y={ROW_STUDENTS_Y}
        w={380}
        label="الفصول"
        value={headlineStats.classCount}
        from={ITEM_START.classes}
        icon={<ClassesGroupIcon />}
      />

      <StatCard
        x={960 + 260}
        y={ROW_ECON_SOCIAL_Y}
        w={380}
        label="الحالة الاقتصادية"
        value={economicCasesCount}
        from={ITEM_START.economic}
        icon={<EconomicIcon />}
      />
      <StatCard
        x={960 - 260}
        y={ROW_ECON_SOCIAL_Y}
        w={380}
        label="الحالة الاجتماعية"
        value={socialCasesCount}
        from={ITEM_START.social}
        icon={<SocialIcon />}
      />

      <StatCard
        x={960}
        y={ROW_HEALTH_Y}
        w={420}
        label="الحالة الصحية"
        value={healthCases.total}
        from={ITEM_START.health}
        icon={<HealthIcon />}
      />
      <SubBadge
        label={`${healthCases.sugar} سكر`}
        x={960 + 90}
        y={ROW_HEALTH_Y + 110}
        from={ITEM_START.sugar}
        icon={<SugarIcon />}
      />
      <SubBadge
        label={`${healthCases.epilepsy} صرع`}
        x={960 - 90}
        y={ROW_HEALTH_Y + 110}
        from={ITEM_START.epilepsy}
        icon={<EpilepsyIcon />}
      />
    </AbsoluteFill>
  );
};
