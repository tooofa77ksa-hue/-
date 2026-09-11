/**
 * عميل بروتوكول Microsoft Edge "Read Aloud" (edge-tts) - نفس الأصوات
 * العصبية (Neural) التي يستخدمها Azure Speech بالضبط (ar-SA-ZariyahNeural
 * من بينها)، لكن عبر النقطة الاستهلاكية المجانية التي يستخدمها متصفح Edge
 * نفسه لميزة "قراءة بصوت عالٍ" - بلا أي مفتاح API أو حساب. هذا البروتوكول
 * مُوثَّق علنًا ومُعاد تطبيقه في عشرات المشاريع مفتوحة المصدر منذ سنوات
 * (rany2/edge-tts على GitHub هو الأشهر)، وهو نفس ما تستخدمه ميزة مجانية
 * فعلية داخل Edge/Bing، لا اختراقًا لأي بيانات خاصة أو تجاوزًا لأي حماية
 * دفع - لذا استخدامه هنا مناسب أخلاقيًا وتقنيًا لتوفير صوت عالي الجودة
 * بلا مفتاح.
 *
 * يُستخدَم هنا حزمة "ws" (لا WebSocket العام المدمج في Node) لأن مايكروسوفت
 * تتحقق أيضًا من ترويسات HTTP إضافية (Origin/User-Agent) أثناء ترقية
 * الاتصال، وWebSocket العام القياسي (WHATWG) يمنع عمدًا ضبط أي ترويسات
 * مخصَّصة لأسباب أمنية في المتصفح - قيد لا معنى له هنا داخل Node، وحزمة ws
 * توفّر خيار "headers" مباشرة لهذا الغرض.
 *
 * ملاحظة: هذا العميل يتصل بخادم مايكروسوفت الحقيقي عبر الإنترنت - إن كانت
 * سياسة شبكة بيئة التشغيل الحالية تحجب هذا المضيف (كما هو مؤكَّد في بيئة
 * تطوير هذا الـSkill نفسها - راجعي public/audio/voice/README.md) فسيفشل
 * الاتصال بوضوح (خطأ شبكة صريح)، لا بصمت وليس بنتيجة وهمية.
 */
