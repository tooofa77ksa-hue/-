"""فك ترميز كشوف الطالبات الرسمية (PDF) واستخراجها منظّمة.

تخزّن هذه الكشوف الحروف كأشكال عربية (Arabic Presentation Forms-B)
مزاحة إلى كتل يونيكود أخرى، وبترتيب بصري معكوس.
القاعدة المستنتجة من فحص كل رموز الملفين:
    الحرف غير اللاتيني →  0xFE00 + (codepoint & 0xFF)
ثم يُعكس الترتيب، وتُعاد الأرقام إلى اتجاهها، ويُطبَّع NFKC.

كل صفحة تحمل ترويستها الخاصة (الصف/الفصل)، وقد تتغيّر بين الصفحات،
فتُقرأ الترويسة لكل صفحة على حدة ولا تُفترض ثابتة على الملف.
"""
import re
import unicodedata

import pymupdf

SPECIAL = {
    0x0BCC: 'الله'[::-1],   # لفظ الجلالة (يُدرَج معكوسًا ليستقيم بعد عكس السطر)
    0x02EF: 'ء',            # الهمزة المفردة
}

GRADE_WORDS = {
    'الأول': 1, 'الاول': 1, 'الثاني': 2, 'الثالث': 3,
    'الرابع': 4, 'الخامس': 5, 'السادس': 6,
}

NUMBER_COLUMN_X = 520   # عمود «عدد» في أقصى يمين الجدول
TABLE_TOP_Y = 185       # أسفل سطر عناوين الجدول

# أي حرف عربي أو لاتيني: الأسماء قد تَرِد بأي منهما في الكشف الرسمي
LETTER = re.compile(r'[؀-ۿA-Za-z]')

# كلمات ترويسة وتذييل قد تقع ضمن نطاق صف الجدول
SKIP_WORDS = {'عدد', 'كشف', 'الصف', 'الفصل', 'القسم', 'التوقيع', 'الطالبة',
              'اسم', 'بأسماء', 'الطالبات', 'ReportID'}


def _deglyph(ch: str) -> str:
    o = ord(ch)
    if o in SPECIAL:
        return SPECIAL[o]
    if o < 0x20:
        return ' '
    if o < 0x80:
        return ch
    return chr(0xFE00 + (o & 0xFF))


ARABIC = re.compile(r'[؀-ۿﭐ-\ufeff]')


def decode(s: str) -> str:
    """يفكّ ترميز كلمة واحدة ويعيدها إلى اتجاهها الصحيح.

    العربية مخزّنة بترتيب بصري معكوس فتُعكس، أما اللاتينية والأرقام فمخزّنة
    بترتيبها المنطقي أصلًا فلا تُمسّ — وعكسها يقلب الاسم رأسًا على عقب.
    """
    mapped = ''.join(_deglyph(c) for c in s)
    if not ARABIC.search(mapped):
        return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', mapped)).strip()
    out = unicodedata.normalize('NFKC', mapped[::-1])
    out = re.sub(r'\d+', lambda m: m.group()[::-1], out)   # الأرقام لاتينية الاتجاه
    return re.sub(r'\s+', ' ', out).strip()


def _page_header(page):
    """يقرأ (الصف، اسم الصف، الفصل، العام الدراسي) من ترويسة الصفحة."""
    words = [(w[1], w[0], decode(w[4])) for w in page.get_text("words") if w[1] < 110]
    words.sort(key=lambda t: (round(t[0]), -t[1]))
    tokens = [t[2] for t in words]

    grade = grade_name = klass = year = None
    for i, tok in enumerate(tokens):
        if tok == 'الصف' and i + 1 < len(tokens):
            grade_name = ' '.join(tokens[i + 1:i + 3]).strip()
            grade = GRADE_WORDS.get(tokens[i + 1])
        if tok == 'الفصل':
            for back in range(1, 4):
                if i - back >= 0 and tokens[i - back].isdigit():
                    klass = tokens[i - back]
                    break
        m = re.fullmatch(r'(14\d{2})-(14\d{2})', tok)
        if m:
            year = '-'.join(sorted([m.group(1), m.group(2)]))
    return grade, grade_name, klass, year


def extract_roster(path: str):
    """سجلات الكشف: {grade, gradeName, className, academicYear, no, name, page}."""
    doc = pymupdf.open(path)
    out = []

    for page_index, page in enumerate(doc, start=1):
        grade, grade_name, klass, year = _page_header(page)
        body = [w for w in page.get_text("words") if w[1] > TABLE_TOP_Y]

        numbers, names = [], []
        for x0, y0, _x1, _y1, raw, *_ in body:
            text = decode(raw)
            if x0 >= NUMBER_COLUMN_X and text.isdigit():
                numbers.append((y0, int(text)))
            elif LETTER.search(text):
                # تُقبل الحروف العربية واللاتينية معًا: بعض الأسماء في الكشف
                # الرسمي مكتوبة بحروف لاتينية، وإسقاطها يفقد طالبات حقيقيات.
                names.append((y0, x0, text))

        # رقم الصف يعلو اسمه بنحو ٣ نقاط؛ نضمّ كل اسم إلى أقرب رقم فوقه
        for y_num, number in sorted(numbers):
            parts = [(x, t) for y, x, t in names if -1 <= (y - y_num) <= 9]
            parts = [(x, t) for x, t in parts if t not in SKIP_WORDS]
            if not parts:
                continue
            # العربية تُقرأ من اليمين، واللاتينية من اليسار داخل السطر نفسه
            latin_only = not any(ARABIC.search(t) for _, t in parts)
            ordered = sorted(parts, key=lambda p: p[0] if latin_only else -p[0])
            name = re.sub(r'\s*-\s*', ' ', ' '.join(t for _, t in ordered)).strip()
            out.append({
                'grade': grade, 'gradeName': grade_name, 'className': klass,
                'academicYear': year, 'no': number, 'name': name, 'page': page_index,
            })
    return out


if __name__ == '__main__':
    import sys, json
    from collections import defaultdict
    rows = extract_roster(sys.argv[1])
    groups = defaultdict(list)
    for r in rows:
        groups[(r['gradeName'], r['className'])].append(r)
    for key, items in sorted(groups.items()):
        nums = sorted(i['no'] for i in items)
        gap = 'متصلة' if nums == list(range(1, len(nums) + 1)) else f'انقطاع: {nums}'
        print(f"  {key[0]} / فصل {key[1]}: {len(items)} طالبة — {gap}")
        for i in sorted(items, key=lambda x: x['no'])[:3]:
            print(f"      {i['no']}. {i['name']}")
    print("  الإجمالي:", len(rows))
