import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { StatsSceneChrome } from "../components/StatsSceneChrome";
import { Sfx } from "../components/Sfx";
import { facilitiesRoot, facilitiesRow1, facilitiesRow2, FacilityNode } from "../data/facilities";

/**
 * "المرافق والتجهيزات" - organizational-chart / mind-map scene. New file,
 * reuses the same chrome/colors/font/card style as the rest of this
 * section (StatsSceneChrome, brand tokens) - no new design system.
 *
 * All timing is centralized here per the explicit request, in frames at
 * 30fps: skeleton lines draw in `structureDuration`, then all 12 nodes
 * (root first, then the 11 branches in the given order) cascade in one at
 * a time, each taking `itemDuration` with `itemGap` between them, then the
 * complete chart holds for `finalHold` before the scene ends. This keeps
 * the whole slide in the 8-11s range the user asked for.
 */
export const FACILITIES_TIMING = {
  structureDuration: 30, // ~1.0s skeleton/line draw
  itemDuration: 12, // ~0.4s per card's own entrance
  itemGap: 5, // ~0.17s between one card finishing and the next starting
  finalHold: 42, // ~1.4s fully-visible hold before the scene ends
};

const allNodes: FacilityNode[] = [facilitiesRoot, ...facilitiesRow1, ...facilitiesRow2];
const itemsPhaseFrames = allNodes.length * (FACILITIES_TIMING.itemDuration + FACILITIES_TIMING.itemGap);
export const FACILITIES_DURATION =
  FACILITIES_TIMING.structureDuration + itemsPhaseFrames + FACILITIES_TIMING.finalHold;

// ---- Layout (1920x1080, chrome header=118 / footer=64) ----
const ROOT = { cx: 960, top: 170, w: 460, h: 76 };
const SPINE1_Y = 288;
const ROW1_TOP = 320;
const ROW1_H = 148;
const SPINE2_Y = 500;
const ROW2_TOP = 532;
const ROW2_H = 148;
const CARD_W = 268;

const row1X = (() => {
  const gap = 30;
  const totalW = facilitiesRow1.length * CARD_W + (facilitiesRow1.length - 1) * gap;
  const start = (1920 - totalW) / 2 + CARD_W / 2;
  return facilitiesRow1.map((_, i) => start + i * (CARD_W + gap));
})();

const row2X = (() => {
  const gap = 30;
  const totalW = facilitiesRow2.length * CARD_W + (facilitiesRow2.length - 1) * gap;
  const start = (1920 - totalW) / 2 + CARD_W / 2;
  return facilitiesRow2.map((_, i) => start + i * (CARD_W + gap));
})();

