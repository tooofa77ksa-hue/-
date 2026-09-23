import type ExcelJSNS from 'exceljs'

import type { Scope } from './analysis'
import { participation, satisfactionIndex } from './analysis'
import { fullClass, orderedClasses, shortClass, shortGrade } from './labels'
import {
  CHART_COLORS, cellRef, colRef, columnLetter, injectCharts, type ChartSpec,
} from './excelCharts'
import {
  nonRespondentRows, overallRows, questionRows, studentRows,
  suggestionRows, summaryRows,
} from './reportRows'
import type { SystemState } from '../domain/types'

const BRAND_NAVY = 'FF15445A'
const BRAND_TINT = 'FFDCECEB'

function scopeLabel(state: SystemState, scope: Scope): string {
  if (scope.classId) {
    const c = state.classes.find((x) => x.id === scope.classId)
    const g = c ? state.grades.find((x) => x.id === c.gradeId) : null
    return c ? `${g?.name ?? ''} — فصل ${c.name}` : 'فصل'
  }
  if (scope.gradeId) {
    return state.grades.find((x) => x.id === scope.gradeId)?.name ?? 'صف'
  }
  return 'المدرسة كاملة'
}

/** تحميل ExcelJS عند الحاجة فقط — يبقى خارج حزمة القياس العام. */
async function newWorkbook(state: SystemState): Promise<ExcelJSNS.Workbook> {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = state.meta.school
  wb.created = new Date()
  return wb
}

/** ترويسة موحّدة أعلى كل ورقة: الجهة والقياس والنطاق وتاريخ الاستخراج. */
function addTitle(
  ws: ExcelJSNS.Worksheet,
  state: SystemState,
  sheetTitle: string,
  scope: Scope,
  columns: number,
): number {
  ws.views = [{ rightToLeft: true, state: 'frozen', ySplit: 6 }]

  const lines = [
    state.meta.directorate,
    state.meta.school,
    `${state.meta.surveyTitle} ${state.meta.hijriYear}هـ — ${sheetTitle}`,
    `النطاق: ${scopeLabel(state, scope)}`,
    `تاريخ الاستخراج: ${new Intl.DateTimeFormat('ar-SA-u-nu-latn', { dateStyle: 'full', timeStyle: 'short' }).format(new Date())}`,
  ]

  lines.forEach((text, i) => {
    const row = ws.getRow(i + 1)
    ws.mergeCells(i + 1, 1, i + 1, Math.max(columns, 2))
    const cell = row.getCell(1)
    cell.value = text
    cell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rtl' }
    cell.font = { name: 'Arial', size: i === 2 ? 14 : 11, bold: i <= 2, color: { argb: BRAND_NAVY } }
    row.height = i === 2 ? 22 : 18
  })
  return lines.length + 1   // أول صف بعد الترويسة (يُترك صف فارغ)
}

function addHeaderRow(ws: ExcelJSNS.Worksheet, rowIndex: number, headers: string[]) {
  const row = ws.getRow(rowIndex)
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1)
    cell.value = h
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_NAVY } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'rtl' }
    cell.border = { bottom: { style: 'thin', color: { argb: BRAND_NAVY } } }
  })
  row.height = 28
  return row
}

function styleBody(ws: ExcelJSNS.Worksheet, firstDataRow: number, columns: number) {
  for (let r = firstDataRow; r <= ws.rowCount; r += 1) {
    const row = ws.getRow(r)
    for (let c = 1; c <= columns; c += 1) {
      const cell = row.getCell(c)
      cell.alignment = { horizontal: c === 2 ? 'right' : 'center', vertical: 'middle', wrapText: true, readingOrder: 'rtl' }
      cell.font = { name: 'Arial', size: 11 }
      if ((r - firstDataRow) % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_TINT } }
      }
    }
  }
}

/**
 * إعداد طباعة موحّد لكل ورقة.
 *
 * بدونه يطبع Excel الورقة عموديًا بلا ضبط، فتتناثر الأعمدة على صفحات
 * زائدة ويخرج الجدول مقطوعًا. و«fitToWidth: 1» يضمن أن كل الأعمدة
 * تسع صفحةً واحدة عرضًا مهما ضاقت الطابعة، و«fitToHeight: 0» يترك
 * الطول يتمدّد على ما يلزم من صفحات بدل سحق الصفوف.
 *
 * وصف العناوين يتكرّر في أعلى كل صفحة مطبوعة، فلا تصل الوزارة صفحةٌ
 * من الجدول لا يُعرف ما أعمدتها.
 */
