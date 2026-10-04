import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { brand, fontFamily } from "../brand/tokens";
import { StatsSceneChrome } from "../components/StatsSceneChrome";
import { CountUpNumber } from "../components/CountUpNumber";
import { Sfx } from "../components/Sfx";
import { headlineStats } from "../data/schoolStats";
import {
  adminsCount,
  economicCasesCount,
  healthCases,
  socialCasesCount,
  specialNeedsCases,
  supervisoryRoles,
  teacherClassification,
  teacherLicense,
  transferredStudents,
  repeatingStudents,
} from "../data/orgStats";

/**
 * "الخريطة التنظيمية والإحصائية" - أول مشهد في هذا الفيديو (يحل محل
 * StatsIntroScene). خريطة واحدة متراكمة (نفس أسلوب FacilitiesScene: عمود
 * فقري يمتد تدريجيًا وبطاقات تتوالى بالظهور وتبقى على الشاشة)، مقسّمة إلى
 * 5 مجموعات مترابطة كما طلب المستخدم بالضبط: الهيئة الإشرافية، ثم
 * المعلمات+الإداريات، ثم الطالبات+الفصول، ثم الاقتصادية+الاجتماعية، ثم
 * الصحية+السكر+الصرع.
 *
 * التوقيت: مبني بالكامل على التسجيل الصوتي الحقيقي الثاني
 * (public/audio/school-stats/org-stats-line.mp3، صوت "Layla"، 59.35 ثانية)
 * الذي يغطي كل شيء الآن - بما فيها تصنيف المعلمات وموهبة/إعاقة/صعوبات
 * التعلّم، فلا حاجة بعد اليوم لأي فجوة صامتة أو تقسيم صوتي. المنهجية:
 * النص الفعلي قُسّم إلى 22 مقطعًا مطابقًا لكل عنصر يظهر على الشاشة، حُسب
 * عدد كلمات كل مقطع، استُخدمت النسبة التراكمية لتقدير زمن البداية، ثم
 * طوبق كل تقدير مع أقرب سكتة صمت حقيقية من
 * `ffmpeg -af silencedetect=noise=-30dB:d=0.25`، مع فرض حد أدنى 22 إطارًا
 * بين أي عنصرين متتاليين (أطول قليلًا من REVEAL_DURATION) حتى لا يتداخل
 * ظهور عنصر مع سابقه.
 */
const REVEAL_DURATION = 18; // ~0.6s icon->label->count entrance
const COUNT_DURATION = 20; // ~0.67s count-up
const AUDIO_SRC = "audio/school-stats/org-stats-line.mp3";

// آخر عنصر مَنطوق (learningDifficulty=1774) + مهلة هدوء قصيرة قبل الانتقال.
// الطالبات المنقولات من/إلى المدرسة لها مشهدها المستقل الخاص الآن
// (TransferredStudentsScene) بدل إضافتها هنا - راجع ذلك الملف.
export const ORG_STATS_DURATION = 1812;

const ITEM_START = {
  groupTitle: 81,
  director: 108,
  deputy: 186,
  guidance: 208,
  admins: 230,
  teachers: 343,
  licensed: 433,
  notLicensed: 482,
  classExpert: 509,
  classAdvanced: 680,
  classPractitioner: 742,
  classAssistant: 858,
  students: 880,
  classes: 928,
  transferredFrom: 940, // إضافة صامتة بصرية - بدون تسجيل صوتي يغطيها بعد
  transferredTo: 970,
  repeating: 1000,
  economic: 1044,
  social: 1212,
  health: 1304,
  sugar: 1452,
  epilepsy: 1474,
  gifted: 1550,
  disability: 1686,
  learningDifficulty: 1774,
} as const;

