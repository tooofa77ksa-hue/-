/*
  لوحة العرض — صفحة اللجنة الزائرة.

  غرضها واحد: أن يفتح زائرٌ رابطًا واحدًا (أو يمسح باركودًا) فيرى المنصة
  كلها كما هي — الطالبات وملفاتهن ومشاريعهن، والمعلمات وموادهن، وتقييمات
  المعلمات بنجومها وأوسمتها وتعليقاتها — دون أن يملك تغيير حرف واحد.

  «للمشاهدة فقط» هنا ليست إخفاء أزرار:
  ------------------------------------------------------------------
  الصفحة لا تستورد أي محرّر ولا تستدعي أي دالة كتابة، لكن هذا ليس مصدر
  الأمان. مصدره أن زائر هذه اللوحة بلا حساب أصلًا، وقواعد Firestore
  تمنع كل كتابة على كل مجموعة ما لم يكن صاحبها مشرفةً أو معلمةً بدعوة
  حيّة أو وليَّ أمر برابط حيّ. فلو فتح الزائر أدوات المطوّر وكتب
  استدعاء الحفظ بيده لرُفض على الخادم. ما هنا تجربةُ عرضٍ نظيفة فوق
  منعٍ قائمٍ في قاعدة البيانات، لا بديلٌ عنه.

  وكل ما فيها حيّ: الاشتراكات نفسها التي تستعملها بقية الشاشات، فتقييم
  معلمةٍ بعد شهر، أو طالبةٌ جديدة، أو مشروعٌ رُفع قبل دقيقة — يظهر عند
  فتح الرابط نفسه بلا إعادة طباعة ولا باركود جديد.
*/
import { useMemo } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  Eye,
  FolderOpen,
  GraduationCap,
  MessageSquareQuote,
  RefreshCw,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Media } from "@/injazi/ui/Media";
