# مؤثرات صوتية (SFX)

يُنشَأ ويُحدَّث تلقائيًا بواسطة Skill `arabic-kids-game-audio`. مصدر
الحقيقة الكامل في `public/audio/audio-manifest.json`.

معظم هذه المؤثرات موّلَفة برمجيًا (PCM خالص، بلا أي ملف/مكتبة خارجية) عبر
`.claude/skills/arabic-kids-game-audio/scripts/generate-sfx.ts` بنفس
أسلوب `src/game/audio/sfxSynth.ts` تمامًا (نغمات قصيرة لطيفة، بلا Buzzer
عقابي) لكن مُصدَّرة كملف MP3 حقيقي.

| الملف | الوصف | الحدث | الحالة | المزوّد | تاريخ التوليد |
|---|---|---|---|---|---|
| `button_pop.mp3` | ضغط زر لطيف عام | — | ✓ موجود | synth-offline-pcm | 2026-09-11 |
| `correct_pop.mp3` | إجابة صحيحة | EXCELLENT | ✓ موجود | synth-offline-pcm | 2026-09-11 |
| `sparkle.mp3` | لمعة سحرية خفيفة | HERO | ✓ موجود | synth-offline-pcm | 2026-09-11 |
| `star_twinkle.mp3` | صوت نجمة | STAR | ✓ موجود | synth-offline-pcm | 2026-09-11 |
| `gem_collect.mp3` | جمع جوهرة | GEM | ✓ موجود | synth-offline-pcm | 2026-09-11 |
| `wrong_soft.mp3` | إجابة غير صحيحة - لطيف جدًا وغير عقابي، بلا Buzzer | WRONG / ALMOST | ✓ موجود | synth-offline-pcm | 2026-09-11 |
| `rocket_charge.mp3` | شحن الصاروخ | ROCKET_READY | ✓ موجود | synth-offline-pcm | 2026-09-11 |
| `rocket_launch.mp3` | إقلاع الصاروخ | — | ✓ موجود | synth-offline-pcm | 2026-09-11 |
| `magic_whoosh.mp3` | فتح البوابة السحرية | NEXT_LEVEL | ✓ موجود | synth-offline-pcm | 2026-09-11 |
| `treasure_open.mp3` | فتح صندوق الكنز | — | ✓ موجود | synth-offline-pcm | 2026-09-11 |
| `celebration.mp3` | احتفال قصير | AMAZING | ✓ موجود | synth-offline-pcm | 2026-09-11 |
| `applause_short.mp3` | تصفيق أطفال مرح قصير جدًا - يحتاج مصدرًا مرخصًا حقيقيًا أو مولّد SFX خارجي، لا يُصنَع صناعيًا | CREATIVE | ✗ يحتاج مصدرًا خارجيًا (لا يُولَّد برمجيًا) | — | — |

## applause_short.mp3

استُثني عمدًا من التوليد البرمجي: تصفيق "مُصطنَع" بنغمات بسيطة يبدو رديئًا
وغير طبيعي بوضوح. إن رغبتِ إضافته، استخدمي تسجيلًا حقيقيًا أو مكتبة
مؤثرات مرخّصة، وسجّلي هنا **يدويًا** مصدره ورخصته عند إضافته (لا تحذفي
هذا القسم عند إعادة تشغيل update-manifest.ts - أضيفي الملف فقط وشغّلي
السكربت، سيتحول الصف أعلاه إلى "✓ موجود" تلقائيًا).

## آلية الاحتياط (Fallback)

`src/game/audio/AudioManager.ts` يحاول تحميل كل ملف هنا أولًا؛ إن كان
غير موجود، يستخدم المؤثر المولَّف حيًّا من `sfxSynth.ts` بلا أي انقطاع
أو خطأ - إضافة/حذف أي ملف هنا آمن تمامًا في أي وقت.
