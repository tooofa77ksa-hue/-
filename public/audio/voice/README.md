# فتحات الصوت البشري (Voice Slots)

هذا الملف يُنشَأ ويُحدَّث تلقائيًا بواسطة Skill `arabic-kids-game-audio`
(عبر `update-manifest.ts`) - لا تعدّليه يدويًا، بل عدّلي الجدول في
`.claude/skills/arabic-kids-game-audio/scripts/lib/audioTable.ts` ثم
شغّلي "ولّد أصوات اللعبة" مرة أخرى.

مصدر الحقيقة الكامل (قابل للقراءة برمجيًا) موجود في
`public/audio/audio-manifest.json`.

| الملف | العبارة | الحدث | الحالة | المزوّد | الصوت (Voice ID) | تاريخ التوليد |
|---|---|---|---|---|---|---|
| `excellent_01.mp3` | ممتازة! | EXCELLENT | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `hero_01.mp3` | أحسنتِ يا بطلة! | HERO | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `amazing_01.mp3` | واو! إجابة رائعة! | AMAZING | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `star_01.mp3` | نجمة جديدة لك! | STAR | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `gem_01.mp3` | كنز جديد! | GEM | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `creative_01.mp3` | أبدعتِ! | CREATIVE | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `next_01.mp3` | إلى المرحلة التالية! | NEXT_LEVEL | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `try_again_01.mp3` | حاولي مرة أخرى. | WRONG | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `almost_01.mp3` | اقتربتِ، جرّبي مرة ثانية. | ALMOST | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `rocket_ready_01.mp3` | صاروخك جاهز! | ROCKET_READY | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `oops_01.mp3` | أووبس! أخطأتِ. | — | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `start_01.mp3` | هيا نبدأ! | — | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `choose_game_01.mp3` | اختاري لعبتك! | — | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `great_01.mp3` | رائعة جدًا! | — | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |
| `yasalam_01.mp3` | يا سلام! | — | ✓ موجود | elevenlabs | d15jrIAARvF899pDoC6T | 2026-09-11 |

## كيف تعمل الملفات المفقودة

الكود (`src/game/audio/AudioManager.ts`) يتجاهل بصمت أي ملف غير موجود
ويكتفي بالمؤثر الصوتي المولَّف (WebAudio) وحركة الشخصية - لا صفحة بيضاء
ولا خطأ ولا صوت روبوتي بديل أبدًا. إضافة أي ملف بالاسم الصحيح هنا يُفعِّله
فورًا بلا أي تعديل على الكود.

## توليد الملفات

شغّلي من جذر المشروع (تحتاج AZURE_SPEECH_KEY + AZURE_SPEECH_REGION، أو
ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID كمتغيرات بيئة):

```
npx tsx .claude/skills/arabic-kids-game-audio/scripts/run-all.ts
```

لا يُسجَّل أي API Key في هذا الملف أو في audio-manifest.json إطلاقًا -
فقط اسم المزوّد والصوت المُستخدَم.
