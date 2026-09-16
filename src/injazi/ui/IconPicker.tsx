/*
  منتقي الأيقونات.
  الأيقونات تُخزَّن كأسماء نصية في Firestore وتُحلّ وقت العرض، فتستطيع
  المشرفة تغيير أيقونة أي مادة أو هواية دون لمس الكود.
  القائمة مغلقة عمدًا (لا استيراد ديناميكي لكل أيقونات Lucide): استيراد
  المكتبة كاملة كان سيضيف مئات الكيلوبايت لأجل أيقونة واحدة.
*/
import { useState } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { ICONS, ICON_NAMES } from "@/injazi/ui/iconRegistry";
import { DUR, EASE_POP } from "@/injazi/motion/motion";

/** يحلّ اسم الأيقونة إلى مكوّن، مع بديل آمن لأي اسم قديم أو محذوف. */
export function Icon({
  name,
  size = 20,
  strokeWidth = 2.2,
  className,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const Component = ICONS[name] ?? Sparkles;
  return <Component size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}

export function IconPicker({
  value,
  onChange,
  label = "الأيقونة",
}: {
  value: string;
  onChange: (name: string) => void;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const names = query
    ? ICON_NAMES.filter((name) => name.toLowerCase().includes(query.toLowerCase()))
    : ICON_NAMES;

  return (
    <div className="iz-field">
      <span className="iz-field__label">{label}</span>
      <input
        className="iz-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ابحثي عن أيقونة (بالإنجليزية)"
        aria-label="بحث عن أيقونة"
      />
      <div className="iz-icon-grid" role="radiogroup" aria-label={label}>
        {names.map((name) => (
          <motion.button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            aria-label={name}
            title={name}
            className={`iz-icon-option ${value === name ? "is-active" : ""}`}
            onClick={() => onChange(name)}
            whileHover={{ y: -3, scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: DUR.tap, ease: EASE_POP }}
          >
            <Icon name={name} size={20} />
          </motion.button>
        ))}
        {names.length === 0 && <p className="iz-field__meter">لا توجد أيقونة بهذا الاسم.</p>}
      </div>
    </div>
  );
}
