interface StatCardProps {
  label: string
  value: string
  meta?: string
  tone?: 'blue' | 'green' | 'sand' | 'purple' | 'cyan' | 'navy'
  progress?: number
}

export function StatCard({ label, value, meta, tone = 'cyan', progress }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {meta && <p className="stat-card__meta">{meta}</p>}
      {progress !== undefined && (
        <div
          className="stat-card__bar"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
    </article>
  )
}
