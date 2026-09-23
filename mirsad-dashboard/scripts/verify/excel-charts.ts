/**
 * تجربة الرسوم داخل ملف Excel.
 *
 * الرسم يُحقن XML خامًا، وXML الصحيح نحويًا قد يرفضه Excel لخطأ في
 * الترتيب أو علاقة ناقصة. فلا يكفي أن يُبنى الملف: تفتحه هنا
 * LibreOffice فعلًا وتحوّله إلى PDF — فإن لم تُرسم الرسوم أو رُفض
 * الملف، سقطت التجربة قبل أن يصل الملف إلى الوزارة.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import ExcelJS from 'exceljs'

import { cellRef, colRef, injectCharts, type ChartSpec } from '../../src/lib/excelCharts'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.tmp-excel')
mkdirSync(out, { recursive: true })

const wb = new ExcelJS.Workbook()

const questions = wb.addWorksheet('نتائج الأسئلة')
questions.views = [{ rightToLeft: true }]
questions.addRow(['#', 'نص السؤال', 'أوافق %', 'إلى حد ما %', 'لا أوافق %', 'المتوسط'])
for (let i = 1; i <= 25; i += 1) {
  questions.addRow([i, `السؤال رقم ${i}`, 60 + i, 25, 15 - (i % 10), 2.2 + (i % 8) / 10])
}

const overall = wb.addWorksheet('التقويم العام')
overall.views = [{ rightToLeft: true }]
overall.addRow(['التقدير', 'العدد'])
for (const row of [['ممتاز', 180], ['جيد جدًا', 90], ['جيد', 40], ['مقبول', 12]]) {
  overall.addRow(row)
}

const charts: ChartSpec[] = [
  {
    sheet: 'نتائج الأسئلة',
    title: 'المتوسط المصحَّح لكل سؤال (مقياس 1–3)',
    kind: 'bar',
    categories: colRef('نتائج الأسئلة', 1, 2, 26),
    series: [{ name: cellRef('نتائج الأسئلة', 6, 1), values: colRef('نتائج الأسئلة', 6, 2, 26) }],
    anchor: { col: 0, row: 27, cols: 9, rows: 25 },
    axis: { min: 1, max: 3 },
    dataLabels: true,
  },
  {
    sheet: 'نتائج الأسئلة',
    title: 'توزيع الإجابات على الخيارات لكل سؤال (%)',
    kind: 'col',
    categories: colRef('نتائج الأسئلة', 1, 2, 26),
    series: [3, 4, 5].map((c) => ({
      name: cellRef('نتائج الأسئلة', c, 1),
      values: colRef('نتائج الأسئلة', c, 2, 26),
    })),
    anchor: { col: 0, row: 54, cols: 9, rows: 22 },
    axis: { min: 0, max: 100 },
  },
  {
    sheet: 'التقويم العام',
    title: 'توزيع التقويم العام',
    kind: 'pie',
    categories: colRef('التقويم العام', 1, 2, 5),
    series: [{ name: cellRef('التقويم العام', 2, 1), values: colRef('التقويم العام', 2, 2, 5) }],
    anchor: { col: 0, row: 6, cols: 7, rows: 20 },
    varyColors: true,
  },
]

const written = await wb.xlsx.writeBuffer()
const withCharts = await injectCharts(written as ArrayBuffer, charts)
const file = join(out, 'charts.xlsx')
writeFileSync(file, Buffer.from(withCharts))
console.log(file)