// ---- Layout (1920x1080, chrome header=118 / footer=64) ----
// إعادة تصميم كاملة (جولة ثالثة): بدل أربع صفوف تنزل تحت بعض (فوق بعض =
// "مزدحم ومتراكب" حسب وصف المستخدمة)، كل الفروع السبعة بصف أفقي واحد
// عريض يمتد على كامل عرض الشاشة - بالضبط زي الصورة المرجعية (فرع بجانب
// فرع، لا فرع فوق فرع). تفاصيل كل فرع (الرخصة، التصنيف، المنقولات...)
// تنزل في عمود ضيق تحت فرعها هو بالذات فقط.
const SPINE_TOP = 195;
const ROW_TITLE_Y = 150;
const ROW_ROLES_Y = 215;
const BAR_Y = 300; // الخط الأفقي اللي يتفرّع منه كل الفروع السبعة
const CARD_TOP_Y = 330;
const CHILD_START_Y = 552; // أول عنصر تحت أي فرع
const CHILD_STEP = 44;

// مراكز الفروع السبعة (من اليمين لليسار) - موزّعة على كامل العرض بتباعد
// غير منتظم عمدًا: فرعا "المعلمات" و"الطالبات" لهما أكبر عدد تفاصيل تحتهما
// (رخصة+تصنيف، ومنقولات+معيدات) فأعطيا مسافة أكبر بينهما لمنع تراكب نص
// التفاصيل الطويلة، بينما بقية الفروع (تفاصيلها قصيرة أو معدومة) أقرب لبعض.
const BX = {
  admins: 1775,
  teachers: 1535,
  students: 1135,
  classes: 895,
  economic: 655,
  social: 415,
  health: 175,
} as const;

// ---- Icons: unified single-color line icons, same visual language as FacilitiesScene ----
const IC = brand.primary;
const iconProps = { width: 38, height: 38, viewBox: "0 0 48 48", fill: "none", stroke: IC, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

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
const RankBadgeIcon = () => (
  <svg {...iconProps}><circle cx="24" cy="18" r="11" /><path d="M15 27l-4 15 13-6 13 6-4-15" /></svg>
);
const GiftedIcon = () => (
  <svg width={22} height={22} viewBox="0 0 48 48" fill="none" stroke={IC} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M24 6l4.5 9.5L38 18l-7 7 1.7 10-8.7-5-8.7 5L17 25l-7-7 9.5-2.5L24 6Z" /></svg>
);
const DisabilityIcon = () => (
  <svg width={22} height={22} viewBox="0 0 48 48" fill="none" stroke={brand.muted} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="10" r="4" /><path d="M20 16v10l-9 14M20 26h14M20 20l9 6 7-4" /></svg>
);
const LearningDifficultyIcon = () => (
  <svg width={22} height={22} viewBox="0 0 48 48" fill="none" stroke={brand.muted} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M8 14h24v26H8zM32 20h8v20h-8z" /><path d="M14 22h12M14 28h12M14 34h8" /></svg>
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
        fontSize: 48,
        color: brand.primaryDark,
        opacity: t,
      }}
    >
      الهيئة الإشرافية
    </div>
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
        <span style={{ fontFamily, fontWeight: 800, fontSize: 36, color: brand.primaryDark }}>{label}</span>
      </div>
    </div>
  );
};

/**
 * بطاقة صغيرة لعناصر فرعية (تصنيف المعلمات، المنقولات، تفاصيل الحالة
 * الصحية) - مربّع بإطار وخط علوي ملوّن مثل البطاقات الكبيرة بالضبط (مو
 * حبة مستديرة pill)، بس بحجم مصغّر وسطر واحد أفقي حتى تترتب الأعمدة
 * الطويلة (ستة عناصر تحت المعلمات مثلاً) تحت بعض بدون ما تتجاوز الشاشة.
 */
const SubBadge: React.FC<{ label: string; x: number; y: number; from: number; icon: React.ReactNode; muted?: boolean; accent?: string }> = ({
  label,
  x,
  y,
  from,
  icon,
  muted,
  accent = brand.primary,
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
        gap: 7,
        opacity: t,
        background: "#fbfdfc",
        border: `1px solid ${brand.border}`,
        borderTop: `3px solid ${muted ? brand.gray : accent}`,
        borderRadius: 8,
        boxShadow: "0 4px 10px rgba(21,68,90,0.06)",
        padding: "5px 13px",
        whiteSpace: "nowrap",
      }}
    >
      <Sfx kind="tick" at={from} volume={0.15} />
      {icon}
      <span style={{ fontFamily, fontWeight: 700, fontSize: 27, color: muted ? brand.muted : brand.primaryDark }}>{label}</span>
    </div>
  );
};