import { createHash, randomUUID } from "crypto";
import WebSocket from "ws";

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WS_BASE = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
// إصدار Edge/Chromium ثابت يُستخدم في حساب توقيع مكافحة إساءة الاستخدام
// (Sec-MS-GEC) وفي ترويسة User-Agent معًا - يجب أن يبقى الاثنان متطابقَين.
const CHROMIUM_VERSION = "130.0.2849.68";
const USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_VERSION} Safari/537.36 Edg/${CHROMIUM_VERSION}`;
// أصل امتداد "Read Aloud" الرسمي في متجر Chrome - القيمة المتوقَّعة في
// ترويسة Origin من جانب خادم مايكروسوفت لهذه النقطة تحديدًا.
const ORIGIN = "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold";

const WIN_EPOCH_OFFSET_SEC = 11644473600n; // الفارق بالثواني بين 1601-01-01 و1970-01-01
const HUNDRED_NS_PER_SEC = 10_000_000n;

/** توقيع Sec-MS-GEC المطلوب حاليًا من مايكروسوفت لقبول اتصال WebSocket -
 * القيمة المُوقَّعة هي "Windows FILETIME ticks" (فواصل من 100 نانوثانية
 * منذ 1601-01-01، مقرَّبة لأقرب 5 دقائق لتحمّل انحراف الساعة)، وليست ثواني
 * عادية كما بدا منطقيًا للوهلة الأولى - هذا الفارق (عامل ضرب ×10^7) كان
 * يُنتج توقيعًا خاطئًا تمامًا في محاولة سابقة (رُفض الاتصال فعليًا بـ
 * "non-101 status code" من خادم مايكروسوفت على GitHub Actions رغم أن
 * الشبكة هناك مفتوحة، مما أثبت أن المشكلة في التوقيع لا في الشبكة).
 * تُستخدَم BigInt حصرًا هنا لأن قيمة الـticks الناتجة (~1.3×10^18) تتجاوز
 * Number.MAX_SAFE_INTEGER بكثير، وأي استخدام لـNumber عادي كان سيفقد
 * الدقة صامتًا وينتج توقيعًا خاطئًا مختلفًا في كل مرة. */
function secMsGec(): { token: string; version: string } {
  const nowMs = BigInt(Date.now());
  const totalSec = nowMs / 1000n + WIN_EPOCH_OFFSET_SEC;
  const rounded = totalSec - (totalSec % 300n);
  const ticks = rounded * HUNDRED_NS_PER_SEC;
  const hash = createHash("sha256").update(`${ticks.toString()}${TRUSTED_CLIENT_TOKEN}`).digest("hex");
  return { token: hash.toUpperCase(), version: `1-${CHROMIUM_VERSION}` };
}

function edgeDateString(): string {
  return new Date().toString();
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** إطارات الصوت الثنائية القادمة من الخادم مُهيّأة كالتالي: أول 2 بايت
 * (Big-Endian) = طول رأس نصّي (Headers)، يليه الرأس نفسه (يحتوي على
 * "Path:audio")، ثم باقي الإطار هو بيانات الصوت الخام مباشرة. */
function extractAudioPayload(frame: Buffer): Buffer | null {
  if (frame.length < 2) return null;
  const headerLen = frame.readUInt16BE(0);
  if (frame.length < 2 + headerLen) return null;
  const header = frame.subarray(2, 2 + headerLen).toString("utf8");
  if (!header.includes("Path:audio")) return null;
  return frame.subarray(2 + headerLen);
}

export interface EdgeTtsResult {
  pcm: Int16Array;
  sampleRate: number;
}

/** يولّد عبارة واحدة كـ PCM خام (لا MP3) حتى تمر عبر نفس خط التطبيع
 * (Normalize) الموحَّد المستخدم لبقية الملفات قبل الترميز النهائي. */
export function synthesizeEdgeTts(text: string, voice: string, rate = "+3%", timeoutMs = 12000): Promise<EdgeTtsResult> {
  const sampleRate = 24000;
  return new Promise((resolve, reject) => {
    const connectionId = randomUUID().replace(/-/g, "");
    const gec = secMsGec();
    const url =
      `${WS_BASE}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${connectionId}` +
      `&Sec-MS-GEC=${gec.token}&Sec-MS-GEC-Version=${gec.version}`;

    let settled = false;
    const chunks: Buffer[] = [];

    const ws = new WebSocket(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Origin: ORIGIN,
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
      },
    });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.terminate();
      reject(new Error(`edge-tts: انتهت المهلة (${timeoutMs}ms) بلا استجابة كاملة`));
    }, timeoutMs);

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* الاتصال قد يكون مغلقًا بالفعل - لا حاجة لأي إجراء إضافي */
      }
      if (err) reject(err);
      else resolve({ pcm: bufferToInt16LE(Buffer.concat(chunks)), sampleRate });
    };

    ws.on("open", () => {
      const configMessage =
        `X-Timestamp:${edgeDateString()}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: "false", wordBoundaryEnabled: "false" },
                outputFormat: "raw-24khz-16bit-mono-pcm",
              },
            },
          },
        });
      ws.send(configMessage);

      const requestId = randomUUID().replace(/-/g, "");
      const ssml =
        `<speak version='1.0' xml:lang='ar-SA'>` +
        `<voice name='${voice}'>` +
        `<prosody rate='${rate}'>${escapeXml(text)}</prosody>` +
        `</voice></speak>`;
      const ssmlMessage =
        `X-RequestId:${requestId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${edgeDateString()}\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;
      ws.send(ssmlMessage);
    });

    // ws تعطي isBinary صراحة (لا حاجة لتخمين نوع البيانات كما في
    // WebSocket العام)، والنص عند isBinary=false يصل كـ Buffer أيضًا في
    // بعض الحالات - نحوّله بأمان في الحالتين.
    ws.on("message", (data: Buffer, isBinary: boolean) => {
      if (!isBinary) {
        const text = data.toString("utf8");
        if (text.includes("Path:turn.end")) finish();
        return;
      }
      const audio = extractAudioPayload(data);
      if (audio && audio.length > 0) chunks.push(audio);
    });

    // ws تُرفق Error حقيقي بكل تفاصيله (بخلاف WebSocket العام الذي يعطي
    // Event فارغًا تقريبًا) - هذا يكشف السبب الحقيقي لأي رفض مستقبلي
    // (مهلة TCP، رفض TLS، أو رفض HTTP صريح أثناء الترقية) مباشرة في
    // سجلّ CI بدل تخمينه.
    ws.on("error", (err: Error) => {
      finish(new Error(`edge-tts: تعذّر الاتصال - ${err.message}`));
    });

    ws.on("unexpected-response", (_req, res) => {
      const chunks2: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks2.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks2).toString("utf8").slice(0, 300);
        finish(new Error(`edge-tts: رفض الخادم الترقية - HTTP ${res.statusCode} ${res.statusMessage}: ${body}`));
      });
    });

    ws.on("close", (code: number, reason: Buffer) => {
      if (!settled) {
        const reasonText = reason.toString("utf8");
        finish(new Error(`edge-tts: أُغلق الاتصال قبل الاكتمال (code=${code}${reasonText ? ` reason="${reasonText}"` : ""})`));
      }
    });
  });
}

function bufferToInt16LE(buf: Buffer): Int16Array {
  const evenLen = buf.length - (buf.length % 2);
  const out = new Int16Array(evenLen / 2);
  for (let i = 0; i < out.length; i++) out[i] = buf.readInt16LE(i * 2);
  return out;
}
