import type Phaser from "phaser";
import type { GameMode } from "@/types/models";
import { GAME_MODE_LABELS_AR } from "@/lib/constants";
import RocketMissionScene from "./RocketMissionScene";
import SquishyTreasureScene from "./SquishyTreasureScene";
import MagicGateScene from "./MagicGateScene";

/**
 * سجلّ أنماط اللعب. لإضافة نمط رابع/خامس مستقبلًا: أنشئ Scene يرث
 * BaseGameScene وينفّذ نفس عقد أحداث gameBus، ثم أضفه هنا مع تسمية عربية.
 * لا حاجة لتغيير Firestore أو Security Rules أو لوحة المعلمة.
 */
export const GAME_MODE_SCENES: Record<GameMode, typeof Phaser.Scene> = {
  rocket_mission: RocketMissionScene as unknown as typeof Phaser.Scene,
  squishy_treasure: SquishyTreasureScene as unknown as typeof Phaser.Scene,
  magic_gate: MagicGateScene as unknown as typeof Phaser.Scene,
};

export const GAME_MODE_LABELS = GAME_MODE_LABELS_AR;
