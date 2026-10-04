import { SCHOOL_SCOPE, suggestionsInScope } from './analysis'
import type { ImprovementAction, Suggestion, SystemState } from '../domain/types'

export interface Band {
  action: ImprovementAction
  /** الآراء التي وُلد منها البند، بنصّها كما كتبته صاحباتها. */
  voices: Suggestion[]
}

/**
 * بنود التحسين ومعها أصواتها، مرتَّبةً بعدد ما تحتها.
 *
 * البند بلا صوتٍ تحته دعوى بلا بيّنة، فلا يُعرض. والترتيب بالعدد لا
 * بتاريخ الإنشاء: أكثر ما تكرّر على ألسنة الطالبات أولى بأول نظرة.
 *
 * وهي محسوبة هنا لا داخل الشاشة، لأن شاشة العرض تحتاج عددها قبل أن
 * ترسمها: عليها أن تعرف في كم شريحةٍ تُقسّمها.
 */
export function improvementBands(state: SystemState): Band[] {
  const all = suggestionsInScope(state, SCHOOL_SCOPE)
  const byId = new Map(all.map((s) => [s.id, s]))
  return state.improvementActions
    .map((action) => ({
      action,
      voices: action.linkedSuggestionIds
        .map((id) => byId.get(id))
        .filter((s): s is Suggestion => Boolean(s)),
    }))
    .filter((b) => b.voices.length > 0)
    .sort((x, y) => y.voices.length - x.voices.length)
}
