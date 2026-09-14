import { useEffect, useState } from "react";
import { addItem, deleteItem, markItemSeen, rateItem, subscribeItems } from "@/lib/repo";
import { AddItemForm } from "./AddItemForm";
import { ItemCard } from "./ItemCard";
import { StarRating } from "./StarRating";
import type { ItemSection, PortfolioItem, Subject } from "@/types/models";

interface RaterProps {
  teacherUid: string;
  subject: Subject;
}

export function SectionPanel({
  studentId,
  section,
  color,
  canAdd,
  rater,
  markSeenOnMount,
}: {
  studentId: string;
  section: ItemSection;
  color: string;
  canAdd: boolean;
  rater?: RaterProps;
  /** العائلة: علّمي كل تقييم جديد كمقروء بمجرد فتح هذا القسم. */
  markSeenOnMount?: boolean;
}) {
  const [items, setItems] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    return subscribeItems(studentId, section, setItems);
  }, [studentId, section]);

  useEffect(() => {
    if (!markSeenOnMount) return;
    // items يصل بشكل حيّ وغير متزامن من onSnapshot (فارغ في أول عرض) -
    // لازم يكون هذا التأثير معتمِدًا عليه فعليًا وإلا يشتغل قبل وصول
    // البيانات فلا يُعلَّم أي تقييم كمقروء أبدًا. الاستدعاء متكرر آمن هنا
    // (idempotent): بعد وضع seen=true لا يعود العنصر يطابق الفلتر.
    items.filter((it) => it.rating && !it.seen).forEach((it) => markItemSeen(studentId, it.id));
  }, [studentId, section, markSeenOnMount, items]);

  return (
    <div className="section-panel">
      {canAdd && (
        <AddItemForm onAdd={(input) => addItem(studentId, { section, ...input })} />
      )}
      <div className="section-panel__list">
        {items.length === 0 && <p className="section-panel__empty">ما فيه شي هنا بعد</p>}
        {items.map((item) => (
          <div key={item.id} className="section-panel__item">
            <ItemCard
              item={item}
              color={color}
              canDelete={canAdd}
              onDelete={() => deleteItem(studentId, item.id)}
            />
            {rater && (
              <RateBox
                item={item}
                onRate={(stars, comment) => rateItem(studentId, item.id, { stars, comment }, rater.teacherUid, rater.subject)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RateBox({ item, onRate }: { item: PortfolioItem; onRate: (stars: number, comment: string) => Promise<void> }) {
  const [stars, setStars] = useState(item.rating?.stars ?? 0);
  const [comment, setComment] = useState(item.rating?.comment ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await onRate(stars, comment);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rate-box">
      <StarRating value={stars} onChange={setStars} />
      <input
        placeholder="عبارة تشجيعية (اختياري)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="button" onClick={save} disabled={busy}>
        {item.rating ? "تحديث التقييم" : "تقييم"}
      </button>
    </div>
  );
}
