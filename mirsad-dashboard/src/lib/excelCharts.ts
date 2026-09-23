/**
 * رسوم بيانية أصلية داخل ملف Excel.
 *
 * مكتبة ExcelJS تكتب الجداول ولا تكتب الرسوم، فالرسم يُحقن هنا في
 * ملف الإخراج نفسه: ملف xlsx حزمة مضغوطة من أجزاء XML، فنضيف جزء
 * الرسم وجزء اللوحة ونربطهما بالورقة.
 *
 * الرسم أصليّ لا صورة ملصقة: يُطبع بدقة الطابعة مهما كُبِّر، ويقرأ
 * قيمه من خلايا الورقة نفسها — فإن صُحّح رقم في الجدول تحرّك العمود
 * معه، ولا يبقى في التقرير رسمٌ يقول غير ما يقوله جدوله.
 */

const NS_C = 'http://schemas.openxmlformats.org/drawingml/2006/chart'
const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const NS_XDR = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'

const REL_CHART = `${NS_R}/chart`
const REL_DRAWING = `${NS_R}/drawing`

/** لوحة ألوان الرسوم: كحلي الوزارة وفيروزيّها ورمليّها ومساندة داكنة. */
export const CHART_COLORS = [
  '15445A', '0DA9A6', 'C1B489', '3D7EB9', '7258A4', '07A869',
]

export type ChartKind = 'col' | 'bar' | 'pie'

export interface ChartSeries {
  /** مرجع خلية اسم السلسلة، أو النص مباشرة. */
  name: string
  /** مرجع مطلق لقيم السلسلة: 'الورقة'!$D$8:$D$32 */
  values: string
  color?: string
}

export interface ChartSpec {
  /** اسم الورقة التي يوضع فيها الرسم. */
  sheet: string
  title: string
  kind: ChartKind
  /** مرجع مطلق لأسماء الفئات. */
  categories: string
  series: ChartSeries[]
  /** موضع الرسم بالخلايا (يبدأ من الصفر). */
  anchor: { col: number; row: number; cols: number; rows: number }
  /** تدرّج ألوان لكل نقطة — للدائري خاصة. */
  varyColors?: boolean
  /** حدّا المحور الرقمي حين يكون المقياس معروفًا سلفًا. */
  axis?: { min?: number; max?: number }
  /** إظهار القيمة فوق كل عمود. */
  dataLabels?: boolean
}

const esc = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;')

/** نصّ عربي داخل الرسم: اتجاه من اليمين ومحاذاة إليه. */
function textProps(size = 1000, bold = false): string {
  return `<c:txPr><a:bodyPr rot="0" rtlCol="1"/><a:lstStyle/><a:p><a:pPr algn="r" rtl="1">`
    + `<a:defRPr sz="${size}" b="${bold ? 1 : 0}" lang="ar-SA">`
    + `<a:solidFill><a:srgbClr val="15445A"/></a:solidFill>`
    + `<a:latin typeface="Arial"/><a:cs typeface="Arial"/></a:defRPr>`
    + `</a:pPr><a:endParaRPr lang="ar-SA"/></a:p></c:txPr>`
}

function titleXml(text: string): string {
  return `<c:title><c:tx><c:rich><a:bodyPr rtlCol="1"/><a:lstStyle/>`
    + `<a:p><a:pPr algn="r" rtl="1"><a:defRPr sz="1200" b="1" lang="ar-SA">`
    + `<a:solidFill><a:srgbClr val="15445A"/></a:solidFill>`
    + `<a:latin typeface="Arial"/><a:cs typeface="Arial"/></a:defRPr></a:pPr>`
    + `<a:r><a:rPr lang="ar-SA" sz="1200" b="1"/><a:t>${esc(text)}</a:t></a:r>`
    + `</a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>`
}

