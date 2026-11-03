import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { brand, fontFamily } from "./brand/tokens";
import { StatsSceneChrome } from "./components/StatsSceneChrome";
import { Sfx } from "./components/Sfx";
import { krokiPages } from "./data/kroki";

/**
 * Standalone composition "SchoolKroki" ("كروكي المدرسة") - a completely
 * separate video from Grade3Nafs/Grade6Nafs/SchoolStats/SchoolAchievements.
 * Built entirely in this new file plus data/kroki.ts; only additively
 * registered in Root.tsx, nothing else touched. Reuses StatsSceneChrome/
 * brand tokens/Sfx exactly as-is - no new design system.
 *
 * The floor-plan pages themselves are images cropped directly out of the
 * original PDF (public/kroki/floor-1..6.png) - never redrawn or edited -
 * so no room, corridor, entrance, or staircase can possibly be altered.
 * Only a light Ken-Burns zoom is applied to the image as a whole (camera
 * movement only, never touching the diagram's content) plus a small
 * floor-name label overlay.
 *
 * Narration: ONE continuous real ElevenLabs recording (same voice as the
 * rest of the project), public/audio/kroki-narration.mp3, 41.64s (1250
 * frames at 30fps). This runs ~1.6s past the user's stated 40s maximum -
 * the voice was never sped up or cut to force it under that cap (same
 * "never distort/rush the narration" rule applied throughout this
 * project), so the real recording's length governs; flagged to the user
 * rather than silently overridden. Per-beat frame counts below are the
 * original word-count proportions rescaled to this real audio length
 * (same methodology as NARRATION-TIMING.md).
 */
const PAGE_BEATS = [302, 222, 181, 141, 181, 223]; // one per krokiPages entry, in order
export const krokiTotalDuration = PAGE_BEATS.reduce((a, b) => a + b, 0);

const ZOOM_TO = 1.07;

const FloorPage: React.FC<{ image: string; label: string; durationInFrames: number }> = ({
  image,
  label,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const labelAppear = interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const imgAppear = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = interpolate(frame, [0, durationInFrames], [1, ZOOM_TO], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx kind="whoosh" at={0} volume={0.4} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 30,
            color: brand.paper,
            background: brand.primary,
            borderRadius: 12,
            padding: "8px 32px",
            opacity: labelAppear,
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: 1620,
            height: 760,
            borderRadius: 18,
            overflow: "hidden",
            background: "#fbfdfc",
            border: `2px solid ${brand.border}`,
            boxShadow: "0 22px 60px rgba(21,68,90,0.14)",
            opacity: imgAppear,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Img
            src={staticFile(image)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              scale: String(zoom),
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SchoolKroki: React.FC = () => {
  let cursor = 0;
  const starts = PAGE_BEATS.map((d) => {
    const s = cursor;
    cursor += d;
    return s;
  });

  return (
    <AbsoluteFill style={{ background: brand.paper, fontFamily, direction: "rtl" }}>
      <StatsSceneChrome sectionTitle="كروكي توزيع المرافق" />
      <Audio src={staticFile("audio/kroki-narration.mp3")} />

      {krokiPages.map((p, i) => (
        <Sequence key={p.image} from={starts[i]} durationInFrames={PAGE_BEATS[i]} layout="absolute-fill">
          <FloorPage image={p.image} label={p.label} durationInFrames={PAGE_BEATS[i]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
