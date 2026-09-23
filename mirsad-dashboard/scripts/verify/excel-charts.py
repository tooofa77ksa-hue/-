# -*- coding: utf-8 -*-
"""
فحص ملف Excel المولَّد: هل رسومه صحيحة فعلًا؟

الرسم يُكتب XML خامًا، وملفٌ يقرؤه المحلِّل قد يرفضه Excel ويفتحه
برسالة «إصلاح» أمام الوزارة. فالفحص هنا على مستويين:

  ١) قراءة الملف بمحلِّل OOXML مستقل (openpyxl): هل وصلت الرسوم
     بأنواعها وسلاسلها ومراجعها وموضعها؟
  ٢) ترتيب الأبناء داخل كل عنصر: مخطط OOXML يفرض تسلسلًا، والمحلِّل
     المتساهل يقبل ما يرفضه Excel — فيُفحص التسلسل صراحةً.
"""
import re
import sys
import zipfile

import openpyxl

PATH = sys.argv[1]

# التسلسل المُلزِم لأبناء كل عنصر، كما في مخطط ECMA-376
SEQUENCES = {
    'c:chartSpace': ['c:date1904', 'c:lang', 'c:roundedCorners', 'c:style',
                     'c:clrMapOvr', 'c:pivotSource', 'c:protection', 'c:chart',
                     'c:spPr', 'c:txPr', 'c:externalData', 'c:printSettings'],
    'c:chart': ['c:title', 'c:autoTitleDeleted', 'c:pivotFmts', 'c:view3D',
                'c:floor', 'c:sideWall', 'c:backWall', 'c:plotArea', 'c:legend',
                'c:plotVisOnly', 'c:dispBlanksAs', 'c:showDLblsOverMax'],
    'c:plotArea': ['c:layout', 'c:barChart', 'c:pieChart', 'c:lineChart',
                   'c:catAx', 'c:valAx', 'c:dTable', 'c:spPr'],
    'c:barChart': ['c:barDir', 'c:grouping', 'c:varyColors', 'c:ser', 'c:dLbls',
                   'c:gapWidth', 'c:overlap', 'c:serLines', 'c:axId'],
    'c:pieChart': ['c:varyColors', 'c:ser', 'c:dLbls', 'c:firstSliceAng'],
    'c:ser': ['c:idx', 'c:order', 'c:tx', 'c:spPr', 'c:invertIfNegative',
              'c:pictureOptions', 'c:dPt', 'c:dLbls', 'c:trendline', 'c:errBars',
              'c:cat', 'c:val', 'c:shape'],
    'c:catAx': ['c:axId', 'c:scaling', 'c:delete', 'c:axPos', 'c:majorGridlines',
                'c:minorGridlines', 'c:title', 'c:numFmt', 'c:majorTickMark',
                'c:minorTickMark', 'c:tickLblPos', 'c:spPr', 'c:txPr', 'c:crossAx',
                'c:crosses', 'c:crossesAt', 'c:auto', 'c:lblAlgn', 'c:lblOffset',
                'c:tickLblSkip', 'c:tickMarkSkip', 'c:noMultiLvlLbl'],
    'c:valAx': ['c:axId', 'c:scaling', 'c:delete', 'c:axPos', 'c:majorGridlines',
                'c:minorGridlines', 'c:title', 'c:numFmt', 'c:majorTickMark',
                'c:minorTickMark', 'c:tickLblPos', 'c:spPr', 'c:txPr', 'c:crossAx',
                'c:crosses', 'c:crossesAt', 'c:crossBetween', 'c:majorUnit',
                'c:minorUnit', 'c:dispUnits'],
    'c:scaling': ['c:logBase', 'c:orientation', 'c:max', 'c:min'],
    'c:legend': ['c:legendPos', 'c:legendEntry', 'c:layout', 'c:overlay',
                 'c:spPr', 'c:txPr'],
    'c:title': ['c:tx', 'c:layout', 'c:overlay', 'c:spPr', 'c:txPr'],
    'c:dLbls': ['c:numFmt', 'c:spPr', 'c:txPr', 'c:dLblPos', 'c:showLegendKey',
                'c:showVal', 'c:showCatName', 'c:showSerName', 'c:showPercent',
                'c:showBubbleSize', 'c:separator', 'c:showLeaderLines'],
}

