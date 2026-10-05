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
 *     ثم تظهر تحته ثلاثة أسطر ترحيبية (بدّلت القصيدة الأولى بناءً على طلب
 *     صريح، ثم حُذف سطر العنوان المنفصل لاحقًا) بخط القلم (كشف تدريجي من
 *     اليمين لليسار) بخط BalooBhaijaan2، بحجم كبير وواضح لعرضه على شاشة
 *     كبيرة. العبارات مأخوذة ومُصاغة من نماذج ترحيب أرسلتها المستخدمة
 *     (قوالب تصميم جاهزة)، مع تخصيصها باسم مديرة المدرسة واسم المدرسة
 *     بالأرقام الإنجليزية كما طلبت.
 * خلفية كحلية داكنة مع علامة مائية باهتة جدًا من الشعار الحقيقي بألوانه
 * الأصلية (public/intro/logo-watermark-color.png) للعمق البصري الاحترافي.
 * اسم المدرسة وإدارة التعليم ثابتان أسفل يسار/يمين الشاشة الفعليين طوال
 * المقدمة. بدون صوت سرد (مذيعة) - أغنية ترحيب قصيرة تُضاف كموسيقى خلفية.
 */
export const WELCOME_INTRO_DURATION = 810;

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
const MOVE_START = 140;
const MOVE_DURATION = 45;
const PAGE2_START = MOVE_START + MOVE_DURATION;

const LINE2_START = PAGE2_START + 20;
const LINE2_DURATION = 50;
const LINE3_START = LINE2_START + LINE2_DURATION + 20;
const LINE3_DURATION = 55;
const LINE4_START = LINE3_START + LINE3_DURATION + 20;
const LINE4_DURATION = 55;

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

const PoemLine: React.FC<{
  text: string;
  color: string;
  top: number;
  from: number;
  duration: number;
  fontSize?: number;
}> = ({ text, color, top, from, duration, fontSize = 62 }) => {
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
          fontSize,
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
      <Sfx kind="tick" at={LINE2_START} volume={0.25} />
      <Sfx kind="tick" at={LINE3_START} volume={0.25} />
      <Sfx kind="tick" at={LINE4_START} volume={0.2} />

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
        text="حَلَلتُم أهلًا ووَطِئتُم سَهلًا"
        color="#ffffff"
        top={420}
        from={LINE2_START}
        duration={LINE2_DURATION}
      />
      <PoemLine
        text="في صَرحِنا التَّعليمي، وضُيوفُنا الكِرام"
        color={brand.teal}
        top={528}
        from={LINE3_START}
        duration={LINE3_DURATION}
      />
      <PoemLine
        text="مديرة المدرسة الابتدائية 165: أ. جازية أسميري، وكافة منسوباتها وطالباتها"
        color={brand.gold}
        top={650}
        from={LINE4_START}
        duration={LINE4_DURATION}
        fontSize={34}
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
        المدرسة الابتدائية 165
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
