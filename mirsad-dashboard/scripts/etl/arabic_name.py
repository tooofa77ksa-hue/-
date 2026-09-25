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


# أدوات النسب تُطرح: «محمد بن سلمان» و«محمد سلمان» شخص واحد
LINEAGE = {'بن', 'ابن', 'بنت'}

# صدور الأسماء المركّبة تُوصل بما بعدها ولا تُطرح: «عبد الله» اسم واحد،
# وطرحُ «عبد» يُبقي «الله» أمام «عبدالله» فلا يلتقيان
COMPOUND = {'عبد', 'ابو', 'ابي', 'ام', 'ال', 'ذو', 'ذي', 'بو'}


def tokens(name: str) -> list:
    return [t for t in normalize(name).split() if t]


def core_tokens(name: str) -> list:
    """كلمات الاسم الدالّة، موحَّدة الصورة.

    ثلاث معالجات بترتيبها: تُطرح أدوات النسب، ثم يُوصل صدر الاسم
    المركّب بما بعده، ثم تُنزع «ال» التعريف من أوّل الكلمة — فتلتقي
    «العسيري» و«عسيري»، وهما أسرة واحدة.

    والترتيب مقصود: لو نُزعت «ال» قبل الوصل لصار «عبد الله» → «عبد له».
    """
    raw = tokens(name)
    out = []
    i = 0
    while i < len(raw):
        t = raw[i]
        if t in LINEAGE:
            i += 1
            continue
        if t in COMPOUND and i + 1 < len(raw) and raw[i + 1] not in LINEAGE:
            out.append(t + raw[i + 1])
            i += 2
            continue
        out.append(t)
        i += 1
    return [t[2:] if t.startswith('ال') and len(t) >= 5 else t for t in out]
