import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { Sfx, TickBurst } from "../components/Sfx";
import logoDotsData from "../data/logoDots.json";

/**
 * مقدمة ترحيبية قصيرة (أقل من 30 ثانية) تُعرض قبل بداية الفيديو: شعار
 * الوزارة الحقيقي (public/ministry-logo.webp) يتكوّن "حبة حبة" - الشعار
 * الرسمي نفسه مكوَّن أصلاً من دوائر، فاستُخرجت مواضعها وأنصاف أقطارها
 * الحقيقية بتحليل بكسلات الصورة (34 دائرة)، وتُعرض هنا بالأبيض فقط على
 * خلفية كحلية داكنة من ألوان الهوية. بعدها يُكتب بيت شعر ترحيبي بخط القلم
 * (كشف تدريجي بـclip-path من اليمين لليسار يحاكي اتجاه الكتابة العربية)
 * بخط BalooBhaijaan2 الذي أرسلته المستخدمة لهذه المقدمة تحديدًا. بدون أي
 * صوت سرد - مؤثرات صوتية خفيفة فقط. اسم المدرسة وإدارة التعليم ثابتان أسفل
 * الشاشة طوال المقدمة، بموضع فعلي يسار/يمين الشاشة (وليس RTL منطقي) بناءً
 * على طلب صريح.
 */
export const WELCOME_INTRO_DURATION = 870;

const ARABIC_WORDMARK_BOX = { x: 16, y: 338, w: 696, h: 102 };
const ENGLISH_WORDMARK_BOX = { x: 16, y: 476, w: 696, h: 76 };
const LOGO_BBOX = { x0: 20, y0: 20, x1: 714, y1: 547 };

const LOGO_SCREEN_W = 729;
const SCALE = LOGO_SCREEN_W / (LOGO_BBOX.x1 - LOGO_BBOX.x0);
const LOGO_LEFT = (1920 - LOGO_SCREEN_W) / 2;
const LOGO_TOP = 90;

const toScreen = (ox: number, oy: number) => ({
  x: LOGO_LEFT + (ox - LOGO_BBOX.x0) * SCALE,
  y: LOGO_TOP + (oy - LOGO_BBOX.y0) * SCALE,
});

const DOTS_START = 10;
const DOT_STAGGER = 5;
const DOT_ANIM = 18;
const dotsEnd = DOTS_START + (logoDotsData.dots.length - 1) * DOT_STAGGER + DOT_ANIM;

const ARABIC_WORDMARK_START = dotsEnd + 7;
const ARABIC_WORDMARK_DURATION = 45;
const ENGLISH_WORDMARK_START = ARABIC_WORDMARK_START + 30;
const ENGLISH_WORDMARK_DURATION = 45;
const logoDone = ENGLISH_WORDMARK_START + ENGLISH_WORDMARK_DURATION;

const BAYT1_START = logoDone + 45;
const BAYT1_DURATION = 55;
const BAYT2_START = BAYT1_START + BAYT1_DURATION + 25;
const BAYT2_DURATION = 55;

const LogoDots: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {logoDotsData.dots.map((d, i) => {
        const start = DOTS_START + i * DOT_STAGGER;
        const local = frame - start;
        if (local < -2) return null;
        const t = interpolate(local, [0, DOT_ANIM], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(1.5)),
        });
        const pos = toScreen(d.cx, d.cy);
        const r = d.r * SCALE;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pos.x - r,
              top: pos.y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: "#ffffff",
              opacity: Math.max(t, 0),
              transform: `scale(${Math.max(t, 0)})`,
              boxShadow: "0 0 16px rgba(255,255,255,0.4)",
            }}
          />
        );
      })}
    </>
  );
};

const WordmarkWipe: React.FC<{
  src: string;
  box: { x: number; y: number; w: number; h: number };
  from: number;
  duration: number;
  direction: "rtl" | "ltr";
}> = ({ src, box, from, duration, direction }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  if (local < -2) return null;
  const t = interpolate(local, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const pos = toScreen(box.x, box.y);
  const clipPath = direction === "rtl" ? `inset(0 0 0 ${(1 - t) * 100}%)` : `inset(0 ${(1 - t) * 100}% 0 0)`;
  return (
    <Img
      src={src}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: box.w * SCALE,
        height: box.h * SCALE,
        clipPath,
      }}
    />
  );
};

const PoemLine: React.FC<{ text: string; color: string; top: number; from: number; duration: number }> = ({
  text,
  color,
  top,
  from,
  duration,
}) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  if (local < -2) return null;
  const reveal = interpolate(local, [0, duration], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center" }}>
      <div
        dir="rtl"
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          fontFamily: '"Baloo Bhaijaan 2"',
          fontWeight: 700,
          fontSize: 54,
          color,
          clipPath: `inset(0 0 0 ${reveal}%)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const WelcomeIntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const labelsT = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: brand.primaryDark }}>
      <Sfx kind="whoosh" at={0} volume={0.3} />
      <TickBurst from={DOTS_START} durationInFrames={dotsEnd - DOTS_START} count={logoDotsData.dots.length} volume={0.12} />
      <Sfx kind="whoosh" at={ARABIC_WORDMARK_START} volume={0.22} />
      <Sfx kind="whoosh" at={ENGLISH_WORDMARK_START} volume={0.18} />
      <Sfx kind="tick" at={BAYT1_START} volume={0.3} />
      <Sfx kind="tick" at={BAYT2_START} volume={0.3} />

      <LogoDots />
      <WordmarkWipe
        src={staticFile("intro/logo-wordmark-ar.png")}
        box={ARABIC_WORDMARK_BOX}
        from={ARABIC_WORDMARK_START}
        duration={ARABIC_WORDMARK_DURATION}
        direction="rtl"
      />
      <WordmarkWipe
        src={staticFile("intro/logo-wordmark-en.png")}
        box={ENGLISH_WORDMARK_BOX}
        from={ENGLISH_WORDMARK_START}
        duration={ENGLISH_WORDMARK_DURATION}
        direction="ltr"
      />

      <PoemLine
        text="بِكُم أزهَرَ العِلمُ في رُبوعِنا وفاحَ شَذا الخَيرِ في أرجائِنا"
        color="#ffffff"
        top={700}
        from={BAYT1_START}
        duration={BAYT1_DURATION}
      />
      <PoemLine
        text="فحَيَّا الصَّباحُ خُطاكُم بابتِسامةٍ ومدرستي اليومَ تَزهو بِلِقانا"
        color={brand.teal}
        top={792}
        from={BAYT2_START}
        duration={BAYT2_DURATION}
      />

      <div
        style={{
          position: "absolute",
          left: 60,
          bottom: 52,
          opacity: labelsT,
          fontFamily,
          fontWeight: 700,
          fontSize: 26,
          color: "#eaf2ef",
        }}
      >
        المدرسة الابتدائية الخامسة والستون بعد المائة
      </div>
      <div
        style={{
          position: "absolute",
          right: 60,
          bottom: 52,
          opacity: labelsT,
          fontFamily,
          fontWeight: 700,
          fontSize: 26,
          color: "#eaf2ef",
        }}
      >
        إدارة التعليم محافظة جدة
      </div>
    </AbsoluteFill>
  );
};
