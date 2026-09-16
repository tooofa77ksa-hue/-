/*
  إدارة المعلمات.
  إضافة معلمة تنشئ شيئين معًا: مستند المعلمة (للعرض والإسناد) وحساب
  دخول بدور teacher مربوط بموادها. هذا هو معنى «لا أرجع للكود كلما
  جاءت معلمة جديدة».
  تغيير مواد المعلمة يحدّث مستند المعلمة وملف صلاحياتها في آنٍ واحد،
  لأن القواعد الأمنية تقرأ subjectIds من ملف الصلاحيات لا من المعلمة.
*/
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Mail, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { EmptyState } from "@/injazi/components/EmptyState";
import { ConfirmDialog, Modal } from "@/injazi/ui/Modal";
import { Chip, Field, Notice, SectionTitle, SelectInput, TextInput } from "@/injazi/ui/primitives";
import { SortableList } from "@/injazi/ui/SortableList";
import { Uploader } from "@/injazi/ui/Uploader";
import { Icon } from "@/injazi/ui/IconPicker";
import {
  COL,
  createTeacher,
  deleteTeacher,
  logActivity,
  reorder,
  saveUserDoc,
  updateSubject,
  updateTeacher,
} from "@/injazi/services/repo";
import { createAccount } from "@/injazi/services/auth";
import { deleteFile } from "@/injazi/services/storage";
import { useSession, useSubjects, useTeachers, useUsers } from "@/injazi/hooks/useLive";
import { showToast } from "@/injazi/lib/toast";
import { pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";
import type { Subject, Teacher, UserDoc } from "@/injazi/types/models";

export function AdminTeachers() {
  const { profile } = useSession();
  const { data: teachers, loading } = useTeachers();
  const { data: subjects } = useSubjects();
  const { data: users } = useUsers();

  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ open: boolean; row: Teacher | null }>({ open: false, row: null });
  const [confirm, setConfirm] = useState<Teacher | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim();
    return needle
      ? teachers.filter((teacher) => teacher.name.includes(needle) || teacher.email.includes(needle))
      : teachers;
  }, [teachers, query]);

  return (
    <motion.div className="iz-page" variants={pageVariants} initial="initial" animate="enter" exit="exit">
      <SectionTitle
        hint="إضافة معلمة تنشئ حساب دخولها وتسند إليها موادها مباشرة"
        action={
          <ClayButton icon={<Plus size={18} strokeWidth={2.6} />} onClick={() => setEditor({ open: true, row: null })}>
            إضافة معلمة
          </ClayButton>
        }
      >
        المعلمات ({teachers.length})
      </SectionTitle>

      <div className="iz-filters">
        <div className="iz-search">
          <Search size={18} strokeWidth={2.4} aria-hidden="true" />
          <input
            className="iz-search__input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحثي بالاسم أو البريد"
            aria-label="بحث"
          />
        </div>
      </div>

      {loading ? (
        <p className="iz-field__meter">جارٍ التحميل…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          object="book"
          tone="mint"
          title={query ? "لا توجد نتيجة" : "لم تُضَف أي معلمة بعد"}
          body={query ? "جرّبي جزءًا من الاسم." : "أضيفي المعلمات ثم أسندي إلى كل واحدة مادتها."}
          action={
            <ClayButton size="lg" icon={<Plus size={18} strokeWidth={2.6} />} onClick={() => setEditor({ open: true, row: null })}>
              إضافة معلمة
            </ClayButton>
          }
        />
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="enter">
          <SortableList
            items={rows}
            disabled={query.trim().length > 0}
            onReorder={async (ids) => {
              await reorder(COL.teachers, ids);
              showToast("تم حفظ الترتيب");
            }}
            renderItem={(teacher) => {
              const account = users.find((user) => user.teacherId === teacher.id);
              const owned = subjects.filter((subject) => teacher.subjectIds.includes(subject.id));
              return (
                <motion.div className="iz-admin-row" variants={riseItem}>
                  <span className="iz-admin-row__avatar">
                    {teacher.photoUrl ? (
                      <img src={teacher.photoUrl} alt="" loading="lazy" />
                    ) : (
                      <span aria-hidden="true">{teacher.name.charAt(0)}</span>
                    )}
                  </span>

                  <span className="iz-admin-row__text">
                    <strong>{teacher.name}</strong>
                    <span className="iz-admin-row__meta">
                      <Mail size={13} strokeWidth={2.4} aria-hidden="true" /> {teacher.email}
                    </span>
                    <span className="iz-chip-row">
                      {!teacher.active && <Chip tone="warn">معطَّلة</Chip>}
                      {!account && <Chip tone="warn">بلا حساب دخول</Chip>}
                      {owned.length === 0 ? (
                        <Chip tone="info">بلا مادة</Chip>
                      ) : (
                        owned.map((subject) => (
                          <Chip key={subject.id} tone="success" icon={<Icon name={subject.icon} size={13} />}>
                            {subject.name}
                          </Chip>
                        ))
                      )}
                    </span>
                  </span>

                  <span className="iz-admin-row__actions">
                    <button
                      type="button"
                      className="iz-icon-btn"
                      aria-label={`تعديل ${teacher.name}`}
                      onClick={() => setEditor({ open: true, row: teacher })}
                    >
                      <Pencil size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      className="iz-icon-btn iz-icon-btn--danger"
                      aria-label={`حذف ${teacher.name}`}
                      onClick={() => setConfirm(teacher)}
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

      <TeacherEditor
        open={editor.open}
        row={editor.row}
        subjects={subjects}
        users={users}
        actorName={profile?.name ?? "مشرفة"}
        onClose={() => setEditor({ open: false, row: null })}
      />

      <ConfirmDialog
        open={confirm !== null}
        title="حذف المعلمة"
        message={`سيُحذف ملف «${confirm?.name}» وتُفكّ موادها. حساب الدخول يبقى معطَّلًا في Firebase Authentication ويُحذف من هناك. هل أنتِ متأكدة؟`}
        onConfirm={async () => {
          if (!confirm) return;
          const account = users.find((user) => user.teacherId === confirm.id);
          if (account) await saveUserDoc(account.id, { active: false, subjectIds: [] });
          await deleteTeacher(confirm.id);
          await logActivity("teacher.delete", `تم حذف المعلمة ${confirm.name}`, profile?.name ?? "مشرفة", "admin");
          showToast("تم حذف المعلمة", "info");
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  );
}

function TeacherEditor({
  open,
  row,
  subjects,
  users,
  actorName,
  onClose,
}: {
  open: boolean;
  row: Teacher | null;
  subjects: Subject[];
  users: UserDoc[];
  actorName: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [photo, setPhoto] = useState<{ url: string; path: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(row?.name ?? "");
    setEmail(row?.email ?? "");
    setPassword("");
    setSubjectIds(row?.subjectIds ?? []);
    setActive(row?.active ?? true);
    setPhoto(row?.photoUrl ? { url: row.photoUrl, path: row.photoPath ?? "" } : null);
    setError(null);
  }, [open, row]);

  const account = row ? users.find((user) => user.teacherId === row.id) : undefined;
  const needsAccount = !row || !account;

  function toggleSubject(id: string) {
    setSubjectIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  async function save() {
    if (name.trim().length < 2 || !email.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subjectIds,
        active,
        photoUrl: photo?.url ?? null,
        photoPath: photo?.path ?? null,
      };

      const teacherId = row ? (await updateTeacher(row.id, payload), row.id) : await createTeacher(payload);

      // المواد المسنَدة تُكتب في المادة نفسها أيضًا، فيظهر اسم المعلمة
      // في ملف كل طالبة دون استعلام إضافي.
      await Promise.all(
        subjects.map((subject) => {
          const shouldOwn = subjectIds.includes(subject.id);
          if (shouldOwn && subject.teacherId !== teacherId) return updateSubject(subject.id, { teacherId });
          if (!shouldOwn && subject.teacherId === teacherId) return updateSubject(subject.id, { teacherId: null });
          return Promise.resolve();
        }),
      );

      if (account) {
        await saveUserDoc(account.id, { name: payload.name, subjectIds, active, teacherId });
      } else if (password.length >= 6) {
        await createAccount(payload.email, password, payload.name, "teacher", { teacherId, subjectIds });
      }

      await logActivity(
        row ? "teacher.update" : "teacher.create",
        `${row ? "تم تعديل" : "تمت إضافة"} المعلمة ${payload.name}`,
        actorName,
        "admin",
      );
      showToast(row ? "تم حفظ بيانات المعلمة" : "تمت إضافة المعلمة وحسابها");
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
      title={row ? "تعديل المعلمة" : "إضافة معلمة"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <ClayButton variant="soft" onClick={onClose} disabled={busy}>
            إلغاء
          </ClayButton>
          <ClayButton
            onClick={save}
            loading={busy}
            disabled={name.trim().length < 2 || !email.trim() || (needsAccount && password.length < 6)}
          >
            حفظ
          </ClayButton>
        </>
      }
    >
      <div className="iz-form-grid">
        <Field label="اسم المعلمة">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={60} />
        </Field>
        <Field label="البريد الإلكتروني">
          <TextInput
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            inputMode="email"
            disabled={Boolean(account)}
          />
        </Field>
      </div>

      {needsAccount && (
        <Field
          label="كلمة مرور الدخول"
          hint="٦ أحرف على الأقل. تستطيع المعلمة تغييرها لاحقًا عبر «نسيت كلمة المرور»."
        >
          <TextInput
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            autoComplete="new-password"
          />
        </Field>
      )}

      <section className="iz-editor-block">
        <h3 className="iz-editor-block__title">المواد المسنَدة</h3>
        {subjects.length === 0 ? (
          <p className="iz-field__meter">لا توجد مواد بعد — أضيفيها من تبويب «المواد».</p>
        ) : (
          <div className="iz-pill-row">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                role="checkbox"
                aria-checked={subjectIds.includes(subject.id)}
                className={`iz-pill ${subjectIds.includes(subject.id) ? "is-active" : ""}`}
                onClick={() => toggleSubject(subject.id)}
              >
                <Icon name={subject.icon} size={15} />
                {subject.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="iz-form-grid">
        <Field label="الحالة">
          <SelectInput value={active ? "1" : "0"} onChange={(event) => setActive(event.target.value === "1")}>
            <option value="1">نشطة</option>
            <option value="0">معطَّلة (لا تستطيع الدخول)</option>
          </SelectInput>
        </Field>

        <section className="iz-editor-block">
          <h3 className="iz-editor-block__title">صورة المعلمة (اختياري)</h3>
          <div className="iz-cover-row">
            {photo && (
              <div className="iz-thumb">
                <img src={photo.url} alt="" />
                <button
                  type="button"
                  className="iz-thumb__remove"
                  aria-label="حذف الصورة"
                  onClick={async () => {
                    await deleteFile(photo.path);
                    setPhoto(null);
                  }}
                >
                  <Trash2 size={15} strokeWidth={2.6} />
                </button>
              </div>
            )}
            <Uploader
              folder="teachers"
              accept="image"
              crop
              cropAspect={1}
              label={photo ? "استبدال" : "رفع صورة"}
              onUploaded={async (files) => {
                if (photo) await deleteFile(photo.path);
                setPhoto({ url: files[0].url, path: files[0].path });
              }}
            />
          </div>
        </section>
      </div>

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}
