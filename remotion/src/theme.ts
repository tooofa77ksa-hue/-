/**
 * نسخة من رموز الهوية البصرية في src/styles/theme.css بالمشروع الرئيسي،
 * لضمان تطابق ألوان الفيديو مع واجهة التطبيق (لا إعادة تصميم).
 */
export const theme = {
  brandPrimary: "#07a869",
  brandPrimaryDark: "#15445a",
  brandBlue: "#3d7eb9",
  brandTeal: "#0da9a6",
  brandGold: "#c1b489",
  brandInk: "#15445a",
  brandPaper: "#ffffff",
  brandMuted: "#5b6b73",

  gameBg1: "#fff4d6",
  gameBg2: "#ffe0ec",
  gameBg3: "#d9f4ff",
  gameAccent1: "#ff8a3d",
  gameAccent2: "#ff5d8f",
  gameAccent3: "#35c2e8",
  gameAccent4: "#7bd389",
  gameGold: "#ffcb3d",
  gameInk: "#3a2a4d",
} as const;

export const games = [
  { name: "مهمة الصاروخ", accent: theme.gameAccent1, bg: theme.gameBg1 },
  { name: "كنز الدامبلنغ", accent: theme.gameAccent2, bg: theme.gameBg2 },
  { name: "البوابة السحرية", accent: theme.gameAccent3, bg: theme.gameBg3 },
] as const;