// ---- Icons: unified single-color line icons ----
const IC = brand.primary;
const iconProps = { width: 34, height: 34, viewBox: "0 0 48 48", fill: "none", stroke: IC, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const BuildingIcon = () => (
  <svg {...iconProps}><path d="M10 42V10a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v32" /><path d="M6 42h36" /><path d="M16 16h4M26 16h4M16 24h4M26 24h4M16 32h4M26 32h4" /></svg>
);
const BriefcaseIcon = () => (
  <svg {...iconProps}><rect x="6" y="16" width="36" height="22" rx="3" /><path d="M18 16v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" /><path d="M6 26h36" /></svg>
);
const FolderIcon = () => (
  <svg {...iconProps}><path d="M6 14a2 2 0 0 1 2-2h9l4 4h19a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V14Z" /></svg>
);
const ChatIcon = () => (
  <svg {...iconProps}><path d="M6 10h36v22H20l-8 8v-8H6z" /><path d="M14 19h20M14 25h12" /></svg>
);
const TeachersIcon = () => (
  <svg {...iconProps}><circle cx="17" cy="16" r="6" /><path d="M6 40c0-8 5-13 11-13s11 5 11 13" /><circle cx="34" cy="14" r="5" strokeOpacity={0.55} /><path d="M26 40c1-7 5-11 10-11s9 4 10 11" strokeOpacity={0.55} /></svg>
);
const ClinicIcon = () => (
  <svg {...iconProps}><circle cx="24" cy="24" r="18" /><path d="M24 15v18M15 24h18" /></svg>
);
const FlaskIcon = () => (
  <svg {...iconProps}><path d="M19 6h10M20 6v12l-11 20a3 3 0 0 0 2.6 4.5h25a3 3 0 0 0 2.6-4.5L28 18V6" /><path d="M15 32h18" /></svg>
);
const DumbbellIcon = () => (
  <svg {...iconProps}><path d="M6 24h36" /><rect x="4" y="18" width="6" height="12" rx="1.5" /><rect x="38" y="18" width="6" height="12" rx="1.5" /><rect x="13" y="14" width="5" height="20" rx="1.5" /><rect x="30" y="14" width="5" height="20" rx="1.5" /></svg>
);
const ArchiveIcon = () => (
  <svg {...iconProps}><rect x="6" y="8" width="36" height="10" rx="2" /><path d="M9 18v20a2 2 0 0 0 2 2h26a2 2 0 0 0 2-2V18" /><path d="M20 26h8" /></svg>
);
const TreeIcon = () => (
  <svg {...iconProps}><path d="M24 44V28" /><path d="M24 8c7 0 12 5.5 12 11.5S31 30 24 30s-12-4.5-12-10.5S17 8 24 8Z" /><path d="M14 40h20" /></svg>
);
const CafeteriaIcon = () => (
  <svg {...iconProps}><path d="M12 6v16a6 6 0 0 0 12 0V6M18 6v14" /><path d="M34 6c-4 0-6 4-6 9s2 8 6 8" /><path d="M34 6v36" /></svg>
);
const RestroomIcon = () => (
  <svg {...iconProps}><circle cx="15" cy="10" r="4.2" /><path d="M8 28V16h14v12M11 28v14M18 28v14" /><circle cx="33" cy="10" r="4.2" strokeOpacity={0.55} /><path d="M27 18a5 5 0 0 1 5-4 5 5 0 0 1 5 4l2 10h-5l1 14h-6l1-14h-5Z" strokeOpacity={0.55} /></svg>
);
const AccessibilityIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={brand.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4.5" r="1.8" fill={brand.blue} stroke="none" />
    <path d="M12 8v4l-4 2M12 12l4 3M9 16l-2 4M15 15l3 5" />
    <path d="M8 10h8" />
  </svg>
);

const rootIconFor = () => <BuildingIcon />;
const row1Icons = [BriefcaseIcon, FolderIcon, ChatIcon, TeachersIcon, ClinicIcon, FlaskIcon];
const row2Icons = [DumbbellIcon, ArchiveIcon, TreeIcon, CafeteriaIcon, RestroomIcon];

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ fontFamily, fontWeight: 800, fontSize: 34, color: brand.primaryDark, opacity: t }}>
      المرافق والتجهيزات
    </div>
  );
};

/** Skeleton connector lines, drawn via stroke-dashoffset over structureDuration. */
const Skeleton: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [0, FACILITIES_TIMING.structureDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [
    { x1: ROOT.cx, y1: ROOT.top + ROOT.h, x2: ROOT.cx, y2: SPINE1_Y },
    { x1: row1X[0], y1: SPINE1_Y, x2: row1X[row1X.length - 1], y2: SPINE1_Y },
    ...row1X.map((x) => ({ x1: x, y1: SPINE1_Y, x2: x, y2: ROW1_TOP })),
    { x1: ROOT.cx, y1: SPINE1_Y, x2: ROOT.cx, y2: SPINE2_Y },
    { x1: row2X[0], y1: SPINE2_Y, x2: row2X[row2X.length - 1], y2: SPINE2_Y },
    ...row2X.map((x) => ({ x1: x, y1: SPINE2_Y, x2: x, y2: ROW2_TOP })),
  ];

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {segments.map((s, i) => {
        const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1) || 1;
        return (
          <line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={brand.border}
            strokeWidth={3}
            strokeDasharray={len}
            strokeDashoffset={len * (1 - draw)}
          />
        );
      })}
    </svg>
  );
};

