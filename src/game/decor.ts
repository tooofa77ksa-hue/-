import Phaser from "phaser";

/** زخارف مرسومة بالكامل بالكود (بلا صور خارجية) - زهور وبريق/تلألؤ تُضاف
 * لخلفيات الألعاب الثلاث لإضافة دفء ومرح بصريًا، خصوصًا في المنطقة المرئية
 * فوق بطاقة السؤال حيث تركّز الطالبة نظرها أثناء اللعب. */

export function drawFlower(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  petalColor: number,
  centerColor: number,
  alpha = 1
) {
  const petals = 5;
  for (let i = 0; i < petals; i++) {
    const angle = (Math.PI * 2 * i) / petals - Math.PI / 2;
    const px = cx + Math.cos(angle) * size * 0.55;
    const py = cy + Math.sin(angle) * size * 0.55;
    g.fillStyle(petalColor, alpha);
    g.fillEllipse(px, py, size * 0.62, size * 0.44);
  }
  g.fillStyle(centerColor, alpha);
  g.fillCircle(cx, cy, size * 0.3);
}

export function drawSparkle(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  color: number,
  alpha = 1
) {
  g.fillStyle(color, alpha);
  g.fillTriangle(cx, cy - size, cx - size * 0.26, cy, cx, cy + size);
  g.fillTriangle(cx - size, cy, cx, cy - size * 0.26, cx + size, cy);
}

/** توزيع زخارف بموقع ثابت (Deterministic) حتى لا "تقفز" عند إعادة الرسم
 * (تغيير حجم الشاشة مثلًا) - بذرة عشوائية بسيطة بدل Math.random(). */
export function scatterDecor(
  width: number,
  height: number,
  seed: number,
  count: number,
  draw: (x: number, y: number, size: number, i: number) => void
) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const size = 5 + rand() * 8;
    draw(x, y, size, i);
  }
}

/** نجوم/بريق عابرة تتطاير من نقطة وتتلاشى - عنصر بصري خفيف الوزن (Graphics
 * مؤقتة تُدمَّر بعد التلاشي) يُستخدم للاحتفال بلحظات محددة فقط (إجابة صحيحة،
 * وصول جوهرة، إكمال مرحلة) لا في كل إطار. يُحترم Reduced Motion بإلغاء
 * الاستدعاء بالكامل. */
export function burstStars(
  scene: Phaser.Scene,
  x: number,
  y: number,
  count: number,
  reducedMotion: boolean,
  color = 0xffcb3d
) {
  if (reducedMotion) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 26 + Math.random() * 38;
    const g = scene.add.graphics({ x, y });
    drawSparkle(g, 0, 0, 5 + Math.random() * 4, color, 1);
    scene.tweens.add({
      targets: g,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist - 8,
      alpha: 0,
      scale: 0.3,
      duration: 480 + Math.random() * 260,
      ease: "Cubic.easeOut",
      onComplete: () => g.destroy(),
    });
  }
}

/** مسار نجوم خفيف يتبع عنصرًا متحركًا (كصاروخ يقلع) لمدة محددة - يُنشئ
 * Timer داخليًا يُوقف نفسه تلقائيًا عند انتهاء المدة، بلا أي حاجة لتتبعه
 * خارجيًا. */
export function starTrail(
  scene: Phaser.Scene,
  getPosition: () => { x: number; y: number },
  durationMs: number,
  reducedMotion: boolean
) {
  if (reducedMotion) return;
  const delay = 70;
  scene.time.addEvent({
    delay,
    repeat: Math.floor(durationMs / delay),
    callback: () => {
      const { x, y } = getPosition();
      const g = scene.add.graphics({ x, y });
      drawSparkle(g, 0, 0, 4 + Math.random() * 3, 0xffffff, 0.9);
      scene.tweens.add({
        targets: g,
        y: y + 24,
        alpha: 0,
        scale: 0.4,
        duration: 380,
        ease: "Cubic.easeOut",
        onComplete: () => g.destroy(),
      });
    },
  });
}
