# -*- coding: utf-8 -*-
"""
فحص إعداد الطباعة في كل ورقة من كل ملف Excel.

بلا هذا الإعداد يطبع Excel الورقة عموديًا بلا ضبط، فتتناثر الأعمدة
على صفحات زائدة ويصل الجدول إلى الوزارة مقطوعًا. والفحص هنا على
الملف المولَّد فعلًا لا على الكود الذي يولّده.
"""
import sys
import glob

import openpyxl

results = []


def check(name, ok, detail=''):
    results.append(ok)
    print(('  ✓ ' if ok else '  ✗ ') + name + (' — ' + detail if detail else ''))


for path in sorted(glob.glob(sys.argv[1])):
    name = path.rsplit('/', 1)[-1]
    print('\n' + name)
    wb = openpyxl.load_workbook(path)
    for ws in wb.worksheets:
        setup = ws.page_setup
        landscape = setup.orientation == 'landscape'
        fit_w = ws.sheet_properties.pageSetUpPr is not None \
            and ws.sheet_properties.pageSetUpPr.fitToPage
        width_one = setup.fitToWidth in (1, '1')
        # الطول يتمدّد على ما يلزم بدل سحق الصفوف
        height_free = setup.fitToHeight in (0, '0', None)
        titles = (ws.print_title_rows or '') != ''
        footer = (ws.oddFooter.center.text or '') if ws.oddFooter else ''
        header = (ws.oddHeader.right.text or '') if ws.oddHeader else ''

        check('«%s»: أفقية' % ws.title, landscape, setup.orientation or 'غير محدّد')
        check('  كل الأعمدة في صفحة واحدة عرضًا', bool(fit_w) and width_one)
        check('  الطول يتمدّد لا يُسحق', height_free)
        check('  صف العناوين يتكرّر في كل صفحة', titles, ws.print_title_rows or '')
        check('  ترويسة باسم المدرسة', 'الابتدائية' in header or len(header) > 0)
        check('  تذييل برقم الصفحة', '&P' in footer and '&N' in footer)

failed = results.count(False)
print('\n%d فحصًا، %d ساقطًا' % (len(results), failed))
sys.exit(1 if failed else 0)
