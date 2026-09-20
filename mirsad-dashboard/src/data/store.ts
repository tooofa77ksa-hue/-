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
    version: SCHEMA_VERSION,
  }
}

function safeRead(): SystemState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SystemState
    if (parsed.version !== SCHEMA_VERSION) return null
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

/** نسخة احتياطية كاملة قبل أي عملية واسعة. */
export function exportBackup(state: SystemState): string {
  return JSON.stringify(state, null, 2)
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
