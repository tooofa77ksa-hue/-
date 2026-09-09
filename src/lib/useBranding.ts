import { useEffect, useState } from "react";
import { subscribeGameSettings } from "./repo";
import type { BrandingSettings } from "@/types/models";

/** قيم افتراضية تُعرض قبل وصول أول رد من Firestore أو إن لم تُضبط بعد -
 * تطابق النصوص الأصلية المطلوبة، لكنها تُستبدَل فورًا بمجرد توفر
 * gameSettings.branding من قاعدة البيانات، وتُعدَّل بالكامل من /teacher. */
const DEFAULT_BRANDING: BrandingSettings = {
  gameName: "شُعلة لغتي",
  gameTagline: "منصة تعليمية تفاعلية - لغتي - الصف الثالث الابتدائي",
  welcomeMessage: "اختاري لعبتك المفضلة! 🌟",
  schoolName: "المدرسة الابتدائية الخامسة والستون بعد المائة",
  principalName: "جازية السميري",
  deputyName: "ناهد الحربي",
  designerCredit: "دلال السناني",
};

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
