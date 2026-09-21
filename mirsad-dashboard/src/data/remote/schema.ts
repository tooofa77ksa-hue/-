import type {
  Answer, AuditEntry, Category, ClassRoom, Cycle, Grade, ImprovementAction,
  Question, Student, Suggestion, SurveyResponse, SystemState,
} from '../../domain/types'

/**
 * تخطيط حالة النظام على مجموعات Firestore.
 *
 * مجموعة واحدة لكل كيان، ومعرّف المستند هو معرّف الكيان نفسه —
 * لا اسم الطالبة. هذا يطابق شرط «المفتاح معرّف ثابت لا اسم».
 *
 * الإجابات تُحفظ داخل مستند الاستجابة نفسه لا في مجموعة منفصلة:
 * فالاستجابة وإجاباتها وحدة واحدة تُكتب بعملية ذرّية واحدة، فلا
 * يمكن أن تصل استجابة بلا إجاباتها أو العكس.
 */
export const COLLECTIONS = {
  meta: 'meta',
  cycles: 'cycles',
  grades: 'grades',
  classes: 'classes',
  students: 'students',
  questions: 'questions',
  options: 'options',
  responses: 'responses',
  suggestions: 'suggestions',
  categories: 'categories',
  improvementActions: 'improvementActions',
  auditLogs: 'auditLogs',
  reviewAcks: 'reviewAcks',
} as const

/** مستند الإعدادات العامة الوحيد: ما ليس له معرّف مستقل. */
export const SYSTEM_DOC = 'system'

/**
 * مجموعات لا يجوز الحذف منها إطلاقًا.
 *
 * القواعد في firestore.rules ترفض الحذف منها على الخادم، وهذه القائمة
 * تمنع الطبقة المحلية من محاولته أصلًا، فلا يظهر خطأ صلاحيات على
 * عملية ما كان ينبغي أن تُطلب.
 */
export const NEVER_DELETE: ReadonlySet<string> = new Set([
  COLLECTIONS.students,
  COLLECTIONS.responses,
  COLLECTIONS.suggestions,
  COLLECTIONS.auditLogs,
])

/** مستند الاستجابة كما يُخزَّن: الاستجابة + إجاباتها. */
export interface ResponseDoc extends Omit<SurveyResponse, 'id'> {
  answers: Omit<Answer, 'responseId'>[]
}

/** يجمع الإجابات المسطّحة داخل استجاباتها قبل الكتابة. */
export function toResponseDocs(
  responses: SurveyResponse[],
  answers: Answer[],
): { id: string; doc: ResponseDoc }[] {
  const byResponse = new Map<string, Omit<Answer, 'responseId'>[]>()
  for (const a of answers) {
    const bucket = byResponse.get(a.responseId)
    const entry = { questionId: a.questionId, rawValue: a.rawValue, optionId: a.optionId, score: a.score }
    if (bucket) bucket.push(entry)
    else byResponse.set(a.responseId, [entry])
  }
  return responses.map(({ id, ...rest }) => ({
    id,
    doc: { ...rest, answers: byResponse.get(id) ?? [] },
  }))
}

/** يعيد تسطيح مستندات الاستجابات إلى الشكل الذي تتوقعه الحالة. */
export function fromResponseDocs(
  docs: { id: string; doc: ResponseDoc }[],
): { responses: SurveyResponse[]; answers: Answer[] } {
  const responses: SurveyResponse[] = []
  const answers: Answer[] = []
  for (const { id, doc } of docs) {
    const { answers: docAnswers, ...rest } = doc
    responses.push({ id, ...rest })
    for (const a of docAnswers ?? []) answers.push({ responseId: id, ...a })
  }
  return { responses, answers }
}

/** ما ليس له معرّف مستقل، يُحفظ في مستند واحد. */
export interface SystemDoc {
  meta: SystemState['meta']
  overallOptions: string[]
  duplicateGroups: SystemState['duplicateGroups']
  version: number
}

export function toSystemDoc(state: SystemState): SystemDoc {
  return {
    meta: state.meta,
    overallOptions: state.overallOptions,
    duplicateGroups: state.duplicateGroups,
    version: state.version,
  }
}

/** الكيانات ذات المعرّفات، مجموعةً مجموعة. */
export interface IdentifiedSlices {
  cycles: Cycle[]
  grades: Grade[]
  classes: ClassRoom[]
  students: Student[]
  questions: Question[]
  options: SystemState['options']
  suggestions: Suggestion[]
  categories: Category[]
  improvementActions: ImprovementAction[]
  audit: AuditEntry[]
}

/** اسم المجموعة المقابل لكل شريحة في الحالة. */
export const SLICE_COLLECTION: Record<keyof IdentifiedSlices, string> = {
  cycles: COLLECTIONS.cycles,
  grades: COLLECTIONS.grades,
  classes: COLLECTIONS.classes,
  students: COLLECTIONS.students,
  questions: COLLECTIONS.questions,
  options: COLLECTIONS.options,
  suggestions: COLLECTIONS.suggestions,
  categories: COLLECTIONS.categories,
  improvementActions: COLLECTIONS.improvementActions,
  audit: COLLECTIONS.auditLogs,
}
