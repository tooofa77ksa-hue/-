/*
  الصفحة الرئيسية
  ------------------------------------------------------------------
  ترتيب اللحظات مقصود: الفراشات ترحّب (مرة واحدة في العمر)، ثم يهبط
  العنوان، ثم تتتابع بطاقات المواد. الحركة هنا تبني ترتيب القراءة
  ولا تزيّنه؛ ولهذا لا شيء يتحرك بعد استقرار الصفحة سوى جسم البطل.
*/
import { motion } from "motion/react";
import { Crown, Sparkles, NotebookPen } from "lucide-react";
import { ButterflyEntrance } from "@/injazi/components/ButterflyEntrance";
import { ClayButton } from "@/injazi/components/ClayButton";
import { HeroObject } from "@/injazi/components/HeroObject";
import { SubjectTile } from "@/injazi/components/SubjectTile";
import { SUBJECTS } from "@/injazi/lib/subjects";
import { journalSummary, useAchievements } from "@/injazi/lib/store";
import { pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";

export function HomeScreen() {
  const achievements = useAchievements();
  const { stars, totalStars, crowns, stories } = journalSummary(achievements);
  const goal = SUBJECTS.reduce((sum, subject) => sum + subject.starGoal, 0);

  return (
    <motion.div
      className="iz-page"
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <ButterflyEntrance />

      <motion.header className="iz-hero" variants={staggerContainer}>
        <div className="iz-hero__text">
          <motion.p className="iz-hero__eyebrow" variants={riseItem}>
            الصف الرابع الابتدائي
          </motion.p>
          <motion.h1 className="iz-hero__title" variants={riseItem}>
            إنجازي <span className="iz-hero__title-accent">يحكي</span>
          </motion.h1>
          <motion.p className="iz-hero__body" variants={riseItem}>
            كل شيء تعلّمتِه اليوم يستحق أن يُحكى. اختاري مادة، احكِ ما أنجزتِه
            فيها، واجمعي نجومكِ حتى يكتمل التاج.
          </motion.p>
          <motion.div className="iz-hero__actions" variants={riseItem}>
            <ClayButton to="/injazi/journal" icon={<NotebookPen size={20} strokeWidth={2.4} />} size="lg">
              افتحي دفتري
            </ClayButton>
          </motion.div>
        </div>

        <motion.div className="iz-hero__stage" variants={riseItem}>
          <HeroObject />
        </motion.div>
      </motion.header>

      <motion.section className="iz-summary" variants={staggerContainer} aria-label="ملخص إنجازاتي">
        <motion.div className="iz-summary__cell" variants={riseItem}>
          <Sparkles size={22} strokeWidth={2.4} aria-hidden="true" />
          <strong>{totalStars}</strong>
          <span>من {goal} نجمة</span>
        </motion.div>
        <motion.div className="iz-summary__cell" variants={riseItem}>
          <Crown size={22} strokeWidth={2.4} aria-hidden="true" />
          <strong>{crowns}</strong>
          <span>من {SUBJECTS.length} تيجان</span>
        </motion.div>
        <motion.div className="iz-summary__cell" variants={riseItem}>
          <NotebookPen size={22} strokeWidth={2.4} aria-hidden="true" />
          <strong>{stories}</strong>
          <span>حكاية مكتوبة</span>
        </motion.div>
      </motion.section>

      <motion.section className="iz-subjects" variants={staggerContainer} aria-label="المواد">
        <motion.h2 className="iz-section-title" variants={riseItem}>
          عن أي مادة تحكين اليوم؟
        </motion.h2>
        <div className="iz-subjects__grid">
          {SUBJECTS.map((subject) => (
            <SubjectTile
              key={subject.id}
              subject={subject}
              earned={stars[subject.id] ?? 0}
              crowned={(stars[subject.id] ?? 0) >= subject.starGoal}
            />
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
