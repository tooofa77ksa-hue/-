import { Easing, interpolate, Img, staticFile, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { schoolInfo } from "../data/schoolStats";

/**
 * Chrome for the school-stats section (employees/students/classes,
 * distribution table, smart schedule, teacher data). Duplicated from
 * components/Grade6SceneChrome.tsx (not imported) so grade-3/6 NAFS scenes
 * stay completely untouched. Logo lives only in this top bar - no
 * dedicated logo intro/outro slide, never in the bottom bar.
 */
export const StatsSceneChrome: React.FC<{
  sectionTitle: string;
  from?: number;
}> = ({ sectionTitle, from = 0 }) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [from, from + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 118,
          background: brand.paper,
          borderBottom: `4px solid ${brand.primary}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 56px",
          opacity: appear,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Img src={staticFile("ministry-logo.webp")} style={{ height: 64, width: "auto", margin: "0 10px" }} />
        </div>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 34, color: brand.primaryDark }}>{sectionTitle}</div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: brand.paper,
          borderTop: `4px solid ${brand.primary}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          opacity: appear,
          fontFamily,
          fontSize: 18,
          color: brand.muted,
        }}
      >
        <span>{schoolInfo.schoolName} - {schoolInfo.schoolGender}</span>
        <span style={{ width: 4, height: 4, borderRadius: 999, background: brand.muted }} />
        <span>{schoolInfo.stage}</span>
        <span style={{ width: 4, height: 4, borderRadius: 999, background: brand.muted }} />
        <span>الرقم الوزاري {schoolInfo.ministryNumber}</span>
      </div>
    </>
  );
};