function setupPrint(
  ws: ExcelJSNS.Worksheet, state: SystemState, headerRow: number, columns: number,
) {
  ws.pageSetup = {
    paperSize: 9,                 // A4
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    printTitlesRow: `${headerRow}:${headerRow}`,
    margins: {
      left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3,
    },
  }
  ws.pageSetup.printArea = `A1:${columnLetter(Math.max(columns, 1))}${ws.rowCount}`
  ws.headerFooter = {
    differentFirst: false,
    differentOddEven: false,
    oddHeader: `&R&"Arial,Bold"&11${state.meta.school}&L&"Arial"&9${state.meta.directorate}`,
    oddFooter: `&C&"Arial"&9صفحة &P من &N&R&"Arial"&9${state.meta.surveyTitle} ${state.meta.hijriYear}هـ`,
  }
}

function autoWidth(ws: ExcelJSNS.Worksheet, minimum = 10, maximum = 60) {
  ws.columns.forEach((col) => {
    let width = minimum
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const text = String(cell.value ?? '')
      width = Math.max(width, Math.min(maximum, text.length + 4))
    })
    col.width = width
  })
}

/**
 * تنزيل ملف.
 *
 * تُستخدم أسماء ملفات لاتينية عمدًا: المتصفحات تُسقط أسماء الملفات العربية
 * من سمة download فينزل الملف باسم «download» بلا امتداد، فلا يفتحه Excel.
 * العناوين العربية موجودة داخل الملف نفسه في ترويسة كل ورقة.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function download(wb: ExcelJSNS.Workbook, filename: string, charts: ChartSpec[] = []) {
  const written = await wb.xlsx.writeBuffer()
  const buffer = await injectCharts(written as ArrayBuffer, charts)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveBlob(blob, filename)
}

/** بناء ورقة جاهزة من عناوين وصفوف. */
function buildSheet(
  wb: ExcelJSNS.Workbook, state: SystemState, name: string, scope: Scope,
  headers: string[], rows: (string | number)[][],
) {
  const ws = wb.addWorksheet(name)
  const headerRow = addTitle(ws, state, name, scope, headers.length)
  addHeaderRow(ws, headerRow, headers)
  rows.forEach((r) => ws.addRow(r))
  ws.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow + rows.length, column: headers.length },
  }
  ws.views = [{ rightToLeft: true, state: 'frozen', ySplit: headerRow }]
  styleBody(ws, headerRow + 1, headers.length)
  autoWidth(ws)
  setupPrint(ws, state, headerRow, headers.length)
  return { ws, headerRow, firstDataRow: headerRow + 1, lastDataRow: headerRow + rows.length }
}

// ───────────────── التقارير ─────────────────

export async function exportNonRespondents(state: SystemState, scope: Scope) {
  const wb = await newWorkbook(state)

  buildSheet(wb, state, 'غير المستجيبات', scope,
    ['م', 'اسم الطالبة', 'الصف', 'الفصل', 'رقم الكشف'],
    nonRespondentRows(state, scope).map((r) => [r.index, r.name, r.grade, r.className, r.rosterNo]))

  await download(wb, `non-respondents-${state.meta.hijriYear}.xlsx`)
}

