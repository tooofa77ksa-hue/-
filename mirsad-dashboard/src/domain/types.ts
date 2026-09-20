/** نماذج بيانات نظام «قياس اتجاه المتعلمين». */

export type Id = string

export interface Meta {
  school: string
  directorate: string
  surveyTitle: string
  hijriYear: string
  academicYear: string
  generatedAt: string
  sources: string[]
  scale: { min: number; max: number }
}

export interface Cycle {
  id: Id
  name: string
  academicYear: string
  hijriYear: string
  status: 'open' | 'closed'
  questionIds: Id[]
}

export interface Grade {
  id: Id
  no: number
  name: string
}

export interface ClassRoom {
  id: Id
  gradeId: Id
  name: string
  source: 'roster' | 'manual'
  sourceFile?: string
}

export type StudentStatus = 'active' | 'archived'

export interface Student {
  id: Id
  name: string
  normalizedName: string
  gradeId: Id
  classId: Id | null
  rosterNo: number | null
  source: 'roster' | 'manual'
  sourceFile?: string
  status: StudentStatus
  archivedAt: string | null
}

export type QuestionKind = 'likert' | 'overall' | 'text'
export type QuestionDirection = 'positive' | 'reverse' | 'descriptive'

export interface Question {
  id: Id
  order: number
  /** النص الأصلي كما ورد في المصدر — لا يُعاد صياغته إطلاقًا. */
  text: string
  kind: QuestionKind
  scored: boolean
  direction: QuestionDirection
  reverseNote: string | null
  required: boolean
  active: boolean
  weight: number
}

export interface AnswerOption {
  id: Id
  label: string
  score: number
}

/** حالة مطابقة الاستجابة بطالبة في الكشف الرسمي. */
export type MatchStatus = 'MATCHED' | 'POSSIBLE_MATCH' | 'NEW' | 'LEGACY' | 'DUPLICATE'

export interface SurveyResponse {
  id: Id
  cycleId: Id
  /** لا يُملأ إلا عند تطابق مؤكّد أو تأكيد إداري صريح. */
  studentId: Id | null
  rawName: string
  declaredGradeId: Id | null
  classId: Id | null
  matchStatus: MatchStatus
  candidateStudentIds: Id[]
  duplicateFlag: boolean
  source: 'import' | 'web'
  sourceFile?: string
  sourceRow?: number
  submittedAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
}

export interface Answer {
  responseId: Id
  questionId: Id
  /** القيمة كما وردت حرفيًا. */
  rawValue: string | null
  optionId: Id | null
  score: number | null
}

export type SuggestionStatus = 'new' | 'reviewed' | 'linked' | 'closed'

export interface Suggestion {
  id: Id
  responseId: Id
  studentId: Id | null
  gradeId: Id | null
  classId: Id | null
  /** نص الطالبة الأصلي — لا يُحرَّر أبدًا. */
  text: string
  categoryId: Id | null
  status: SuggestionStatus
  sourceFile?: string
  sourceRow?: number
}

export type ActionStatus = 'planned' | 'in_progress' | 'completed'
export type ActionPriority = 'high' | 'medium' | 'low'

export interface Evidence {
  id: Id
  kind: 'link' | 'note'
  label: string
  value: string
  addedAt: string
}

export interface ImprovementAction {
  id: Id
  title: string
  problem: string
  categoryId: Id | null
  sourceNote: string
  mentions: number
  priority: ActionPriority
  action: string
  owner: string
  startDate: string | null
  dueDate: string | null
  doneDate: string | null
  status: ActionStatus
  notes: string
  evidence: Evidence[]
  impact: string
  followUp: string
  linkedSuggestionIds: Id[]
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: Id
  name: string
}

export interface AuditEntry {
  id: Id
  at: string
  operation: string
  entity: string
  recordId: Id
  actor: string
  details: string
}

export interface Dataset {
  meta: Meta
  cycles: Cycle[]
  grades: Grade[]
  classes: ClassRoom[]
  students: Student[]
  questions: Question[]
  options: AnswerOption[]
  overallOptions: string[]
  responses: SurveyResponse[]
  answers: Answer[]
  suggestions: Suggestion[]
  duplicateGroups: { key: string; gradeId: Id | null; responseIds: Id[] }[]
}

/** الحالة الكاملة للنظام: بيانات المصدر + ما تضيفه الإدارة. */
export interface SystemState extends Dataset {
  categories: Category[]
  improvementActions: ImprovementAction[]
  audit: AuditEntry[]
  version: number
}
