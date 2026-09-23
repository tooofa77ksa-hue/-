import type { ReactNode } from 'react'

import { ORGANIZATION } from '../brand'
import { hijriToday } from '../lib/format'

/**
 * إطار التقرير: ترويسة وتذييل يتكرّران على كل صفحة مطبوعة.
 *
 * الطريقة جدول لا عنصر ثابت: المتصفّح يكرّر «thead» و«tfoot» على كل
 * صفحة من جدول ممتد — وهي الطريقة الوحيدة التي تعمل في متصفّحات
 * اليوم. جُرِّب «position: fixed» أولًا فرسم الترويسة مرة واحدة في
 * غير موضعها، ولا يملك CSS في هذه المتصفّحات صناديق هوامش الصفحة.
 *
 * على الشاشة يعود الجدول كتلًا عادية، فلا يتغيّر شكل التقرير وهو
 * يُقرأ متدفّقًا بلا صفحات.
 *
 * رقم الصفحة يضيفه المتصفّح من خيار «الترويسات والتذييلات» في نافذة
 * الطباعة: لا عدّاد صفحات في CSS هنا.
 */
export function ReportChrome(
  { title, scope, children }: { title: string; scope: string; children: ReactNode },
) {
  return (
    <table className="report-sheet">
      <thead className="report-sheet__head">
        <tr>
          <td>
            <div className="report__running report__running--top">
              <img className="report__running-logo" src={ORGANIZATION.logo} alt="" />
              <span className="report__running-org">{ORGANIZATION.directorate}</span>
              <span className="report__running-title">{title}</span>
            </div>
          </td>
        </tr>
      </thead>

      <tfoot className="report-sheet__foot">
        <tr>
          <td>
            <div className="report__running report__running--bottom">
              <span>{scope}</span>
              <span>وثيقة داخلية — صادرة عن المدرسة</span>
              <span>{hijriToday()}</span>
            </div>
          </td>
        </tr>
      </tfoot>

      <tbody className="report-sheet__body">
        <tr><td>{children}</td></tr>
      </tbody>
    </table>
  )
}
