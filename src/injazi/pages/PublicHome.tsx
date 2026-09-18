/*
  الصفحة الرئيسية العامة.
  ترتيب مقصود: ترحيب قصير + عالم ثلاثي الأبعاد، ثم بطاقات الطالبات —
  لأن سبب زيارة أي ولي أمر هو ابنته، فلا يُدفن المعرض أسفل الصفحة.
*/
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, Sparkles } from "lucide-react";
import { ButterflyEntrance } from "@/injazi/components/ButterflyEntrance";
import { HeroObject } from "@/injazi/components/HeroObject";
import { EmptyState } from "@/injazi/components/EmptyState";
import { StudentCard } from "@/injazi/features/students/StudentCard";
import { SkeletonCards } from "@/injazi/ui/primitives";
import { useSettings, useStudents } from "@/injazi/hooks/useLive";
import { pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";
import { textMatches } from "@/injazi/lib/arabicSearch";

export function PublicHome() {
  const settings = useSettings();
  const { data: students, loading } = useStudents();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const active = students.filter((student) => student.active);
    const needle = query.trim();
    return needle ? active.filter((student) => textMatches(student.name, needle)) : active;
  }, [students, query]);

  return (
    <motion.div className="iz-page" variants={pageVariants} initial="initial" animate="enter" exit="exit">
      <ButterflyEntrance />

      <motion.header className="iz-hero" variants={staggerContainer}>
        <div className="iz-hero__text">
          <motion.p className="iz-hero__eyebrow" variants={riseItem}>
            {settings.schoolName} · {settings.gradeLabel}
          </motion.p>
          <motion.h1 className="iz-hero__title" variants={riseItem}>
            {settings.platformName.split(" ").map((word, index) =>
              index === 1 ? (
                <span key={index} className="iz-hero__title-accent">
                  {" "}
                  {word}
                </span>
              ) : (
                <span key={index}>{index ? ` ${word}` : word}</span>
              ),
            )}
          </motion.h1>
          <motion.p className="iz-hero__tagline" variants={riseItem}>
            {settings.tagline}
          </motion.p>
          <motion.p className="iz-hero__body" variants={riseItem}>
            {settings.subtitle}
          </motion.p>
        </div>

        <motion.div className="iz-hero__stage" variants={riseItem}>
          <HeroObject enabled={settings.features.hero3d} />
        </motion.div>
      </motion.header>

      <motion.section className="iz-gallery" variants={staggerContainer} aria-label="ملفات الطالبات">
        <div className="iz-section-head">
          <div>
            <h2 className="iz-section-title">
              <Sparkles size={22} strokeWidth={2.4} aria-hidden="true" /> ملفات الطالبات
            </h2>
            <p className="iz-section-hint">
              {loading ? "جارٍ التحميل…" : `${visible.length} طالبة`}
            </p>
          </div>

          <div className="iz-search">
            <Search size={18} strokeWidth={2.4} aria-hidden="true" />
            <input
              className="iz-search__input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحثي عن طالبة"
              aria-label="ابحثي عن طالبة"
              type="search"
            />
          </div>
        </div>

        {loading ? (
          <SkeletonCards count={6} />
        ) : visible.length === 0 ? (
          <EmptyState
            object="bag"
            tone="lilac"
            title={query ? "لا توجد نتيجة لهذا البحث" : "لم تُضَف أي طالبة بعد"}
            body={
              query
                ? "جرّبي كتابة جزء من الاسم فقط."
                : "تُضاف الطالبات من لوحة الإدارة، ثم تظهر بطاقاتهن هنا مباشرة."
            }
          />
        ) : (
          <div className="iz-gallery__grid">
            {visible.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
