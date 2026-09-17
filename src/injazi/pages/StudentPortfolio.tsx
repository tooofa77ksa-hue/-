/*
  ملف إنجاز الطالبة.
  الصفحة تقرأ ثيم الطالبة وتطبّقه على جذرها فقط، فيبدو كل ملف مختلفًا
  دون أي تغيير في التخطيط. أزرار التعديل لا تظهر إلا لمن يملك الصلاحية،
  والقواعد الأمنية تمنع التعديل فعليًا حتى لو ظهر الزر بالخطأ.
*/
import { useMemo, useState } from "react";
import { Media } from "@/injazi/ui/Media";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  MessageSquareQuote,
  Archive,
  ArchiveRestore,
  Palette,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { ClayCard } from "@/injazi/components/ClayCard";
import { ClayObject } from "@/injazi/components/ClayObject";
import { CrownCelebration } from "@/injazi/components/CrownCelebration";
import { EmptyState } from "@/injazi/components/EmptyState";
import { AchievementEditor } from "@/injazi/features/portfolio/AchievementEditor";
import { HobbiesEditor } from "@/injazi/features/portfolio/HobbiesEditor";
import { PersonalizePanel } from "@/injazi/features/portfolio/PersonalizePanel";
import { ProjectCard } from "@/injazi/features/portfolio/ProjectCard";
import { ProjectEditor } from "@/injazi/features/portfolio/ProjectEditor";
import { ConfirmDialog } from "@/injazi/ui/Modal";
import { Chip, MetricCard, Panel, SectionTitle, Skeleton } from "@/injazi/ui/primitives";
import { Icon } from "@/injazi/ui/IconPicker";
import { Rating } from "@/injazi/ui/Rating";
import {
  useSession,
  useStudent,
  useStudentAchievements,
  useStudentEvaluations,
  useStudentProjects,
  useSubjects,
  useTeachers,
} from "@/injazi/hooks/useLive";
import {
  archiveAchievement,
  archiveProject,
  deleteAchievement,
  deleteProject,
  logActivity,
} from "@/injazi/services/repo";
import { showToast } from "@/injazi/lib/toast";
import { canEditStudent, canViewContent } from "@/injazi/lib/permissions";
import { themeVars } from "@/injazi/themes/themes";
import { pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";
import type { Achievement, Project } from "@/injazi/types/models";

export function StudentPortfolio() {
  const { studentId = "" } = useParams();
  const { profile } = useSession();
  const { data: student, loading } = useStudent(studentId);
  const { data: subjects } = useSubjects();
  const { data: teachers } = useTeachers();
  const { data: projects } = useStudentProjects(studentId);
  const { data: achievements } = useStudentAchievements(studentId);
  const { data: evaluations } = useStudentEvaluations(studentId);

  const [projectEditor, setProjectEditor] = useState<{ open: boolean; project: Project | null }>({
    open: false,
    project: null,
  });
  const [achievementEditor, setAchievementEditor] = useState<{
    open: boolean;
    kind: Achievement["kind"];
    row: Achievement | null;
  }>({ open: false, kind: "achievement", row: null });
  const [personalize, setPersonalize] = useState(false);
  const [hobbies, setHobbies] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; run: () => Promise<void>; message: string }>({
    open: false,
    run: async () => {},
    message: "",
  });
  const [crownFor, setCrownFor] = useState<string | null>(null);

  const canEdit = canEditStudent(profile, studentId);
  // الأرشيف مخفي افتراضيًا: المؤرشف ليس محذوفًا لكنه ليس معروضًا.
  const [showArchive, setShowArchive] = useState(false);
  const activeSubjects = useMemo(() => subjects.filter((subject) => !subject.archived), [subjects]);

  const visibleProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          canViewContent(profile, project.visibility, studentId) &&
          // المؤرشف لا يُعرض لأحد إلا لمالكة الملف وحين تطلبه صراحةً.
          (project.archived === true ? canEdit && showArchive : !showArchive),
      ),
    [projects, profile, studentId, canEdit, showArchive],
  );
  const visibleAchievements = useMemo(
    () =>
      achievements.filter(
        (row) =>
          canViewContent(profile, row.visibility, studentId) &&
          (row.archived === true ? canEdit && showArchive : !showArchive),
      ),
    [achievements, profile, studentId, canEdit, showArchive],
  );

  const archivedCount = useMemo(
    () =>
      projects.filter((row) => row.archived === true).length +
      achievements.filter((row) => row.archived === true).length,
    [projects, achievements],
  );

  const certificates = visibleAchievements.filter((row) => row.kind === "certificate");
  const wins = visibleAchievements.filter((row) => row.kind === "achievement");
  const badges = evaluations.filter((entry) => entry.badge).length;
  const averageStars =
    evaluations.length > 0
      ? Math.round((evaluations.reduce((sum, entry) => sum + entry.stars, 0) / evaluations.length) * 10) / 10
      : 0;

  if (loading) {
    return (
      <div className="iz-page">
        <Skeleton height={220} radius={28} />
        <div style={{ height: 24 }} />
        <Skeleton height={26} width="40%" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="iz-page iz-page--narrow">
        <EmptyState
          object="globe"
          tone="sky"
          title="لم نجد هذا الملف"
          body="ربما حُذف الملف أو تغيّر رابطه."
          action={
            <ClayButton to="/" size="lg">
              العودة للرئيسية
            </ClayButton>
          }
        />
      </div>
    );
  }

  const style = themeVars(student.themeId, student.accentColor) as CSSProperties;

  function askDelete(message: string, run: () => Promise<void>) {
    setConfirm({ open: true, message, run });
  }

  return (
    <motion.div
      className="iz-page iz-portfolio"
      style={style}
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <Link to="/" className="iz-back">
        <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
        كل الطالبات
      </Link>

      {/* ---------------- ترويسة الملف ---------------- */}
      <motion.header className="iz-profile" variants={staggerContainer}>
        <div className={`iz-profile__cover iz-cover--${student.coverStyle}`} aria-hidden="true" />

        <motion.div className="iz-profile__avatar" variants={riseItem}>
          {student.photoUrl ? (
            <Media
              src={student.photoUrl}
              alt={`صورة ${student.name}`}
              loading="eager"
              fallback={<span aria-hidden="true">{student.name.trim().charAt(0)}</span>}
            />
          ) : (
            <span aria-hidden="true">{student.name.trim().charAt(0)}</span>
          )}
        </motion.div>

        <motion.div className="iz-profile__text" variants={riseItem}>
          <h1 className="iz-profile__name">{student.name}</h1>
          <p className="iz-profile__grade">{student.grade}</p>
          {student.bio && <p className="iz-profile__bio">{student.bio}</p>}
        </motion.div>

        {canEdit && (
          <motion.div className="iz-profile__actions" variants={riseItem}>
            <ClayButton
              variant="soft"
              size="sm"
              icon={<Palette size={16} strokeWidth={2.4} />}
              onClick={() => setPersonalize(true)}
            >
              تخصيص الملف
            </ClayButton>
            <ClayButton
              variant="soft"
              size="sm"
              icon={<Sparkles size={16} strokeWidth={2.4} />}
              onClick={() => setHobbies(true)}
            >
              هواياتي
            </ClayButton>
            {(archivedCount > 0 || showArchive) && (
              <ClayButton
                variant={showArchive ? "primary" : "soft"}
                size="sm"
                icon={<Archive size={16} strokeWidth={2.4} />}
                onClick={() => setShowArchive((value) => !value)}
              >
                {showArchive ? "رجوع للملف" : `الأرشيف (${archivedCount})`}
              </ClayButton>
            )}
          </motion.div>
        )}
      </motion.header>

      {/* ---------------- مؤشرات ---------------- */}
      <section className="iz-summary" aria-label="ملخّص الملف">
        <MetricCard icon={<BookOpen size={20} strokeWidth={2.4} />} value={visibleProjects.length} label="مشروع" tone="lilac" />
        <MetricCard icon={<Sparkles size={20} strokeWidth={2.4} />} value={averageStars || "—"} label="متوسط النجوم" tone="lemon" />
        <MetricCard icon={<Award size={20} strokeWidth={2.4} />} value={badges} label="شارة تميّز" tone="gold" />
      </section>

      {/* ---------------- الهوايات ---------------- */}
      {student.hobbies?.length > 0 && (
        <section className="iz-block" aria-label="هواياتي">
          <SectionTitle>هواياتي</SectionTitle>
          <div className="iz-hobbies">
            {student.hobbies.map((hobby) => (
              <motion.span
                key={hobby.id}
                className="iz-hobby"
                whileHover={{ y: -3, scale: 1.04 }}
                transition={{ duration: 0.18 }}
              >
                <Icon name={hobby.icon} size={17} />
                {hobby.label}
              </motion.span>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- المواد والمشاريع ---------------- */}
      <section className="iz-block" aria-label="المواد والمشاريع">
        <SectionTitle
          hint="المشاريع وأوراق العمل مرتّبة حسب المادة"
          action={
            canEdit && activeSubjects.length > 0 ? (
              <ClayButton
                icon={<Plus size={18} strokeWidth={2.6} />}
                onClick={() => setProjectEditor({ open: true, project: null })}
              >
                إضافة مشروع
              </ClayButton>
            ) : undefined
          }
        >
          مشاريعي
        </SectionTitle>

        {activeSubjects.length === 0 ? (
          <EmptyState
            object="book"
            tone="apricot"
            title="لا توجد مواد بعد"
            body="تُضاف المواد من لوحة الإدارة، ثم تظهر هنا تلقائيًا."
          />
        ) : visibleProjects.length === 0 ? (
          <EmptyState
            object="pencil"
            tone="lilac"
            title="لا توجد مشاريع بعد"
            body="ابدئي أول حكاية من إنجازاتك."
            action={
              canEdit ? (
                <ClayButton
                  size="lg"
                  icon={<Plus size={18} strokeWidth={2.6} />}
                  onClick={() => setProjectEditor({ open: true, project: null })}
                >
                  إضافة مشروع
                </ClayButton>
              ) : undefined
            }
          />
        ) : (
          activeSubjects.map((subject) => {
            const subjectProjects = visibleProjects.filter((project) => project.subjectId === subject.id);
            if (subjectProjects.length === 0 && !canEdit) return null;
            const teacher = teachers.find((entry) => entry.id === subject.teacherId);

            return (
              <div key={subject.id} className="iz-subject-block">
                <div className={`iz-subject-head iz-tone--${subject.tone}`}>
                  <motion.span
                    className="iz-subject-head__icon"
                    whileHover={{ rotate: -10, scale: 1.12 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon name={subject.icon} size={22} />
                  </motion.span>
                  <div>
                    <h3 className="iz-subject-head__name">{subject.name}</h3>
                    {teacher && <p className="iz-subject-head__teacher">المعلمة: {teacher.name}</p>}
                  </div>
                  <Chip>{subjectProjects.length} مشروع</Chip>
                </div>

                {subjectProjects.length === 0 ? (
                  <p className="iz-field__meter iz-subject-block__empty">لا توجد مشاريع في هذه المادة بعد.</p>
                ) : (
                  <motion.div
                    className="iz-projects-grid"
                    variants={staggerContainer}
                    initial="initial"
                    animate="enter"
                  >
                    {subjectProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        subject={subject}
                        evaluations={evaluations.filter((entry) => entry.projectId === project.id)}
                        canEdit={canEdit}
                        onOpen={() => setProjectEditor({ open: true, project })}
                        onEdit={() => setProjectEditor({ open: true, project })}
                        onArchive={async () => {
                          await archiveProject(project.id, !project.archived);
                          showToast(project.archived ? "تمت الاستعادة" : "تمت الأرشفة");
                        }}
                        onDelete={() =>
                          askDelete(`هل أنتِ متأكدة من حذف مشروع «${project.title}»؟`, async () => {
                            await deleteProject(project.id);
                            await logActivity(
                              "project.delete",
                              `تم حذف مشروع «${project.title}»`,
                              profile?.name ?? "زائرة",
                              profile?.role ?? "guest",
                            );
                            showToast("تم حذف المشروع", "info");
                            setConfirm((current) => ({ ...current, open: false }));
                          })
                        }
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* ---------------- الإنجازات والشهادات ---------------- */}
      {[
        { kind: "achievement" as const, title: "إنجازاتي", rows: wins, object: "star" as const },
        { kind: "certificate" as const, title: "شهاداتي", rows: certificates, object: "crown" as const },
      ].map((group) => (
        <section key={group.kind} className="iz-block" aria-label={group.title}>
          <SectionTitle
            action={
              canEdit ? (
                <ClayButton
                  variant="soft"
                  size="sm"
                  icon={<Plus size={16} strokeWidth={2.6} />}
                  onClick={() => setAchievementEditor({ open: true, kind: group.kind, row: null })}
                >
                  إضافة
                </ClayButton>
              ) : undefined
            }
          >
            {group.title}
          </SectionTitle>

          {group.rows.length === 0 ? (
            <Panel className="iz-inline-empty">
              <ClayObject name={group.object} tone="gold" size={54} />
              <p>لا توجد {group.title} بعد.</p>
            </Panel>
          ) : (
            <motion.div className="iz-cards-grid" variants={staggerContainer} initial="initial" animate="enter">
              {group.rows.map((row) => (
                <motion.div key={row.id} variants={riseItem}>
                  <ClayCard>
                    <article className="iz-achievement">
                      {row.imageUrl && (
                        <Media className="iz-achievement__image" src={row.imageUrl} alt="" />
                      )}
                      <div className="iz-achievement__body">
                        <h4>{row.title}</h4>
                        <p className="iz-achievement__date">{row.date}</p>
                        {row.description && <p className="iz-achievement__desc">{row.description}</p>}
                      </div>
                      {canEdit && (
                        <div className="iz-project__actions">
                          <button
                            type="button"
                            className="iz-icon-btn"
                            aria-label={`تعديل ${row.title}`}
                            onClick={() => setAchievementEditor({ open: true, kind: row.kind, row })}
                          >
                            <Pencil size={16} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            className="iz-icon-btn"
                            aria-label={`${row.archived ? "استعادة" : "أرشفة"} ${row.title}`}
                            title={row.archived ? "استعادة" : "أرشفة"}
                            onClick={async () => {
                              await archiveAchievement(row.id, !row.archived);
                              showToast(row.archived ? "تمت الاستعادة" : "تمت الأرشفة");
                            }}
                          >
                            {row.archived ? (
                              <ArchiveRestore size={16} strokeWidth={2.5} />
                            ) : (
                              <Archive size={16} strokeWidth={2.5} />
                            )}
                          </button>
                          <button
                            type="button"
                            className="iz-icon-btn iz-icon-btn--danger"
                            aria-label={`حذف ${row.title}`}
                            onClick={() =>
                              askDelete(`هل أنتِ متأكدة من حذف «${row.title}»؟`, async () => {
                                await deleteAchievement(row.id);
                                showToast("تم الحذف", "info");
                                setConfirm((current) => ({ ...current, open: false }));
                              })
                            }
                          >
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </article>
                  </ClayCard>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      ))}

      {/* ---------------- تقييمات المعلمات ---------------- */}
      <section className="iz-block" aria-label="تقييمات المعلمات">
        <SectionTitle hint="رأي المعلمة في كل مشروع">تقييمات المعلمات</SectionTitle>
        {evaluations.length === 0 ? (
          <Panel className="iz-inline-empty">
            <ClayObject name="book" tone="mint" size={54} />
            <p>لم تصل أي تقييمات بعد.</p>
          </Panel>
        ) : (
          <motion.div className="iz-cards-grid" variants={staggerContainer} initial="initial" animate="enter">
            {evaluations.map((entry) => {
              const subject = subjects.find((row) => row.id === entry.subjectId);
              const project = projects.find((row) => row.id === entry.projectId);
              return (
                <motion.div key={entry.id} variants={riseItem}>
                  <ClayCard>
                    <article className={`iz-evaluation iz-tone--${subject?.tone ?? "lilac"}`}>
                      <header className="iz-evaluation__head">
                        <div>
                          <strong>{entry.teacherName}</strong>
                          <span className="iz-evaluation__subject">{subject?.name ?? "مادة"}</span>
                        </div>
                        {entry.badge && (
                          <motion.button
                            type="button"
                            className="iz-evaluation__badge"
                            onClick={() => setCrownFor(subject?.name ?? "المادة")}
                            aria-label="عرض شارة التميّز"
                            whileHover={{ scale: 1.1, rotate: -8 }}
                            whileTap={{ scale: 0.94 }}
                          >
                            <ClayObject name="crown" tone="gold" size={30} grounded={false} />
                          </motion.button>
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
          </motion.div>
        )}
      </section>

      {/* ---------------- النوافذ ---------------- */}
      <AnimatePresence>{null}</AnimatePresence>

      <ProjectEditor
        open={projectEditor.open}
        student={student}
        subjects={activeSubjects}
        project={projectEditor.project}
        actor={profile}
        onClose={() => setProjectEditor({ open: false, project: null })}
      />

      <AchievementEditor
        open={achievementEditor.open}
        student={student}
        kind={achievementEditor.kind}
        achievement={achievementEditor.row}
        actor={profile}
        onClose={() => setAchievementEditor({ open: false, kind: "achievement", row: null })}
      />

      <PersonalizePanel
        open={personalize}
        student={student}
        actor={profile}
        onClose={() => setPersonalize(false)}
      />

      <HobbiesEditor open={hobbies} student={student} actor={profile} onClose={() => setHobbies(false)} />

      <ConfirmDialog
        open={confirm.open}
        title="تأكيد الحذف"
        message={confirm.message}
        onConfirm={confirm.run}
        onCancel={() => setConfirm((current) => ({ ...current, open: false }))}
      />

      <CrownCelebration
        open={crownFor !== null}
        subjectName={crownFor ?? ""}
        onClose={() => setCrownFor(null)}
      />
    </motion.div>
  );
}
