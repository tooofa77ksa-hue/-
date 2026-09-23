# -*- coding: utf-8 -*-
"""
فحص الباركود الملوّن: هل يُقرأ فعلًا؟

اللون في الباركود مخاطرة حقيقية: الماسح لا يقرأ لونًا بل فرق إضاءة
بين المربّع والخلفية، وباركود جميل لا يُقرأ يعني استجابة طالبة ضاعت.
فلا يكفي أن يُولَّد الباركود بلون: يُفكّ هنا بفاكٍّ مستقل (OpenCV)
ويُقارَن الناتج بالرابط الأصلي، ويُقاس تباينه على الأبيض.
"""
import json
import sys

import cv2
import numpy as np

results = []


def check(name, ok, detail=''):
    results.append(ok)
    print(('  ✓ ' if ok else '  ✗ ') + name + (' — ' + detail if detail else ''))


def luminance(hex_color):
    """الإضاءة النسبية حسب WCAG."""
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


cases = json.load(open(sys.argv[1], encoding='utf-8'))
detector = cv2.QRCodeDetector()

print('\n١) فكّ الباركود الملوّن')
for case in cases:
    raw = np.frombuffer(bytes(case['png']), dtype=np.uint8)
    image = cv2.imdecode(raw, cv2.IMREAD_COLOR)
    decoded, _points, _straight = detector.detectAndDecode(image)
    check('«%s» يُفكّ ويطابق رابطه' % case['title'],
          decoded == case['url'],
          decoded[:46] + ('…' if len(decoded) > 46 else '') if decoded else 'لم يُفكّ')

print('\n٢) التباين على أبيض')
# ٧:١ حدّ WCAG الأعلى للنص، والباركود يحتاج دونه بكثير — فهو هامش واسع
for color in sorted({c['color'] for c in cases}):
    ratio = (1.0 + 0.05) / (luminance(color.lstrip('#')) + 0.05)
    check('%s تباينه كافٍ' % color, ratio >= 7.0, '%.1f:1' % ratio)

failed = results.count(False)
print('\n%d فحصًا، %d ساقطًا' % (len(results), failed))
sys.exit(1 if failed else 0)
