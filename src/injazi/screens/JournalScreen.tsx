/*
  دفتري
  ------------------------------------------------------------------
  قائمة الحكايات مرتّبة من الأحدث. البطاقة نفسها هي زر الفتح، ويظهر
  النص الكامل في لوح منزلق بدل صفحة جديدة، حتى لا تفقد الطالبة موضعها
  في الدفتر.
*/
import { useState } from "react";
import { motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { ClayCard } from "@/injazi/components/ClayCard";
import { ClayObject } from "@/injazi/components/ClayObject";
import { EmptyState } from "@/injazi/components/EmptyState";
import { InjaziSheet } from "@/injazi/components/InjaziSheet";
import { findSubject } from "@/injazi/lib/subjects";
import { showToast } from "@/injazi/lib/toast";
import { useAchievements, useRemoveAchievement } from "@/injazi/lib/store";
import type { Achievement } from "@/injazi/lib/store";
import { pageVariants, popItem, riseItem, staggerContainer } from "@/injazi/motion/motion";

const DATE_FORMAT = new Intl.DateTimeFormat("ar-SA", {
  day: "numeric",
  month: "long",
});

export function JournalScreen() {
  const achievements = useAchievements();
  const remove = useRemoveAchievement();
  const [open, setOpen] = useState<Achievement | null>(null);

  const openSubject = open ? findSubject(open.subjectId) : undefined;

  function handleRemove(achievement: Achievement) {
    remove(achievement.id);
    setOpen(null);
    showToast("حُذفت الحكاية من دفتركِ", "info");
  }

  return (
    <motion.div
      className="iz-page iz-page--narrow"
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <motion.div variants={staggerContainer}>
        <motion.h1 className="iz-page__title" variants={riseItem}>
          دفتري
        </motion.h1>

        {achievements.length === 0 ? (
          <motion.div variants={riseItem}>
            <EmptyState
              object="book"
              tone="apricot"
              title="دفتركِ ما زال فارغًا"
              body="أول حكاية تكتبينها ستضع أول نجمة في الدفتر. اختاري مادة وابدئي."
              action={
                <ClayButton to="/injazi" size="lg">
                  اختاري مادة
                </ClayButton>
              }
            />
          </motion.div>
        ) : (
          <div className="iz-journal">
            {achievements.map((achievement) => {
              const subject = findSubject(achievement.subjectId);
              return (
                <motion.div key={achievement.id} variants={popItem}>
                  <ClayCard>
                    <button
                      type="button"
                      className="iz-entry"
                      onClick={() => setOpen(achievement)}
                      aria-label={`افتحي حكاية: ${achievement.title}`}
                    >
                      <span className="iz-entry__object">
                        <ClayObject
                          name={subject?.object ?? "book"}
                          tone={subject?.tone ?? "lilac"}
                          size={48}
                          grounded={false}
                        />
                      </span>
                      <span className="iz-entry__text">
                        <strong className="iz-entry__title">{achievement.title}</strong>
                        <span className="iz-entry__meta">
                          {subject?.name ?? "مادة"} · {DATE_FORMAT.format(new Date(achievement.createdAt))}
                        </span>
                        <span className="iz-entry__excerpt">{achievement.story}</span>
                      </span>
                    </button>
                  </ClayCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <InjaziSheet
        open={open !== null}
        title={open?.title ?? ""}
        onClose={() => setOpen(null)}
      >
        {open && (
          <div className="iz-entry-detail">
            <div className={`iz-entry-detail__head iz-tone--${openSubject?.tone ?? "lilac"}`}>
              <ClayObject
                name={openSubject?.object ?? "book"}
                tone={openSubject?.tone ?? "lilac"}
                size={64}
              />
              <div>
                <p className="iz-entry-detail__subject">{openSubject?.name ?? "مادة"}</p>
                <p className="iz-entry-detail__date">
                  {DATE_FORMAT.format(new Date(open.createdAt))}
                </p>
              </div>
            </div>
            <p className="iz-entry-detail__story">{open.story}</p>
            <ClayButton
              variant="ghost"
              className="iz-btn--danger"
              icon={<Trash2 size={18} strokeWidth={2.4} />}
              onClick={() => handleRemove(open)}
            >
              احذفي هذه الحكاية
            </ClayButton>
          </div>
        )}
      </InjaziSheet>
    </motion.div>
  );
}