export async function exportResults(state: SystemState, scope: Scope) {
  const wb = await newWorkbook(state)
  const charts: ChartSpec[] = []
  const { min, max } = state.meta.scale

  // ── ١) ملخص القياس ──
  buildSheet(wb, state, 'ملخص القياس', scope,
    ['البند', 'القيمة', 'قاعدة الحساب'],
    summaryRows(state, scope).map((r) => [r.label, r.value, r.basis]))

  // ── ٢) نتائج الأسئلة ──
  const optionCount = state.options.length
  const questions = questionRows(state, scope)
  const QUESTIONS = 'نتائج الأسئلة'
  const q = buildSheet(wb, state, QUESTIONS, scope,
    ['#', 'نص السؤال', 'الاتجاه', ...state.options.map((o) => o.label),
      ...state.options.map((o) => `${o.label} %`), 'ن', 'مفقود', 'المتوسط المصحَّح'],
    questions.map((r) => [
      r.order, r.text, r.direction, ...r.counts, ...r.percents, r.n, r.missing, r.adjustedMean,
    ]))

  if (questions.length > 0) {
    const meanCol = 3 + optionCount * 2 + 3      // آخر عمود: المتوسط المصحَّح
    const firstPercent = 4 + optionCount          // أول عمود نسبة مئوية
    const categories = colRef(QUESTIONS, 1, q.firstDataRow, q.lastDataRow)

    // المتوسط لكل سؤال: أفقي كي يتّسع لخمسة وعشرين سؤالًا دون تزاحم
    charts.push({
      sheet: QUESTIONS,
      title: `المتوسط المصحَّح لكل سؤال (مقياس ${min}–${max})`,
      kind: 'bar',
      categories,
      series: [{
        name: cellRef(QUESTIONS, meanCol, q.headerRow),
        values: colRef(QUESTIONS, meanCol, q.firstDataRow, q.lastDataRow),
      }],
      anchor: { col: 0, row: q.lastDataRow + 1, cols: 9, rows: Math.max(20, questions.length) },
      axis: { min, max },
      dataLabels: true,
    })

    // توزيع الخيارات: سلسلة لكل خيار، بترتيب المصدر ولونٍ ثابت لكل منها
    charts.push({
      sheet: QUESTIONS,
      title: 'توزيع الإجابات على الخيارات لكل سؤال (%)',
      kind: 'col',
      categories,
      series: state.options.map((_option, i) => ({
        name: cellRef(QUESTIONS, firstPercent + i, q.headerRow),
        values: colRef(QUESTIONS, firstPercent + i, q.firstDataRow, q.lastDataRow),
      })),
      anchor: {
        col: 0,
        row: q.lastDataRow + 3 + Math.max(20, questions.length),
        cols: 9,
        rows: 22,
      },
      axis: { min: 0, max: 100 },
    })
  }

  // ── ٣) التقويم العام ──
  const overall = overallRows(state, scope)
  const OVERALL = 'التقويم العام'
  const o = buildSheet(wb, state, OVERALL, scope,
    ['التقدير', 'العدد', 'النسبة %'],
    overall.map((r) => [r.value, r.count, r.percent]))

  if (overall.length > 0) {
    charts.push({
      sheet: OVERALL,
      title: 'توزيع التقويم العام',
      kind: 'pie',
      categories: colRef(OVERALL, 1, o.firstDataRow, o.lastDataRow),
      series: [{
        name: cellRef(OVERALL, 2, o.headerRow),
        values: colRef(OVERALL, 2, o.firstDataRow, o.lastDataRow),
      }],
      anchor: { col: 0, row: o.lastDataRow + 1, cols: 7, rows: 20 },
      varyColors: true,
    })
  }

  // ── ٤) مقارنة الصفوف ──
  // لا تُبنى إلا في نطاق المدرسة: المقارنة بين الصفوف لا معنى لها داخل صف واحد
  if (!scope.gradeId && !scope.classId) {
    const GRADES = 'مقارنة الصفوف'
    const perGrade = state.grades
      .filter((g) => state.classes.some((c) => c.gradeId === g.id))
      .sort((a, b) => a.no - b.no)
      .map((g) => {
        const gradeScope: Scope = { gradeId: g.id }
        const p = participation(state, gradeScope)
        const idx = satisfactionIndex(state, gradeScope)
        return [
          shortGrade(g.no), g.name, p.totalStudents, p.confirmedRespondents,
          Number(p.rate.toFixed(1)), Number(p.receivedRate.toFixed(1)),
          idx.mean === null ? '' : Number(idx.mean.toFixed(2)),
        ] as (string | number)[]
      })

    const gs = buildSheet(wb, state, GRADES, scope,
      ['الصف', 'الاسم الكامل', 'عدد الطالبات', 'المستجيبات المؤكّدات',
        'نسبة الاستجابة المؤكّدة %', 'نسبة من أجابت %', 'مؤشر الاتجاه'],
      perGrade)

    if (perGrade.length > 0) {
      const categories = colRef(GRADES, 1, gs.firstDataRow, gs.lastDataRow)
      charts.push({
        sheet: GRADES,
        title: 'مؤشر الاتجاه حسب الصف',
        kind: 'col',
        categories,
        series: [{
          name: cellRef(GRADES, 7, gs.headerRow),
          values: colRef(GRADES, 7, gs.firstDataRow, gs.lastDataRow),
        }],
        anchor: { col: 0, row: gs.lastDataRow + 1, cols: 6, rows: 20 },
        axis: { min, max },
        dataLabels: true,
      })
      charts.push({
        sheet: GRADES,
        title: 'نسبة من أجابت حسب الصف (%)',
        kind: 'col',
        categories,
        series: [{
          name: cellRef(GRADES, 6, gs.headerRow),
          values: colRef(GRADES, 6, gs.firstDataRow, gs.lastDataRow),
          color: CHART_COLORS[1],
        }],
        anchor: { col: 0, row: gs.lastDataRow + 23, cols: 6, rows: 20 },
        axis: { min: 0, max: 100 },
        dataLabels: true,
      })
    }
  }

  // ── ٥) الفصول، كل فصل على حدة ──
  // بترتيب الصف ثم رقم الفصل: أولى ١، أولى ٢، ثانية ١ … لا ترتيبًا
  // أبجديًا يضع «الثالث» قبل «الثاني».
  if (!scope.classId) {
    const ROOMS = 'الفصول'
    const rooms = orderedClasses(state.grades, state.classes)
      .filter(({ room }) => !scope.gradeId || room.gradeId === scope.gradeId)

    const roomRows = rooms.map(({ room, grade }) => {
      const roomScope: Scope = { classId: room.id }
      const p = participation(state, roomScope)
      const idx = satisfactionIndex(state, roomScope)
      return [
        grade?.name ?? '',
        shortClass(grade, room),
        fullClass(grade, room),
        p.totalStudents,
        p.confirmedRespondents,
        p.responsesReceived,
        Number(p.receivedRate.toFixed(1)),
        idx.mean === null ? '' : Number(idx.mean.toFixed(2)),
      ] as (string | number)[]
    })

    const rs = buildSheet(wb, state, ROOMS, scope,
      ['الصف', 'الفصل', 'الاسم الكامل', 'عدد الطالبات', 'المستجيبات المؤكّدات',
        'الاستجابات المستلمة', 'نسبة من أجابت %', 'مؤشر الاتجاه'],
      roomRows)

    if (roomRows.length > 0) {
      // الفئات من عمود الاسم المختصر: «أولى ١» تسع محور الرسم، والاسم
      // الكامل يبقى في عموده للجدول والتقارير
      const categories = colRef(ROOMS, 2, rs.firstDataRow, rs.lastDataRow)
      charts.push({
        sheet: ROOMS,
        title: `مؤشر الاتجاه لكل فصل (مقياس ${min}–${max})`,
        kind: 'bar',
        categories,
        series: [{
          name: cellRef(ROOMS, 8, rs.headerRow),
          values: colRef(ROOMS, 8, rs.firstDataRow, rs.lastDataRow),
        }],
        anchor: { col: 0, row: rs.lastDataRow + 1, cols: 8, rows: Math.max(18, roomRows.length + 6) },
        axis: { min, max },
        dataLabels: true,
      })
      charts.push({
        sheet: ROOMS,
        title: 'نسبة من أجابت لكل فصل (%)',
        kind: 'col',
        categories,
        series: [{
          name: cellRef(ROOMS, 7, rs.headerRow),
          values: colRef(ROOMS, 7, rs.firstDataRow, rs.lastDataRow),
          color: CHART_COLORS[1],
        }],
        anchor: {
          col: 0,
          row: rs.lastDataRow + 3 + Math.max(18, roomRows.length + 6),
          cols: 8,
          rows: 20,
        },
        axis: { min: 0 },
        dataLabels: true,
      })
    }
  }

  await download(wb, `survey-results-${state.meta.hijriYear}.xlsx`, charts)
}

