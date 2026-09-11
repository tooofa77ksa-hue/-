/**
 * يولّد كل مؤثرات SFX القابلة للتوليف البرمجي (12 من أصل 12) كملفات MP3
 * حقيقية داخل public/audio/sfx/، بنفس الأسلوب الصوتي المستخدم أصلًا في
 * src/game/audio/sfxSynth.ts (نغمات + ضجيج قصير بمغلّف لطيف) لكن مُصدَّرة
 * كملف بدل تشغيلها حيّة عبر WebAudio.
 *
 * applause_short (تصفيق): تقريب برمجي (عشرات نقرات ضجيج قصيرة جدًا
 * addClapBurst بتوقيت عشوائي وكثافة صاعدة-هابطة تحاكي بداية ونهاية تصفيق
 * حقيقي) - ليس تسجيلًا حقيقيًا، لكنه أفضل من مؤثر واحد بسيط، ويمكن
 * استبداله لاحقًا بوضع ملف حقيقي يدويًا في نفس المسار (الأولوية دائمًا
 * لملف موجود مسبقًا - راجعي منطق --force أدناه).
 *
 * تشغيل مباشر: npx tsx .claude/skills/arabic-kids-game-audio/scripts/generate-sfx.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { addClapBurst, addNoiseBurst, addTone, createBuffer, toInt16 } from "./lib/pcm";
import { encodeMp3 } from "./lib/mp3";
import { normalizePeakInt16, SFX_TARGET_PEAK } from "./lib/normalize";
import { SFX_SPECS } from "./lib/audioTable";
import { recordGeneration } from "./lib/log";
import { assertProjectRoot, projectPath } from "./lib/paths";

export interface SfxGenResult {
  id: string;
  status: "generated" | "skipped-not-synthesizable" | "skipped-exists";
  bytes?: number;
}

type Builder = (buf: Float32Array) => void;

/** كل دالة تبني مؤثرًا واحدًا بالجمع فوق buf فارغ بالطول المناسب. الأسلوب
 * (نغمات قصيرة، ذروة معتدلة 0.25-0.45، بلا Buzzer) مطابق لروح
 * sfxSynth.ts الحالي - راجعي هذا الملف إن رغبتِ تعديل الطابع الصوتي. */
