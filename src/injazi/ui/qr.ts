/*
  مساعدات رمز QR.
  استنتاج نوع الرابط وتطبيعه يعيشان هنا لأنهما منطق لا واجهة، ويُستخدمان
  من محرّر المشروع كما من بطاقة الرمز.
*/
import type { LinkKind } from "@/injazi/types/models";

export type QrFrame = "classic" | "heart" | "star" | "geo";

export const QR_FRAMES: { id: QrFrame; name: string }[] = [
  { id: "classic", name: "كلاسيكي" },
  { id: "heart", name: "إطار قلب" },
  { id: "star", name: "إطار نجوم" },
  { id: "geo", name: "إطار هندسي" },
];

export const KIND_LABEL: Record<LinkKind, string> = {
  drive: "Google Drive",
  youtube: "YouTube",
  telegram: "Telegram",
  url: "رابط",
};

/** استنتاج نوع الرابط من نطاقه — يُستخدَم للأيقونة والتسمية. */
export function detectLinkKind(url: string): LinkKind {
  const value = url.toLowerCase();
  if (value.includes("drive.google.") || value.includes("docs.google.")) return "drive";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "youtube";
  if (value.includes("t.me") || value.includes("telegram.")) return "telegram";
  return "url";
}

/** رابط صالح وآمن فقط: http/https. يمنع javascript: و data:. */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

