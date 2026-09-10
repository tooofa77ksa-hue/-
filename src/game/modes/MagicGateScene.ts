import Phaser from "phaser";
import { BaseGameScene } from "./BaseGameScene";
import { getAudioManager } from "@/game/audio/AudioManager";
import { drawFlower, drawSparkle, scatterDecor } from "@/game/decor";

const SEGMENTS = 5;

/** MAGIC GATE: كل إجابة صحيحة تفتح جزءًا من البوابة حتى تنفتح كاملة. */
export default class MagicGateScene extends BaseGameScene {
  private gate!: Phaser.GameObjects.Graphics;
  private opened = false;

  constructor() {
    super("MagicGateScene");
  }

  protected drawBackground() {
    const { width, height } = this.scale;
    this.bgGraphics.clear();
    this.bgGraphics.fillGradientStyle(0x7bd389, 0x7bd389, 0xd9f4ff, 0xd9f4ff, 1);
    this.bgGraphics.fillRect(0, 0, width, height);

    // بريق سحري حول البوابة + زهور عند القاعدة
    scatterDecor(width, height * 0.62, 13, 14, (x, y, s) =>
      drawSparkle(this.bgGraphics, x, y, s * 0.45, 0xffffff, 0.65)
    );
    drawFlower(this.bgGraphics, width * 0.1, height * 0.56, 20, 0xffcb3d, 0xff5d8f, 0.85);
    drawFlower(this.bgGraphics, width * 0.9, height * 0.56, 20, 0xff8fa3, 0xffe8a3, 0.85);
  }

  protected layout() {
    this.gate?.destroy();
    this.gate = this.add.graphics();
    this.drawGate(this.opened ? SEGMENTS : Math.round(this.progress * SEGMENTS));
  }

  private drawGate(openSegments: number) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const topY = height * 0.18;
    const gateH = height * 0.42;
    const gateW = Math.min(width * 0.6, 340);

    this.gate.clear();
    this.gate.fillStyle(0xb98a2e, 1);
    this.gate.fillRoundedRect(cx - gateW / 2 - 16, topY, 18, gateH, 8);
    this.gate.fillRoundedRect(cx + gateW / 2 - 2, topY, 18, gateH, 8);
    this.gate.fillStyle(0xffcb3d, 1);
    this.gate.fillEllipse(cx, topY, gateW + 34, 40);

    const segW = gateW / SEGMENTS;
    for (let i = 0; i < SEGMENTS; i++) {
      const isOpen = i < openSegments;
      this.gate.fillStyle(isOpen ? 0xd9f4ff : 0x35c2e8, isOpen ? 0.25 : 0.95);
      this.gate.fillRect(cx - gateW / 2 + i * segW, topY + 4, segW - 2, gateH - 8);
    }

    if (this.opened) {
      this.gate.fillStyle(0xffffff, 0.5);
      this.gate.fillEllipse(cx, topY + gateH / 2, gateW * 0.7, gateH * 0.8);
    }
  }

  protected onCorrect(progress: number) {
    this.drawGate(Math.round(progress * SEGMENTS));
    getAudioManager().playEvent("STAR");
    this.tweens.add({ targets: this.gate, alpha: 0.6, duration: 100, yoyo: true });
  }

  protected onWrong() {
    /* لا تراجع في فتح البوابة عند الخطأ، فقط اهتزاز الشخصية */
  }

  protected onComplete() {
    if (this.opened) return;
    this.opened = true;
    this.drawGate(SEGMENTS);
    this.tweens.add({ targets: this.gate, scale: 1.05, duration: 250, yoyo: true, ease: "Sine.easeOut" });
  }

  protected onReset() {
    this.opened = false;
    this.layout();
  }
}
