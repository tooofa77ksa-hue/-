import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { brand, fontFamily } from "../brand/tokens";
import { StatsSceneChrome } from "../components/StatsSceneChrome";
import { Sfx } from "../components/Sfx";
import { classSchedules } from "../data/schoolStats";

/**
 * Transition line (presenter voice, public/audio/school-stats/line5.mp3 -
 * 107 frames at 30fps), then all 12 class timetables shown one by one,
 * start to finish, in the same order as the source PDF. Each table is
 * rendered from an image cropped directly out of the original PDF page
 * (public/schedules/class-01..12.png) rather than hand-retyped - with up to
 * ~35 cells per timetable, this removes any risk of a transcription error
 * in a subject, teacher name, or period time.
 */
const LINE5_FRAMES = 107; // line5.mp3, 3.579s
const TRANSITION_BEAT = 5 + LINE5_FRAMES + 8;
const PER_CLASS_BEAT = 130;
export const SMART_SCHEDULE_DURATION = TRANSITION_BEAT + PER_CLASS_BEAT * classSchedules.length;

const TransitionBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sequence from={5} layout="none">
        <Audio src={staticFile("audio/school-stats/line5.mp3")} />
      </Sequence>
      <div style={{ fontFamily, fontSize: 44, fontWeight: 800, color: brand.primaryDark, opacity: t }}>
        والآن مع الجدول الذكي لجداول الفصول
      </div>
    </AbsoluteFill>
  );
};

const ClassBeat: React.FC<{ image: string; label: string }> = ({ image, label }) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const labelAppear = interpolate(frame, [4, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.4} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 32,
            fontWeight: 800,
            color: brand.paper,
            background: brand.primary,
            borderRadius: 14,
            padding: "10px 36px",
            opacity: labelAppear,
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: 1700,
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 24px 70px rgba(21,68,90,0.16)",
            border: `2px solid ${brand.border}`,
            clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
          }}
        >
          <Img src={staticFile(image)} style={{ width: "100%", display: "block" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SmartScheduleScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      <StatsSceneChrome sectionTitle="الجدول الذكي - جداول الفصول" />

      <Sequence from={0} durationInFrames={TRANSITION_BEAT} layout="absolute-fill">
        <TransitionBeat />
      </Sequence>

      {classSchedules.map((cls, i) => (
        <Sequence
          key={cls.image}
          from={TRANSITION_BEAT + i * PER_CLASS_BEAT}
          durationInFrames={PER_CLASS_BEAT}
          layout="absolute-fill"
        >
          <ClassBeat image={cls.image} label={cls.label} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
