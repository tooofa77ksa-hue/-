"""تطبيع خيارات الإجابة الواردة في ملفات Excel.

خيارات القياس ثلاثة فقط في المصدر، لكنها كُتبت بأخطاء إملائية متعددة
أثناء الإدخال. تُوحَّد هنا للتحليل فقط، مع الاحتفاظ دائمًا بالقيمة الخام
كما وردت في الملف الأصلي.
"""
from arabic_name import normalize

# المعرّف، النص المعتمد، الدرجة على مقياس ثلاثي
OPTIONS = [
    {'id': 'agree_fully', 'label': 'أوافق تماماً', 'score': 3},
    {'id': 'agree_somewhat', 'label': 'أوافق إلى حد ما', 'score': 2},
    {'id': 'disagree', 'label': 'لا أوافق إطلاقاً', 'score': 1},
]

SCALE_MIN, SCALE_MAX = 1, 3

# كل صيغة وردت فعليًا في الملفات الثلاثة، بعد التطبيع وحذف المسافات
VARIANTS = {
    'اوافقتماما': 'agree_fully',
    'اوافقتمااما': 'agree_fully',
    'اوافقتمام': 'agree_fully',
    'اوافقاليحدما': 'agree_somewhat',
    'اولفقاليحدما': 'agree_somewhat',
    'اوافقاليحد': 'agree_somewhat',
    'اوافقاليحداما': 'agree_somewhat',
    'لااوافقاطلاقا': 'disagree',
    'لااولفقاطلاقا': 'disagree',
    'لااوافقطلاقا': 'disagree',
    'لااوفقاطلاقا': 'disagree',
}

BY_ID = {o['id']: o for o in OPTIONS}


def canonical(raw):
    """يعيد (معرّف الخيار، الدرجة) أو (None, None) إن تعذّر التعرّف."""
    if raw is None or not str(raw).strip():
        return None, None
    key = normalize(raw).replace(' ', '')
    oid = VARIANTS.get(key)
    if oid is None:
        return None, None
    return oid, BY_ID[oid]['score']
