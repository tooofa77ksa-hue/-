import { formatAmount, formatRelative } from '../lib/format'
import { STATUS_LABELS, type Entry } from '../types'

interface EntryTableProps {
  entries: readonly Entry[]
  busyId: string | null
  onEdit: (entry: Entry) => void
  onDelete: (entry: Entry) => void
}

export function EntryTable({ entries, busyId, onEdit, onDelete }: EntryTableProps) {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">قائمة السجلات</caption>
        <thead>
          <tr>
            <th scope="col">العنوان</th>
            <th scope="col">التصنيف</th>
            <th scope="col">الحالة</th>
            <th scope="col" className="table__num">
              القيمة
            </th>
            <th scope="col">آخر تحديث</th>
            <th scope="col">
              <span className="sr-only">إجراءات</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className={busyId === entry.id ? 'is-busy' : undefined}>
              <td>
                <span className="table__title">{entry.title}</span>
                {entry.notes && <span className="table__notes">{entry.notes}</span>}
              </td>
              <td>
                <span className="chip">{entry.category || 'غير مصنّف'}</span>
              </td>
              <td>
                <span className={`status status--${entry.status}`}>
                  {STATUS_LABELS[entry.status]}
                </span>
              </td>
              <td className="table__num">{formatAmount(entry.amount)}</td>
              <td className="table__muted">{formatRelative(entry.updatedAt)}</td>
              <td>
                <div className="table__actions">
                  <button
                    type="button"
                    className="button button--small"
                    onClick={() => onEdit(entry)}
                    disabled={busyId === entry.id}
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    className="button button--small button--danger"
                    onClick={() => onDelete(entry)}
                    disabled={busyId === entry.id}
                  >
                    حذف
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
