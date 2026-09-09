import { useEffect, useState } from "react";
import { subscribeGameSettings } from "./repo";
import { DEFAULT_BRANDING } from "./starterData";
import type { BrandingSettings } from "@/types/models";

export function useBranding(): BrandingSettings {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);

  useEffect(
    () =>
      subscribeGameSettings((settings) => {
        if (settings?.branding) {
          setBranding({ ...DEFAULT_BRANDING, ...settings.branding });
        }
      }),
    []
  );

  return branding;
}
