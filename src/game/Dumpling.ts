import Phaser from "phaser";

/**
 * «دَمبل» - شخصية أصلية طرية (Squishy Dumpling) مرسومة بالكامل بالكود عبر
 * Phaser.Graphics (لا صور خارجية). التصميم أصلي: كرة مطاطية صفراء دافئة
 * بخدين ورديين وعينين كبيرتين، دون أي اقتباس من شخصية معروفة.
 */
export class Dumpling {
  readonly container: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  private getReducedMotion: () => boolean;
  private idleTween?: Phaser.Tweens.Tween;
  private blinkTimer?: Phaser.Time.TimerEvent;
  private currentMood: "happy" | "cheer" | "oops" = "happy";
  private blinking = false;

  constructor(scene: Phaser.Scene, x: number, y: number, getReducedMotion: () => boolean) {
    this.scene = scene;
    this.getReducedMotion = getReducedMotion;
    this.container = scene.add.container(x, y);
    this.body = scene.add.graphics();
    this.drawBody();
    this.container.add(this.body);
    this.startIdle();
    this.scheduleBlink();
  }

  private drawBody(mood: "happy" | "cheer" | "oops" = "happy", blink = false) {
    const g = this.body;
    g.clear();
    g.fillStyle(0xffd166, 1);
    g.fillEllipse(0, 6, 116, 100);
    g.fillStyle(0xffe8a3, 1);
    g.fillEllipse(0, -14, 70, 30);
    g.fillStyle(0xff8fa3, 0.65);
    g.fillEllipse(-36, 14, 20, 13);
    g.fillEllipse(36, 14, 20, 13);

    const eyeY = mood === "oops" ? -2 : -10;
    g.fillStyle(0x2b2140, 1);
    if (mood === "oops" || blink) {
      g.fillEllipse(-22, eyeY, 10, 4);
      g.fillEllipse(22, eyeY, 10, 4);
    } else {
      g.fillCircle(-22, eyeY, 7.5);
      g.fillCircle(22, eyeY, 7.5);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-19, eyeY - 3, 2.6);
      g.fillCircle(25, eyeY - 3, 2.6);
    }

    g.lineStyle(4, 0x2b2140, 1);
    g.beginPath();
    if (mood === "cheer") {
      g.arc(0, 6, 22, Phaser.Math.DegToRad(10), Phaser.Math.DegToRad(170));
    } else if (mood === "oops") {
      g.arc(0, 22, 14, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340));
    } else {
      g.arc(0, 8, 20, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160));
    }
    g.strokePath();
  }

  private startIdle() {
    this.idleTween?.remove();
    if (this.getReducedMotion()) return;
    this.idleTween = this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 5,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /** رمشة خفيفة عشوائية بين الحين والآخر أثناء السكون فقط - تمنح الشخصية
   * إحساسًا بالحياة دون أن تتعارض مع تعابير celebrate/wobble. */
  private scheduleBlink() {
    this.blinkTimer?.remove();
    if (this.getReducedMotion()) return;
    this.blinkTimer = this.scene.time.delayedCall(2200 + Math.random() * 2600, () => {
      if (this.currentMood === "happy" && !this.blinking) {
        this.blinking = true;
        this.drawBody("happy", true);
        this.scene.time.delayedCall(120, () => {
          this.blinking = false;
          if (this.currentMood === "happy") this.drawBody("happy");
        });
      }
      this.scheduleBlink();
    });
  }

  /** إجابة صحيحة عادية: قفزة مع Squash & Stretch */
  celebrateExcellent() {
    this.currentMood = "happy";
    this.drawBody("happy");
    if (this.getReducedMotion()) {
      this.pulse();
      return;
    }
    const t = this.scene.tweens;
    t.add({
      targets: this.container,
      scaleX: 1.18,
      scaleY: 0.8,
      duration: 90,
      yoyo: true,
      onComplete: () => {
        t.add({
          targets: this.container,
          scaleY: 1.3,
          scaleX: 0.85,
          duration: 140,
          ease: "Cubic.easeOut",
          yoyo: true,
          onComplete: () => {
            t.add({ targets: this.container, scaleX: 1, scaleY: 1, duration: 160, ease: "Bounce.easeOut" });
          },
        });
      },
    });
  }

  /** إنجاز أكبر: رقصة احتفال */
  celebrateHero() {
    this.currentMood = "cheer";
    this.drawBody("cheer");
    if (this.getReducedMotion()) {
      this.pulse();
      return;
    }
    const t = this.scene.tweens;
    let count = 0;
    const step = () => {
      count++;
      t.add({
        targets: this.container,
        angle: count % 2 === 0 ? 8 : -8,
        y: this.container.y - 10,
        duration: 130,
        yoyo: true,
        ease: "Sine.easeInOut",
        onComplete: () => {
          if (count < 4) step();
          else t.add({ targets: this.container, angle: 0, duration: 120 });
        },
      });
    };
    step();
  }

  /** إجابة خاطئة: اهتزاز لطيف بلا إحباط */
  wobbleGently() {
    this.currentMood = "oops";
    this.drawBody("oops");
    const restore = () => {
      this.currentMood = "happy";
      this.drawBody("happy");
    };
    if (this.getReducedMotion()) {
      this.scene.time.delayedCall(400, restore);
      return;
    }
    this.scene.tweens.add({
      targets: this.container,
      angle: 6,
      duration: 90,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.container.angle = 0;
        restore();
      },
    });
  }

  private pulse() {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0.6,
      duration: 120,
      yoyo: true,
    });
  }

  setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  destroy() {
    this.idleTween?.remove();
    this.blinkTimer?.remove();
    this.container.destroy();
  }
}
