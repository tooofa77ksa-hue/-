/**
 * مصدر الحقيقة الوحيد لعبارات الصوت البشري ومؤثرات SFX التي يُنتجها هذا
 * الـSkill - تقرؤه كل السكربتات (generate-voice، generate-sfx،
 * update-manifest) بدل تكرار القوائم في كل ملف.
 *
 * ملاحظة تسمية مهمة: بعض الأسماء التي طلبتها المستخدمة تتداخل مع فتحات
 * (Slots) موجودة بالفعل في src/game/audio/AudioManager.ts بنص متطابق أو
 * شبه متطابق تحت اسم ملف مختلف قليلًا:
 *   - "close_01.mp3" (اقتربتِ، جرّبي مرة ثانية) ↔ الفتحة الموجودة أصلًا
 *     ALMOST باسم الملف "almost_01" - نفس المعنى بالضبط لحدث ALMOST.
 *   - "ready_01.mp3" (صاروخك جاهز!) ↔ الفتحة الموجودة أصلًا ROCKET_READY
 *     باسم الملف "rocket_ready_01".
 * حفاظًا على "لا تُغيّر أي وظيفة لعبة أخرى" ولتفادي توليد ملفين شبه
 * متطابقين لنفس اللحظة، اعتُمد اسم الملف الموجود مسبقًا في الكود كمرجع
 * وحيد (event في الجدول أدناه يوضّح هذا الربط)، بدل إضافة اسم ملف بديل
 * غير مستخدم فعليًا من أي مكان في اللعبة.
 */

export interface VoicePhrase {
  /** اسم الملف بلا امتداد - يُطابق VOICE_SLOTS في AudioManager.ts للعبارات
   * المرتبطة بحدث؛ للعبارات الإضافية هو اسم حر جاهز لاستخدام مستقبلي. */
  id: string;
  text: string;
  /** GameEvent المرتبط، إن وُجد - راجع AudioManager.ts:VOICE_SLOTS */
  event?: string;
}

export const VOICE_PHRASES: VoicePhrase[] = [
  { id: "excellent_01", text: "ممتازة!", event: "EXCELLENT" },
  { id: "hero_01", text: "أحسنتِ يا بطلة!", event: "HERO" },
  { id: "amazing_01", text: "واو! إجابة رائعة!", event: "AMAZING" },
  { id: "star_01", text: "نجمة جديدة لك!", event: "STAR" },
  { id: "gem_01", text: "كنز جديد!", event: "GEM" },
  { id: "creative_01", text: "أبدعتِ!", event: "CREATIVE" },
  { id: "next_01", text: "إلى المرحلة التالية!", event: "NEXT_LEVEL" },
  { id: "try_again_01", text: "حاولي مرة أخرى.", event: "WRONG" },
  { id: "almost_01", text: "اقتربتِ، جرّبي مرة ثانية.", event: "ALMOST" },
  { id: "rocket_ready_01", text: "صاروخك جاهز!", event: "ROCKET_READY" },
  // متغيّر ثالث لحظة الإجابة الخاطئة - لا يملك GameEvent خاصًا به (يُستدعى
  // مباشرة عبر AudioManager.playWrongVariant كأحد ثلاثة احتمالات، بنفس
  // مؤثر WRONG الصوتي وحركة الدَمبلنغ) حتى لا تتكرر نفس العبارتين دائمًا.
  { id: "oops_01", text: "أووبس! أخطأتِ." },
  // نهاية الجولة حين تحتوي أخطاءً: تُستدعى عبر playVoiceLine مباشرة من
  // كل مشهد لعبة (RocketMissionScene/SquishyTreasureScene) بدل الاحتفال
  // الكامل (AMAZING/CREATIVE) حين لا تكون الجولة مثالية - طلب صريح من
  // المستخدمة بعد أن لاحظت أن اللعبة كانت تقول "واو! إجابة رائعة!" حتى
  // عند وجود إجابات خاطئة في الجولة.
  { id: "encourage_01", text: "يحزنني هذا قليلًا، لكن أنتِ تستطيعين! حاولي مرة أخرى." },
  // عبارات إضافية غير مربوطة بحدث ثابت بعد - جاهزة لاستخدام مستقبلي عبر
  // AudioManager.playVoiceLine(id) بمجرد اختيار الشاشة/اللحظة المناسبة لها
  { id: "start_01", text: "هيا نبدأ!" },
  { id: "choose_game_01", text: "اختاري لعبتك!" },
  { id: "great_01", text: "رائعة جدًا!" },
  { id: "yasalam_01", text: "يا سلام!" },
];

export interface SfxSpec {
  id: string;
  /** false = يحتاج مصدرًا خارجيًا مرخصًا حقيقيًا، لا يُولَّد برمجيًا أبدًا */
  synthesizable: boolean;
  event?: string;
  description: string;
}

export const SFX_SPECS: SfxSpec[] = [
  { id: "button_pop", synthesizable: true, description: "ضغط زر لطيف عام" },
  { id: "correct_pop", synthesizable: true, event: "EXCELLENT", description: "إجابة صحيحة" },
  { id: "sparkle", synthesizable: true, event: "HERO", description: "لمعة سحرية خفيفة" },
  { id: "star_twinkle", synthesizable: true, event: "STAR", description: "صوت نجمة" },
  { id: "gem_collect", synthesizable: true, event: "GEM", description: "جمع جوهرة" },
  {
    id: "wrong_soft",
    synthesizable: true,
    event: "WRONG / ALMOST",
    description: "إجابة غير صحيحة - لطيف جدًا وغير عقابي، بلا Buzzer",
  },
  { id: "rocket_charge", synthesizable: true, event: "ROCKET_READY", description: "شحن الصاروخ" },
  { id: "rocket_launch", synthesizable: true, description: "إقلاع الصاروخ" },
  { id: "magic_whoosh", synthesizable: true, event: "NEXT_LEVEL", description: "فتح البوابة السحرية" },
  { id: "treasure_open", synthesizable: true, description: "فتح صندوق الكنز" },
  { id: "celebration", synthesizable: true, event: "AMAZING", description: "احتفال قصير" },
  {
    id: "applause_short",
    synthesizable: true,
    event: "CREATIVE",
    description:
      "تصفيق قصير مُقارَب برمجيًا (عشرات نقرات ضجيج عشوائية التوقيت بكثافة صاعدة-هابطة) - تقريب معقول لا تسجيل حقيقي؛ يمكن استبداله لاحقًا بمصدر مرخّص حقيقي متى توفّر بوضعه يدويًا في public/audio/sfx/applause_short.mp3",
  },
];

export const VOICE_DIR = "public/audio/voice";
export const SFX_DIR = "public/audio/sfx";
export const MANIFEST_PATH = "public/audio/audio-manifest.json";
