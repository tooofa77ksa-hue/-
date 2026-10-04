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

// خط المقدمة الترحيبية (WelcomeIntroScene) فقط - أرسلته المستخدمة لهذا الغرض
// تحديدًا، وهو خط متغيّر (variable font) فنحمّله بمدى أوزان واحد.
loadFont({
  family: "Baloo Bhaijaan 2",
  url: staticFile("fonts/BalooBhaijaan2-VariableFont_wght.ttf"),
  weight: "400 800",
});

registerRoot(RemotionRoot);