results = []


def check(name, ok, detail=''):
    results.append(ok)
    print(('  ✓ ' if ok else '  ✗ ') + name + (' — ' + detail if detail else ''))


def children_of(xml, tag):
    """أبناء المستوى الأول لكل عنصر بهذا الاسم."""
    out = []
    for m in re.finditer(r'<' + re.escape(tag) + r'(?:\s[^>]*)?>', xml):
        depth, i, kids = 0, m.start(), []
        for t in re.finditer(r'<(/?)([a-zA-Z:]+)([^>]*?)(/?)>', xml[i:]):
            closing, name, _attrs, self_closing = t.groups()
            if t.start() == 0:
                depth = 1
                continue
            if closing:
                depth -= 1
                if depth == 0:
                    break
            else:
                if depth == 1:
                    kids.append(name)
                if not self_closing:
                    depth += 1
        out.append(kids)
    return out


print('\n١) بنية الملف')
zf = zipfile.ZipFile(PATH)
names = zf.namelist()
charts = [n for n in names if n.startswith('xl/charts/chart')]
drawings = [n for n in names if re.match(r'xl/drawings/drawing\d+\.xml$', n)]
check('أجزاء الرسوم موجودة', len(charts) > 0, '%d رسمًا' % len(charts))
check('لكل لوحة ملف علاقات',
      all(('xl/drawings/_rels/%s.rels' % d.split('/')[-1]) in names for d in drawings))

types = zf.read('[Content_Types].xml').decode('utf-8')
registered = set(re.findall(r'PartName="([^"]+)"', types))
check('كل جزء رسم مسجَّل في فهرس الأنواع',
      all('/' + c in registered for c in charts + drawings))

print('\n٢) ترتيب الأبناء حسب مخطط OOXML')
bad = []
for part in charts:
    xml = zf.read(part).decode('utf-8')
    for tag, order in SEQUENCES.items():
        rank = {n: i for i, n in enumerate(order)}
        for kids in children_of(xml, tag):
            seen = [rank[k] for k in kids if k in rank]
            if seen != sorted(seen):
                bad.append('%s/%s: %s' % (part, tag, ' → '.join(kids)))
check('لا عنصر خارج تسلسله المُلزِم', not bad, '; '.join(bad[:3]))

unknown = []
for part in charts:
    xml = zf.read(part).decode('utf-8')
    for tag, order in SEQUENCES.items():
        for kids in children_of(xml, tag):
            unknown += ['%s/%s' % (tag, k) for k in kids if k not in order]
check('لا ابن غير معروف في العناصر المفحوصة', not unknown, '; '.join(sorted(set(unknown))[:3]))

print('\n٣) قراءة مستقلة بمحلِّل OOXML')
wb = openpyxl.load_workbook(PATH)
found = [(ws.title, ch) for ws in wb.worksheets for ch in ws._charts]
check('المحلِّل المستقل يقرأ الرسوم', len(found) == len(charts),
      '%d من %d' % (len(found), len(charts)))
for title, ch in found:
    kind = type(ch).__name__
    refs = [s.val.numRef.f for s in ch.series if s.val and s.val.numRef]
    check('رسم في «%s» (%s) بمراجع سليمة' % (title, kind),
          len(refs) == len(ch.series) and all("!$" in r for r in refs),
          '%d سلسلة' % len(ch.series))
    check('  موضعه محدَّد بخليتين',
          type(ch.anchor).__name__ == 'TwoCellAnchor')

print('')
failed = results.count(False)
print('%d فحصًا، %d ساقطًا' % (len(results), failed))
sys.exit(1 if failed else 0)
