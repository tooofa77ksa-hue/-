import Phaser from "phaser";
import { BaseGameScene } from "./BaseGameScene";
import { getAudioManager } from "@/game/audio/AudioManager";
import { burstStars, drawFlower, drawSparkle, scatterDecor } from "@/game/decor";

const SEGMENTS = 5;

/** MAGIC GATE: كل إجابة صحيحة تفتح جزءًا من البوابة حتى تنفتح كاملة. */
export default class MagicGateScene extends BaseGameScene {
  private gate!: Phaser.GameObjects.Graphics;
  private opened = false;
  private lightPointTimer?: Phaser.Time.TimerEvent;
  private gateCx = 0;
  private gateTopY = 0;
  private gateH = 0;
  private gateW = 0;

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
    this.startLightPoints();
  }

  /** نقاط ضوء سحرية تطفو وتتلاشى حول البوابة بين الحين والآخر - وليست في
   * كل إطار، لتبقى خفيفة الأداء وغير مزعجة بصريًا. */
  private startLightPoints() {
    this.lightPointTimer?.remove();
    if (this.reducedMotion) return;
    this.lightPointTimer = this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => {
        const x = this.gateCx + Phaser.Math.Between(-this.gateW / 2 - 10, this.gateW / 2 + 10);
        const y = this.gateTopY + Phaser.Math.Between(0, this.gateH);
        const dot = this.add.graphics({ x, y });
        dot.fillStyle(0xffffff, 0.9);
        dot.fillCircle(0, 0, 3);
        this.tweens.add({
          targets: dot,
          y: y - 26,
          alpha: 0,
          duration: 1400,
          ease: "Sine.easeOut",
          onComplete: () => dot.destroy(),
        });
      },
    });
  }

  private drawGate(openSegments: number) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const topY = height * 0.18;
    const gateH = height * 0.42;
    const gateW = Math.min(width * 0.6, 340);
    this.gateCx = cx;
    this.gateTopY = topY;
    this.gateH = gateH;
    this.gateW = gateW;

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
    burstStars(this, this.gateCx, this.gateTopY + this.gateH / 2, 2, this.reducedMotion, 0xffffff);
  }

  protected onWrong() {
    /* لا تراجع في فتح البوابة عند الخطأ، فقط اهتزاز الشخصية */
  }

  protected onComplete() {
    if (this.opened) return;
    this.opened = true;
    this.drawGate(SEGMENTS);
    this.tweens.add({ targets: this.gate, scale: 1.05, duration: 250, yoyo: true, ease: "Sine.easeOut" });

    if (!this.reducedMotion) {
      const flash = this.add.graphics({ x: this.gateCx, y: this.gateTopY + this.gateH / 2 });
      flash.fillStyle(0xffffff, 0.8);
      flash.fillCircle(0, 0, 10);
      this.tweens.add({
        targets: flash,
        scale: this.gateW / 8,
        alpha: 0,
        duration: 500,
        ease: "Cubic.easeOut",
        onComplete: () => flash.destroy(),
      });
    }
    burstStars(this, this.gateCx, this.gateTopY + this.gateH / 2, 8, this.reducedMotion, 0xffe8a3);
  }

  protected onReset() {
    this.opened = false;
    this.layout();
  }
}
