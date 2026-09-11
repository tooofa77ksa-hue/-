/** ترميز PCM (Int16) إلى MP3 حقيقي عبر مُرمِّز JavaScript خالص
 * (@breezystack/lamejs) - بلا الحاجة لأي أداة خارجية مثل ffmpeg، وهو ما
 * يجعل هذا التوليد يعمل داخل أي بيئة Node عادية. */
import { Mp3Encoder } from "@breezystack/lamejs";
import { SAMPLE_RATE } from "./pcm";

export function encodeMp3(samples: Int16Array, sampleRate = SAMPLE_RATE, kbps = 128): Buffer {
  const encoder = new Mp3Encoder(1, sampleRate, kbps);
  const chunks: Buffer[] = [];
  const blockSize = 1152;
  for (let i = 0; i < samples.length; i += blockSize) {
    const chunk = samples.subarray(i, i + blockSize);
    const mp3Chunk = encoder.encodeBuffer(chunk);
    if (mp3Chunk.length > 0) chunks.push(Buffer.from(mp3Chunk));
  }
  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(Buffer.from(tail));
  return Buffer.concat(chunks);
}