import { ClayCard } from "@/injazi/components/ClayCard";
import { ClayObject } from "@/injazi/components/ClayObject";
import { EmptyState } from "@/injazi/components/EmptyState";
import { StudentCard } from "@/injazi/features/students/StudentCard";
import { Chip, MetricCard, Panel, SectionTitle, SkeletonCards } from "@/injazi/ui/primitives";
import { Icon } from "@/injazi/ui/IconPicker";
import { Rating } from "@/injazi/ui/Rating";
import {
  useEvaluations,
  usePublicProjects,
  useSettings,
  useStudents,
  useSubjects,
  useTeachers,
} from "@/injazi/hooks/useLive";
import { pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";

/** آخر ما كتبته المعلمات — لا السجل كله، حتى لا تصير اللوحة أرشيفًا. */
const LATEST_EVALUATIONS = 12;

export function BoardView() {
  const settings = useSettings();
  const { data: students, loading: studentsLoading } = useStudents();
  const { data: teachers } = useTeachers();
  const { data: subjects } = useSubjects();
  const { data: projects } = usePublicProjects();
  const { data: evaluations } = useEvaluations();

  const activeStudents = useMemo(() => students.filter((row) => row.active), [students]);
  const activeTeachers = useMemo(() => teachers.filter((row) => row.active), [teachers]);
  const liveSubjects = useMemo(() => subjects.filter((row) => !row.archived), [subjects]);

  const subjectById = useMemo(
    () => Object.fromEntries(subjects.map((row) => [row.id, row])),
    [subjects],
  );
  const studentById = useMemo(
    () => Object.fromEntries(students.map((row) => [row.id, row])),
    [students],
  );
  const projectById = useMemo(
    () => Object.fromEntries(projects.map((row) => [row.id, row])),
    [projects],
  );

  /** أوسمة كل طالبة — تظهر على بطاقتها كما تظهر في الصفحة الرئيسية. */
  const crownsByStudent = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of evaluations) {
      if (entry.badge) counts[entry.studentId] = (counts[entry.studentId] ?? 0) + 1;
    }
    return counts;
  }, [evaluations]);

  /** كم قيّمت كل معلمة — رقم يقرأه الزائر فيعرف أن المنصة تُستعمل فعلًا. */
  const evaluationsByTeacher = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of evaluations) {
      counts[entry.teacherId] = (counts[entry.teacherId] ?? 0) + 1;
    }
    return counts;
  }, [evaluations]);

  const badges = useMemo(() => evaluations.filter((entry) => entry.badge).length, [evaluations]);
  const latest = useMemo(() => evaluations.slice(0, LATEST_EVALUATIONS), [evaluations]);

  return (
    <motion.div className="iz-page iz-page--board" variants={pageVariants} initial="initial" animate="enter" exit="exit">
      <motion.header className="iz-board-head" variants={staggerContainer}>
        <motion.span className="iz-board-seal" variants={riseItem}>
          <Eye size={15} strokeWidth={2.6} aria-hidden="true" />
          للعرض والمشاهدة فقط
        </motion.span>

        <motion.h1 className="iz-board-title" variants={riseItem}>
          {settings.platformName}
        </motion.h1>

        <motion.p className="iz-board-sub" variants={riseItem}>
          {settings.schoolName} · {settings.gradeLabel}
        </motion.p>

        <motion.p className="iz-board-tagline" variants={riseItem}>
          {settings.tagline}
        </motion.p>

        <motion.p className="iz-board-note" variants={riseItem}>
          <RefreshCw size={14} strokeWidth={2.6} aria-hidden="true" />
          هذه اللوحة تتحدّث تلقائيًا: كل تقييم جديد أو طالبة جديدة أو مشروع يُرفع يظهر هنا فور
          حدوثه، بالرابط نفسه.
        </motion.p>
      </motion.header>

      <motion.section className="iz-summary iz-summary--6" variants={staggerContainer} aria-label="مؤشرات المنصة">
        <MetricCard icon={<Users size={20} strokeWidth={2.4} />} value={activeStudents.length} label="طالبة" tone="lilac" />
        <MetricCard icon={<GraduationCap size={20} strokeWidth={2.4} />} value={activeTeachers.length} label="معلمة" tone="mint" />
        <MetricCard icon={<BookOpen size={20} strokeWidth={2.4} />} value={liveSubjects.length} label="مادة" tone="sky" />
        <MetricCard icon={<FolderOpen size={20} strokeWidth={2.4} />} value={projects.length} label="مشروع" tone="apricot" />
        <MetricCard icon={<Star size={20} strokeWidth={2.4} />} value={evaluations.length} label="تقييم" tone="lemon" />
        <MetricCard icon={<Sparkles size={20} strokeWidth={2.4} />} value={badges} label="وسام تميّز" tone="rose" />
      </motion.section>

      <motion.section className="iz-block" variants={staggerContainer} aria-label="ملفات الطالبات">
        <SectionTitle hint="اضغطي على أي بطاقة ليُفتح ملف الإنجاز كاملًا">
          <Sparkles size={22} strokeWidth={2.4} aria-hidden="true" /> ملفات الطالبات
        </SectionTitle>

        {studentsLoading ? (
          <SkeletonCards count={6} />
        ) : activeStudents.length === 0 ? (
          <EmptyState object="bag" tone="lilac" title="لم تُضَف أي طالبة بعد" body="ستظهر بطاقات الطالبات هنا فور إضافتهن." />
        ) : (
          <div className="iz-gallery__grid">
            {activeStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                crowns={crownsByStudent[student.id] ?? 0}
                basePath="/board/student"
              />
            ))}
          </div>
        )}
      </motion.section>

      <motion.section className="iz-block" variants={staggerContainer} aria-label="المعلمات">
        <SectionTitle hint={`${activeTeachers.length} معلمة · ${liveSubjects.length} مادة`}>
          <GraduationCap size={22} strokeWidth={2.4} aria-hidden="true" /> المعلمات والمواد
        </SectionTitle>

        {activeTeachers.length === 0 ? (
          <EmptyState object="book" tone="mint" title="لم تُضَف أي معلمة بعد" body="ستظهر المعلمات ومواد كل واحدة هنا." />
        ) : (
          <div className="iz-board-teachers">
            {activeTeachers.map((teacher) => {
              const taught = liveSubjects.filter(
                (subject) => subject.teacherId === teacher.id || teacher.subjectIds.includes(subject.id),
              );
              const count = evaluationsByTeacher[teacher.id] ?? 0;
              return (
                <motion.div key={teacher.id} variants={riseItem}>
                  <Panel className="iz-board-teacher">
                    <span className="iz-board-teacher__avatar">
                      {teacher.photoUrl ? (
                        <Media
                          src={teacher.photoUrl}
                          alt={`صورة ${teacher.name}`}
                          fallback={<span aria-hidden="true">{teacher.name.trim().charAt(0)}</span>}
                        />
                      ) : (
                        <span aria-hidden="true">{teacher.name.trim().charAt(0)}</span>
                      )}
                    </span>

                    <div className="iz-board-teacher__body">
                      <strong className="iz-board-teacher__name">{teacher.name}</strong>
                      <div className="iz-chip-row">
                        {taught.length === 0 ? (
                          <Chip tone="neutral">بلا مادة مسندة</Chip>
                        ) : (
                          taught.map((subject) => (
                            <Chip key={subject.id} tone="info" icon={<Icon name={subject.icon} size={14} />}>
                              {subject.name}
                            </Chip>
                          ))
                        )}
                      </div>
                    </div>

                    <span className="iz-board-teacher__count" title="عدد التقييمات">
                      <Star size={15} strokeWidth={2.6} aria-hidden="true" />
                      {count}
                    </span>
                  </Panel>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      <motion.section className="iz-block" variants={staggerContainer} aria-label="تقييمات المعلمات">
        <SectionTitle hint={evaluations.length > LATEST_EVALUATIONS ? `أحدث ${LATEST_EVALUATIONS} من ${evaluations.length} تقييمًا` : "بأسماء المعلمات وتعليقاتهن"}>
          <Star size={22} strokeWidth={2.4} aria-hidden="true" /> تقييمات المعلمات
        </SectionTitle>

        {latest.length === 0 ? (
          <EmptyState
            object="star"
            tone="lemon"
            title="لا توجد تقييمات بعد"
            body="تظهر هنا تقييمات المعلمات لمشاريع الطالبات فور كتابتها."
          />
        ) : (
          <div className="iz-cards-grid">
            {latest.map((entry) => {
              const subject = subjectById[entry.subjectId];
              const project = projectById[entry.projectId];
              const student = studentById[entry.studentId];
              return (
                <motion.div key={entry.id} variants={riseItem}>
                  <ClayCard>
                    <article className={`iz-evaluation iz-tone--${subject?.tone ?? "lilac"}`}>
                      <header className="iz-evaluation__head">
                        <div>
                          <strong>{entry.teacherName}</strong>
                          <span className="iz-evaluation__subject">
                            {subject?.name ?? "مادة"}
                            {student ? ` · ${student.name}` : ""}
                          </span>
                        </div>
                        {entry.badge && (
                          <span className="iz-evaluation__badge" title="شارة التميّز">
                            <ClayObject name="crown" tone="gold" size={30} grounded={false} />
                          </span>
                        )}
                      </header>
                      <Rating value={entry.stars} readOnly size={20} />
                      {project && <p className="iz-evaluation__project">عن: {project.title}</p>}
                      {entry.comment && (
                        <p className="iz-evaluation__comment">
                          <MessageSquareQuote size={15} strokeWidth={2.4} aria-hidden="true" />
                          {entry.comment}
                        </p>
                      )}
                      <p className="iz-evaluation__date">{entry.updatedAt.slice(0, 10)}</p>
                    </article>
                  </ClayCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      <motion.p className="iz-board-foot" variants={riseItem}>
        إمكانية التوسّع لتشمل جميع طالبات الفصل.
      </motion.p>
    </motion.div>
  );
}
