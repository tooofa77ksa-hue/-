/*
  شاشة الحكاية
  ------------------------------------------------------------------
  اللحظة الأهم في المنصة: الطفلة تكتب، ثم تُكافأ. لذلك تُحجَز أثقل
  الحركات لهذه الشاشة وحدها — لوحة نجاح تغطي النموذج للحظة، نجمة
  تُضاف إلى الصف، وتاجٌ إن اكتملت المادة.
  الحفظ لا يقفز بالطالبة إلى شاشة أخرى مباشرة: تبقى لترى نجمتها،
  ثم تنتقل بنفسها.
*/
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Save } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { ClayObject } from "@/injazi/components/ClayObject";
import { CrownCelebration } from "@/injazi/components/CrownCelebration";
import { LottieMoment } from "@/injazi/components/LottieMoment";
import { StarRow } from "@/injazi/components/StarRow";
import { findSubject } from "@/injazi/lib/subjects";
import { showToast } from "@/injazi/lib/toast";
import { starsBySubject, useAchievements, useSaveAchievement } from "@/injazi/lib/store";
import { DUR, EASE_CLAY, EASE_POP, pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";

const MIN_STORY = 20;

export function TellScreen() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const subject = findSubject(subjectId);
  const achievements = useAchievements();
  const save = useSaveAchievement();

  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [saving, setSaving] = useState(false);
  const [crownFor, setCrownFor] = useState<string | null>(null);

  const earned = useMemo(
    () => (subject ? (starsBySubject(achievements)[subject.id] ?? 0) : 0),
    [achievements, subject],
  );

  if (!subject) {
    return (
      <motion.div className="iz-page" variants={pageVariants} initial="initial" animate="enter" exit="exit">
        <p className="iz-notice">لم نجد هذه المادة.</p>
        <ClayButton to="/injazi" variant="soft">
          العودة للرئيسية
        </ClayButton>
      </motion.div>
    );
  }

  const ready = title.trim().length >= 3 && story.trim().length >= MIN_STORY;

  function handleSave() {
    if (!ready || !subject || saving) return;
    setSaving(true);
    const result = save(subject.id, title, story);
    setTitle("");
    setStory("");
    showToast("حُفظت حكايتكِ، ونلتِ نجمة", "success");
    if (result.crowned) setCrownFor(subject.name);
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
        <motion.div variants={riseItem}>
          <Link to="/injazi" className="iz-back">
            <ChevronRight size={18} strokeWidth={2.6} aria-hidden="true" />
            كل المواد
          </Link>
        </motion.div>

        <motion.header className={`iz-tell__head iz-tone--${subject.tone}`} variants={riseItem}>
          <ClayObject name={subject.object} tone={subject.tone} size={84} />
          <div>
            <h1 className="iz-tell__title">{subject.name}</h1>
            <p className="iz-tell__prompt">{subject.prompt}</p>
            <StarRow earned={earned} total={subject.starGoal} size={24} />
          </div>
        </motion.header>

        <motion.div className="iz-form" variants={riseItem}>
          <AnimatePresence>
            {saving && (
              <motion.div
                className="iz-form__success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.base, ease: EASE_CLAY }}
              >
                <motion.div
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: DUR.slow, ease: EASE_POP }}
                >
                  <LottieMoment name="success" size={128} label="تم حفظ الحكاية" />
                </motion.div>
                <p className="iz-form__success-text">حكايتكِ صارت في دفتركِ</p>
                <div className="iz-form__success-actions">
                  <ClayButton variant="primary" onClick={() => navigate("/injazi/journal")}>
                    اقرئي دفتري
                  </ClayButton>
                  <ClayButton variant="soft" onClick={() => setSaving(false)}>
                    احكِ حكاية أخرى
                  </ClayButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <label className="iz-field">
            <span className="iz-field__label">عنوان الإنجاز</span>
            <input
              className="iz-field__input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثال: حفظت جدول الضرب ٧"
              maxLength={80}
              /* لوحة النجاح تغطي النموذج بصريًا، فيجب أن تغطيه للوحة
                 المفاتيح أيضًا — وإلا وصل التركيز إلى حقول لا تُرى. */
              disabled={saving}
            />
          </label>

          <label className="iz-field">
            <span className="iz-field__label">احكِ ما حدث</span>
            <textarea
              className="iz-field__input iz-field__input--area"
              value={story}
              onChange={(event) => setStory(event.target.value)}
              placeholder="ماذا تعلّمتِ؟ ما الذي كان صعبًا؟ كيف تجاوزتِه؟"
              rows={6}
              maxLength={600}
              disabled={saving}
            />
            <span className="iz-field__meter">
              {story.trim().length < MIN_STORY
                ? `اكتبي ${MIN_STORY - story.trim().length} حرفًا على الأقل`
                : `${story.trim().length} حرفًا`}
            </span>
          </label>

          <ClayButton
            onClick={handleSave}
            disabled={!ready}
            size="lg"
            block
            icon={<Save size={20} strokeWidth={2.4} />}
          >
            احفظي واكسبي نجمة
          </ClayButton>
        </motion.div>
      </motion.div>

      <CrownCelebration
        open={crownFor !== null}
        subjectName={crownFor ?? subject.name}
        onClose={() => setCrownFor(null)}
      />
    </motion.div>
  );
}