const Card: React.FC<{
  node: FacilityNode;
  x: number;
  top: number;
  h: number;
  from: number;
  icon: React.ReactNode;
  variant?: "root" | "branch";
}> = ({ node, x, top, h, from, icon, variant = "branch" }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const t = interpolate(local, [0, FACILITIES_TIMING.itemDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
    output: "perceptual-scale",
  });
  if (local < -2) return null;

  const isRoot = variant === "root";
  const w = isRoot ? ROOT.w : CARD_W;

  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top,
        width: w,
        height: h,
        opacity: t,
        scale: 0.85 + t * 0.15,
        translate: `0 ${interpolate(t, [0, 1], [10, 0])}px`,
      }}
    >
      <Sfx kind="tick" at={from} volume={0.18} />
      <div
        style={{
          width: "100%",
          height: "100%",
          background: isRoot ? brand.primaryDark : "#fbfdfc",
          border: isRoot ? "none" : `1.5px solid ${brand.border}`,
          borderRadius: 16,
          boxShadow: "0 10px 26px rgba(21,68,90,0.10)",
          display: "flex",
          flexDirection: isRoot ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
          gap: isRoot ? 16 : 6,
          padding: "10px 14px",
        }}
      >
        {isRoot ? (
          <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={34} height={34} viewBox="0 0 48 48" fill="none" stroke={brand.paper} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 42V10a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v32" />
              <path d="M6 42h36" />
              <path d="M16 16h4M26 16h4M16 24h4M26 24h4M16 32h4M26 32h4" />
            </svg>
          </div>
        ) : (
          icon
        )}
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: isRoot ? 26 : 19,
            color: isRoot ? brand.paper : brand.primaryDark,
            textAlign: "center",
            lineHeight: 1.25,
          }}
        >
          {node.label}
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: isRoot ? 18 : 15,
            color: isRoot ? brand.primaryDark : brand.paper,
            background: isRoot ? brand.paper : brand.primary,
            borderRadius: 999,
            padding: "2px 12px",
            direction: "ltr",
          }}
        >
          ×{node.count}
        </div>
        {node.note ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily, fontSize: 13, color: brand.muted }}>
            <AccessibilityIcon />
            <span>{node.note}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const FacilitiesScene: React.FC = () => {
  const itemStart = (i: number) =>
    FACILITIES_TIMING.structureDuration + i * (FACILITIES_TIMING.itemDuration + FACILITIES_TIMING.itemGap);

  return (
    <AbsoluteFill style={{ background: brand.paper }}>
      {/*
        Narration ("المرافق والتجهيزات" only) not generated yet - once
        public/audio/school-stats/facility-line.mp3 arrives, add:
        <Sequence from={0} layout="none"><Audio src={staticFile("audio/school-stats/facility-line.mp3")} /></Sequence>
        (import Audio from "@remotion/media", staticFile from "remotion")
        and replace LINE_FRAMES above with the real ceil(seconds*30) length.
      */}
      <StatsSceneChrome sectionTitle="المرافق والتجهيزات" />
      <Sfx kind="whoosh" at={0} volume={0.45} />

      <div style={{ position: "absolute", top: 130, left: 0, right: 0, textAlign: "center" }}>
        <Title />
      </div>

      <Skeleton />

      <Card
        node={facilitiesRoot}
        x={ROOT.cx}
        top={ROOT.top}
        h={ROOT.h}
        from={itemStart(0)}
        icon={rootIconFor()}
        variant="root"
      />

      {facilitiesRow1.map((node, i) => {
        const Icon = row1Icons[i];
        return (
          <Card key={node.label} node={node} x={row1X[i]} top={ROW1_TOP} h={ROW1_H} from={itemStart(1 + i)} icon={<Icon />} />
        );
      })}

      {facilitiesRow2.map((node, i) => {
        const Icon = row2Icons[i];
        return (
          <Card
            key={node.label}
            node={node}
            x={row2X[i]}
            top={ROW2_TOP}
            h={ROW2_H}
            from={itemStart(1 + facilitiesRow1.length + i)}
            icon={<Icon />}
          />
        );
      })}
    </AbsoluteFill>
  );
};
