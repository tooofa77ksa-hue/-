/**
 * شارة «يحتاج مراجعة» — أداة إدارية داخلية.
 * هادئة بلون الهوية الرملي: تلفت النظر دون إنذار.
 */
export function ReviewBadge({ count }: { count?: number }) {
  return (
    <span className="review-badge" title="حالة تحتاج مراجعة الإدارة">
      <span className="review-badge__dot" aria-hidden="true" />
      يحتاج مراجعة
      {count !== undefined && count > 1 && <span className="review-badge__n">{count}</span>}
    </span>
  )
}

export function ReviewedBadge() {
  return (
    <span className="review-badge review-badge--done" title="اطّلعت عليها الإدارة">
      <span className="review-badge__dot" aria-hidden="true" />
      تمت مراجعته
    </span>
  )
}
