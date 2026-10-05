# -*- coding: utf-8 -*-
"""تهيئة صور الشواهد للطباعة — تصحيحٌ ضوئي لا تعديلَ محتوى.

الصور مأخوذةٌ بجوالٍ في ممرٍّ أو فصلٍ إضاءته صفراء، فتخرج داكنةً
مائلةً إلى الصفرة. وصفحةٌ تُعرض على أولياء الأمور تُقرأ من صورها قبل
سطورها: صورةٌ باهتة تُفهم إهمالًا، وهي ليست كذلك.

فالمعالجة هنا ضوئيةٌ بحتة — مستويات، وتوازن أبيض، وحدّة — ولا يُضاف
إلى الصورة شيء ولا يُحذف منها شيء ولا تُقصّ حوافّها. وما حُجب من
أسماءٍ ووجوه حُجب قبل هذه المرحلة، في ملفات «public/shahid» نفسها.

    python3 scripts/reports/polish-photos.py
"""
import os
import glob
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

SRC = 'public/shahid'
OUT = '.report-out/photos'

# صورٌ عولجت حجبًا من قبل: تُنسخ كما هي كي لا يُضعف التحسينُ تبقيعَها
ALREADY = {'lawhat-taaziz.jpg', 'tashrif-maamal.jpg', 'tashrif-shahadatan.jpg',
           'sunduq-amanat.jpg'}


def autolevel(im, low=0.4, high=99.6):
    """مدُّ المستويات لكل قناة على حدة، فيزول ميل الإضاءة إلى الصفرة."""
    a = np.asarray(im).astype(np.float32)
    for c in range(3):
        lo, hi = np.percentile(a[:, :, c], (low, high))
        if hi - lo < 1:
            continue
        a[:, :, c] = np.clip((a[:, :, c] - lo) * (255.0 / (hi - lo)), 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def lift_shadows(im, amount=0.18):
    """رفعُ الظلال وحدها: الممرّات مظلمة، والسقوف مضيئة — فلا يُحرق الضوء."""
    a = np.asarray(im).astype(np.float32) / 255.0
    lifted = a ** (1.0 - amount)
    return Image.fromarray((lifted * 255).astype(np.uint8))


def polish(im):
    im = autolevel(im)
    im = lift_shadows(im)
    im = ImageEnhance.Color(im).enhance(1.10)
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=85, threshold=3))
    return im


os.makedirs(OUT, exist_ok=True)
for path in sorted(glob.glob(f'{SRC}/*.jpg')):
    name = os.path.basename(path)
    im = Image.open(path).convert('RGB')
    if name not in ALREADY:
        im = polish(im)
    im.thumbnail((1600, 1600), Image.LANCZOS)
    im.save(os.path.join(OUT, name), quality=90, optimize=True, progressive=True)
    print('✓', name, im.size)
