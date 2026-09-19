/*
  بوابة المعلمات.
  بعد الدخول يقرأ النظام مواد المعلمة من ملف صلاحياتها ويعرض مشاريع
  تلك المواد فقط — لا قائمة مواد تختار منها، لأن الاختيار هنا ليس
  تفضيلًا بل صلاحية.
*/
import { useMemo, useState } from "react";
import { Media } from "@/injazi/ui/Media";
import { motion } from "motion/react";
import {
  CheckCircle2,
  ClipboardList,
  Inbox,
  RefreshCcw,
  Search,
  Star,
  Users,
} from "lucide-react";
import { ClayCard } from "@/injazi/components/ClayCard";
import { StudentCard } from "@/injazi/features/students/StudentCard";
import { EmptyState } from "@/injazi/components/EmptyState";
import { textMatches } from "@/injazi/lib/arabicSearch";
import { EvaluationEditor } from "@/injazi/features/teacher/EvaluationEditor";
import { Chip, MetricCard, SectionTitle, SelectInput, SkeletonCards } from "@/injazi/ui/primitives";
import { Icon } from "@/injazi/ui/IconPicker";
import { Rating } from "@/injazi/ui/Rating";
import {
  useIndex,
  useProjectsForSubjects,
  useSession,
  useStudents,
  useSubjects,
} from "@/injazi/hooks/useLive";
import { liveCollection, COL } from "@/injazi/services/repo";
import { pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";
import type { Evaluation, Project } from "@/injazi/types/models";
import { useEffect } from "react";

type StatusFilter = "all" | "new" | "reviewed" | "needs-revision";

export function TeacherPortal() {
  const { profile } = useSession();
  const { data: subjects } = useSubjects();
  const { data: students } = useStudents();

  const mySubjectIds = useMemo(() => profile?.subjectIds ?? [], [profile]);
  const { data: projects, loading, error: projectsError } = useProjectsForSubjects(mySubjectIds);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  // المواد نفسها لا عددها: نقل المعلمة من مادة إلى أخرى بنفس العدد كان
  // يُبقي الاشتراك على حاله.
  const subjectsKey = mySubjectIds.join(",");
  useEffect(() => {
    if (subjectsKey === "") {
      setEvaluations([]);
      return;
    }
    return liveCollection<Evaluation>(COL.evaluations, [], setEvaluations);
  }, [subjectsKey]);

  const [query, setQuery] = useState("");
  /* بحث الطالبات منفصل عن بحث المشاريع عمدًا: خلطهما في مربّع واحد
     يجعل كتابة اسم طالبة تُفرغ قائمة المشاريع بلا سبب ظاهر. */
  const [studentQuery, setStudentQuery] = useState("");
  // المعلمة ذات المادة الواحدة تفتح على مادتها مباشرة — لا قائمة من عنصر.
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "student">("newest");
  const [editing, setEditing] = useState<Project | null>(null);

  // مادة واحدة ⇒ اختيارها تلقائيًا: القائمة من عنصر واحد خطوة بلا معنى.
  useEffect(() => {
    if (mySubjectIds.length === 1) setSubjectFilter(mySubjectIds[0]);
  }, [mySubjectIds]);

  const studentIndex = useIndex(students);
  const subjectIndex = useIndex(subjects);
  const mySubjects = subjects.filter((subject) => mySubjectIds.includes(subject.id));

  /** تقييم هذه المعلمة لهذا المشروع (لا تقييمات زميلاتها). */
  const myEvaluationFor = (projectId: string) =>
    evaluations.find(
      (entry) => entry.projectId === projectId && entry.teacherId === (profile?.teacherId ?? profile?.id),
    );

  const rows = useMemo(() => {
    // المؤرشف أخفته الطالبة عن ملفها، فلا يُعرض للتقييم.
    let list = projects.filter(
      (project) => mySubjectIds.includes(project.subjectId) && project.archived !== true,
    );

    if (subjectFilter !== "all") list = list.filter((project) => project.subjectId === subjectFilter);

    if (statusFilter !== "all") {
      list = list.filter((project) => {
        const evaluation = myEvaluationFor(project.id);
        if (statusFilter === "new") return !evaluation;
        if (statusFilter === "reviewed") return Boolean(evaluation) && evaluation!.status !== "needs-revision";
        return evaluation?.status === "needs-revision";
      });
    }

    const needle = query.trim();
    if (needle) {
      list = list.filter(
        (project) =>
          textMatches(project.title, needle) ||
          textMatches(studentIndex[project.studentId]?.name ?? "", needle),
      );
    }

    return [...list].sort((a, b) => {
      if (sort === "student") {
        return (studentIndex[a.studentId]?.name ?? "").localeCompare(studentIndex[b.studentId]?.name ?? "", "ar");
      }
      return sort === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, mySubjectIds, subjectFilter, statusFilter, query, sort, studentIndex, evaluations]);

  /* هل في موادها أعمال أصلًا؟ «لا شيء بعد» و«التصفية أخفت كل شيء»
     حالتان مختلفتان تمامًا: الأولى تنتظر الطالبات ولا تملك المعلمة لها
     حيلة، والثانية تُحلّ بضغطة. رسالة واحدة للحالتين تدفع المعلمة إلى
     تجربة تصفيات لن تُظهر شيئًا، فتظنّ أن البيانات ضاعت. */
  const hasAnyWork = useMemo(
    () =>
      projects.some(
        (project) => mySubjectIds.includes(project.subjectId) && project.archived !== true,
      ),
    [projects, mySubjectIds],
  );

  const activeStudents = useMemo(() => students.filter((student) => student.active), [students]);

  const studentRows = useMemo(
    () => activeStudents.filter((student) => textMatches(student.name, studentQuery)),
    [activeStudents, studentQuery],
  );

  const liveProjects = useMemo(
    () => projects.filter((project) => project.archived !== true),
    [projects],
  );
  const pending = liveProjects.filter((project) => !myEvaluationFor(project.id)).length;
  const reviewed = liveProjects.length - pending;
  const revisions = liveProjects.filter(
    (project) => myEvaluationFor(project.id)?.status === "needs-revision",
  ).length;
  const studentsWithWork = new Set(liveProjects.map((project) => project.studentId)).size;

  if (mySubjectIds.length === 0) {
    return (
      <div className="iz-page iz-page--narrow">
        <EmptyState
          object="book"
          tone="apricot"
          title="لم تُسنَد إليكِ مادة بعد"
          body="تُسنَد المواد من لوحة الإدارة. بعد الإسناد ستظهر مشاريع طالباتكِ هنا مباشرة."
        />
      </div>
    );
  }

  return (
    <motion.div className="iz-page" variants={pageVariants} initial="initial" animate="enter" exit="exit">
      <motion.header className="iz-dash-head" variants={staggerContainer}>
        <motion.div variants={riseItem}>
          <p className="iz-hero__eyebrow">بوابة المعلمات</p>
          <h1 className="iz-page__title">أهلًا {profile?.name}</h1>
          <div className="iz-chip-row">
            {mySubjects.map((subject) => (
              <Chip key={subject.id} tone="info" icon={<Icon name={subject.icon} size={14} />}>
                {subject.name}
              </Chip>
            ))}
          </div>
        </motion.div>
      </motion.header>

      <section className="iz-summary iz-summary--4" aria-label="مؤشرات">
        <MetricCard icon={<Users size={20} strokeWidth={2.4} />} value={studentsWithWork} label="طالبة لديها أعمال" tone="lilac" />
        <MetricCard icon={<ClipboardList size={20} strokeWidth={2.4} />} value={liveProjects.length} label="مشروع" tone="sky" />
        <MetricCard icon={<Inbox size={20} strokeWidth={2.4} />} value={pending} label="بانتظار التقييم" tone="apricot" />
        <MetricCard icon={<CheckCircle2 size={20} strokeWidth={2.4} />} value={reviewed} label="تم تقييمه" tone="mint" />
      </section>

      {/* ملفات الطالبات قبل قائمة المشاريع: المعلمة تعرف طالباتها
          بأسمائهنّ لا بعناوين مشاريعهنّ، وأول ما تبحث عنه اسم. وكانت
          البوابة تبحث في المشاريع وحدها، فمن كتبت اسم طالبة لم تجد
          شيئًا وظنّت أن البيانات ضاعت. القراءة هنا لا تمنح تعديلًا:
          صلاحيات التعديل تُحسَم في القواعد لا في هذه الصفحة. */}
      <section className="iz-block" aria-label="ملفات الطالبات">
        <SectionTitle hint={`${studentRows.length} من ${activeStudents.length} طالبة`}>
          ملفات الطالبات
        </SectionTitle>

        <div className="iz-search" style={{ marginBottom: 14 }}>
          <Search size={18} strokeWidth={2.4} aria-hidden="true" />
          <input
            className="iz-search__input"
            value={studentQuery}
            onChange={(event) => setStudentQuery(event.target.value)}
            placeholder="اكتبي اسم الطالبة لفتح ملفها"
            aria-label="ابحثي عن طالبة"
            type="search"
          />
        </div>

        {studentRows.length === 0 ? (
          <EmptyState
            object="bag"
            tone="lilac"
            title={activeStudents.length === 0 ? "لم تُضَف أي طالبة بعد" : "لا توجد طالبة بهذا الاسم"}
            body={
              activeStudents.length === 0
                ? "تُضاف الطالبات من لوحة الإدارة، ثم تظهر ملفاتهن هنا مباشرة."
                : "جرّبي كتابة جزء من الاسم فقط — الاسم الأول يكفي."
            }
          />
        ) : (
          <div className="iz-gallery__grid">
            {studentRows.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        )}
      </section>

      <section className="iz-block">
        <SectionTitle hint={revisions > 0 ? `${revisions} مشروع يحتاج مراجعة` : undefined}>
          مشاريع الطالبات
        </SectionTitle>

        <div className="iz-filters">
          <div className="iz-search">
            <Search size={18} strokeWidth={2.4} aria-hidden="true" />
            <input
              className="iz-search__input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحثي باسم الطالبة أو المشروع"
              aria-label="بحث"
            />
          </div>

          <SelectInput
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            aria-label="تصفية حسب المادة"
          >
            <option value="all">كل موادي</option>
            {mySubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </SelectInput>

          <SelectInput
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            aria-label="تصفية حسب الحالة"
          >
            <option value="all">كل الحالات</option>
            <option value="new">بانتظار التقييم</option>
            <option value="reviewed">تم تقييمه</option>
            <option value="needs-revision">يحتاج مراجعة</option>
          </SelectInput>

          <SelectInput
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            aria-label="الترتيب"
          >
            <option value="newest">الأحدث أولًا</option>
            <option value="oldest">الأقدم أولًا</option>
            <option value="student">حسب اسم الطالبة</option>
          </SelectInput>
        </div>

        {/* عطل القراءة يُقال صراحةً: «لم ترفع أي طالبة عملًا بعد» رسالة
            مطمئنة، وقولها بينما السبب رفض صلاحية أو انقطاع شبكة يجعل
            المعلمة تنتظر عملًا موجودًا فعلًا ولا يصلها. */}
        {projectsError ? (
          <EmptyState
            object="pencil"
            tone="apricot"
            title="تعذّر تحميل المشاريع"
            body={projectsError}
          />
        ) : loading ? (
          <SkeletonCards count={4} />
        ) : rows.length === 0 ? (
          hasAnyWork ? (
            <EmptyState
              object="pencil"
              tone="mint"
              title="لا توجد مشاريع مطابقة"
              body="جرّبي مسح كلمة البحث أو إعادة التصفية إلى «كل الحالات»."
            />
          ) : (
            <EmptyState
              object="pencil"
              tone="mint"
              title="لم ترفع أي طالبة عملًا بعد"
              body="حين ترفع طالبة مشروعًا في مادتك سيظهر هنا وحده لتقييمه. البحث لن يجد شيئًا الآن لأنه لا يوجد شيء بعد — ولا ينقصك أي إعداد."
            />
          )
        ) : (
          <motion.div className="iz-cards-grid" variants={staggerContainer} initial="initial" animate="enter">
            {rows.map((project) => {
              const student = studentIndex[project.studentId];
              const subject = subjectIndex[project.subjectId];
              const evaluation = myEvaluationFor(project.id);

              return (
                <motion.div key={project.id} variants={riseItem}>
                  <ClayCard>
                    <button
                      type="button"
                      className="iz-review-row"
                      onClick={() => setEditing(project)}
                      aria-label={`تقييم ${project.title} لـ ${student?.name ?? "طالبة"}`}
                    >
                      <span className="iz-review-row__avatar">
                        {student?.photoUrl ? (
                          <Media src={student.photoUrl} alt="" fallback={<span aria-hidden="true">{student?.name?.charAt(0) ?? "؟"}</span>} />
                        ) : (
                          <span aria-hidden="true">{student?.name?.charAt(0) ?? "؟"}</span>
                        )}
                      </span>

                      <span className="iz-review-row__text">
                        <strong>{project.title}</strong>
                        <span className="iz-review-row__meta">
                          {student?.name ?? "طالبة"} · {subject?.name ?? "مادة"} · {project.date}
                        </span>
                        {evaluation ? (
                          <span className="iz-review-row__eval">
                            <Rating value={evaluation.stars} readOnly size={16} />
                            <Chip
                              tone={
                                evaluation.status === "excellent"
                                  ? "gold"
                                  : evaluation.status === "complete"
                                    ? "success"
                                    : "warn"
                              }
                            >
                              {evaluation.status === "excellent"
                                ? "متميّز"
                                : evaluation.status === "complete"
                                  ? "مكتمل"
                                  : "يحتاج مراجعة"}
                            </Chip>
                          </span>
                        ) : (
                          <Chip tone="warn" icon={<Star size={13} strokeWidth={2.6} />}>
                            بانتظار التقييم
                          </Chip>
                        )}
                      </span>

                      <RefreshCcw size={17} strokeWidth={2.4} className="iz-review-row__go" aria-hidden="true" />
                    </button>
                  </ClayCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      <EvaluationEditor
        open={editing !== null}
        project={editing}
        student={editing ? studentIndex[editing.studentId] : undefined}
        subject={editing ? subjectIndex[editing.subjectId] : undefined}
        existing={editing ? myEvaluationFor(editing.id) : undefined}
        teacher={profile}
        onClose={() => setEditing(null)}
      />
    </motion.div>
  );
}
