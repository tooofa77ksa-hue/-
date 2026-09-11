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
    const pos = this.dumplingPosition(width, height);
    this.dumpling = new Dumpling(this, pos.x, pos.y, () => this.reducedMotion);

    this.layout();

    this.unsubscribers.push(
      gameBus.on("ANSWER_CORRECT", ({ progress }) =>
        this.safeRun(() => {
          this.progress = progress;
          this.dumpling.celebrateExcellent();
          this.onCorrect(progress);
        })
      ),
      gameBus.on("ANSWER_WRONG", () =>
        this.safeRun(() => {
          this.dumpling.wobbleGently();
          this.onWrong();
        })
      ),
      gameBus.on("ROUND_COMPLETE", ({ hadMistakes }) =>
        this.safeRun(() => {
          this.dumpling.celebrateHero();
          getAudioManager().playEvent("NEXT_LEVEL");
          this.onComplete(hadMistakes);
        })
      ),
      gameBus.on("ROUND_RESET", () =>
        this.safeRun(() => {
          this.progress = 0;
          this.onReset();
        })
      )
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
    const pos = this.dumplingPosition(this.scale.width, this.scale.height);
    this.dumpling.setPosition(pos.x, pos.y);
    this.layout();
  }

  /** موقع الدَمبلنغ ضمن المنطقة المرئية فعليًا فوق بطاقة السؤال (التي تغطي
   * حتى 58% من الأسفل - max-height: 58vh في play.css)، لا خلفها كما كان
   * سابقًا (height*0.72 كان يضع الشخصية خلف البطاقة بالكامل طوال اللعب). */
  private dumplingPosition(width: number, height: number) {
    return { x: width * 0.24, y: height * 0.34 };
  }

  /** يتحقق أولًا أن أنظمة المشهد الأساسية ما زالت موجودة، وينفّذ الدالة
   * داخل try/catch كخط دفاع أخير - يحمي من حدث gameBus متأخر يصل بعد
   * تدمير اللعبة. يحدث هذا حصرًا في وضع التطوير (React.StrictMode يُنشئ
   * اللعبة مرتين عمدًا للتحقق من صحة التنظيف؛ مؤكَّد أنه لا يحدث إطلاقًا
   * في بناء الإنتاج الفعلي حيث تُعطَّل هذه الميزة التشخيصية تلقائيًا)،
   * وفي هذه الحالة تحديدًا بعض أنظمة Phaser الداخلية (غير this.add نفسها)
   * قد تكون تالفة جزئيًا رغم أن this.add كمرجع لا يزال موجودًا - لذا
   * try/catch ضروري هنا بجانب الفحص المبدئي، لا بديل عنه. */
  private safeRun(fn: () => void) {
    if (!this.add || !this.tweens) return;
    try {
      fn();
    } catch {
      /* مشهد تحت التدمير (سباق React.StrictMode في وضع التطوير فقط) -
       * تجاهل بصمت بدل تعطيل الصفحة كلها. */
    }
  }

  /** خلفية زاهية كرتونية خاصة بكل نمط لعبة */
  protected abstract drawBackground(): void;
  /** إعادة ترتيب/رسم العناصر الخاصة بالنمط (تُستدعى أيضًا عند تغيير الحجم) */
  protected abstract layout(): void;
  protected abstract onCorrect(progress: number): void;
  protected abstract onWrong(): void;
  /** hadMistakes: هل حوت الجولة إجابة خاطئة واحدة على الأقل - كل مشهد
   * يستخدمها ليختار بين احتفال كامل (جولة مثالية) أو عبارة تشجيع لطيفة
   * بدل الثناء غير الدقيق (مثل "واو! إجابة رائعة!" رغم وجود أخطاء). */
  protected abstract onComplete(hadMistakes: boolean): void;
  protected abstract onReset(): void;

  protected get bgGraphics() {
    return this.bg;
  }
}
