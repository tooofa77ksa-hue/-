import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setCrf(16);
Config.setConcurrency(null);

// جودة إخراج عالية لعرض وزاري (MP4, H.264, معدل بت مرتفع عبر CRF منخفض)
Config.setChromiumOpenGlRenderer("angle");

// استخدام Chromium المثبَّت مسبقًا في هذه البيئة (سياسة الشبكة تمنع تنزيل
// Remotion لنسخته الخاصة من remotion.media) - بلا أي تأثير على الرندر خارج
// هذه البيئة، إذ يُستخدم فقط إن وُجد المسار.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}

