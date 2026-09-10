import Phaser from "phaser";
import { BaseGameScene } from "./BaseGameScene";
import { getAudioManager } from "@/game/audio/AudioManager";
import { drawFlower, drawSparkle, scatterDecor } from "@/game/decor";

const GEM_COLORS = [0xff5d8f, 0x35c2e8, 0xffcb3d, 0x7bd389];

/** SQUISHY TREASURE: كل إجابة صحيحة تُطير جوهرة نحو عداد الكنز. */
export default class SquishyTreasureScene extends BaseGameScene {
  private counterBg!: Phaser.GameObjects.Graphics;
  private counterText!: Phaser.GameObjects.Text;
  private chest!: Phaser.GameObjects.Graphics;
  private collected = 0;

  constructor() {
    super("SquishyTreasureScene");
  }

  protected drawBackground() {
    const { width, height } = this.scale;
    this.bgGraphics.clear();
    this.bgGraphics.fillGradientStyle(0xffe0ec, 0xffe0ec, 0xfff4d6, 0xfff4d6, 1);
    this.bgGraphics.fillRect(0, 0, width, height);
    this.bgGraphics.fillStyle(0xd9f4ff, 0.6);
    this.bgGraphics.fillEllipse(width * 0.5, height, width * 0.9, 100);

    // زهور وبريق زخرفي - هذه أكثر لعبة تحتاج دفئًا بصريًا لخلوّها من عنصر
    // رئيسي كبير (الصندوق صغير في الزاوية فقط)
    scatterDecor(width, height * 0.45, 11, 13, (x, y, s) =>
      drawSparkle(this.bgGraphics, x, y, s * 0.5, 0xffffff, 0.75)
    );
    drawFlower(this.bgGraphics, width * 0.14, height * 0.32, 24, 0xff5d8f, 0xffe8a3, 0.9);
    drawFlower(this.bgGraphics, width * 0.5, height * 0.16, 18, 0x35c2e8, 0xffcb3d, 0.85);
    drawFlower(this.bgGraphics, width * 0.62, height * 0.4, 16, 0x7bd389, 0xff8fa3, 0.85);
  }

  protected layout() {
    const { width } = this.scale;

    this.chest?.destroy();
    this.chest = this.add.graphics();
    this.chest.fillStyle(0xb98a2e, 1);
    this.chest.fillRoundedRect(width - 96, 24, 64, 44, 8);
    this.chest.fillStyle(0xffcb3d, 1);
    this.chest.fillRect(width - 68, 24, 8, 44);

    this.counterBg?.destroy();
    this.counterBg = this.add.graphics();
    this.counterBg.fillStyle(0xffffff, 0.9);
    this.counterBg.fillRoundedRect(width - 108, 72, 88, 30, 15);

    this.counterText?.destroy();
    this.counterText = this.add.text(width - 64, 87, `${this.collected}`, {
      fontFamily: "Tajawal, sans-serif",
      fontSize: "18px",
      color: "#3a2a4d",
    });
    this.counterText.setOrigin(0.5);
  }

  protected onCorrect() {
    const { width } = this.scale;
    const startX = this.dumpling.container.x;
    const startY = this.dumpling.container.y - 20;
    const color = GEM_COLORS[this.collected % GEM_COLORS.length];

    const gem = this.add.graphics();
    gem.fillStyle(color, 1);
    gem.fillTriangle(-10, 0, 10, 0, 0, -16);
    gem.fillTriangle(-10, 0, 10, 0, 0, 12);
    gem.setPosition(startX, startY);

    getAudioManager().playEvent("GEM");

    this.tweens.add({
      targets: gem,
      x: width - 64,
      y: 87,
      scale: 0.4,
      duration: this.reducedMotion ? 250 : 650,
      ease: "Cubic.easeIn",
      onComplete: () => {
        gem.destroy();
        this.collected += 1;
        this.counterText.setText(`${this.collected}`);
        this.tweens.add({ targets: this.counterText, scale: 1.3, duration: 100, yoyo: true });
      },
    });
  }

  protected onWrong() {
    /* اهتزاز الشخصية يكفي، بدون فقدان جواهر */
  }

  protected onComplete() {
    getAudioManager().playEvent("CREATIVE");
    this.tweens.add({ targets: this.chest, angle: -4, duration: 100, yoyo: true, repeat: 3 });
  }

  protected onReset() {
    this.collected = 0;
    this.layout();
  }
}
