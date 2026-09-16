/*
  بطاقة الطالبة.
  البطاقة العامة تعرض الاسم والصورة فقط — لا نبذة ولا محتوى داخلي،
  مهما كانت إعدادات الخصوصية، لأن الصفحة الرئيسية مفتوحة للجميع.
  الصورة اختيار الطالبة نفسها؛ عند غيابها يظهر حرفها الأول بلون ملفها
  (لا صورة مولَّدة ولا صورة من بنك صور).
*/
import type { CSSProperties } from "react";
import { Media } from "@/injazi/ui/Media";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ClayObject } from "@/injazi/components/ClayObject";
import { Icon } from "@/injazi/ui/IconPicker";
import { DUR, EASE_CLAY, EASE_POP, popItem } from "@/injazi/motion/motion";
import { themeById, themeVars } from "@/injazi/themes/themes";
import type { Student } from "@/injazi/types/models";

export function StudentCard({ student, crowns = 0 }: { student: Student; crowns?: number }) {
  const theme = themeById(student.themeId);
  const style = themeVars(student.themeId, student.accentColor) as CSSProperties;

  return (
    <motion.div variants={popItem} className="iz-student-card-stage">
      <motion.div
        className={`iz-student-card iz-student-card--${student.cardStyle}`}
        style={style}
        initial="rest"
        whileHover="lift"
        whileFocus="lift"
        whileTap="press"
        variants={{
          rest: { y: 0 },
          lift: { y: -8 },
          press: { y: -2, scale: 0.985 },
        }}
        transition={{ duration: DUR.base, ease: EASE_CLAY }}
      >
        <div className={`iz-student-card__cover iz-cover--${student.coverStyle}`} aria-hidden="true" />

        <motion.div
          className="iz-student-card__avatar"
          variants={{ rest: { scale: 1 }, lift: { scale: 1.05 }, press: { scale: 1 } }}
          transition={{ duration: DUR.base, ease: EASE_POP }}
        >
          {student.photoUrl ? (
            <Media
              src={student.photoUrl}
              alt={`صورة ${student.name}`}
              fallback={
                <span className="iz-student-card__initial" aria-hidden="true">
                  {student.name.trim().charAt(0)}
                </span>
              }
            />
          ) : (
            <span className="iz-student-card__initial" aria-hidden="true">
              {student.name.trim().charAt(0)}
            </span>
          )}
        </motion.div>

        {/* الزخرفة الصغيرة: تتحرك عند التحويم فقط، لا باستمرار */}
        <motion.span
          className="iz-student-card__decor"
          variants={{
            rest: { rotate: 0, scale: 1, opacity: 0.85 },
            lift: { rotate: -14, scale: 1.16, opacity: 1 },
            press: { rotate: -6, scale: 1.05, opacity: 1 },
          }}
          transition={{ duration: DUR.base, ease: EASE_POP }}
          aria-hidden="true"
        >
          <Icon name={student.decorIcon} size={20} />
        </motion.span>

        <h3 className="iz-student-card__name">{student.name}</h3>
        <p className="iz-student-card__theme">{theme.name}</p>

        {crowns > 0 && (
          <span className="iz-student-card__crowns" title={`${crowns} شارة تميّز`}>
            <ClayObject name="crown" tone="gold" size={20} grounded={false} />
            <span>{crowns}</span>
          </span>
        )}

        <Link className="iz-student-card__cta" to={`/student/${student.id}`}>
          عرض الملف
          <ArrowLeft size={17} strokeWidth={2.6} aria-hidden="true" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
