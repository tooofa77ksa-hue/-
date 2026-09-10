import { nafesThird } from "./nafes-third";
import { nafesSixth } from "./nafes-sixth";

/**
 * نصوص التعليق الصوتي - عربية فصحى، مبنية حصرًا على بيانات نافس الفعلية.
 * كل عنصر يقابل ملف صوت واحد باسم `id` داخل public/audio/voice/{id}.mp3.
 * التقسيم مقصود إلى جمل قصيرة (سنة واحدة/فكرة واحدة لكل ملف) لتحقيق
 * مزامنة حقيقية بين الصوت والحركة البصرية (كل جملة = نبضة واحدة في
 * timeline.ts تتحكم بعمود واحد أو مؤشر واحد)، بدل جملة طويلة يصعب مزامنة
 * أجزائها الداخلية مع الصورة.
 */
export interface VoiceoverLine {
  id: string;
  text: string;
}

const t3 = nafesThird.headline.points;
const t6 = nafesSixth.headline.points;

export const voiceoverScript: VoiceoverLine[] = [
  {
    id: "intro_01",
    text: "بإشراف وزارة التعليم، نستعرض في هذا التقرير المرئي نتائج المدرسة في الاختبارات الوطنية نافس.",
  },

  // ------- الصف الثالث الابتدائي -------
  {
    id: "third_intro_01",
    text: "نستعرض الآن نتائج الصف الثالث الابتدائي في الاختبارات الوطنية نافس.",
  },
  {
    id: "third_trend_2023",
    text: `في عام ${t3[0].year} بلغت نسبة الطلبة الذين اجتازوا الحد الأدنى للإتقان في المجالين معًا ${fmt(t3[0].value)} بالمائة.`,
  },
  {
    id: "third_trend_2025",
    text: `وفي العام التالي، عام ${t3[1].year}، تراجعت النسبة إلى ${fmt(t3[1].value)} بالمائة.`,
  },
  {
    id: "third_trend_2026",
    text: `أما في عام ${t3[2].year} فنلاحظ ارتفاع المؤشر مجددًا إلى ${fmt(t3[2].value)} بالمائة.`,
  },
  {
    id: "third_compare_01",
    text: `ونلاحظ الفرق بين العامين الأخيرين بمقدار ${fmt(Math.abs(nafesThird.headline.latestChange))} نقطة.`,
  },
  {
    id: "third_subject_math_01",
    text: `وعند النظر إلى المجالين الفرعيين، ارتفع مؤشر الإتقان في الرياضيات بمقدار ${fmt(nafesThird.subjects[0].latestChangeProficiency)} نقطة.`,
  },
  {
    id: "third_subject_reading_01",
    text: `بينما تراجع في القراءة بمقدار ${fmt(Math.abs(nafesThird.subjects[1].latestChangeProficiency))} نقطة، ويعكس هذا الاتجاه تباينًا واضحًا بين المجالين يستدعي المتابعة.`,
  },
  {
    id: "third_summary_01",
    text: "بهذا نختتم استعراض نتائج الصف الثالث الابتدائي في اختبار نافس.",
  },

  {
    id: "transition_01",
    text: "وننتقل الآن إلى نتائج الصف السادس الابتدائي.",
  },

  // ------- الصف السادس الابتدائي -------
  {
    id: "sixth_intro_01",
    text: "نستعرض نتائج الصف السادس الابتدائي في الاختبارات الوطنية نافس.",
  },
  {
    id: "sixth_trend_2023",
    text: `في عام ${t6[0].year} بلغت نسبة الطلبة الذين اجتازوا الحد الأدنى للإتقان في المجالات الثلاثة معًا ${fmt(t6[0].value)} بالمائة فقط.`,
  },
  {
    id: "sixth_trend_2025",
    text: `وتُظهر النتائج تطورًا لافتًا في عام ${t6[1].year}، حيث ارتفعت النسبة إلى ${fmt(t6[1].value)} بالمائة.`,
  },
  {
    id: "sixth_trend_2026",
    text: `أما في عام ${t6[2].year} فقد تراجعت النسبة إلى ${fmt(t6[2].value)} بالمائة.`,
  },
  {
    id: "sixth_compare_01",
    text: `بفارق قدره ${fmt(Math.abs(nafesSixth.headline.latestChange))} نقطة عن العام السابق.`,
  },
  {
    id: "sixth_subject_science_01",
    text: `وفي المجالات الفرعية، ارتفع مؤشر الإتقان في العلوم بمقدار ${fmt(nafesSixth.subjects[0].latestChangeProficiency)} نقطة.`,
  },
  {
    id: "sixth_subject_math_01",
    text: `وفي الرياضيات بمقدار ${fmt(nafesSixth.subjects[2].latestChangeProficiency)} نقطة.`,
  },
  {
    id: "sixth_subject_reading_01",
    text: `في حين تراجع في القراءة بمقدار ${fmt(Math.abs(nafesSixth.subjects[1].latestChangeProficiency))} نقطة.`,
  },
  {
    id: "sixth_summary_01",
    text: "بهذا نختتم استعراض نتائج الصف السادس الابتدائي في اختبار نافس.",
  },

  {
    id: "outro_01",
    text: "شكرًا لمتابعتكم هذا التقرير، الصادر بإشراف وزارة التعليم.",
  },
];

function fmt(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return rounded.toString();
}

export const voiceoverById: Record<string, VoiceoverLine> = Object.fromEntries(
  voiceoverScript.map((line) => [line.id, line]),
);
