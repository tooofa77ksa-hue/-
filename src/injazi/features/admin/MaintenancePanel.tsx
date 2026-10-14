/*
  الصيانة — ما يحتاج تدخّلًا، في مكان واحد وبزر واحد.
  ==================================================================
  ثلاثة أعطال تنشأ من الاستعمال العادي ولا يظهر أثرها في أي شاشة،
  فتبقى سنواتٍ بلا أن يلاحظها أحد:

  ١) مشروع مادته محُذفت — أخطرها. ملف الطالبة يعرض مشاريعها مجموعةً
     حسب المواد القائمة، فمشروعٌ مادتُه لم تعد موجودة لا يظهر في أي
     مجموعة: عملُ الطالبة محفوظٌ في قاعدة البيانات ومخفيٌّ عن ملفها.
  ٢) نسخة مكرّرة من مشروع — من ضغطة حفظ مزدوجة.
  ٣) مادة محذوفة باقية في مستند معلمة — لا تضرّ اليوم، لكن استعلام
     مواد المعلمة محدود بعشر قيم، فكل معرّف ميت يأكل خانة حيّة.

  واللوحة لا تظهر إلا حين يوجد ما يُصلَح: إن كان كل شيء سليمًا فلا
  بطاقة ولا عنوان ولا سطر. صيانةٌ تُنادي حين تلزم لا زينةٌ دائمة.

  ولا حذف هنا إطلاقًا: النسخة الزائدة تُؤرشف (وتُستعاد بضغطة)،
  والمشروع اليتيم يُنقل إلى مادة تختارها المشرفة بنفسها — لا تخمين.
*/
import { useMemo, useState } from "react";
import { AlertTriangle, Check, FolderSymlink, Layers, Wrench } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { Panel, SectionTitle, SelectInput } from "@/injazi/ui/primitives";
import {
  archiveProject,
  logActivity,
  syncTeacherGrants,
  updateProject,
  updateTeacher,
} from "@/injazi/services/repo";
import { showToast } from "@/injazi/lib/toast";
import type { Project, Student, Subject, Teacher, UserDoc } from "@/injazi/types/models";

/**
 * صيغة العدد في العربية ليست «١ معلمات».
 * المفرد والمثنى لهما لفظهما، والثلاثة إلى العشرة جمعٌ، وما فوقها
 * مفردٌ منصوب. سطرٌ تقرؤه معلمة أو مشرفة لا يصحّ أن يكون ركيكًا.
 */
function count(n: number, one: string, two: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n === 2) return two;
  return n <= 10 ? `${n} ${few}` : `${n} ${many}`;
}

type Props = {
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  projects: Project[];
  profile: UserDoc | null;
};

