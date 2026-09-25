#!/usr/bin/env python3
"""خط استيراد بيانات «قياس اتجاه المتعلمين» — من المصدر إلى مجموعة بيانات موحّدة.

المسار: PARSE → NORMALIZE → VALIDATE → MATCH → REVIEW → EMIT → VERIFY

لا يحذف هذا الخط أي سجل، ولا يدمج اسمين تلقائيًا، ولا يربط استجابة
بطالبة غير مؤكدة. كل حالة غير مؤكدة تُصدَّر بحالتها ومرشّحيها لتراجعها
الإدارة يدويًا داخل «مركز مراجعة المطابقة».

الإخراج: src/data/dataset.json  +  تقرير استيراد مفصّل.
"""
import glob
import hashlib
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone

import openpyxl

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from answers import OPTIONS, SCALE_MAX, SCALE_MIN, VARIANTS, canonical
from arabic_name import core_tokens, normalize
from questions import NON_SCORED_KINDS, REVERSE_SCORED, direction, reverse_note
from roster_pdf import extract_roster

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SOURCE = os.path.join(ROOT, 'data', 'source')
OUT_DEFINITION = os.path.join(ROOT, 'src', 'data', 'survey-definition.json')
OUT_SCHOOL = os.path.join(ROOT, 'src', 'data', 'school-data.json')
OUT_REPORT = os.path.join(ROOT, 'data', 'import-report.json')

SCHOOL = 'الابتدائية الخامسة والستون بعد المائة'
DIRECTORATE = 'الإدارة العامة للتعليم بمحافظة جدة'
SURVEY_TITLE = 'قياس اتجاه المتعلمين'
HIJRI_YEAR = '1448'
ACADEMIC_YEAR = '1447-1448'

GRADE_NAMES = {1: 'الأول الابتدائي', 2: 'الثاني الابتدائي', 3: 'الثالث الابتدائي',
               4: 'الرابع الابتدائي', 5: 'الخامس الابتدائي', 6: 'السادس الابتدائي'}


def _grade_no(value):
    """يقرأ رقم الصف سواء ورد رقمًا أو نصًّا أو رقمًا عشريًّا."""
    if value is None:
        return None
    try:
        return int(float(str(value).strip()))
    except ValueError:
        return None


def sid(*parts) -> str:
    return hashlib.sha1('|'.join(str(p) for p in parts).encode()).hexdigest()[:12]


# ───────────────────────── PARSE ─────────────────────────

def read_rosters():
    rows = []
    for path in sorted(glob.glob(os.path.join(SOURCE, 'roster-*.pdf'))):
        for r in extract_roster(path):
            r['sourceFile'] = os.path.basename(path)
            rows.append(r)
    return rows


def read_workbooks():
    """يعيد (الأسئلة المكتشفة، صفوف الاستجابات الخام)."""
    questions, rows = None, []
    for path in sorted(glob.glob(os.path.join(SOURCE, 'responses-*.xlsx'))):
        ws = openpyxl.load_workbook(path, data_only=True).active
        header = [ws.cell(1, c).value for c in range(1, ws.max_column + 1)]

        # تُحدَّد الأعمدة بترويستها لا بموضعها: بعض الملفات تبدأ بعمود
        # «طابع زمني» إضافي، فأي افتراض بموضع ثابت يزيح البيانات كلها.
        q_cols, overall_col, text_col = [], None, None
        name_col = grade_col = stamp_col = None
        for idx, h in enumerate(header, start=1):
            label = str(h).strip() if h else ''
            if not label:
                continue
            if label[0].isdigit():
                q_cols.append((idx, label))
            elif 'التقويم العام' in label or 'تقييم المدرسة' in label:
                overall_col = (idx, label)
            elif 'الاقتراحات' in label:
                text_col = (idx, label)
            elif 'اسم' in label and name_col is None:
                name_col = idx
            elif label == 'الصف' and grade_col is None:
                grade_col = idx
            elif 'طابع زمني' in label and stamp_col is None:
                stamp_col = idx
        if name_col is None or grade_col is None:
            raise SystemExit(f'تعذّر تحديد عمودَي الاسم والصف في {path}')

        found = [label for _, label in q_cols]
        if questions is None:
            questions = found
        elif questions != found:
            raise SystemExit(f'اختلاف في نصوص الأسئلة بين الملفات: {path}')

        for r in range(2, ws.max_row + 1):
            name = ws.cell(r, name_col).value
            grade = ws.cell(r, grade_col).value
            if not name or not str(name).strip():
                continue
            stamp = ws.cell(r, stamp_col).value if stamp_col else None
            rows.append({
                'sourceFile': os.path.basename(path),
                'sourceRow': r,
                'submittedAt': stamp.isoformat() if hasattr(stamp, 'isoformat') else (
                    str(stamp).strip() if stamp else None),
                'rawName': str(name).strip(),
                'gradeNo': _grade_no(grade),
                'answers': [(col, label, ws.cell(r, col).value) for col, label in q_cols],
                'overall': ws.cell(r, overall_col[0]).value if overall_col else None,
                'overallLabel': overall_col[1] if overall_col else None,
                'suggestion': ws.cell(r, text_col[0]).value if text_col else None,
                'suggestionLabel': text_col[1] if text_col else None,
            })
    return questions, rows


