/**
 * اختبار دخان حقيقي (Smoke Test) لواجهة /play عبر متصفح Chromium فعلي
 * (Playwright) ضد الحزمة المبنية فعليًا (dist/ الناتجة من npm run build) -
 * وليس ضد كود المصدر مباشرة، حتى يطابق تمامًا ما يراه المستخدم النهائي.
 *
 * يتحقق من:
 *   1) لا أخطاء JavaScript في الصفحة (Console errors / Page errors).
 *   2) كل ملفات الصوت (SFX + Voice) المذكورة في audio-manifest.json كـ
 *      "exists: true" تُجلَب فعليًا بنجاح (HTTP 200) من الحزمة المبنية.
 *   3) شاشة اختيار اللعبة (/#/play) تُعرَض بلا انهيار.
 *   4) الدخول إلى إحدى الألعاب الثلاث يعرض واجهة اللعبة (Canvas + شريط
 *      علوي) بلا انهيار - بغضّ النظر عن توفر بيانات Firestore الحيّة من
 *      عدمه (حالة "جارٍ التحميل" مقبولة، الانهيار غير مقبول).
 *
 * تشغيل: npx tsx .claude/skills/arabic-kids-game-audio/scripts/test-play.ts
 * (يفترض أن dist/ مبنية بالفعل عبر npm run build قبل تشغيله)
 *
 * --local: يستخدم Chromium مثبَّتًا محليًا (لبيئة تطوير هذا الـSkill نفسها
 * فقط) بدل الاعتماد على `playwright install` العادي الذي تستخدمه بيئات
 * CI الطبيعية.
 */
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { chromium } from "playwright";
import { assertProjectRoot, projectPath } from "./lib/paths";

function startPreviewServer(): Promise<{ url: string; proc: ChildProcessWithoutNullStreams }> {
  return new Promise((resolve, reject) => {
    // يُستدعى ثنائي vite مباشرة من node_modules (لا عبر npx) حتى يكون
    // proc.pid هو عملية vite نفسها فعليًا - استدعاؤه عبر npx ينشئ عملية
    // غلاف إضافية تجعل proc.kill() لاحقًا يقتل الغلاف فقط ويترك خادم
    // المعاينة الفعلي يعمل في الخلفية (سبب تسرّب عملية لوحظ فعليًا أثناء
    // تطوير هذا الملف). العملية هنا غير منفصلة (لا detached) عمدًا - تكفي
    // proc.kill() العادية بعد إصلاح مشكلة الغلاف، وتفادي detached يتفادى
    // أي تعقيد إضافي غير ضروري حول التحكم بمجموعات العمليات.
    const viteBin = projectPath("node_modules/.bin/vite");
    const proc = spawn(viteBin, ["preview", "--port", "4173", "--strictPort"], {
      cwd: projectPath("."),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let settled = false;
    let buffered = "";
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill("SIGKILL");
        reject(
          new Error(
            `test-play: vite preview لم يبدأ خلال 30 ثانية. الناتج المُلتقَط حتى الآن:\n${buffered || "(لا شيء)"}`
          )
        );
      }
    }, 30000);

    const onData = (data: Buffer) => {
      const text = data.toString();
      buffered += text;
      const match = text.match(/Local:\s+(http:\/\/[^\s]+)/);
      if (match && !settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ url: match[1], proc });
      }
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`test-play: تعذّر تشغيل vite preview: ${err.message}`));
      }
    });
    proc.on("exit", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`test-play: vite preview خرج مبكرًا برمز ${code}. الناتج:\n${buffered || "(لا شيء)"}`));
      }
    });
  });
}

interface CheckResult {
  ok: boolean;
  report: string[];
}

export async function testPlay(localChromiumPath?: string): Promise<CheckResult> {
  assertProjectRoot();
  const report: string[] = [];
  let ok = true;

  const { url, proc } = await startPreviewServer();
  report.push(`✓ خادم المعاينة يعمل على ${url}`);

  const browser = await chromium.launch(localChromiumPath ? { executablePath: localChromiumPath } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("ERR_CONNECTION_RESET")) {
        pageErrors.push(msg.text());
      }
    });

    // 1) فحص ملفات الصوت المذكورة في المانفست فعليًا من الحزمة المبنية
    const manifestPath = projectPath("public/audio/audio-manifest.json");
    const manifest = JSON.parse(await import("fs").then((fs) => fs.readFileSync(manifestPath, "utf8")));
    const audioFiles: string[] = [
      ...Object.values(manifest.voice as Record<string, { exists: boolean; file: string | null }>)
        .filter((v) => v.exists && v.file)
        .map((v) => v.file as string),
      ...Object.values(manifest.sfx as Record<string, { exists: boolean; file: string | null }>)
        .filter((s) => s.exists && s.file)
        .map((s) => s.file as string),
    ];

    await page.goto(`${url}#/play`, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    let audioOk = 0;
    for (const file of audioFiles) {
      const res = await page.evaluate(async (f) => {
        try {
          const r = await fetch(f);
          return { status: r.status, size: (await r.arrayBuffer()).byteLength };
        } catch (e) {
          return { status: 0, size: 0, error: String(e) };
        }
      }, file);
      if (res.status === 200 && res.size > 200) {
        audioOk++;
      } else {
        ok = false;
        report.push(`✗ فشل جلب ${file}: ${JSON.stringify(res)}`);
      }
    }
    report.push(`${audioOk === audioFiles.length ? "✓" : "✗"} ملفات الصوت: ${audioOk}/${audioFiles.length} تُجلَب بنجاح`);

    // 2) شاشة اختيار اللعبة تُعرَض
    const modeSelect = await page.$(".mode-select, .mode-select__grid");
    if (modeSelect) report.push("✓ شاشة اختيار اللعبة تُعرَض");
    else {
      ok = false;
      report.push("✗ شاشة اختيار اللعبة لم تُعرَض");
    }

    // 3) الدخول إلى لعبة واحدة على الأقل يعرض واجهة اللعبة بلا انهيار
    await page.goto(`${url}#/play/rocket_mission`, { waitUntil: "load" });
    await page.waitForTimeout(2000);
    const gameScreen = await page.$(".game-screen, .game-screen__empty");
    if (gameScreen) report.push("✓ واجهة لعبة الصاروخ تُعرَض بلا انهيار");
    else {
      ok = false;
      report.push("✗ واجهة لعبة الصاروخ لم تُعرَض");
    }

    if (pageErrors.length > 0) {
      ok = false;
      report.push(`✗ أخطاء JavaScript في الصفحة: ${JSON.stringify(pageErrors)}`);
    } else {
      report.push("✓ لا أخطاء JavaScript في الصفحة");
    }
  } finally {
    await browser.close();
    proc.kill("SIGKILL");
  }

  return { ok, report };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const localFlagIndex = process.argv.indexOf("--local");
  const localChromiumPath = localFlagIndex !== -1 ? "/opt/pw-browsers/chromium" : undefined;
  testPlay(localChromiumPath).then(({ ok, report }) => {
    console.log("\n[test-play] النتيجة:");
    report.forEach((line) => console.log(`  ${line}`));
    if (!ok) {
      console.error("\n[test-play] فشل واحد أو أكثر من الفحوصات أعلاه.");
      process.exitCode = 1;
    } else {
      console.log("\n[test-play] ✓ كل الفحوصات نجحت.");
    }
  });
}
