import { Easing, interpolate, Img, staticFile, useCurrentFrame } from "remotion";
import { brand, fontFamily } from "../brand/tokens";
import { schoolInfo } from "../data/grade3";

/**
 * Shared header/footer chrome for every scene: the official ministry logo
 * (untouched - no glow/shadow/recoloring, safe clear-space preserved as per
 * the brand guide) plus the section title and a persistent school footer.
 */
export const SceneChrome: React.FC<{
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
          {/* official logo: untouched, with clear space, no effects */}
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
        <span>{schoolInfo.grade} - {schoolInfo.academicYear}</span>
        <span style={{ width: 4, height: 4, borderRadius: 999, background: brand.muted }} />
        <span>الرقم الوزاري {schoolInfo.ministryNumber}</span>
      </div>
    </>
  );
};