const BUILDERS: Record<string, { duration: number; build: Builder }> = {
  button_pop: {
    duration: 0.18,
    build: (buf) => addTone(buf, 0, 480, 0.1, "sine", 0.4, 760),
  },
  correct_pop: {
    duration: 0.25,
    build: (buf) => {
      addTone(buf, 0, 500, 0.12, "sine", 0.45, 820);
      addTone(buf, 0.05, 750, 0.12, "triangle", 0.2, 1000);
    },
  },
  sparkle: {
    duration: 0.35,
    build: (buf) => {
      addTone(buf, 0, 900, 0.12, "triangle", 0.3, 1300);
      addTone(buf, 0.08, 1300, 0.15, "sine", 0.25, 1700);
    },
  },
  star_twinkle: {
    duration: 0.42,
    build: (buf) => {
      addTone(buf, 0, 1046, 0.18, "sine", 0.3);
      addTone(buf, 0.08, 1318, 0.18, "sine", 0.3);
      addTone(buf, 0.16, 1568, 0.18, "sine", 0.3);
    },
  },
  gem_collect: {
    duration: 0.3,
    build: (buf) => {
      addTone(buf, 0, 660, 0.1, "sine", 0.35, 990);
      addTone(buf, 0.06, 990, 0.15, "sine", 0.3, 1320);
    },
  },
  wrong_soft: {
    duration: 0.25,
    build: (buf) => addTone(buf, 0, 260, 0.18, "sine", 0.26, 170),
  },
  rocket_charge: {
    duration: 0.3,
    build: (buf) => {
      addTone(buf, 0, 440, 0.12, "triangle", 0.35);
      addTone(buf, 0.07, 660, 0.12, "triangle", 0.35);
      addTone(buf, 0.14, 880, 0.12, "triangle", 0.35);
    },
  },
  rocket_launch: {
    duration: 0.75,
    build: (buf) => {
      addNoiseBurst(buf, 0, 0.6, 0.28);
      addTone(buf, 0, 90, 0.7, "sawtooth", 0.35, 480);
    },
  },
  magic_whoosh: {
    duration: 0.55,
    build: (buf) => {
      addTone(buf, 0, 220, 0.5, "sine", 0.3, 880);
      addNoiseBurst(buf, 0, 0.35, 0.14);
    },
  },
  treasure_open: {
    duration: 0.55,
    build: (buf) => {
      addTone(buf, 0, 140, 0.12, "sine", 0.32, 90);
      addTone(buf, 0.12, 523, 0.14, "triangle", 0.28);
      addTone(buf, 0.2, 659, 0.14, "triangle", 0.28);
      addTone(buf, 0.28, 784, 0.14, "triangle", 0.28);
      addTone(buf, 0.36, 1046, 0.16, "triangle", 0.3);
    },
  },
  celebration: {
    duration: 0.65,
    build: (buf) => {
      [523, 659, 784, 988, 1175].forEach((freq, i) => addTone(buf, i * 0.06, freq, 0.14, "triangle", 0.28));
      addNoiseBurst(buf, 0.3, 0.25, 0.1);
    },
  },
  applause_short: {
    duration: 0.9,
    build: (buf) => {
      // كثافة صاعدة (0..0.25s) ثم هضبة (0.25..0.55s) ثم هابطة (0.55..0.85s) -
      // نفس شكل تصفيق حقيقي يبدأ متناثرًا، يتكثّف، ثم يخفت.
      const claps = 55;
      for (let i = 0; i < claps; i++) {
        const t = Math.random() * 0.85;
        const density = t < 0.25 ? t / 0.25 : t < 0.55 ? 1 : Math.max(0, 1 - (t - 0.55) / 0.3);
        if (Math.random() > 0.35 + density * 0.5) continue;
        addClapBurst(buf, t, 0.12 + Math.random() * 0.1);
      }
    },
  },
};

export function generateSfx(force = false): SfxGenResult[] {
  assertProjectRoot();
  const sfxDir = projectPath("public/audio/sfx");
  if (!existsSync(sfxDir)) mkdirSync(sfxDir, { recursive: true });

  const results: SfxGenResult[] = [];

  for (const spec of SFX_SPECS) {
    const outPath = projectPath("public/audio/sfx", `${spec.id}.mp3`);

    if (!spec.synthesizable) {
      results.push({ id: spec.id, status: "skipped-not-synthesizable" });
      continue;
    }

    if (existsSync(outPath) && !force) {
      results.push({ id: spec.id, status: "skipped-exists" });
      continue;
    }

    const builder = BUILDERS[spec.id];
    if (!builder) {
      throw new Error(`[generate-sfx] لا يوجد Builder لـ ${spec.id} رغم أنه synthesizable=true - تحقق من audioTable.ts`);
    }

    const buf = createBuffer(builder.duration + 0.1);
    builder.build(buf);
    const normalized = normalizePeakInt16(toInt16(buf), SFX_TARGET_PEAK);
    const mp3 = encodeMp3(normalized);
    writeFileSync(outPath, mp3);

    recordGeneration({
      id: spec.id,
      kind: "sfx",
      provider: "synth-offline-pcm",
      generatedAt: new Date().toISOString(),
    });

    results.push({ id: spec.id, status: "generated", bytes: mp3.length });
  }

  return results;
}

// يشتغل مباشرة إن استُدعي هذا الملف كسكربت رئيسي (وليس مستورَدًا من run-all.ts)
if (import.meta.url === `file://${process.argv[1]}`) {
  const force = process.argv.includes("--force");
  const results = generateSfx(force);
  console.log("\n[generate-sfx] النتيجة:");
  for (const r of results) {
    const label =
      r.status === "generated"
        ? `✓ تم التوليد (${r.bytes} bytes)`
        : r.status === "skipped-exists"
          ? "↷ موجود مسبقًا (استخدمي --force لإعادة التوليد)"
          : "⨯ يحتاج مصدرًا خارجيًا - لم يُولَّد";
    console.log(`  ${r.id.padEnd(16)} ${label}`);
  }
}