export function MaintenancePanel({ students, teachers, subjects, projects, profile }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState<Record<string, string>>({});

  const liveSubjects = useMemo(() => subjects.filter((row) => !row.archived), [subjects]);
  const subjectIds = useMemo(() => new Set(subjects.map((row) => row.id)), [subjects]);
  const studentName = (id: string) => students.find((row) => row.id === id)?.name ?? "طالبة";

  /** مشاريع مادتها لم تعد موجودة — مخفية عن ملف صاحبتها. */
  const orphans = useMemo(
    () => projects.filter((row) => !row.archived && !subjectIds.has(row.subjectId)),
    [projects, subjectIds],
  );

  /** نسخ زائدة: نفس الطالبة والمادة والعنوان. تُبقى الأقدم. */
  const duplicates = useMemo(() => {
    const groups = new Map<string, Project[]>();
    for (const row of projects) {
      if (row.archived) continue;
      const key = `${row.studentId}|${row.subjectId}|${row.title.trim()}`;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return [...groups.values()]
      .filter((group) => group.length > 1)
      .map((group) => {
        const sorted = [...group].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        return { keep: sorted[0], extra: sorted.slice(1) };
      });
  }, [projects]);

  /** معلمات يحملن معرّف مادة لم تعد موجودة. */
  const staleTeachers = useMemo(
    () =>
      teachers
        .map((teacher) => ({
          teacher,
          clean: teacher.subjectIds.filter((id) => subjectIds.has(id)),
        }))
        .filter((row) => row.clean.length !== row.teacher.subjectIds.length),
    [teachers, subjectIds],
  );

  const total = orphans.length + duplicates.length + staleTeachers.length;
  if (total === 0) return null;

  const actor = profile?.name ?? "مشرفة";

  async function run(key: string, work: () => Promise<void>, done: string) {
    if (busy) return;
    setBusy(key);
    try {
      await work();
      showToast(done);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذّر الإصلاح", "danger");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="iz-block">
      <SectionTitle hint="أمور لا تظهر في الشاشات وتحتاج ضغطة منكِ">
        <Wrench size={20} strokeWidth={2.4} aria-hidden="true" /> الصيانة ({total})
      </SectionTitle>

      {orphans.length > 0 && (
        <Panel className="iz-maint">
          <p className="iz-maint__head">
            <AlertTriangle size={17} strokeWidth={2.5} aria-hidden="true" />
            <strong>
              {count(
                orphans.length,
                "مشروع مخفيّ",
                "مشروعان مخفيّان",
                "مشاريع مخفيّة",
                "مشروعًا مخفيًّا",
              )}{" "}
              عن ملف الطالبة
            </strong>
          </p>
          <p className="iz-maint__why">
            مادتها حُذفت، فلا تظهر في أي مجموعة داخل الملف — والعمل محفوظ ولم يُفقد. اختاري لها
            مادة فتعود للظهور فورًا.
          </p>
          {orphans.map((project) => (
            <div key={project.id} className="iz-maint__row">
              <span className="iz-maint__label">
                {studentName(project.studentId)} · «{project.title}»
              </span>
              <SelectInput
                value={moveTo[project.id] ?? ""}
                onChange={(event) =>
                  setMoveTo((current) => ({ ...current, [project.id]: event.target.value }))
                }
                aria-label={`المادة الجديدة لمشروع ${project.title}`}
              >
                <option value="">اختاري المادة…</option>
                {liveSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </SelectInput>
              <ClayButton
                size="sm"
                icon={<FolderSymlink size={15} strokeWidth={2.5} />}
                disabled={!moveTo[project.id]}
                loading={busy === `move:${project.id}`}
                onClick={() =>
                  run(
                    `move:${project.id}`,
                    async () => {
                      await updateProject(project.id, { subjectId: moveTo[project.id] });
                      await logActivity(
                        "project.update",
                        `نُقل مشروع «${project.title}» إلى مادة قائمة`,
                        actor,
                        "admin",
                      );
                    },
                    "ظهر المشروع في ملف الطالبة",
                  )
                }
              >
                نقل
              </ClayButton>
            </div>
          ))}
        </Panel>
      )}

      {duplicates.length > 0 && (
        <Panel className="iz-maint">
          <p className="iz-maint__head">
            <Layers size={17} strokeWidth={2.5} aria-hidden="true" />
            <strong>
              {count(
                duplicates.length,
                "مشروع مكرّر",
                "مشروعان مكرّران",
                "مشاريع مكرّرة",
                "مشروعًا مكرّرًا",
              )}
            </strong>
          </p>
          <p className="iz-maint__why">
            نسخة زائدة من ضغطة حفظ مزدوجة. تُؤرشف النسخة الأحدث وتبقى الأقدم — والأرشفة تُستعاد
            بضغطة، فلا شيء يُفقد.
          </p>
          <ul className="iz-maint__list">
            {duplicates.map((group) => (
              <li key={group.keep.id}>
                {studentName(group.keep.studentId)} · «{group.keep.title}» —{" "}
                {group.extra.length + 1} نسخ
              </li>
            ))}
          </ul>
          <ClayButton
            size="sm"
            icon={<Check size={15} strokeWidth={2.6} />}
            loading={busy === "dups"}
            onClick={() =>
              run(
                "dups",
                async () => {
                  for (const group of duplicates) {
                    for (const extra of group.extra) {
                      await archiveProject(extra.id, true);
                    }
                  }
                  await logActivity(
                    "project.update",
                    `أُرشفت ${duplicates.reduce((sum, g) => sum + g.extra.length, 0)} نسخة مكرّرة`,
                    actor,
                    "admin",
                  );
                },
                "تمت أرشفة النسخ الزائدة",
              )
            }
          >
            أرشفة النسخ الزائدة
          </ClayButton>
        </Panel>
      )}

      {staleTeachers.length > 0 && (
        <Panel className="iz-maint">
          <p className="iz-maint__head">
            <Wrench size={17} strokeWidth={2.5} aria-hidden="true" />
            <strong>
              {count(
                staleTeachers.length,
                "معلمة تحمل مادة محذوفة",
                "معلمتان تحملان مادة محذوفة",
                "معلمات يحملن مادة محذوفة",
                "معلمة تحمل مادة محذوفة",
              )}
            </strong>
          </p>
          <p className="iz-maint__why">
            بقايا مواد حُذفت: {staleTeachers.map((row) => row.teacher.name).join("، ")}. لا تضرّ
            اليوم، وتنظيفها يمنع التباسًا لاحقًا.
          </p>
          <ClayButton
            size="sm"
            variant="soft"
            icon={<Check size={15} strokeWidth={2.6} />}
            loading={busy === "teachers"}
            onClick={() =>
              run(
                "teachers",
                async () => {
                  for (const row of staleTeachers) {
                    await updateTeacher(row.teacher.id, { subjectIds: row.clean });
                    await syncTeacherGrants(row.teacher.id, row.clean);
                  }
                  await logActivity(
                    "teacher.update",
                    `نُظِّفت مواد محذوفة من ${staleTeachers.length} معلمات`,
                    actor,
                    "admin",
                  );
                },
                "تم التنظيف",
              )
            }
          >
            تنظيف
          </ClayButton>
        </Panel>
      )}
    </section>
  );
}
