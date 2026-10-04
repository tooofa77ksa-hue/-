import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { Sfx } from "../components/Sfx";

/**
 * مقدمة ترحيبية احترافية (أقل من 30 ثانية) تُعرض قبل بداية الفيديو.
 *
 * أُعيد تصميمها بالكامل بعد أن رُفض الإصدار الأول (شعار يتكوّن نقطة نقطة مع
 * صوت "طق طق" متكرر - وُصف بأنه "يدب" وغير احترافي). التصميم الحالي:
 * مرحلتان فقط، بلا أي حركة درامية أو دوران:
 *  ١) الشعار الأبيض (public/intro/logo-white-full.png) يظهر بتلاشٍ وتكبير
 *     ناعم بسيط في منتصف الشاشة، يثبت لحظة - بدون صوت نقر متكرر.
 *  ٢) "صفحة جديدة": الشعار ينتقل بسلاسة لأعلى الشاشة ويصغر (يبقى أبيض)،
 *     ثم يظهر تحته بيت الترحيب الشعري بخط القلم (كشف تدريجي من اليمين
 *     لليسار) بخط BalooBhaijaan2، بحجم كبير وواضح لعرضه على شاشة كبيرة.
 * خلفية كحلية داكنة مع علامة مائية باهتة جدًا من الشعار الحقيقي بألوانه
 * الأصلية (public/intro/logo-watermark-color.png) للعمق البصري الاحترافي.
 * اسم المدرسة وإدارة التعليم ثابتان أسفل يسار/يمين الشاشة الفعليين طوال
 * المقدمة. بدون صوت سرد.
 */
export const WELCOME_INTRO_DURATION = 780;

const LOGO_ASPECT = 536 / 703; // height / width of logo-white-full.png

const CENTERED_BOX = { width: 520, top: 300 };
const HEADER_BOX = { width: 280, top: 56 };
const boxForWidth = (width: number, top: number) => ({
  width,
  height: width * LOGO_ASPECT,
  top,
  left: (1920 - width) / 2,
});
const centeredBox = boxForWidth(CENTERED_BOX.width, CENTERED_BOX.top);
const headerBox = boxForWidth(HEADER_BOX.width, HEADER_BOX.top);

const LOGO_IN_START = 15;
const LOGO_IN_DURATION = 45;
const MOVE_START = 165;
const MOVE_DURATION = 45;
const PAGE2_START = MOVE_START + MOVE_DURATION;

const BAYT1_START = PAGE2_START + 35;
const BAYT1_DURATION = 60;
const BAYT2_START = BAYT1_START + BAYT1_DURATION + 35;
const BAYT2_DURATION = 60;

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const inT = interpolate(frame - LOGO_IN_START, [0, LOGO_IN_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const moveT = interpolate(frame - MOVE_START, [0, MOVE_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const lerp = (a: number, b: number) => a + (b - a) * moveT;
  const box = {
    width: lerp(centeredBox.width, headerBox.width),
    height: lerp(centeredBox.height, headerBox.height),
    top: lerp(centeredBox.top, headerBox.top),
    left: lerp(centeredBox.left, headerBox.left),
  };
  return (
    <Img
      src={staticFile("intro/logo-white-full.png")}
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        opacity: inT,
        transform: `scale(${0.94 + inT * 0.06})`,
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
          fontSize: 62,
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
  const watermarkT = interpolate(frame, [0, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const watermarkBreathe = 1 + Math.sin(frame / 90) * 0.015;

  return (
    <AbsoluteFill style={{ background: brand.primaryDark, overflow: "hidden" }}>
      <Sfx kind="whoosh" at={0} volume={0.22} />
      <Sfx kind="whoosh" at={MOVE_START} volume={0.2} />
      <Sfx kind="tick" at={BAYT1_START} volume={0.25} />
      <Sfx kind="tick" at={BAYT2_START} volume={0.25} />

      <Img
        src={staticFile("intro/logo-watermark-color.png")}
        style={{
          position: "absolute",
          right: -260,
          bottom: -260,
          width: 1150,
          opacity: watermarkT * 0.05,
          transform: `scale(${watermarkBreathe})`,
        }}
      />

      <Logo />

      <PoemLine
        text="بِكُم أزهَرَ العِلمُ في رُبوعِنا وفاحَ شَذا الخَيرِ في أرجائِنا"
        color="#ffffff"
        top={400}
        from={BAYT1_START}
        duration={BAYT1_DURATION}
      />
      <PoemLine
        text="فحَيَّا الصَّباحُ خُطاكُم بابتِسامةٍ ومدرستي اليومَ تَزهو بِلِقانا"
        color={brand.teal}
        top={508}
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