function seriesXml(s: ChartSeries, i: number, spec: ChartSpec): string {
  const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length]
  const nameIsRef = s.name.includes('!$')
  const tx = nameIsRef
    ? `<c:tx><c:strRef><c:f>${esc(s.name)}</c:f></c:strRef></c:tx>`
    : `<c:tx><c:v>${esc(s.name)}</c:v></c:tx>`
  const fill = spec.varyColors
    ? ''
    : `<c:spPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill>`
      + `<a:ln><a:noFill/></a:ln></c:spPr>`
  const labels = spec.dataLabels
    ? `<c:dLbls><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${textProps(900)}`
      + `<c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/>`
      + `<c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>`
    : ''
  // ترتيب العناصر داخل c:ser مُلزِم في المخطط: idx, order, tx, spPr, dLbls, cat, val
  return `<c:ser><c:idx val="${i}"/><c:order val="${i}"/>${tx}${fill}${labels}`
    + `<c:cat><c:strRef><c:f>${esc(spec.categories)}</c:f></c:strRef></c:cat>`
    + `<c:val><c:numRef><c:f>${esc(s.values)}</c:f></c:numRef></c:val></c:ser>`
}

function axisPairXml(spec: ChartSpec): string {
  const catId = 111111111
  const valId = 222222222
  const min = spec.axis?.min !== undefined ? `<c:min val="${spec.axis.min}"/>` : ''
  const max = spec.axis?.max !== undefined ? `<c:max val="${spec.axis.max}"/>` : ''
  const line = `<c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="B9D2D3"/></a:solidFill></a:ln></c:spPr>`
  // ترتيب الأبناء داخل المحور مُلزِم في مخطط OOXML، وأيّ تقديم أو تأخير
  // يجعل Excel يفتح الملف برسالة «إصلاح». التسلسل هنا كما في المعيار:
  // axId, scaling, delete, axPos, majorGridlines, numFmt, tickLblPos, spPr, txPr, crossAx, …
  return `<c:catAx><c:axId val="${catId}"/><c:scaling><c:orientation val="minMax"/></c:scaling>`
    + `<c:delete val="0"/><c:axPos val="${spec.kind === 'bar' ? 'l' : 'b'}"/>`
    + `<c:tickLblPos val="nextTo"/>${line}${textProps(900)}`
    + `<c:crossAx val="${valId}"/><c:crosses val="autoZero"/><c:auto val="1"/>`
    + `<c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>`
    + `<c:valAx><c:axId val="${valId}"/><c:scaling><c:orientation val="minMax"/>${max}${min}</c:scaling>`
    + `<c:delete val="0"/><c:axPos val="${spec.kind === 'bar' ? 'b' : 'l'}"/>`
    + `<c:majorGridlines><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="E4EDEE"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>`
    + `<c:numFmt formatCode="General" sourceLinked="1"/><c:tickLblPos val="nextTo"/>${line}${textProps(900)}`
    + `<c:crossAx val="${catId}"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>`
}

function plotXml(spec: ChartSpec): string {
  const sers = spec.series.map((s, i) => seriesXml(s, i, spec)).join('')
  if (spec.kind === 'pie') {
    return `<c:pieChart><c:varyColors val="1"/>${sers}`
      + `<c:dLbls>${textProps(900)}<c:showLegendKey val="0"/><c:showVal val="0"/>`
      + `<c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="1"/>`
      + `<c:showBubbleSize val="0"/></c:dLbls>`
      + `<c:firstSliceAng val="0"/></c:pieChart>`
  }
  return `<c:barChart><c:barDir val="${spec.kind}"/><c:grouping val="clustered"/>`
    + `<c:varyColors val="${spec.varyColors ? 1 : 0}"/>${sers}`
    + `<c:gapWidth val="60"/><c:overlap val="-20"/>`
    + `<c:axId val="111111111"/><c:axId val="222222222"/></c:barChart>${axisPairXml(spec)}`
}