# ───────────────────────── MATCH ─────────────────────────

def match_response(row, roster_by_grade):
    """يصنّف الاستجابة: MATCHED / POSSIBLE_MATCH / NEW / LEGACY.

    لا يربط إلا عند التطابق التام والوحيد. ما عداه يُترك للمراجعة اليدوية.
    """
    pool = roster_by_grade.get(row['gradeNo'], [])
    if not pool:
        # لا يوجد كشف رسمي لهذا الصف، فلا يمكن تأكيد الهوية
        return 'LEGACY', None, []

    target = normalize(row['rawName'])
    exact = [s for s in pool if normalize(s['name']) == target]
    if len(exact) == 1:
        return 'MATCHED', exact[0]['id'], [exact[0]['id']]
    if len(exact) > 1:
        return 'POSSIBLE_MATCH', None, [s['id'] for s in exact]

    rt = core_tokens(row['rawName'])
    if not rt:
        return 'NEW', None, []

    # تُرتَّب الاحتمالات في طبقات، ولا تُعرَض إلا أقواها الموجودة.
    # بدون هذا الترتيب يظهر «رتيل منصور الحربي» مرشّحًا لطالبتين
    # تشتركان في الاسم الأول والعائلة، فيلتبس ما هو في الحقيقة محسوم.
    tiers = {1: [], 2: [], 3: []}
    for s in pool:
        st = core_tokens(s['name'])
        if not st or rt[0] != st[0]:
            continue
        if set(rt).issubset(set(st)):
            tiers[1].append(s)          # كل أجزاء الاسم المُدخَل موجودة في الكشف
        elif set(st).issubset(set(rt)):
            tiers[2].append(s)          # الكشف أقصر، والمُدخَل يحتويه
        elif len(rt) >= 2 and len(st) >= 2 and rt[-1] == st[-1]:
            tiers[3].append(s)          # الاسم الأول والعائلة فقط

    for level in (1, 2, 3):
        if tiers[level]:
            return 'POSSIBLE_MATCH', None, [s['id'] for s in tiers[level]]
    return 'NEW', None, []


def read_excluded():
    """استجابات قرّرت المدرسة استبعادها، بموضعها في ملف المصدر.

    قرار الاستبعاد إداري ويُسجَّل في ملف يُرفع مع الشيفرة، لا يُحذف
    الصفّ من المصدر: لو حُذف من المصدر لم يُعرف بعد شهر ماذا نقص ولا
    لماذا، ولعاد ما استُبعد لو أُعيد إرسال الملف.

    ولا اسم في الملف: الموضع يكفي لتمييز الصفّ، والاسم بيانات شخصية.
    """
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'excluded.json')
    if not os.path.exists(path):
        return []
    with open(path, encoding='utf-8') as fh:
        return json.load(fh).get('excluded', [])


