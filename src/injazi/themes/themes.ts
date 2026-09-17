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

/*
  أسماء الثيمات عربية: الموقع لطالبات صف رابع في مدرسة سعودية، وسطر
  إنجليزي تحت اسم عربي نشاز لا وظيفة له.
  الألوان مضبوطة على الأرضية الليلية: accent ساطع (النص فوقه داكن)،
  وcover يتلاشى إلى الليل لا إلى الورق الكريمي.
*/
export const THEMES: PortfolioTheme[] = [
  {
    id: "lavender",
    name: "حلم بنفسجي",
    accent: "#a98bff",
    accentDeep: "#7d5bf0",
    wash: "rgba(169, 139, 255, 0.18)",
    cover: "linear-gradient(135deg, #a98bff, #5fe3ff 58%, rgba(11, 8, 36, 0))",
    tone: "lilac",
  },
  {
    id: "pink",
    name: "وردة ضوء",
    accent: "#ff8fc0",
    accentDeep: "#e0578f",
    wash: "rgba(255, 143, 192, 0.18)",
    cover: "linear-gradient(135deg, #ff8fc0, #ffc96b 66%, rgba(11, 8, 36, 0))",
    tone: "rose",
  },
  {
    id: "sky",
    name: "مغامرة السماء",
    accent: "#5fe3ff",
    accentDeep: "#2fb6e0",
    wash: "rgba(95, 227, 255, 0.18)",
    cover: "linear-gradient(135deg, #5fe3ff, #a98bff 62%, rgba(11, 8, 36, 0))",
    tone: "sky",
  },
  {
    id: "mint",
    name: "نعناع هادئ",
    accent: "#6ee7c7",
    accentDeep: "#34c9a0",
    wash: "rgba(110, 231, 199, 0.18)",
    cover: "linear-gradient(135deg, #6ee7c7, #5fe3ff 62%, rgba(11, 8, 36, 0))",
    tone: "mint",
  },
  {
    id: "peach",
    name: "شفق دافئ",
    accent: "#ffb27a",
    accentDeep: "#e8863f",
    wash: "rgba(255, 178, 122, 0.18)",
    cover: "linear-gradient(135deg, #ffb27a, #ff8fc0 62%, rgba(11, 8, 36, 0))",
    tone: "apricot",
  },
  {
    id: "sunny",
    name: "شمس ذهبية",
    accent: "#ffc96b",
    accentDeep: "#e09a26",
    wash: "rgba(255, 201, 107, 0.2)",
    cover: "linear-gradient(135deg, #ffc96b, #6ee7c7 68%, rgba(11, 8, 36, 0))",
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
/*
  ألوان ساطعة لا داكنة: على الأرضية الليلية يحمل الزرُّ نصًّا داكنًا
  (--iz-on-accent)، فالساطع هو ما يقرأ. اللون الداكن هنا كان يصنع زرًّا
  يذوب في الخلفية.
*/
export const ACCENT_PRESETS = [
  "#7fdcff",
  "#a98bff",
  "#ff8fc0",
  "#ffc96b",
  "#6ee7c7",
  "#ffb27a",
  "#c3adff",
  "#7ef0cd",
  "#ff9fc4",
  "#ffdc8d",
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
