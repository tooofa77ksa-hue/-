import type { Difficulty, GameMode, SkillKey } from "@/types/models";

export const SKILL_LABELS: Record<SkillKey, string> = {
  comprehension: "الفهم",
  inference: "الاستنتاج",
  synonym: "المرادف",
  antonym: "المضاد",
  gender: "مذكر / مؤنث",
  word_type: "اسم / فعل / حرف",
  number_form: "مفرد / مثنى / جمع",
  main_idea: "الفكرة الرئيسة",
  general_goal: "الهدف العام",
  cause_effect: "السبب والنتيجة",
  event_order: "ترتيب الأحداث",
  opinion: "الرأي",
  aesthetic_expression: "التعبير الجمالي",
  alternative_ending: "نهاية مختلفة للنص",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

export const GAME_MODE_LABELS_AR: Record<GameMode, string> = {
  rocket_mission: "مهمة الصاروخ",
  squishy_treasure: "كنز الدامبلنغ",
  magic_gate: "البوابة السحرية",
};

export const SKILL_KEYS: SkillKey[] = Object.keys(SKILL_LABELS) as SkillKey[];
export const DIFFICULTY_KEYS: Difficulty[] = ["easy", "medium", "hard"];
export const GAME_MODE_KEYS: GameMode[] = ["rocket_mission", "squishy_treasure", "magic_gate"];
