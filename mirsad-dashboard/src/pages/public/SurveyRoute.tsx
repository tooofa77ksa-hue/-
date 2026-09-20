import { useParams } from 'react-router-dom'

import { SurveyPage } from './SurveyPage'

/**
 * يعيد تركيب صفحة القياس عند تغيّر رابط الفصل.
 * بدون ذلك يبقى الاختيار السابق ظاهرًا عند الانتقال من رابط فصل إلى آخر
 * أو من الرابط العام إلى رابط فصل داخل الجلسة نفسها.
 */
export function SurveyRoute() {
  const { classId } = useParams()
  return <SurveyPage key={classId ?? 'public'} />
}
