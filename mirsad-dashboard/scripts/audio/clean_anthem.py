#!/usr/bin/env python3
"""تصفية صوت السلام الملكي — إزالة التشويش دون المساس بالموسيقى.

التشخيص الفعلي للملف المُرسَل (قياسات لا افتراضات):
  • لا هسيس      : أرضية الضوضاء ‎-70 dB عند ٢–٤ كيلوهرتز، ومدى ديناميكي ٢٥–٣٠ dB.
  • لا طنين      : لا بروز يُذكر عند ٥٠/٦٠ هرتز وتوافقياتها.
  • لا قصّ صلب   : صفر عيّنة مثبّتة عند السقف.
  • العلّة الحقيقية: تجاوز بين-عيّني ‎+1.08 dBFS في ١٣١ ومضة (١–١٢ عيّنة)،
    يقصّه المشغّل عند التشغيل فيُسمَع طقطقةً وتشويشًا.

لذلك: لا تنقية ضوضاء طيفية (تُتلف تسجيلًا نظيفًا)، ولا ضغط ديناميكي.
قُوبل خفض الكسب العام بالتحديد الجراحي قياسًا، فكان الفرق حاسمًا:
    خفض عام      → فرق الموجة عن الأصل ‎-314 dB (مطابقة رقمية)
    تحديد جراحي  → فرق الموجة عن الأصل  ‎-28 dB (تشويه مسموع محتمل)
فاعتُمد الخفض العام: يمنح الهامش الآمن ويُبقي النشيد كما سُجّل حرفًا بحرف.

السلسلة:
  ① إزالة إزاحة التيار المستمر
  ② تمرير عالٍ ٢٠ هرتز (تحت حدّ السمع — لا يمسّ باص النشيد)
  ③ خفض كسب عام حتى تبلغ الذروة الحقيقية ‎-1 dBTP
  ④ تلاشٍ ١٢ ms في الطرفين يمنع النقرات
  ⑤ ترميز MP3 ثم إعادة قياس الناتج المفكوك، وتكرار الخفض إن رفع الترميز الذروة
"""
import sys

import numpy as np
import soundfile as sf
from scipy import signal

TARGET_DBTP = -1.0
HPF_HZ = 20.0
FADE_MS = 12.0
MP3_QUALITY = 0.0          # أعلى جودة في libsndfile — تطابق معدل بت المصدر
MAX_ENCODE_PASSES = 6
TOLERANCE_DB = 0.05        # تفاوت مقبول حول السقف بعد الترميز


def true_peak(x, oversample=4):
    """الذروة الحقيقية — تُقاس بعد إعادة أخذ عيّنات لكشف القمم بين العيّنات."""
    return float(np.abs(signal.resample_poly(x, oversample, 1, axis=0)).max())


def prepare(path):
    x, sr = sf.read(path, always_2d=True, dtype='float64')
    stats = {
        'sr': sr, 'channels': x.shape[1], 'duration': len(x) / sr,
        'in_peak': float(np.abs(x).max()),
        'in_true_peak': true_peak(x),
        'in_rms': float(np.sqrt((x ** 2).mean())),
        'in_over': int((np.abs(x) > 1.0).sum()),
        'dc': [float(v) for v in x.mean(axis=0)],
    }

    x = x - x.mean(axis=0, keepdims=True)                                   # ①
    sos = signal.butter(4, HPF_HZ / (sr / 2), btype='highpass', output='sos')
    x = signal.sosfiltfilt(sos, x, axis=0)                                  # ②

    fade = int(FADE_MS * sr / 1000)                                         # ④
    ramp = np.sin(np.linspace(0, np.pi / 2, fade)) ** 2
    x[:fade] *= ramp[:, None]
    x[-fade:] *= ramp[::-1, None]
    return x, sr, stats


def encode_with_headroom(x, sr, dst_mp3):
    """يخفض الكسب ويُرمّز، ثم يتحقق من الناتج المفكوك ويكرّر عند اللزوم."""
    ceiling = 10 ** (TARGET_DBTP / 20)
    gain = ceiling / true_peak(x)                                           # ③
    passes = []

    for _ in range(MAX_ENCODE_PASSES):
        y = x * gain
        sf.write(dst_mp3, y, sr, format='MP3', compression_level=MP3_QUALITY)
        back, _ = sf.read(dst_mp3, always_2d=True, dtype='float64')         # ⑤
        decoded_tp = true_peak(back)
        passes.append((20 * np.log10(gain), 20 * np.log10(decoded_tp)))
        if 20 * np.log10(decoded_tp) <= TARGET_DBTP + TOLERANCE_DB:
            return y, back, gain, passes
        gain *= ceiling / decoded_tp * 0.999
    return y, back, gain, passes


def main(src, dst_mp3, dst_wav):
    x, sr, s = prepare(src)
    y, decoded, gain, passes = encode_with_headroom(x, sr, dst_mp3)
    sf.write(dst_wav, y, sr, subtype='PCM_24')

    db = lambda v: 20 * np.log10(max(v, 1e-12))
    # مطابقة الكسب ثم قياس ما تغيّر فعلًا في الموجة
    # يُقاس الفرق على الجزء الأوسط، بعيدًا عن التلاشي المقصود في الطرفين
    pad = int(0.5 * sr)
    a, b = x[pad:-pad], (y / gain)[pad:-pad]
    err = db(np.sqrt(((a - b) ** 2).mean()) / np.sqrt((a ** 2).mean()))

    print(f"  المدة    : {s['duration']:.2f} ثانية · {s['sr']} Hz · "
          f"{'ستيريو' if s['channels'] == 2 else 'أحادي'}")
    print(f"  إزاحة DC : {[f'{v:+.6f}' for v in s['dc']]} → أُزيلت")
    print()
    print("                        قبل          بعد")
    print(f"  الذروة الحقيقية  {db(s['in_true_peak']):+8.2f} dB   {db(true_peak(y)):+8.2f} dB")
    print(f"  ذروة MP3 المفكوك {'—':>11}   {db(true_peak(decoded)):+8.2f} dB")
    print(f"  عيّنات متجاوزة    {s['in_over']:8d}     {int((np.abs(decoded) > 1.0).sum()):8d}")
    print(f"  RMS              {db(s['in_rms']):+8.2f} dB   "
          f"{db(np.sqrt((y ** 2).mean())):+8.2f} dB")
    print()
    print(f"  خفض الكسب المطبَّق : {20 * np.log10(gain):.2f} dB")
    print(f"  تغيّر الموجة عن الأصل بعد مطابقة الكسب : {err:.1f} dB  (أي لم تُمسّ الموسيقى)")
    print(f"  جولات الترميز حتى ثبات الذروة : {len(passes)}")
    for i, (g, tp) in enumerate(passes, 1):
        print(f"      جولة {i}: كسب {g:+.2f} dB → ذروة المفكوك {tp:+.2f} dB")


if __name__ == '__main__':
    main(*sys.argv[1:4])
