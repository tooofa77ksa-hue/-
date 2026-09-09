import Phaser from "phaser";
import { Dumpling } from "@/game/Dumpling";
import { gameBus } from "@/game/eventBus";
import { getAudioManager } from "@/game/audio/AudioManager";

/**
 * قاعدة مشتركة لكل أنماط اللعب (Modular Game Modes). أي نمط جديد يُنشأ
 * بوراثة هذه الفئة وتنفيذ الدوال المجرّدة فقط، دون الحاجة لتعديل الواجهة
 * الخلفية أو طبقة الأسئلة - العقد الوحيد هو أحداث gameBus.
 */
export abstract class BaseGameScene extends Phaser.Scene {
  protected dumpling!: Dumpling;
  protected progress = 0;
  private unsubscribers: Array<() => void> = [];
  private bg!: Phaser.GameObjects.Graphics;

  protected get reducedMotion(): boolean {
    return Boolean(this.registry.get("reducedMotion"));
  }

  create() {
    this.bg = this.add.graphics();
    this.drawBackground();

    const { width, height } = this.scale;
    this.dumpling = new Dumpling(this, width / 2, height * 0.72, () => this.reducedMotion);

    this.layout();

    this.unsubscribers.push(
      gameBus.on("ANSWER_CORRECT", ({ progress }) => {
        this.progress = progress;
        this.dumpling.celebrateExcellent();
        this.onCorrect(progress);
      }),
      gameBus.on("ANSWER_WRONG", () => {
        this.dumpling.wobbleGently();
        this.onWrong();
      }),
      gameBus.on("ROUND_COMPLETE", () => {
        this.dumpling.celebrateHero();
        getAudioManager().playEvent("NEXT_LEVEL");
        this.onComplete();
      }),
      gameBus.on("ROUND_RESET", () => {
        this.progress = 0;
        this.onReset();
      })
    );

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribers.forEach((u) => u());
      this.scale.off("resize", this.handleResize, this);
      this.dumpling.destroy();
    });
  }

  private handleResize() {
    this.drawBackground();
    this.dumpling.setPosition(this.scale.width / 2, this.scale.height * 0.72);
    this.layout();
  }

  /** خلفية زاهية كرتونية خاصة بكل نمط لعبة */
  protected abstract drawBackground(): void;
  /** إعادة ترتيب/رسم العناصر الخاصة بالنمط (تُستدعى أيضًا عند تغيير الحجم) */
  protected abstract layout(): void;
  protected abstract onCorrect(progress: number): void;
  protected abstract onWrong(): void;
  protected abstract onComplete(): void;
  protected abstract onReset(): void;

  protected get bgGraphics() {
    return this.bg;
  }
}
