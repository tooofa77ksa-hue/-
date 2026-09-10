/**
 * رموز الهوية البصرية - مأخوذة حرفيًا من src/styles/theme.css في هذا المستودع
 * (دليل الهوية البصرية - وزارة التعليم، الإصدار 3، أكتوبر 2025).
 * أي تغيير هنا يجب أن يبقى متطابقًا مع الملف المصدر لتفادي انحراف الهوية.
 */
export const colors = {
  primary: "#07a869",
  primaryDark: "#15445a",
  blue: "#3d7eb9",
  teal: "#0da9a6",
  gold: "#c1b489",
  gray: "#c2c1c1",
  ink: "#15445a",
  paper: "#ffffff",
  muted: "#5b6b73",
  border: "#d9e3de",

  // مستويات الأداء (نفس ألوان بطاقة نافس الرسمية: مرتفع/متوسط/منخفض/منخفض جدا)
  levelHigh: "#1f8a5f",
  levelMid: "#bfe3cf",
  levelLow: "#f0c94b",
  levelVeryLow: "#a13a3a",
} as const;

export const fonts = {
  arabic: "Tajawal",
} as const;

export const layout = {
  width: 1920,
  height: 1080,
  fps: 30,
  // هامش آمن لضمان عدم خروج أي نص أو عنصر عن حدود الشاشة في أي عرض
  safeMargin: 96,
} as const;

export const easings = {
  // منحنى ناعم لحركات المذيعة والبطاقات - بدون Bounce أو Elastic
  standard: [0.22, 1, 0.36, 1] as [number, number, number, number],
  enter: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

export const spring = {
  gentle: { damping: 200, stiffness: 120, mass: 1 },
  chart: { damping: 200, stiffness: 90, mass: 1.2 },
};