def drop_resubmissions(rows):
    """يطوي إعادة الإرسال ولا يطوي تشابه الأسماء.

    الطالبة ترسل القياس ثم تعيده لتصحّح إجابة، فتصل استجابتان باسمها
    من الملف نفسه. وفي المدرسة كذلك طالبتان تحملان الاسم نفسه فعلًا،
    وهاتان استجابتان صحيحتان لا تُطويان.

    والفاصل بينهما في الإجابات لا في الاسم: قِيس على بيانات هذا
    القياس فإذا الفرق قاطع — إعادة الإرسال تتفق في ٢٢ أو ٢٣ إجابة من
    ٢٣، والطالبتان المختلفتان لا تتجاوزان ١٤. واتفاق ثلاثٍ وعشرين
    إجابة مصادفةً احتمالُه واحد من مليارات.

    ويُبقى على الأحدث طابعًا زمنيًّا: هي التصحيح.
    """
    groups = defaultdict(list)
    for row in rows:
        groups[(row['sourceFile'], normalize(row['rawName']), row['gradeNo'])].append(row)

    keep, dropped = [], []
    for group in groups.values():
        if len(group) == 1:
            keep.extend(group)
            continue
        # تُقارن الإجابات المقيسة وحدها: التقويم العام والاقتراح نصّان
        def scored(row):
            return tuple(canonical(str(v).strip() if v is not None else None)[0]
                         for _c, _l, v in row['answers'])

        group.sort(key=lambda r: (r.get('submittedAt') or '', r['sourceRow']))
        survivors = []
        for row in group:
            twin = next((s for s in survivors
                         if sum(a == b for a, b in zip(scored(s), scored(row)))
                         >= len(row['answers']) - 1), None)
            if twin is None:
                survivors.append(row)
            else:
                # الأحدث يحلّ محلّ الأقدم، فالتصحيح هو الذي يبقى
                survivors[survivors.index(twin)] = row
                dropped.append(twin)
        keep.extend(survivors)

    keep.sort(key=lambda r: (r['sourceFile'], r['sourceRow']))
    return keep, dropped


# ───────────────────────── BUILD ─────────────────────────

