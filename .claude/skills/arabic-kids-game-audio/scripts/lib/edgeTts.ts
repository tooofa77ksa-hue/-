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
 * ملاحظة مهمة: هذا العميل يتصل بخادم مايكروسوفت الحقيقي عبر الإنترنت -
 * إن كانت سياسة شبكة بيئة التشغيل الحالية تحجب هذا المضيف (كما هو مؤكَّد
 * في بيئة تطوير هذا الـSkill نفسها - راجعي public/audio/voice/README.md)
 * فسيفشل الاتصال بوضوح (خطأ شبكة صريح)، لا بصمت وليس بنتيجة وهمية.
 */
import { createHash, randomUUID } from "crypto";

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WS_BASE = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
// إصدار Edge/Chromium ثابت يُستخدم في حساب توقيع مكافحة إساءة الاستخدام
// (Sec-MS-GEC) الذي أضافته مايكروسوفت لاحقًا - قيمة معروفة ومُستخدَمة على
// نطاق واسع في التطبيقات المعاد بناؤها لهذا البروتوكول.
const CHROMIUM_VERSION = "130.0.2849.68";
const WIN_EPOCH_OFFSET_SEC = 11644473600; // الفارق بالثواني بين 1601-01-01 و1970-01-01

function secMsGec(): { token: string; version: string } {
  const nowSec = Date.now() / 1000 + WIN_EPOCH_OFFSET_SEC;
  const ticks = Math.floor(nowSec / 300) * 300; // تقريب لأقرب 5 دقائق (تسامح انحراف الساعة)
  const hash = createHash("sha256").update(`${Math.round(ticks)}${TRUSTED_CLIENT_TOKEN}`).digest("hex");
  return { token: hash.toUpperCase(), version: `1-${CHROMIUM_VERSION}` };
}

function edgeDateString(): string {
  return new Date().toString();
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function frameToBuffer(data: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (ArrayBuffer.isView(data as ArrayBufferView)) {
    const view = data as ArrayBufferView;
    return Buffer.from(view.buffer, view.byteOffset, view.byteLength);
  }
  const maybeBlob = data as { arrayBuffer?: () => Promise<ArrayBuffer> };
  if (maybeBlob && typeof maybeBlob.arrayBuffer === "function") {
    return Buffer.from(await maybeBlob.arrayBuffer());
  }
  throw new Error("edge-tts: إطار WebSocket ثنائي بصيغة غير مدعومة");
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
    let ws: WebSocket;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        /* لا شيء نفعله - نتجاهل هذا الإطار المتأخر، تجميع الصوت يبقى صحيحًا */
      }
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

    try {
      ws = new WebSocket(url);
    } catch (err) {
      clearTimeout(timer);
      reject(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    ws.addEventListener("open", () => {
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

    ws.addEventListener("message", (event: MessageEvent) => {
      if (typeof event.data === "string") {
        if (event.data.includes("Path:turn.end")) finish();
        return;
      }
      frameToBuffer(event.data)
        .then((buf) => {
          const audio = extractAudioPayload(buf);
          if (audio && audio.length > 0) chunks.push(audio);
        })
        .catch(() => {
          /* إطار غير متوقع - يُتجاهَل، الإطارات الصحيحة الأخرى تكفي لبناء الصوت */
        });
    });

    ws.addEventListener("error", () => {
      finish(new Error("edge-tts: تعذّر الاتصال (خطأ شبكة أو رفض من الخادم)"));
    });

    ws.addEventListener("close", (event: CloseEvent) => {
      if (!settled) finish(new Error(`edge-tts: أُغلق الاتصال قبل الاكتمال (code=${event.code})`));
    });
  });
}

function bufferToInt16LE(buf: Buffer): Int16Array {
  const evenLen = buf.length - (buf.length % 2);
  const out = new Int16Array(evenLen / 2);
  for (let i = 0; i < out.length; i++) out[i] = buf.readInt16LE(i * 2);
  return out;
}
