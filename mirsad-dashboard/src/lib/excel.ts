import type ExcelJSNS from 'exceljs'

import type { Scope } from './analysis'
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
    `تاريخ الاستخراج: ${new Intl.DateTimeFormat('ar-SA', { dateStyle: 'full', timeStyle: 'short' }).format(new Date())}`,
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

async function download(wb: ExcelJSNS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer()
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
  return ws
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
  buildSheet(wb, state, 'ملخص القياس', scope,
    ['البند', 'القيمة', 'قاعدة الحساب'],
    summaryRows(state, scope).map((r) => [r.label, r.value, r.basis]))

  buildSheet(wb, state, 'نتائج الأسئلة', scope,
    ['#', 'نص السؤال', 'الاتجاه', ...state.options.map((o) => o.label),
      ...state.options.map((o) => `${o.label} %`), 'ن', 'مفقود', 'المتوسط المصحَّح'],
    questionRows(state, scope).map((r) => [
      r.order, r.text, r.direction, ...r.counts, ...r.percents, r.n, r.missing, r.adjustedMean,
    ]))

  buildSheet(wb, state, 'التقويم العام', scope,
    ['التقدير', 'العدد', 'النسبة %'],
    overallRows(state, scope).map((r) => [r.value, r.count, r.percent]))

  await download(wb, `survey-results-${state.meta.hijriYear}.xlsx`)
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
