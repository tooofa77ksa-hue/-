import { HeartQr } from "./HeartQr";
import { StarRating } from "./StarRating";
import type { PortfolioItem } from "@/types/models";

export function ItemCard({
  item,
  color,
  canDelete,
  onDelete,
}: {
  item: PortfolioItem;
  color: string;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="item-card">
      <div className="item-card__title">{item.title}</div>
      <div className="item-card__body">
        {item.kind === "image" ? (
          <img className="item-card__image" src={item.url} alt={item.title} />
        ) : (
          <a href={item.url} target="_blank" rel="noreferrer noopener" className="item-card__link">
            <HeartQr value={item.url} color={color} size={130} />
            <span>افتحي الرابط</span>
          </a>
        )}
      </div>
      {item.rating && (
        <div className="item-card__rating">
          <StarRating value={item.rating.stars} readOnly />
          {item.rating.comment && <p className="item-card__comment">"{item.rating.comment}"</p>}
        </div>
      )}
      {canDelete && (
        <button type="button" className="item-card__delete" onClick={onDelete} aria-label="حذف">
          حذف
        </button>
      )}
    </div>
  );
}
