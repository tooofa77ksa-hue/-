import { Easing, interpolate, useCurrentFrame } from "remotion";
import { CountUpNumber } from "./CountUpNumber";
import { fontFamily } from "../brand/tokens";
import { entityLabels } from "../data/grade3";
import { Sfx } from "./Sfx";

type EntityKey = "school" | "admin" | "kingdom";

export type TrendPoint = { year: number } & Partial<Record<EntityKey, number>>;

const baseEntityColors: Record<EntityKey, string> = {
  school: "#4fb6f2",
  admin: "#7c4a94",
  kingdom: "#4b5563",
};

const PER_YEAR_FRAMES = 34;

export const YearTrendLine: React.FC<{
  points: TrendPoint[]; // chronological order: [2023, 2025, 2026]
  entities: EntityKey[];
  from: number;
  width: number;
  height: number;
  suffix?: string;
  decimals?: number;
  colorOverrides?: Partial<Record<EntityKey, string>>;
}> = ({ points, entities, from, width, height, suffix = "", decimals = 1, colorOverrides }) => {
  const frame = useCurrentFrame();
  const n = points.length;
  const entityColors: Record<EntityKey, string> = { ...baseEntityColors, ...colorOverrides };

  const padTop = 56;
  const padBottom = 40;
  const chartH = height - padTop - padBottom;

  const allValues = points.flatMap((p) => entities.map((e) => p[e] ?? Infinity)).filter((v) => v !== Infinity);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const domainPad = (max - min) * 0.25 || 5;
  const yMin = Math.max(0, min - domainPad);
  const yMax = max + domainPad;

  // index 0 (oldest / 2023) is placed at the right edge, matching the
  // original card's RTL layout (2026 left, 2025 middle, 2023 right).
  const xFor = (i: number) => width - (i / (n - 1)) * width;
  const yFor = (v: number) => padTop + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  const activeIndex = Math.min(n - 1, Math.max(0, Math.floor(frame >= from ? (frame - from) / PER_YEAR_FRAMES : -1)));

  return (
    <div style={{ position: "relative", width, height, fontFamily }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* baseline grid */}
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={0}
            x2={width}
            y1={padTop + chartH * t}
            y2={padTop + chartH * t}
            stroke="#e3e9e7"
            strokeDasharray="4 6"
            strokeWidth={1}
          />
        ))}

        {entities.map((entity) => {
          return points.slice(0, -1).map((p, i) => {
            const segFrom = from + i * PER_YEAR_FRAMES;
            const segTo = segFrom + PER_YEAR_FRAMES;
            const v0 = p[entity];
            const v1 = points[i + 1][entity];
            if (v0 === undefined || v1 === undefined) return null;
            const progress = interpolate(frame, [segFrom, segTo], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.inOut(Easing.cubic),
            });
            const x0 = xFor(i);
            const x1 = xFor(i + 1);
            const y0 = yFor(v0);
            const y1 = yFor(v1);
            const cx = x0 + (x1 - x0) * progress;
            const cy = y0 + (y1 - y0) * progress;
            return (
              <line
                key={`${entity}-${i}`}
                x1={x0}
                y1={y0}
                x2={cx}
                y2={cy}
                stroke={entityColors[entity]}
                strokeWidth={entity === "school" ? 6 : 4}
                strokeLinecap="round"
                opacity={entity === "school" ? 1 : 0.85}
              />
            );
          });
        })}

        {entities.map((entity) =>
          points.map((p, i) => {
            const v = p[entity];
            if (v === undefined) return null;
            const pointFrom = from + i * PER_YEAR_FRAMES;
            const scale = interpolate(frame, [pointFrom, pointFrom + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(2)),
              output: "perceptual-scale",
            });
            return (
              <circle
                key={`${entity}-dot-${i}`}
                cx={xFor(i)}
                cy={yFor(v)}
                r={entity === "school" ? 10 : 7}
                fill={entityColors[entity]}
                stroke="#ffffff"
                strokeWidth={3}
                style={{ scale, transformOrigin: `${xFor(i)}px ${yFor(v)}px` }}
              />
            );
          }),
        )}
      </svg>

      {/* value labels */}
      {entities.map((entity) =>
        points.map((p, i) => {
          const v = p[entity];
          if (v === undefined) return null;
          const pointFrom = from + i * PER_YEAR_FRAMES;
          const appear = interpolate(frame, [pointFrom, pointFrom + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const y = yFor(v);
          const labelAbove = entity === "school";
          return (
            <div
              key={`${entity}-label-${i}`}
              style={{
                position: "absolute",
                left: xFor(i),
                top: y + (labelAbove ? -46 : 14),
                transform: "translateX(-50%)",
                opacity: appear,
                background: entityColors[entity],
                color: "#ffffff",
                fontWeight: 800,
                fontSize: entity === "school" ? 24 : 18,
                padding: "5px 12px",
                borderRadius: 10,
                whiteSpace: "nowrap",
                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              }}
            >
              <CountUpNumber value={v} decimals={decimals} suffix={suffix} from={pointFrom} durationInFrames={16} />
              <Sfx kind="tick" at={pointFrom} volume={0.35} />
              {i === n - 1 && entity === "school" ? <Sfx kind="impact" at={pointFrom + 6} volume={0.6} /> : null}
            </div>
          );
        }),
      )}

      {/* year axis with sequential emphasis */}
      <div style={{ position: "absolute", left: 0, right: 0, top: height - 26, height: 26 }}>
        {points.map((p, i) => {
          const isActive = i === activeIndex;
          const pointFrom = from + i * PER_YEAR_FRAMES;
          const appear = interpolate(frame, [pointFrom - 6, pointFrom + 4], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const emphasis = interpolate(frame, [pointFrom, pointFrom + 10, pointFrom + PER_YEAR_FRAMES - 6], [1, 1.18, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={p.year}
              style={{
                position: "absolute",
                left: xFor(i),
                transform: `translateX(-50%) scale(${isActive ? emphasis : 1})`,
                fontWeight: isActive ? 800 : 600,
                fontSize: 22,
                color: isActive ? "#15445a" : "#8ea1a8",
                opacity: appear,
              }}
            >
              {p.year}
            </div>
          );
        })}
      </div>

      {/* entity legend */}
      {entities.length > 1 ? (
        <div
          style={{
            position: "absolute",
            top: -4,
            left: 0,
            display: "flex",
            gap: 22,
            opacity: interpolate(frame, [from, from + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          {[...entities].reverse().map((e) => (
            <div key={e} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 18, color: "#15445a", fontWeight: 600 }}>
              <span style={{ width: 12, height: 12, borderRadius: 999, background: entityColors[e] }} />
              {entityLabels[e]}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const trendDurationFrames = (points: unknown[]) => (points as TrendPoint[]).length * PER_YEAR_FRAMES;
