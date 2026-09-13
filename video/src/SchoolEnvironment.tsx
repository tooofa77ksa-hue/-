import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { brand, fontFamily } from "./brand/tokens";
import { StatsSceneChrome } from "./components/StatsSceneChrome";
import { Sfx } from "./components/Sfx";
import { environmentItems } from "./data/environment";

/**
 * Standalone composition "SchoolEnvironment" ("البيئة الخارجية" - before/
 * after) - a completely separate video from every other composition in
 * this project, built entirely in this new file plus data/environment.ts.
 * Reuses StatsSceneChrome/brand tokens/Sfx exactly as-is - no new design
 * system, no new libraries.
 *
 * The four "before" photos (public/environment/*-before.*) are the user's
 * real, unedited uploads and are rendered completely plainly - no zoom,
 * no color/contrast adjustment, no crop - per her explicit instruction
 * that they must keep their natural, unpolished look for an honest
 * contrast. Only the "after" photos get a light Ken-Burns zoom, matching
 * the treatment used elsewhere in this project (SchoolKroki).
 *
 * Narration: real ElevenLabs recording (same voice as the rest of the
 * project), public/audio/environment-narration.mp3, 49.136s measured via
 * ffprobe (1475 frames, ceil). Section boundaries below come from the
 * actual pauses between sentences in the real file, found locally via
 * `ffmpeg -af silencedetect` (no network available - see
 * SchoolAchievements.tsx for the same fix after a first uniform-rate
 * pass was flagged as out of sync), not from a words-per-second average.
 * Within each item's span, the "before" hold and wipe are fixed small
 * constants and the remaining time is the "after" hold.
 *
 * Full narration script (as recorded, in order):
 * "في مسيرة التطوير المستمر، شهدت البيئة المدرسية تحولًا لافتًا يعكس
 * تكاتف الجهود وتعاون الجميع.
 * فالبيئة الخارجية للمدرسة، التي كانت بلا موقف مخصص لذوي الإعاقة، أصبحت
 * اليوم مهيأة بموقف كامل يخدم ذوي الاحتياجات الخاصة.
 * ودورة مياه ذوي الإعاقة، التي لم تكن مجهزة بالمعايير المطلوبة، أصبحت
 * اليوم مهيأة بالكامل وفق أحدث المعايير.
 * والصالة الرياضية، التي كانت بحاجة إلى تطوير، أصبحت اليوم صالة متكاملة
 * تخدم النشاط البدني للطالبات.
 * ومعمل العلوم، الذي كان بسيطًا وغير مكتمل، أصبح اليوم معملًا مجهزًا
 * يحفّز روح الاكتشاف والتجربة.
 * إنجاز يُحسب لكل من ساهم فيه، وثمرة تعاون صادق من أجل بيئة تعليمية أفضل."
 */
const INTRO_BEAT = 208; // ends at the real 6.94s pause
const ITEM_BEATS = [318, 297, 211, 232]; // exterior/restroom/gym/lab, from real pause boundaries
const CLOSING_BEAT = 209; // to the real 49.136s end
const BEFORE_HOLD = 60; // ~2s plain "before" view
const WIPE_DURATION = 20; // ~0.67s reveal
const AUDIO_SRC = "audio/environment-narration.mp3";

export const environmentTotalDuration =
  INTRO_BEAT + ITEM_BEATS.reduce((a, b) => a + b, 0) + CLOSING_BEAT;

const IntroTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.4} />
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 54,
          color: brand.primaryDark,
          opacity: t,
          scale: interpolate(t, [0, 1], [0.92, 1]),
        }}
      >
        قبل وبعد: رحلة تطوير
      </div>
    </AbsoluteFill>
  );
};

const ClosingTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.4} />
      <Sfx kind="impact" at={16} volume={0.4} />
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 38,
          color: brand.primaryDark,
          opacity: t,
          textAlign: "center",
          maxWidth: 1400,
        }}
      >
        إنجاز يُحسب لكل من ساهم فيه، وثمرة تعاون صادق من أجل بيئة تعليمية أفضل
      </div>
    </AbsoluteFill>
  );
};

const BeforeAfter: React.FC<{ title: string; before: string; after: string; durationInFrames: number }> = ({
  title,
  before,
  after,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const wipe = interpolate(frame, [BEFORE_HOLD, BEFORE_HOLD + WIPE_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const afterStart = BEFORE_HOLD;
  const zoom = interpolate(frame, [afterStart, durationInFrames], [1, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
  const titleT = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagT = interpolate(frame - BEFORE_HOLD, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {frame === 0 && <Sfx kind="whoosh" at={0} volume={0.35} />}
      {frame <= BEFORE_HOLD && <Sfx kind="tick" at={BEFORE_HOLD} volume={0.25} />}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 34, color: brand.primaryDark, opacity: titleT }}>
          {title}
        </div>
        <div
          style={{
            position: "relative",
            width: 1500,
            height: 740,
            borderRadius: 18,
            overflow: "hidden",
            background: "#f4f5f4",
            border: `2px solid ${brand.border}`,
            boxShadow: "0 22px 55px rgba(21,68,90,0.16)",
          }}
        >
          {/* "before" - shown completely plainly, no zoom/filter, wiped away to reveal "after" */}
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${wipe * 100}%)` }}>
            <Img src={staticFile(before)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
            <Img
              src={staticFile(after)}
              style={{ width: "100%", height: "100%", objectFit: "contain", scale: String(zoom) }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              fontFamily,
              fontWeight: 800,
              fontSize: 20,
              color: brand.paper,
              background: brand.muted,
              borderRadius: 999,
              padding: "6px 20px",
              opacity: 1 - tagT,
            }}
          >
            قبل
          </div>
          <div
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              fontFamily,
              fontWeight: 800,
              fontSize: 20,
              color: brand.paper,
              background: brand.primary,
              borderRadius: 999,
              padding: "6px 20px",
              opacity: tagT,
            }}
          >
            بعد
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SchoolEnvironment: React.FC = () => {
  let cursor = 0;
  const introFrom = cursor;
  cursor += INTRO_BEAT;
  const itemFroms = ITEM_BEATS.map((d) => {
    const start = cursor;
    cursor += d;
    return start;
  });
  const closingFrom = cursor;

  return (
    <AbsoluteFill style={{ background: brand.paper, fontFamily, direction: "rtl" }}>
      <StatsSceneChrome sectionTitle="البيئة المدرسية - قبل وبعد" />
      <Audio src={staticFile(AUDIO_SRC)} />

      <Sequence from={introFrom} durationInFrames={INTRO_BEAT} layout="absolute-fill">
        <IntroTitle />
      </Sequence>

      {environmentItems.map((item, i) => (
        <Sequence key={item.title} from={itemFroms[i]} durationInFrames={ITEM_BEATS[i]} layout="absolute-fill">
          <BeforeAfter title={item.title} before={item.before} after={item.after} durationInFrames={ITEM_BEATS[i]} />
        </Sequence>
      ))}

      <Sequence from={closingFrom} durationInFrames={CLOSING_BEAT} layout="absolute-fill">
        <ClosingTitle />
      </Sequence>
    </AbsoluteFill>
  );
};
