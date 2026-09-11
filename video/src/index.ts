import { registerRoot, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { RemotionRoot } from "./Root";

// Self-hosted locally (public/fonts) so rendering never depends on a live
// network fetch to Google Fonts - keeps Studio/render fully reproducible.
Promise.all(
  (["500", "700", "800", "900"] as const).map((weight) =>
    loadFont({
      family: "Tajawal",
      url: staticFile(`fonts/Tajawal-${weight}.ttf`),
      weight,
    }),
  ),
);

registerRoot(RemotionRoot);
