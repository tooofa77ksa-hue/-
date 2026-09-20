"""تطبيع الأسماء العربية للمقارنة فقط — الاسم الأصلي يبقى كما هو دائمًا."""
import re
import unicodedata

TASHKEEL = re.compile(r'[ؐ-ًؚ-ٰٟۖ-ۭ]')
TATWEEL = 'ـ'


def normalize(name: str) -> str:
    if not name:
        return ''
    s = unicodedata.normalize('NFKC', str(name))
    s = TASHKEEL.sub('', s).replace(TATWEEL, '')
    s = re.sub(r'[()\[\]{}«»"\'.،؛:\-_/\\]', ' ', s)
    s = (s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا')
           .replace('ى', 'ي').replace('ئ', 'ي').replace('ؤ', 'و')
           .replace('ة', 'ه').replace('ه‍', 'ه'))
    s = re.sub(r'\s+', ' ', s).strip()
    return s


# كلمات نسب/وصل لا تميّز الهوية عند مقارنة الأسماء المختصرة
FILLERS = {'بن', 'بنت', 'ال', 'عبد'}


def tokens(name: str) -> list:
    return [t for t in normalize(name).split() if t]


def core_tokens(name: str) -> list:
    return [t for t in tokens(name) if t not in FILLERS]
