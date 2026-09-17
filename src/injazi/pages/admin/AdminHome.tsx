/*
  نظرة عامة.
  مؤشرات حقيقية محسوبة من البيانات الحيّة + سجل النشاط. لا رسم بياني
  هنا: خمسة أرقام وسجل زمني يجيبان على سؤال المشرفة أسرع من أي مخطّط.
*/
import { motion } from "motion/react";
import { Activity, BookOpen, GraduationCap, Plus, Star, Users } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { EmptyState } from "@/injazi/components/EmptyState";
import { MetricCard, Panel, SectionTitle, Skeleton } from "@/injazi/ui/primitives";
import { FirstRunImport } from "@/injazi/features/admin/FirstRunImport";
import { useActivity, useSession, useStudents, useSubjects, useTeachers } from "@/injazi/hooks/useLive";
import { pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";

const RELATIVE = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 60) return RELATIVE.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return RELATIVE.format(-hours, "hour");
  return RELATIVE.format(-Math.round(hours / 24), "day");
}

export function AdminHome() {
  const { data: students } = useStudents();
  const { data: teachers } = useTeachers();
  const { data: subjects } = useSubjects();
  const { data: activity, loading, error } = useActivity();
  const { profile } = useSession();

  return (
    <motion.div className="iz-page" variants={pageVariants} initial="initial" animate="enter" exit="exit">
      <FirstRunImport students={students} teachers={teachers} subjects={subjects} profile={profile} />

      <motion.section className="iz-summary iz-summary--4" variants={staggerContainer} aria-label="مؤشرات">
        <MetricCard icon={<Users size={20} strokeWidth={2.4} />} value={students.length} label="طالبة" tone="lilac" />
        <MetricCard icon={<GraduationCap size={20} strokeWidth={2.4} />} value={teachers.filter((t) => t.active).length} label="معلمة نشطة" tone="mint" />
        <MetricCard icon={<BookOpen size={20} strokeWidth={2.4} />} value={subjects.filter((s) => !s.archived).length} label="مادة" tone="sky" />
        <MetricCard icon={<Star size={20} strokeWidth={2.4} />} value={students.filter((s) => s.photoUrl).length} label="ملف بصورة" tone="lemon" />
      </motion.section>

      <section className="iz-block">
        <SectionTitle
          hint="اختصارات الإضافة السريعة"
          action={
            <div className="iz-chip-row">
              <ClayButton to="/admin/students" size="sm" variant="soft" icon={<Plus size={16} strokeWidth={2.6} />}>
                طالبة
              </ClayButton>
              <ClayButton to="/admin/teachers" size="sm" variant="soft" icon={<Plus size={16} strokeWidth={2.6} />}>
                معلمة
              </ClayButton>
              <ClayButton to="/admin/subjects" size="sm" variant="soft" icon={<Plus size={16} strokeWidth={2.6} />}>
                مادة
              </ClayButton>
            </div>
          }
        >
          إجراءات سريعة
        </SectionTitle>
      </section>

      <section className="iz-block">
        <SectionTitle hint="آخر ٤٠ حدثًا">
          <Activity size={20} strokeWidth={2.4} aria-hidden="true" /> سجل النشاط
        </SectionTitle>

        {loading ? (
          <Panel>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} style={{ padding: "10px 0" }}>
                <Skeleton height={14} width={`${70 - index * 8}%`} />
              </div>
            ))}
          </Panel>
        ) : error ? (
          <EmptyState
            object="globe"
            tone="apricot"
            title="تعذّر قراءة السجل"
            body="سجل النشاط متاح للمشرفات فقط. تأكدي من أن حسابكِ يحمل دور admin."
          />
        ) : activity.length === 0 ? (
          <EmptyState
            object="book"
            tone="mint"
            title="لا يوجد نشاط بعد"
            body="سيظهر هنا كل ما يحدث في المنصة: إضافة مشروع، تقييم، تعديل ملف…"
          />
        ) : (
          <Panel>
            <ol className="iz-activity">
              {activity.map((entry) => (
                <motion.li key={entry.id} className="iz-activity__row" variants={riseItem}>
                  <span className="iz-activity__dot" aria-hidden="true" />
                  <div>
                    <p className="iz-activity__message">{entry.message}</p>
                    <p className="iz-activity__meta">
                      {entry.actorName} · {ago(entry.at)}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </Panel>
        )}
      </section>
    </motion.div>
  );
}
