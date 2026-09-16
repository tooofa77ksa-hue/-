/*
  ثيمات ملف الإنجاز.
  كل ثيم يغيّر متغيّرات CSS فقط (لون مميّز، غلاف، خلفية) ولا يغيّر
  التخطيط ولا المسافات ولا أحجام الخط. بهذا تستطيع الطالبة تخصيص ملفها
  دون أي احتمال لكسر التصميم — وهو شرط أساسي في هذا المشروع.
*/
import type { ClayTone } from "@/injazi/components/ClayObject";

export type PortfolioTheme = {
  id: string;
  name: string;
  /** اللون المميّز الافتراضي للثيم. */
  accent: string;
  accentDeep: string;
  /** خلفية خفيفة للبطاقات والأقسام. */
  wash: string;
  /** تدرّج الغلاف أعلى الملف. */
  cover: string;
  tone: ClayTone;
};

export const THEMES: PortfolioTheme[] = [
  {
    id: "lavender",
    name: "Lavender Dream",
    accent: "#7a5fc7",
    accentDeep: "#5f47a3",
    wash: "rgba(195, 174, 245, 0.22)",
    cover: "linear-gradient(135deg, #c3aef5, #8fcbff 60%, #fff8f0)",
    tone: "lilac",
  },
  {
    id: "pink",
    name: "Pink Pop",
    accent: "#d5537a",
    accentDeep: "#ab3f5f",
    wash: "rgba(255, 157, 176, 0.2)",
    cover: "linear-gradient(135deg, #ff9db0, #ffd97d 70%, #fff8f0)",
    tone: "rose",
  },
  {
    id: "sky",
    name: "Sky Adventure",
    accent: "#2f7fc4",
    accentDeep: "#22618f",
    wash: "rgba(143, 203, 255, 0.22)",
    cover: "linear-gradient(135deg, #8fcbff, #c3aef5 65%, #fff8f0)",
    tone: "sky",
  },
  {
    id: "mint",
    name: "Mint Joy",
    accent: "#2e9d76",
    accentDeep: "#227a5b",
    wash: "rgba(143, 224, 192, 0.22)",
    cover: "linear-gradient(135deg, #8fe0c0, #8fcbff 65%, #fff8f0)",
    tone: "mint",
  },
  {
    id: "peach",
    name: "Peach Glow",
    accent: "#c96f2c",
    accentDeep: "#9f5620",
    wash: "rgba(255, 184, 119, 0.22)",
    cover: "linear-gradient(135deg, #ffb877, #ff9db0 65%, #fff8f0)",
    tone: "apricot",
  },
  {
    id: "sunny",
    name: "Sunny Yellow",
    accent: "#b8860b",
    accentDeep: "#8f6708",
    wash: "rgba(255, 217, 125, 0.26)",
    cover: "linear-gradient(135deg, #ffd97d, #8fe0c0 70%, #fff8f0)",
    tone: "lemon",
  },
];

export const COVER_STYLES = [
  { id: "arc", name: "قوس" },
  { id: "wave", name: "موجة" },
  { id: "confetti", name: "قُصاصات" },
  { id: "plain", name: "سادة" },
] as const;

export const CARD_STYLES = [
  { id: "clay", name: "صلصال" },
  { id: "glass", name: "زجاج" },
  { id: "outline", name: "خطّي" },
] as const;

/**
 * ألوان مميّزة جاهزة للاختيار الحر.
 * قائمة مغلقة عمدًا: منتقي ألوان مفتوح يسمح بلون نصّه غير مقروء، وهذه
 * كلها مختبَرة بتباين كافٍ مع الأبيض.
 */
export const ACCENT_PRESETS = [
  "#7a5fc7",
  "#5f47a3",
  "#d5537a",
  "#b8860b",
  "#2f7fc4",
  "#2e9d76",
  "#c96f2c",
  "#8f4f8f",
  "#3f6fa8",
  "#2f7a6b",
];

const FALLBACK = THEMES[0];

export function themeById(id: string | undefined): PortfolioTheme {
  return THEMES.find((theme) => theme.id === id) ?? FALLBACK;
}

/** متغيّرات CSS التي يحقنها الملف على جذره. */
export function themeVars(
  themeId: string | undefined,
  accentColor?: string | null,
): Record<string, string> {
  const theme = themeById(themeId);
  const accent = accentColor || theme.accent;
  return {
    "--iz-accent": accent,
    "--iz-accent-deep": accentColor ? shade(accent, -0.22) : theme.accentDeep,
    "--iz-tone-wash": theme.wash,
    "--iz-cover": theme.cover,
  };
}

/** تغميق/تفتيح لون سداسي — لاشتقاق قاعدة الزر من لون مخصّص. */
function shade(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const channels = [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16));
  const shifted = channels.map((value) =>
    Math.max(0, Math.min(255, Math.round(value + 255 * amount))),
  );
  return `#${shifted.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}
