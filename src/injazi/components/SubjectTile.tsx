/*
  بطاقة مادة
  ------------------------------------------------------------------
  التفاعل الوحيد المسموح هنا: الجسم الصلصالي يميل ويرتفع قليلًا عند
  التحويم/التركيز، لأن ذلك يقول "هذه البطاقة تُفتح". لا شيء يتحرك من
  تلقاء نفسه في الشبكة — عشر بطاقات متحركة باستمرار تعني فوضى لا حياة.
*/
import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ClayCard } from "@/injazi/components/ClayCard";
import { ClayObject } from "@/injazi/components/ClayObject";
import { StarRow } from "@/injazi/components/StarRow";
import type { Subject } from "@/injazi/lib/subjects";
import { DUR, EASE_POP, popItem } from "@/injazi/motion/motion";

type Props = {
  subject: Subject;
  earned: number;
  crowned: boolean;
};

export function SubjectTile({ subject, earned, crowned }: Props) {
  const navigate = useNavigate();
  const progress = Math.round((earned / subject.starGoal) * 100);

  return (
    <motion.div variants={popItem} className="iz-subject">
      <ClayCard>
        <motion.button
          type="button"
          className="iz-subject__inner"
          initial="rest"
          whileHover="lift"
          whileFocus="lift"
          whileTap="press"
          aria-label={`${subject.name} — ${earned} من ${subject.starGoal} نجوم`}
          onClick={() => navigate(`/injazi/tell/${subject.id}`)}
        >
          <motion.div
            className="iz-subject__object"
            variants={{
              rest: { y: 0, rotate: 0, scale: 1 },
              lift: { y: -8, rotate: -6, scale: 1.06 },
              press: { y: -2, rotate: -2, scale: 0.98 },
            }}
            transition={{ duration: DUR.base, ease: EASE_POP }}
          >
            <ClayObject name={subject.object} tone={subject.tone} size={76} />
          </motion.div>

          <div className="iz-subject__text">
            <h3 className="iz-subject__name">
              {subject.name}
              {crowned && <ClayObject name="crown" tone="gold" size={24} grounded={false} title="مادة متوّجة" />}
            </h3>
            <p className="iz-subject__hint">{subject.prompt}</p>
            <StarRow earned={earned} total={subject.starGoal} size={22} />
          </div>

          <div className="iz-subject__go" aria-hidden="true">
            <ChevronLeft size={20} strokeWidth={2.6} />
          </div>

          <div
            className="iz-subject__progress"
            style={{ "--iz-progress": `${progress}%` } as CSSProperties}
            aria-hidden="true"
          />
        </motion.button>
      </ClayCard>
    </motion.div>
  );
}
