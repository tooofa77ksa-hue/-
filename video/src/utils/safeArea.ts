import { layout } from "../styles/tokens";

/** مساحة آمنة لضمان عدم خروج أي عنصر عن حدود الشاشة 1920x1080 */
export const safeArea = {
  top: layout.safeMargin,
  bottom: layout.height - layout.safeMargin,
  left: layout.safeMargin,
  right: layout.width - layout.safeMargin,
  width: layout.width - layout.safeMargin * 2,
  height: layout.height - layout.safeMargin * 2,
};
