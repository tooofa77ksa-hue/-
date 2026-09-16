/*
  عناصر الواجهة الأساسية.
  كل شاشة في المنصة تُبنى من هذه العناصر فقط، فلا يظهر حقل إدخال أو
  بطاقة بشكل مختلف من صفحة لأخرى. الأبعاد والألوان كلها من الرموز.
*/
import { forwardRef } from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { motion } from "motion/react";
import { DUR, EASE_CLAY } from "@/injazi/motion/motion";

// ------------------------------------------------------------- بطاقة

type CardProps = {
  children: ReactNode;
  className?: string;
  /** زجاجي: يُستخدم فوق الأغلفة الملوّنة فقط، لا كأسلوب عام. */
  variant?: "solid" | "glass" | "outline";
  style?: CSSProperties;
};

export function Panel({ children, className = "", variant = "solid", style }: CardProps) {
  return (
    <div className={`iz-panel iz-panel--${variant} ${className}`} style={style}>
      {children}
    </div>
  );
}

// -------------------------------------------------------------- عنوان

export function SectionTitle({
  children,
  action,
  hint,
}: {
  children: ReactNode;
  action?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="iz-section-head">
      <div>
        <h2 className="iz-section-title">{children}</h2>
        {hint && <p className="iz-section-hint">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

// -------------------------------------------------------------- حقول

type FieldProps = { label: string; hint?: string; error?: string | null; children: ReactNode };

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="iz-field">
      <span className="iz-field__label">{label}</span>
      {children}
      {error ? (
        <span className="iz-field__error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="iz-field__meter">{hint}</span>
      )}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = "", ...props }, ref) {
    return <input ref={ref} className={`iz-input ${className}`} {...props} />;
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className = "", rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={`iz-input iz-input--area ${className}`} {...props} />;
  },
);

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function SelectInput({ className = "", children, ...props }, ref) {
    return (
      <select ref={ref} className={`iz-input iz-input--select ${className}`} {...props}>
        {children}
      </select>
    );
  },
);

// ------------------------------------------------------------- شارات

export function Chip({
  children,
  tone = "neutral",
  icon,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "info" | "gold";
  icon?: ReactNode;
}) {
  return (
    <span className={`iz-chip iz-chip--${tone}`}>
      {icon}
      {children}
    </span>
  );
}

// ------------------------------------------------------- بطاقة مؤشّر

export function MetricCard({
  icon,
  value,
  label,
  tone = "lilac",
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  tone?: string;
}) {
  return (
    <motion.div
      className={`iz-metric iz-tone--${tone}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.slow, ease: EASE_CLAY }}
    >
      <span className="iz-metric__icon">{icon}</span>
      <strong className="iz-metric__value">{value}</strong>
      <span className="iz-metric__label">{label}</span>
    </motion.div>
  );
}

// ------------------------------------------------------------ هياكل

/** هيكل تحميل — يحجز مساحة المحتوى الحقيقية فلا يقفز التخطيط عند وصوله. */
export function Skeleton({
  height = 16,
  width = "100%",
  radius = 10,
  className = "",
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
  className?: string;
}) {
  return (
    <span
      className={`iz-skeleton ${className}`}
      style={{ height, width, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="iz-skeleton-grid">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="iz-skeleton-card">
          <Skeleton height={132} radius={20} />
          <Skeleton height={18} width="70%" />
          <Skeleton height={14} width="45%" />
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------- تنبيه

export function Notice({ tone = "info", children }: { tone?: "info" | "danger"; children: ReactNode }) {
  return (
    <div className={`iz-notice iz-notice--${tone}`} role={tone === "danger" ? "alert" : undefined}>
      {children}
    </div>
  );
}