def build():
    roster_rows = read_rosters()
    question_labels, response_rows = read_workbooks()

    # ---- الصفوف والفصول ----
    grades, classes = {}, {}
    for r in roster_rows:
        g = r['grade']
        gid = f'g{g}'
        grades.setdefault(gid, {'id': gid, 'no': g,
                                'name': GRADE_NAMES.get(g, r['gradeName'])})
        cid = f'{gid}-c{r["className"]}'
        classes.setdefault(cid, {'id': cid, 'gradeId': gid, 'name': r['className'],
                                 'source': 'roster', 'sourceFile': r['sourceFile']})

    # صفوف ظهرت في الاستجابات فقط (بلا كشف رسمي)
    for row in response_rows:
        g = row['gradeNo']
        if g and f'g{g}' not in grades:
            grades[f'g{g}'] = {'id': f'g{g}', 'no': g,
                               'name': GRADE_NAMES.get(g, f'الصف {g}')}

    # ---- الطالبات من الكشوف الرسمية ----
    students = []
    for r in roster_rows:
        gid, cid = f'g{r["grade"]}', f'g{r["grade"]}-c{r["className"]}'
        students.append({
            'id': f'st-{sid(gid, cid, r["no"], r["name"])}',
            'name': r['name'], 'normalizedName': normalize(r['name']),
            'gradeId': gid, 'classId': cid, 'rosterNo': r['no'],
            'source': 'roster', 'sourceFile': r['sourceFile'],
            'status': 'active', 'archivedAt': None,
        })

    roster_by_grade = defaultdict(list)
    for s in students:
        roster_by_grade[int(s['gradeId'][1:])].append(s)

    # ---- الأسئلة ----
    questions = []
    for i, label in enumerate(question_labels, start=1):
        questions.append({
            'id': f'q{i:02d}', 'order': i,
            'text': label.strip(),          # النص الأصلي حرفيًا، بلا أي تعديل
            'kind': 'likert', 'scored': True,
            'direction': direction(i), 'reverseNote': reverse_note(i),
            'required': True, 'active': True, 'weight': 1,
        })
    overall_label = next((r['overallLabel'] for r in response_rows if r['overallLabel']), 'التقويم العام للمدرسة')
    suggestion_label = next((r['suggestionLabel'] for r in response_rows if r['suggestionLabel']), 'الاقتراحات لتطوير المدرسة')
    questions.append({'id': 'q_overall', 'order': len(question_labels) + 1,
                      'text': overall_label.strip(), 'kind': 'overall', 'scored': False,
                      'direction': 'descriptive', 'reverseNote': None,
                      'required': False, 'active': True, 'weight': 0})
    questions.append({'id': 'q_suggestion', 'order': len(question_labels) + 2,
                      'text': suggestion_label.strip(), 'kind': 'text', 'scored': False,
                      'direction': 'descriptive', 'reverseNote': None,
                      'required': False, 'active': True, 'weight': 0})

    # خيارات التقويم العام كما وردت في المصدر فقط — بلا افتراض أي فئة
    overall_values = [str(r['overall']).strip() for r in response_rows
                      if r['overall'] is not None and str(r['overall']).strip()]
    overall_options = sorted(set(overall_values), key=lambda v: -overall_values.count(v))

    excluded = read_excluded()
    skip = {(e['sourceFile'], e['sourceRow']) for e in excluded}
    kept = [r for r in response_rows if (r['sourceFile'], r['sourceRow']) not in skip]
    excluded_hit = len(response_rows) - len(kept)
    if excluded_hit != len(skip):
        raise SystemExit(f'ملف الاستبعاد يشير إلى صفوف غير موجودة: {len(skip)} مطلوبة، {excluded_hit} وُجدت')
    response_rows = kept

    response_rows, resubmissions = drop_resubmissions(response_rows)

    # ---- الاستجابات والإجابات ----
    responses, answers, suggestions, unknown_answers = [], [], [], Counter()
    for row in response_rows:
        status, student_id, candidates = match_response(row, roster_by_grade)
        rid = f'rs-{sid(row["sourceFile"], row["sourceRow"])}'
        gid = f'g{row["gradeNo"]}' if row['gradeNo'] else None
        student = next((s for s in students if s['id'] == student_id), None)

        responses.append({
            'id': rid, 'cycleId': 'cy-1448',
            'studentId': student_id,                 # يُملأ فقط عند التطابق التام
            'rawName': row['rawName'],
            'declaredGradeId': gid,
            'classId': student['classId'] if student else None,
            'matchStatus': status, 'candidateStudentIds': candidates,
            'source': 'import', 'sourceFile': row['sourceFile'], 'sourceRow': row['sourceRow'],
            'submittedAt': row.get('submittedAt'),     # من عمود «طابع زمني» إن وُجد
            'reviewedAt': None, 'reviewedBy': None,
        })

        for idx, (_col, label, value) in enumerate(row['answers'], start=1):
            raw = str(value).strip() if value is not None and str(value).strip() else None
            oid, score = canonical(raw)
            if raw and oid is None:
                unknown_answers[raw] += 1
            answers.append({'responseId': rid, 'questionId': f'q{idx:02d}',
                            'rawValue': raw, 'optionId': oid, 'score': score})

        if row['overall'] is not None and str(row['overall']).strip():
            answers.append({'responseId': rid, 'questionId': 'q_overall',
                            'rawValue': str(row['overall']).strip(),
                            'optionId': None, 'score': None})

        if row['suggestion'] is not None and str(row['suggestion']).strip():
            text = str(row['suggestion']).strip()
            suggestions.append({
                'id': f'sg-{sid(rid, "sg")}', 'responseId': rid,
                'studentId': student_id, 'gradeId': gid,
                'classId': student['classId'] if student else None,
                'text': text,                          # نص الطالبة الأصلي، بلا تعديل
                'categoryId': None, 'status': 'new',
                'sourceFile': row['sourceFile'], 'sourceRow': row['sourceRow'],
            })

    # استجابات مكرّرة محتملة: اسمان يطبَّعان إلى القيمة نفسها داخل الصف نفسه
    seen = defaultdict(list)
    for r in responses:
        seen[(r['declaredGradeId'], normalize(r['rawName']))].append(r['id'])
    duplicate_groups = [{'key': k[1], 'gradeId': k[0], 'responseIds': v}
                        for k, v in seen.items() if len(v) > 1]
    dup_ids = {i for g in duplicate_groups for i in g['responseIds']}
    for r in responses:
        r['duplicateFlag'] = r['id'] in dup_ids

    dataset = {
        'meta': {
            'school': SCHOOL, 'directorate': DIRECTORATE,
            'surveyTitle': SURVEY_TITLE, 'hijriYear': HIJRI_YEAR,
            'academicYear': ACADEMIC_YEAR,
            'generatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
            'sources': sorted(os.path.basename(p) for p in
                              glob.glob(os.path.join(SOURCE, '*.xlsx')) +
                              glob.glob(os.path.join(SOURCE, '*.pdf'))),
            'scale': {'min': SCALE_MIN, 'max': SCALE_MAX},
        },
        'cycles': [{'id': 'cy-1448', 'name': f'{SURVEY_TITLE} {HIJRI_YEAR}هـ',
                    'academicYear': ACADEMIC_YEAR, 'hijriYear': HIJRI_YEAR,
                    'status': 'open', 'questionIds': [q['id'] for q in questions]}],
        'grades': sorted(grades.values(), key=lambda g: g['no']),
        'classes': sorted(classes.values(), key=lambda c: (c['gradeId'], c['name'])),
        'students': students,
        'questions': questions,
        'options': OPTIONS,
        'overallOptions': overall_options,
        'responses': responses,
        'answers': answers,
        'suggestions': suggestions,
        'duplicateGroups': duplicate_groups,
    }

    report = {
        'generatedAt': dataset['meta']['generatedAt'],
        'rosterRecords': len(roster_rows),
        'workbookRows': len(response_rows),
        'grades': [g['no'] for g in dataset['grades']],
        'classes': {c['id']: sum(1 for s in students if s['classId'] == c['id'])
                    for c in dataset['classes']},
        'students': len(students),
        'responses': len(responses),
        'matchStatus': dict(Counter(r['matchStatus'] for r in responses)),
        'matchStatusByGrade': {
            gid: dict(Counter(r['matchStatus'] for r in responses
                              if r['declaredGradeId'] == gid))
            for gid in sorted({r['declaredGradeId'] for r in responses if r['declaredGradeId']},
                              key=lambda x: int(x[1:]))
        },
        'answersTotal': len(answers),
        'answersRecognized': sum(1 for a in answers if a['optionId']),
        'likertAnswerSlots': sum(1 for a in answers if a['questionId'].startswith('q') and a['questionId'][1:].isdigit()),
        'answersMissing': sum(1 for a in answers if a['rawValue'] is None),
        'unknownAnswerValues': dict(unknown_answers),
        'answerVariantsMapped': len(VARIANTS),
        'suggestions': len(suggestions),
        'resubmissions': len(resubmissions),
        'excludedBySchool': excluded_hit,
        'overallOptions': dict(Counter(overall_values)),
        'duplicateGroups': duplicate_groups,
        'reverseScored': {str(k): v for k, v in REVERSE_SCORED.items()},
        'gradesWithoutRoster': sorted({r['declaredGradeId'] for r in responses
                                       if r['matchStatus'] == 'LEGACY'}),
        'gradesWithoutResponses': sorted({g['id'] for g in dataset['grades']
                                          if not any(r['declaredGradeId'] == g['id'] for r in responses)}),
    }

    os.makedirs(os.path.dirname(OUT_SCHOOL), exist_ok=True)
    os.makedirs(os.path.dirname(OUT_REPORT), exist_ok=True)

    # تعريف القياس: لا يحتوي أي بيانات شخصية، فيُحفظ في المستودع
    definition_keys = ('meta', 'cycles', 'questions', 'options', 'overallOptions')
    with open(OUT_DEFINITION, 'w', encoding='utf-8') as fh:
        json.dump({k: dataset[k] for k in definition_keys}, fh, ensure_ascii=False, indent=2)

    # بيانات المدرسة: أسماء الطالبات واستجاباتهن وآراؤهن.
    # هذا الملف مستثنى من المستودع في .gitignore — لا يُرفع إطلاقًا.
    school_keys = ('grades', 'classes', 'students', 'responses',
                   'answers', 'suggestions', 'duplicateGroups')
    with open(OUT_SCHOOL, 'w', encoding='utf-8') as fh:
        json.dump({k: dataset[k] for k in school_keys}, fh,
                  ensure_ascii=False, separators=(',', ':'))

    with open(OUT_REPORT, 'w', encoding='utf-8') as fh:
        json.dump(report, fh, ensure_ascii=False, indent=2)

    return dataset, report


if __name__ == '__main__':
    ds, rep = build()
    print(json.dumps(rep, ensure_ascii=False, indent=2))
    print(f"\n  → {OUT_DEFINITION}  ({os.path.getsize(OUT_DEFINITION)/1024:.0f} KB)  — بلا بيانات شخصية")
    print(f"  → {OUT_SCHOOL}  ({os.path.getsize(OUT_SCHOOL)/1024:.0f} KB)  — بيانات شخصية، مستثناة من المستودع")
