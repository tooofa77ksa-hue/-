import { useState } from "react";

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
  const [poppedStar, setPoppedStar] = useState<number | null>(null);

  const handleClick = (s: number) => {
    onChange?.(s);
    if (readOnly) return;
    setPoppedStar(s);
    window.setTimeout(() => setPoppedStar((cur) => (cur === s ? null : cur)), 350);
  };

  return (
    <div className={`star-rating ${readOnly ? "star-rating--readonly" : ""}`} role={readOnly ? undefined : "radiogroup"}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          className={`star-rating__star ${poppedStar === s ? "star-rating__star--pop" : ""}`}
          disabled={readOnly}
          aria-label={`${s} نجوم`}
          onClick={() => handleClick(s)}
        >
          {s <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
