export function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`star-rating ${readOnly ? "star-rating--readonly" : ""}`} role={readOnly ? undefined : "radiogroup"}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          className="star-rating__star"
          disabled={readOnly}
          aria-label={`${s} نجوم`}
          onClick={() => onChange?.(s)}
        >
          {s <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
