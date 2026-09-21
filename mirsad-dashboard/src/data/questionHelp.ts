import raw from './question-help.json'

/**
 * طبقة توضيح فوق أسئلة المصدر.
 *
 * لا تغيّر نص سؤال ولا خيارًا ولا درجة: تشرح للطالبة ولوليّ الأمر
 * ما الذي يُسأل عنه، وماذا تعني الموافقة في العبارات المنفية.
 *
 * السبب: ستٌّ من العبارات مصوغة صياغة سلبية («أشعر بالقلق أثناء
 * وجودي في المدرسة»)، فيوافق عليها من يقصد مدح المدرسة، فتُسجَّل
 * إجابته على عكس مراده. التوضيح يصحّح الفهم لا الإجابة، ولا يقول
 * أيّ الخيارات ينبغي اختياره.
 */
export interface QuestionHelp {
  plain: string
  reverseNote?: string
}

interface HelpFile {
  scale: {
    intro: string
    options: Record<string, string>
    reverseHeading: string
  }
  questions: Record<string, QuestionHelp>
}

const file = raw as unknown as HelpFile

export const SCALE_HELP = file.scale

export function helpFor(questionId: string): QuestionHelp | null {
  return file.questions[questionId] ?? null
}

/** شرح مختصر لمعنى كل خيار، يظهر تحت عنوانه. */
export function optionHint(label: string): string | null {
  return file.scale.options[label] ?? null
}
