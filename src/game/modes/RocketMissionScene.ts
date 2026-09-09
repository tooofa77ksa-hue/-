import Phaser from "phaser";
import { BaseGameScene } from "./BaseGameScene";
import { getAudioManager } from "@/game/audio/AudioManager";

/** ROCKET MISSION: كل إجابة صحيحة تشحن الصاروخ حتى الإقلاع. */
export default class RocketMissionScene extends BaseGameScene {
  private rocket!: Phaser.GameObjects.Container;
  private flame!: Phaser.GameObjects.Graphics;
  private meterBg!: Phaser.GameObjects.Graphics;
  private meterFill!: Phaser.GameObjects.Graphics;
  private launched = false;

  constructor() {
    super("RocketMissionScene");
  }

  protected drawBackground() {
    const { width, height } = this.scale;
    this.bgGraphics.clear();
    this.bgGraphics.fillGradientStyle(0x35c2e8, 0x35c2e8, 0xfff4d6, 0xfff4d6, 1);
    this.bgGraphics.fillRect(0, 0, width, height);
    this.bgGraphics.fillStyle(0xffffff, 0.85);
    for (const [cx, cy, r] of [
      [width * 0.2, height * 0.18, 26],
      [width * 0.7, height * 0.12, 20],
      [width * 0.85, height * 0.28, 30],
    ] as const) {
      this.bgGraphics.fillCircle(cx, cy, r);
      this.bgGraphics.fillCircle(cx + r * 0.8, cy + 4, r * 0.7);
      this.bgGraphics.fillCircle(cx - r * 0.8, cy + 4, r * 0.7);
    }
  }

  protected layout() {
    const { width, height } = this.scale;

    this.rocket?.destroy();
    this.rocket = this.add.container(width / 2, height * 0.42);
    const body = this.add.graphics();
    body.fillStyle(0xff5d8f, 1);
    body.fillRoundedRect(-22, -60, 44, 90, 18);
    body.fillStyle(0xffffff, 1);
    body.fillCircle(0, -30, 14);
    body.fillStyle(0x35c2e8, 1);
    body.fillCircle(0, -30, 8);
    body.fillStyle(0xffcb3d, 1);
    body.fillTriangle(-22, 20, -42, 50, -14, 34);
    body.fillTriangle(22, 20, 42, 50, 14, 34);
    this.flame = this.add.graphics();
    this.drawFlame(0.3);
    this.flame.setPosition(0, 34);
    this.rocket.add([body, this.flame]);

    this.meterBg?.destroy();
    this.meterFill?.destroy();
    this.meterBg = this.add.graphics();
    this.meterBg.fillStyle(0xffffff, 0.85);
    this.meterBg.fillRoundedRect(width / 2 - 110, height - 46, 220, 22, 11);
    this.meterFill = this.add.graphics();
    this.drawMeter(this.launched ? 1 : this.progress);
  }

  private drawFlame(scale: number) {
    this.flame.clear();
    this.flame.fillStyle(0xffcb3d, 0.95);
    this.flame.fillTriangle(-10 * scale, 0, 10 * scale, 0, 0, 26 * scale + 10);
    this.flame.fillStyle(0xff8a3d, 0.9);
    this.flame.fillTriangle(-6 * scale, 0, 6 * scale, 0, 0, 16 * scale + 6);
  }

  private drawMeter(ratio: number) {
    const { width, height } = this.scale;
    this.meterFill.clear();
    this.meterFill.fillStyle(0xff8a3d, 1);
    this.meterFill.fillRoundedRect(width / 2 - 108, height - 44, Math.max(6, 216 * ratio), 18, 9);
  }

  protected onCorrect(progress: number) {
    this.drawMeter(progress);
    this.tweens.add({ targets: this.flame, scale: 1.4, duration: 120, yoyo: true });
    this.tweens.add({ targets: this.rocket, y: this.rocket.y - 6, duration: 140, yoyo: true, ease: "Sine.easeOut" });
  }

  protected onWrong() {
    this.tweens.add({ targets: this.rocket, angle: 3, duration: 90, yoyo: true, repeat: 1 });
  }

  protected onComplete() {
    if (this.launched) return;
    this.launched = true;
    getAudioManager().playEvent("AMAZING");
    const { height } = this.scale;
    this.tweens.add({
      targets: this.flame,
      scale: 2.2,
      duration: 250,
    });
    this.tweens.add({
      targets: this.rocket,
      y: -height * 0.4,
      duration: this.reducedMotion ? 400 : 1100,
      ease: "Cubic.easeIn",
      delay: 200,
    });
  }

  protected onReset() {
    this.launched = false;
    this.layout();
  }
}
