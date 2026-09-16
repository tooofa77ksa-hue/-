/*
  إعادة الترتيب بالسحب.
  dnd-kit مختار لأنه يعمل باللمس ولوحة المفاتيح معًا: المقبض قابل
  للتركيز، والمسافة/الأسهم تنقل العنصر — وهذا شرط لأن الترتيب وظيفة
  حقيقية لا حركة تجميلية.
  الحفظ يقع بعد الإفلات مرة واحدة (كتابة مجمّعة في repo.reorder).
*/
import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type Props<T extends { id: string }> = {
  items: T[];
  onReorder: (orderedIds: string[]) => void | Promise<void>;
  renderItem: (item: T) => ReactNode;
  disabled?: boolean;
};

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  disabled = false,
}: Props<T>) {
  const sensors = useSensors(
    // مسافة 6px قبل بدء السحب: بدونها يتحوّل كل نقر على بطاقة إلى سحب.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex).map((item) => item.id));
  }

  if (disabled) {
    return <div className="iz-sortable">{items.map((item) => <div key={item.id}>{renderItem(item)}</div>)}</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="iz-sortable">
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`iz-sortable__row ${isDragging ? "is-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        type="button"
        className="iz-drag-handle"
        aria-label="اسحبي لإعادة الترتيب"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <div className="iz-sortable__content">{children}</div>
    </div>
  );
}