/** يحوّل لون هوية (hex) إلى خلفية فاتحة جدًا لدائرة الأيقونة، بنفس أسلوب برنامج الألوان الموجود أصلاً (#eef6f2 كان تلوينًا يدويًا لـ brand.primary فقط). */
const tint = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.14)`;
};

/** بطاقة فرع مدمجة (أيقونة فوق، تسمية، قيمة) - عرضها ضيق لأن سبعة فروع تتجاور بصف واحد بدل فروع عريضة تتكدّس فوق بعض. */
const BranchCard: React.FC<{
  x: number;
  label: string;
  value: number;
  from: number;
  icon: React.ReactNode;
  accent?: string;
}> = ({ x, label, value, from, icon, accent = brand.primary }) => {
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
        left: x - 115,
        top: CARD_TOP_Y,
        width: 230,
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
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          textAlign: "center",
          background: "#fbfdfc",
          border: `1.5px solid ${brand.border}`,
          borderTop: `5px solid ${accent}`,
          borderRadius: 16,
          boxShadow: "0 10px 26px rgba(21,68,90,0.10)",
          padding: "14px 10px 12px",
        }}
      >
        <div style={{ width: 54, height: 54, borderRadius: "50%", background: tint(accent), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ fontFamily, fontWeight: 700, fontSize: 24, color: brand.muted, lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 46, color: brand.primaryDark }}>
          <CountUpNumber value={value} decimals={0} from={from} durationInFrames={COUNT_DURATION} />
        </div>
      </div>
    </div>
  );
};

/** الخط الأفقي اللي يمتد على كامل الصف ويتفرّع منه كل فرع - يرسم تدريجيًا بمجرد بداية صف الفروع. */
const BranchBar: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [from, from + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  if (frame < from - 2) return null;
  const left = BX.health;
  const right = BX.admins;
  const span = right - left;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <line x1={960} y1={SPINE_TOP} x2={960} y2={BAR_Y} stroke={brand.border} strokeWidth={3} opacity={draw} />
      <path
        d={`M ${left} ${BAR_Y} H ${right}`}
        stroke={brand.border}
        strokeWidth={3}
        strokeDasharray={span}
        strokeDashoffset={span * (1 - draw)}
      />
    </svg>
  );
};

/** جذع قصير من الخط الأفقي إلى رأس كل بطاقة فرع. */
const Stem: React.FC<{ x: number; from: number }> = ({ x, from }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, from + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < from - 2) return null;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <line x1={x} y1={BAR_Y} x2={x} y2={CARD_TOP_Y} stroke={brand.border} strokeWidth={3} opacity={t} />
    </svg>
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

      <GroupTitle />

      <Pill label={supervisoryRoles[0]} x={960 + 320} y={ROW_ROLES_Y} from={ITEM_START.director} icon={<DirectorIcon />} />
      <Pill label={supervisoryRoles[1]} x={960} y={ROW_ROLES_Y} from={ITEM_START.deputy} icon={<DeputyIcon />} />
      <Pill label={supervisoryRoles[2]} x={960 - 320} y={ROW_ROLES_Y} from={ITEM_START.guidance} icon={<GuidanceIcon />} />

      <BranchBar from={ITEM_START.admins} />

      <Stem x={BX.admins} from={ITEM_START.admins} />
      <BranchCard x={BX.admins} label="الإداريات" value={adminsCount} from={ITEM_START.admins} icon={<AdminsIcon />} accent={brand.blue} />

      <Stem x={BX.teachers} from={ITEM_START.teachers} />
      <BranchCard x={BX.teachers} label="المعلمات" value={teacherLicense.total} from={ITEM_START.teachers} icon={<TeachersGroupIcon />} accent={brand.primary} />
      <SubBadge label={`${teacherLicense.licensed} حاصلة رخصة`} x={BX.teachers} y={CHILD_START_Y} from={ITEM_START.licensed} icon={<LicenseIcon />} />
      <SubBadge label={`${teacherLicense.notLicensed} بدون رخصة`} x={BX.teachers} y={CHILD_START_Y + CHILD_STEP} from={ITEM_START.notLicensed} icon={<NoLicenseIcon />} muted />
      <SubBadge label={`معلم خبير: ${teacherClassification.expert}`} x={BX.teachers} y={CHILD_START_Y + CHILD_STEP * 2} from={ITEM_START.classExpert} icon={<RankBadgeIcon />} />
      <SubBadge label={`معلم متقدم: ${teacherClassification.advanced}`} x={BX.teachers} y={CHILD_START_Y + CHILD_STEP * 3} from={ITEM_START.classAdvanced} icon={<RankBadgeIcon />} />
      <SubBadge label={`معلم ممارس: ${teacherClassification.practitioner}`} x={BX.teachers} y={CHILD_START_Y + CHILD_STEP * 4} from={ITEM_START.classPractitioner} icon={<RankBadgeIcon />} />
      <SubBadge label={`مساعد معلم: ${teacherClassification.assistant}`} x={BX.teachers} y={CHILD_START_Y + CHILD_STEP * 5} from={ITEM_START.classAssistant} icon={<RankBadgeIcon />} />

      <Stem x={BX.students} from={ITEM_START.students} />
      <BranchCard x={BX.students} label="الطالبات" value={headlineStats.studentCount} from={ITEM_START.students} icon={<StudentsGroupIcon />} accent={brand.teal} />
      <SubBadge label={`${transferredStudents.from} منقولة من المدرسة`} x={BX.students} y={CHILD_START_Y} from={ITEM_START.transferredFrom} icon={<StudentsGroupIcon />} accent={brand.teal} />
      <SubBadge label={`${transferredStudents.to} منقولة إلى المدرسة`} x={BX.students} y={CHILD_START_Y + CHILD_STEP} from={ITEM_START.transferredTo} icon={<StudentsGroupIcon />} accent={brand.teal} />
      <SubBadge label={`${repeatingStudents} طالبات معيدات`} x={BX.students} y={CHILD_START_Y + CHILD_STEP * 2} from={ITEM_START.repeating} icon={<StudentsGroupIcon />} muted />

      <Stem x={BX.classes} from={ITEM_START.classes} />
      <BranchCard x={BX.classes} label="الفصول" value={headlineStats.classCount} from={ITEM_START.classes} icon={<ClassesGroupIcon />} accent={brand.gold} />

      <Stem x={BX.economic} from={ITEM_START.economic} />
      <BranchCard x={BX.economic} label="الحالة الاقتصادية" value={economicCasesCount} from={ITEM_START.economic} icon={<EconomicIcon />} accent={brand.primaryDark} />

      <Stem x={BX.social} from={ITEM_START.social} />
      <BranchCard x={BX.social} label="الحالة الاجتماعية" value={socialCasesCount} from={ITEM_START.social} icon={<SocialIcon />} accent={brand.blue} />

      <Stem x={BX.health} from={ITEM_START.health} />
      <BranchCard x={BX.health} label="الحالة الصحية" value={healthCases.total} from={ITEM_START.health} icon={<HealthIcon />} accent={brand.gold} />
      <SubBadge label={`${healthCases.sugar} سكر`} x={BX.health} y={CHILD_START_Y} from={ITEM_START.sugar} icon={<SugarIcon />} accent={brand.gold} />
      <SubBadge label={`${healthCases.epilepsy} صرع`} x={BX.health} y={CHILD_START_Y + CHILD_STEP} from={ITEM_START.epilepsy} icon={<EpilepsyIcon />} accent={brand.gold} />
      <SubBadge label={`${specialNeedsCases.gifted} موهبة`} x={BX.health} y={CHILD_START_Y + CHILD_STEP * 2} from={ITEM_START.gifted} icon={<GiftedIcon />} accent={brand.gold} />
      <SubBadge label={`${specialNeedsCases.disability} إعاقة`} x={BX.health} y={CHILD_START_Y + CHILD_STEP * 3} from={ITEM_START.disability} icon={<DisabilityIcon />} muted />
      <SubBadge label={`${specialNeedsCases.learningDifficulty} صعوبات تعلم`} x={BX.health} y={CHILD_START_Y + CHILD_STEP * 4} from={ITEM_START.learningDifficulty} icon={<LearningDifficultyIcon />} muted />
    </AbsoluteFill>
  );
};
