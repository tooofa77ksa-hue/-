/*
  إدارة المواد.
  إضافة/تعديل/أرشفة/حذف/إعادة ترتيب + تغيير الأيقونة واللون وإسناد
  المعلمة. أي مادة تُضاف هنا تظهر فورًا في كل ملف طالبة وفي بوابة
  المعلمات، لأن كل الشاشات تقرأ المجموعة نفسها حيًّا.
  الأرشفة موجودة لأن الحذف يفقد تاريخ المادة: المادة المؤرشفة تختفي من
  الإضافة الجديدة ويبقى ما نُفِّذ فيها سابقًا.
*/
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { EmptyState } from "@/injazi/components/EmptyState";
import { ConfirmDialog, Modal } from "@/injazi/ui/Modal";
import { Chip, Field, Notice, SectionTitle, SelectInput, TextInput } from "@/injazi/ui/primitives";
import { SortableList } from "@/injazi/ui/SortableList";
import { Icon, IconPicker } from "@/injazi/ui/IconPicker";
import {
  COL,
  createSubject,
  deleteSubject,
  logActivity,
  reorder,
  updateSubject,
  updateTeacher,
} from "@/injazi/services/repo";
import { useSession, useSubjects, useTeachers } from "@/injazi/hooks/useLive";
import { showToast } from "@/injazi/lib/toast";
import { pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";
import type { Subject, Teacher } from "@/injazi/types/models";

const TONES = [
  { id: "lilac", name: "بنفسجي" },
  { id: "sky", name: "سماوي" },
  { id: "mint", name: "نعناعي" },
  { id: "apricot", name: "مشمشي" },
  { id: "rose", name: "وردي" },
  { id: "lemon", name: "ليموني" },
];

export function AdminSubjects() {
  const { profile } = useSession();
  const { data: subjects, loading } = useSubjects();
  const { data: teachers } = useTeachers();

  const [editor, setEditor] = useState<{ open: boolean; row: Subject | null }>({ open: false, row: null });
  const [confirm, setConfirm] = useState<Subject | null>(null);

  return (
    <motion.div className="iz-page" variants={pageVariants} initial="initial" animate="enter" exit="exit">
      <SectionTitle
        hint="اسحبي لإعادة الترتيب — الترتيب نفسه يظهر في ملفات الطالبات"
        action={
          <ClayButton icon={<Plus size={18} strokeWidth={2.6} />} onClick={() => setEditor({ open: true, row: null })}>
            إضافة مادة
          </ClayButton>
        }
      >
        المواد ({subjects.filter((subject) => !subject.archived).length})
      </SectionTitle>

      {loading ? (
        <p className="iz-field__meter">جارٍ التحميل…</p>
      ) : subjects.length === 0 ? (
        <EmptyState
          object="calculator"
          tone="sky"
          title="لا توجد مواد بعد"
          body="أضيفي المواد الأساسية ثم أسندي إلى كل مادة معلمتها."
          action={
            <ClayButton size="lg" icon={<Plus size={18} strokeWidth={2.6} />} onClick={() => setEditor({ open: true, row: null })}>
              إضافة مادة
            </ClayButton>
          }
        />
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="enter">
          <SortableList
            items={subjects}
            onReorder={async (ids) => {
              await reorder(COL.subjects, ids);
              showToast("تم حفظ الترتيب");
            }}
            renderItem={(subject) => {
              const teacher = teachers.find((entry) => entry.id === subject.teacherId);
              const toggleArchive = async () => {
                await updateSubject(subject.id, { archived: !subject.archived });
                showToast(subject.archived ? "أُعيدت المادة" : "أُرشفت المادة", "info");
              };
              return (
                <motion.div className={`iz-admin-row iz-tone--${subject.tone}`} variants={riseItem}>
                  <span className="iz-admin-row__icon">
                    <Icon name={subject.icon} size={22} />
                  </span>

                  <span className="iz-admin-row__text">
                    <strong>{subject.name}</strong>
                    <span className="iz-admin-row__meta">
                      {teacher ? `المعلمة: ${teacher.name}` : "لم تُسنَد معلمة"}
                    </span>
                    {/* الوسم يُخبر ولا يُنقَر، فمن يريد التراجع عن الأرشفة لا
                        يجد أمامه إلا أيقونة بلا كلمة. الفعل يُكتب بجانب
                        الوسم صراحةً — الأيقونة تبقى لمن اعتادها. */}
                    {subject.archived && (
                      <span className="iz-chip-row">
                        <Chip tone="warn">مؤرشفة</Chip>
                        <button type="button" className="iz-linkish" onClick={toggleArchive}>
                          استعادة
                        </button>
                      </span>
                    )}
                  </span>

                  <span className="iz-admin-row__actions">
                    <button
                      type="button"
                      className="iz-icon-btn"
                      aria-label={subject.archived ? `استعادة ${subject.name}` : `أرشفة ${subject.name}`}
                      title={subject.archived ? "استعادة" : "أرشفة"}
                      onClick={toggleArchive}
                    >
                      {subject.archived ? <ArchiveRestore size={16} strokeWidth={2.5} /> : <Archive size={16} strokeWidth={2.5} />}
                    </button>
                    <button
                      type="button"
                      className="iz-icon-btn"
                      aria-label={`تعديل ${subject.name}`}
                      onClick={() => setEditor({ open: true, row: subject })}
                    >
                      <Pencil size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      className="iz-icon-btn iz-icon-btn--danger"
                      aria-label={`حذف ${subject.name}`}
                      onClick={() => setConfirm(subject)}
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </span>
                </motion.div>
              );
            }}
          />
        </motion.div>
      )}

      <SubjectEditor
        open={editor.open}
        row={editor.row}
        teachers={teachers}
        actorName={profile?.name ?? "مشرفة"}
        onClose={() => setEditor({ open: false, row: null })}
      />

      <ConfirmDialog
        open={confirm !== null}
        title="حذف المادة"
        message={`ستُحذف مادة «${confirm?.name}». المشاريع المرتبطة بها ستبقى لكنها ستظهر بلا مادة. الأفضل الأرشفة بدل الحذف. هل أنتِ متأكدة؟`}
        onConfirm={async () => {
          if (!confirm) return;
          await deleteSubject(confirm.id);
          await logActivity("subject.delete", `تم حذف مادة ${confirm.name}`, profile?.name ?? "مشرفة", "admin");
          showToast("تم حذف المادة", "info");
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  );
}

function SubjectEditor({
  open,
  row,
  teachers,
  actorName,
  onClose,
}: {
  open: boolean;
  row: Subject | null;
  teachers: Teacher[];
  actorName: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("BookOpen");
  const [tone, setTone] = useState("lilac");
  const [teacherId, setTeacherId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(row?.name ?? "");
    setIcon(row?.icon ?? "BookOpen");
    setTone(row?.tone ?? "lilac");
    setTeacherId(row?.teacherId ?? "");
    setError(null);
  }, [open, row]);

  async function save() {
    if (name.trim().length < 2 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const payload = { name: name.trim(), icon, tone, teacherId: teacherId || null };
      const subjectId = row ? (await updateSubject(row.id, payload), row.id) : await createSubject(payload);

      // الإسناد ثنائي الاتجاه: تحديث المادة وحده كان سيترك المعلمة بلا
      // صلاحية تقييمها، لأن الصلاحية تُقرأ من subjectIds.
      await Promise.all(
        teachers.map((teacher) => {
          const has = teacher.subjectIds.includes(subjectId);
          if (teacher.id === teacherId && !has) {
            return updateTeacher(teacher.id, { subjectIds: [...teacher.subjectIds, subjectId] });
          }
          if (teacher.id !== teacherId && has) {
            return updateTeacher(teacher.id, {
              subjectIds: teacher.subjectIds.filter((id) => id !== subjectId),
            });
          }
          return Promise.resolve();
        }),
      );

      await logActivity(
        row ? "subject.update" : "subject.create",
        `${row ? "تم تعديل" : "تمت إضافة"} مادة ${payload.name}`,
        actorName,
        "admin",
      );
      showToast(row ? "تم حفظ المادة" : "تمت إضافة المادة");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الحفظ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title={row ? "تعديل المادة" : "إضافة مادة"}
      onClose={onClose}
      footer={
        <>
          <ClayButton variant="soft" onClick={onClose} disabled={busy}>
            إلغاء
          </ClayButton>
          <ClayButton onClick={save} loading={busy} disabled={name.trim().length < 2}>
            حفظ
          </ClayButton>
        </>
      }
    >
      <Field label="اسم المادة">
        <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={50} placeholder="مثال: الرياضيات" />
      </Field>

      <div className="iz-form-grid">
        <Field label="المعلمة">
          <SelectInput value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
            <option value="">بلا معلمة</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="اللون">
          <SelectInput value={tone} onChange={(event) => setTone(event.target.value)}>
            {TONES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <div className={`iz-subject-head iz-tone--${tone}`}>
        <span className="iz-subject-head__icon">
          <Icon name={icon} size={22} />
        </span>
        <div>
          <h3 className="iz-subject-head__name">{name || "اسم المادة"}</h3>
          <p className="iz-subject-head__teacher">معاينة</p>
        </div>
      </div>

      <IconPicker value={icon} onChange={setIcon} label="أيقونة المادة" />

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}
