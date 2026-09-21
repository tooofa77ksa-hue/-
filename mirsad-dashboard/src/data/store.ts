import type {
  AuditEntry, Dataset, Id, ImprovementAction, Student, SystemState,
} from '../domain/types'
import { DEFAULT_CATEGORIES } from './categories'
import { hasSchoolData, schoolData } from './loadSchoolData'
import definition from './survey-definition.json'

const STORAGE_KEY = 'qiyas.state.v1'
const SCHEMA_VERSION = 2

/**
 * مجموعة البيانات = تعريف القياس (محفوظ في المستودع)
 *                 + بيانات المدرسة (شخصية، مستثناة من المستودع).
 */
const dataset = { ...definition, ...schoolData } as unknown as Dataset

export { hasSchoolData }

/** الحالة الابتدائية: بيانات المصدر الحقيقية + ما تضيفه الإدارة. */
export function initialState(): SystemState {
  return {
    ...structuredClone(dataset),
    categories: DEFAULT_CATEGORIES,
    improvementActions: [],
    audit: [],
    reviewAcks: {},
    version: SCHEMA_VERSION,
  }
}

function safeRead(): SystemState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SystemState
    if (parsed.version !== SCHEMA_VERSION) return null
    // حالة محفوظة قبل إضافة طبقة التمييز: تُستكمل بقيمة فارغة
    // بدل إهدار عمل الإدارة بإعادة التهيئة من الصفر.
    if (!parsed.reviewAcks) parsed.reviewAcks = {}
    return parsed
  } catch {
    return null
  }
}

function safeWrite(state: SystemState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // التخزين محجوب — تبقى الحالة في الذاكرة لهذه الجلسة
  }
}

export function loadState(): SystemState {
  return safeRead() ?? initialState()
}

export function saveState(state: SystemState): void {
  safeWrite(state)
}

/** بصمة محتوى بسيطة للتحقق من سلامة الملف عند الاستعادة. */
function checksum(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export interface BackupFile {
  format: 'qiyas-backup'
  formatVersion: number
  schemaVersion: number
  createdAt: string
  school: string
  survey: string
  hijriYear: string
  /** إحصاءات تُعرض للإدارة قبل الاستعادة لتتأكد أنها الملف الصحيح. */
  summary: {
    grades: number
    classes: number
    students: number
    responses: number
    answers: number
    suggestions: number
    improvementActions: number
    reviewAcks: number
    auditEntries: number
  }
  checksum: string
  state: SystemState
}

const BACKUP_FORMAT_VERSION = 1

/** نسخة احتياطية كاملة: كل ما يلزم لإعادة النظام إلى لحظته هذه. */
export function exportBackup(state: SystemState): string {
  const payload = JSON.stringify(state)
  const file: BackupFile = {
    format: 'qiyas-backup',
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: state.version,
    createdAt: new Date().toISOString(),
    school: state.meta.school,
    survey: `${state.meta.surveyTitle} ${state.meta.hijriYear}هـ`,
    hijriYear: state.meta.hijriYear,
    summary: {
      grades: state.grades.length,
      classes: state.classes.length,
      students: state.students.length,
      responses: state.responses.length,
      answers: state.answers.length,
      suggestions: state.suggestions.length,
      improvementActions: state.improvementActions.length,
      reviewAcks: Object.keys(state.reviewAcks ?? {}).length,
      auditEntries: state.audit.length,
    },
    checksum: checksum(payload),
    state,
  }
  return JSON.stringify(file, null, 2)
}

export interface BackupInspection {
  ok: boolean
  /** سبب الرفض بالعربية، أو null عند السلامة. */
  error: string | null
  file: BackupFile | null
}

/**
 * يفحص ملف نسخة احتياطية دون تطبيقه.
 *
 * الاستعادة عملية تستبدل كل شيء، فلا تجري إلا بعد أن ترى الإدارة
 * محتوى الملف وتؤكّد صراحةً.
 */
export function inspectBackup(text: string): BackupInspection {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'الملف ليس بصيغة JSON صالحة', file: null }
  }

  const file = parsed as Partial<BackupFile>
  if (file.format !== 'qiyas-backup') {
    return { ok: false, error: 'هذا ليس ملف نسخة احتياطية من هذا النظام', file: null }
  }
  if (file.formatVersion !== BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      error: `صيغة النسخة (${file.formatVersion}) لا يدعمها هذا الإصدار (${BACKUP_FORMAT_VERSION})`,
      file: null,
    }
  }
  if (!file.state || typeof file.state !== 'object') {
    return { ok: false, error: 'الملف لا يحتوي على بيانات النظام', file: null }
  }
  if (file.schemaVersion !== SCHEMA_VERSION) {
    return {
      ok: false,
      error: `بنية البيانات في الملف (${file.schemaVersion}) تخالف بنية النظام الحالي (${SCHEMA_VERSION})`,
      file: null,
    }
  }
  if (checksum(JSON.stringify(file.state)) !== file.checksum) {
    return { ok: false, error: 'بصمة الملف لا تطابق محتواه — قد يكون تعرّض للتلف أو التعديل', file: null }
  }

  const required = ['meta', 'grades', 'classes', 'students', 'questions', 'responses', 'answers']
  const missing = required.filter((k) => !(k in (file.state as object)))
  if (missing.length > 0) {
    return { ok: false, error: `ينقص الملف: ${missing.join('، ')}`, file: null }
  }

  return { ok: true, error: null, file: file as BackupFile }
}

/** يطبّق نسخة احتياطية مفحوصة ويحفظها. لا يُستدعى إلا بعد تأكيد صريح. */
export function restoreBackup(file: BackupFile): SystemState {
  const state: SystemState = {
    ...file.state,
    reviewAcks: file.state.reviewAcks ?? {},
    version: SCHEMA_VERSION,
  }
  safeWrite(state)
  return state
}

export function resetToSource(): SystemState {
  const fresh = initialState()
  safeWrite(fresh)
  return fresh
}

let auditSeq = 0

export function audit(
  state: SystemState,
  operation: string,
  entity: string,
  recordId: Id,
  details: string,
  actor = 'إدارة المدرسة',
): AuditEntry {
  const entry: AuditEntry = {
    id: `au-${Date.now().toString(36)}-${(auditSeq++).toString(36)}`,
    at: new Date().toISOString(),
    operation,
    entity,
    recordId,
    actor,
    details,
  }
  state.audit = [entry, ...state.audit].slice(0, 2000)
  return entry
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}

export type { Student, ImprovementAction }