function chartXml(spec: ChartSpec): string {
  const legend = spec.series.length > 1 || spec.kind === 'pie'
    ? `<c:legend><c:legendPos val="b"/><c:overlay val="0"/>${textProps(900)}</c:legend>`
    : ''
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<c:chartSpace xmlns:c="${NS_C}" xmlns:a="${NS_A}" xmlns:r="${NS_R}">`
    + `<c:roundedCorners val="0"/><c:chart>${titleXml(spec.title)}`
    + `<c:plotArea><c:layout/>${plotXml(spec)}`
    + `<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr></c:plotArea>`
    + `${legend}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>`
    + `<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>`
    + `<a:ln w="9525"><a:solidFill><a:srgbClr val="D6E4E5"/></a:solidFill></a:ln></c:spPr>`
    + `</c:chartSpace>`
}

function drawingXml(specs: ChartSpec[]): string {
  const anchors = specs.map((spec, i) => {
    const a = spec.anchor
    return `<xdr:twoCellAnchor>`
      + `<xdr:from><xdr:col>${a.col}</xdr:col><xdr:colOff>0</xdr:colOff>`
      + `<xdr:row>${a.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>`
      + `<xdr:to><xdr:col>${a.col + a.cols}</xdr:col><xdr:colOff>0</xdr:colOff>`
      + `<xdr:row>${a.row + a.rows}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>`
      + `<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr>`
      + `<xdr:cNvPr id="${i + 2}" name="${esc(spec.title)}"/><xdr:cNvGraphicFramePr/>`
      + `</xdr:nvGraphicFramePr>`
      + `<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>`
      + `<a:graphic><a:graphicData uri="${NS_C}">`
      + `<c:chart xmlns:c="${NS_C}" xmlns:r="${NS_R}" r:id="rId${i + 1}"/>`
      + `</a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<xdr:wsDr xmlns:xdr="${NS_XDR}" xmlns:a="${NS_A}">${anchors}</xdr:wsDr>`
}

/** العناصر التي تأتي بعد <drawing> في مخطط الورقة — يُدرج قبل أولها. */
const AFTER_DRAWING = /<(legacyDrawing|legacyDrawingHF|picture|oleObjects|controls|webPublishItems|tableParts|extLst)[\s>/]/

/**
 * يحقن الرسوم في ملف xlsx جاهز ويعيده.
 *
 * لا يلمس أي جزء لا يخصّ الرسوم: الجداول والأنماط تبقى كما كتبتها
 * ExcelJS حرفًا بحرف.
 */
export async function injectCharts(
  buffer: ArrayBuffer, specs: ChartSpec[],
): Promise<ArrayBuffer> {
  if (specs.length === 0) return buffer

  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(buffer)

  const read = async (path: string) => {
    const file = zip.file(path)
    return file ? file.async('string') : null
  }

  // ١) خريطة اسم الورقة ← ملفها، عبر workbook.xml وعلاقاته
  const workbook = await read('xl/workbook.xml')
  const wbRels = await read('xl/_rels/workbook.xml.rels')
  if (!workbook || !wbRels) return buffer

  const relTarget = new Map<string, string>()
  for (const m of wbRels.matchAll(/<Relationship\b[^>]*\/>/g)) {
    const id = /Id="([^"]+)"/.exec(m[0])?.[1]
    const target = /Target="([^"]+)"/.exec(m[0])?.[1]
    if (id && target) relTarget.set(id, target.replace(/^\//, '').replace(/^xl\//, ''))
  }

  const sheetPath = new Map<string, string>()
  for (const m of workbook.matchAll(/<sheet\b[^>]*\/>/g)) {
    const name = /name="([^"]+)"/.exec(m[0])?.[1]
    const rid = /r:id="([^"]+)"/.exec(m[0])?.[1]
    const target = rid ? relTarget.get(rid) : undefined
    if (name && target) {
      sheetPath.set(name.replace(/&amp;/g, '&').replace(/&quot;/g, '"'), `xl/${target}`)
    }
  }

  // ٢) تجميع الرسوم حسب الورقة: لكل ورقة لوحة واحدة تحمل رسومها
  const bySheet = new Map<string, ChartSpec[]>()
  for (const spec of specs) {
    if (!sheetPath.has(spec.sheet)) continue
    const list = bySheet.get(spec.sheet) ?? []
    list.push(spec)
    bySheet.set(spec.sheet, list)
  }
  if (bySheet.size === 0) return buffer

  const overrides: string[] = []
  let chartNo = 0
  let drawingNo = 0

  for (const [sheet, sheetSpecs] of bySheet) {
    const path = sheetPath.get(sheet)!
    const sheetXml = await read(path)
    if (!sheetXml) continue

    drawingNo += 1
    const drawingPath = `xl/drawings/drawing${drawingNo}.xml`

    // أجزاء الرسوم وعلاقات اللوحة بها
    const drawingRels: string[] = []
    sheetSpecs.forEach((spec, i) => {
      chartNo += 1
      const chartPath = `xl/charts/chart${chartNo}.xml`
      zip.file(chartPath, chartXml(spec))
      overrides.push(`<Override PartName="/${chartPath}"`
        + ` ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`)
      drawingRels.push(`<Relationship Id="rId${i + 1}" Type="${REL_CHART}"`
        + ` Target="../charts/chart${chartNo}.xml"/>`)
    })

    zip.file(drawingPath, drawingXml(sheetSpecs))
    zip.file(`xl/drawings/_rels/drawing${drawingNo}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
      + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
      + `${drawingRels.join('')}</Relationships>`)
    overrides.push(`<Override PartName="/${drawingPath}"`
      + ` ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`)

    // ٣) ربط الورقة باللوحة: معرّف علاقة لا يصطدم بما كتبته ExcelJS
    const relsPath = path.replace(/worksheets\/(.+)$/, 'worksheets/_rels/$1.rels')
    const existing = await read(relsPath)
    const used = new Set(
      [...(existing ?? '').matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1])),
    )
    let rid = 1
    while (used.has(rid)) rid += 1
    const relation = `<Relationship Id="rId${rid}" Type="${REL_DRAWING}"`
      + ` Target="../drawings/drawing${drawingNo}.xml"/>`

    zip.file(relsPath, existing
      ? existing.replace('</Relationships>', `${relation}</Relationships>`)
      : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
        + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
        + `${relation}</Relationships>`)

    // ٤) وسم <drawing/> في مكانه من ترتيب المخطط، وإلا رفض Excel الملف
    const tag = `<drawing r:id="rId${rid}"/>`
    const after = AFTER_DRAWING.exec(sheetXml)
    zip.file(path, after
      ? sheetXml.slice(0, after.index) + tag + sheetXml.slice(after.index)
      : sheetXml.replace('</worksheet>', `${tag}</worksheet>`))
  }

  // ٥) تسجيل الأجزاء الجديدة في فهرس الأنواع
  const types = await read('[Content_Types].xml')
  if (types) {
    zip.file('[Content_Types].xml',
      types.replace('</Types>', `${overrides.join('')}</Types>`))
  }

  return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
}

/** مرجع مطلق لمدى عمودي في ورقة، بصيغة Excel. */
export function colRef(sheet: string, column: number, firstRow: number, lastRow: number): string {
  const letter = columnLetter(column)
  return `'${sheet.replace(/'/g, "''")}'!$${letter}$${firstRow}:$${letter}$${lastRow}`
}

/** مرجع مطلق لخلية واحدة. */
export function cellRef(sheet: string, column: number, row: number): string {
  return `'${sheet.replace(/'/g, "''")}'!$${columnLetter(column)}$${row}`
}

export function columnLetter(column: number): string {
  let n = column
  let out = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    out = String.fromCharCode(65 + rem) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}
