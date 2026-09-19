import { formatAmount, formatCount, formatRelative } from '../lib/format'
import { percentage, type DashboardStats } from '../lib/stats'

interface StatCardsProps {
  stats: DashboardStats
}

export function StatCards({ stats }: StatCardsProps) {
  const activeShare = percentage(stats.active, stats.total)

  const cards = [
    {
      key: 'total',
      label: 'إجمالي السجلات',
      value: formatCount(stats.total),
      meta: stats.lastUpdatedAt
        ? `آخر تحديث ${formatRelative(stats.lastUpdatedAt)}`
        : 'لا توجد سجلات بعد',
    },
    {
      key: 'active',
      label: 'السجلات النشطة',
      value: formatCount(stats.active),
      meta: `${formatCount(activeShare)}٪ من الإجمالي`,
      progress: activeShare,
    },
    {
      key: 'pending',
      label: 'قيد المراجعة',
      value: formatCount(stats.pending),
      meta: stats.archived > 0 ? `و${formatCount(stats.archived)} مؤرشف` : 'لا يوجد أرشيف',
    },
    {
      key: 'amount',
      label: 'القيمة الإجمالية',
      value: formatAmount(stats.totalAmount),
      meta: stats.total > 0 ? `المتوسط ${formatAmount(stats.averageAmount)}` : '—',
    },
  ]

  return (
    <section className="stats" aria-label="ملخّص اللوحة">
      {cards.map((card) => (
        <article key={card.key} className={`stat-card stat-card--${card.key}`}>
          <p className="stat-card__label">{card.label}</p>
          <p className="stat-card__value">{card.value}</p>
          <p className="stat-card__meta">{card.meta}</p>
          {card.progress !== undefined && (
            <div
              className="stat-card__bar"
              role="progressbar"
              aria-valuenow={card.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="نسبة السجلات النشطة"
            >
              <span style={{ width: `${card.progress}%` }} />
            </div>
          )}
        </article>
      ))}
    </section>
  )
}