export async function exportStudents(state: SystemState, scope: Scope) {
  const wb = await newWorkbook(state)
  buildSheet(wb, state, 'الطالبات', scope,
    ['م', 'اسم الطالبة', 'الصف', 'الفصل', 'رقم الكشف', 'الحالة', 'استجابت'],
    studentRows(state, scope).map((r) => [
      r.index, r.name, r.grade, r.className, r.rosterNo, r.status, r.responded,
    ]))

  await download(wb, `students-${state.meta.hijriYear}.xlsx`)
}

export async function exportSuggestions(state: SystemState, scope: Scope) {
  const wb = await newWorkbook(state)
  buildSheet(wb, state, 'الآراء والمقترحات', scope,
    ['م', 'نص الرأي كما كتبته الطالبة', 'الصف', 'الفصل', 'التصنيف', 'الحالة'],
    suggestionRows(state, scope).map((r) => [
      r.index, r.text, r.grade, r.className, r.category, r.status,
    ]))

  await download(wb, `student-voice-${state.meta.hijriYear}.xlsx`)
}

export async function exportActions(state: SystemState) {
  const wb = await newWorkbook(state)
  const catById = new Map(state.categories.map((c) => [c.id, c]))
  const labels = { planned: 'مخطط', in_progress: 'جارٍ التنفيذ', completed: 'مكتمل' }
  const priorities = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' }

  buildSheet(wb, state, 'إجراءات التحسين', {},
    ['م', 'العنوان', 'المشكلة/الرأي', 'التصنيف', 'المصدر', 'التكرار', 'الأولوية',
      'الإجراء', 'المسؤول', 'تاريخ البدء', 'الإنجاز المتوقع', 'الإنجاز الفعلي',
      'الحالة', 'الأثر', 'المتابعة', 'الأدلة', 'ملاحظات'],
    state.improvementActions.map((a, i) => [
      i + 1, a.title, a.problem, a.categoryId ? catById.get(a.categoryId)?.name ?? '' : '',
      a.sourceNote, a.mentions, priorities[a.priority], a.action, a.owner,
      a.startDate ?? '', a.dueDate ?? '', a.doneDate ?? '', labels[a.status],
      a.impact, a.followUp, a.evidence.map((e) => `${e.label}: ${e.value}`).join(' | '), a.notes,
    ]))

  await download(wb, `improvement-actions-${state.meta.hijriYear}.xlsx`)
}
