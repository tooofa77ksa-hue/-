/*
  إدارة الطالبات.
  الإضافة والتعديل والحذف وإعادة الترتيب وربط حساب ولي الأمر.
  حذف الطالبة يحذف مشاريعها وإنجازاتها وتقييماتها في كتابة مجمّعة
  واحدة (repo.deleteStudent) فلا تبقى بيانات يتيمة في قاعدة البيانات.
*/
import { useEffect, useMemo, useState } from "react";
import { Media } from "@/injazi/ui/Media";
import { motion } from "motion/react";
import { Copy, Eye, Link2, Pencil, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { EmptyState } from "@/injazi/components/EmptyState";
import { ConfirmDialog, Modal } from "@/injazi/ui/Modal";
import { Chip, Field, Notice, SectionTitle, SelectInput, TextInput } from "@/injazi/ui/primitives";
import { SortableList } from "@/injazi/ui/SortableList";
import { Icon } from "@/injazi/ui/IconPicker";
import {
  COL,
  createStudent,
  createStudentLink,
  deleteStudent,
  deleteUserDoc,
  logActivity,
  reorder,
  revokeStudentLink,
  saveUserDoc,
  updateStudent,
} from "@/injazi/services/repo";
import { createAccount } from "@/injazi/services/auth";
import { useSession, useStudentLinks, useStudents, useUsers } from "@/injazi/hooks/useLive";
import { showToast } from "@/injazi/lib/toast";
import { VISIBILITY_LABEL } from "@/injazi/lib/permissions";
import { THEMES } from "@/injazi/themes/themes";
import { pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";
import { copyText, studentUrl } from "@/injazi/lib/inviteLink";
import { AllLinksDialog } from "@/injazi/features/admin/AllLinksDialog";
import type { Student, StudentLink, UserDoc, Visibility } from "@/injazi/types/models";
import { textMatches } from "@/injazi/lib/arabicSearch";

export function AdminStudents() {
  const { profile } = useSession();
  const { data: students, loading } = useStudents();
  const { data: users } = useUsers();
  const { data: studentLinks } = useStudentLinks();

  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ open: boolean; row: Student | null }>({ open: false, row: null });
  const [parentFor, setParentFor] = useState<Student | null>(null);
  const [linkFor, setLinkFor] = useState<Student | null>(null);
  const [confirm, setConfirm] = useState<Student | null>(null);
  const [allLinks, setAllLinks] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim();
    return needle ? students.filter((student) => textMatches(student.name, needle)) : students;
  }, [students, query]);

  const parentsByStudent = useMemo(() => {
    const map: Record<string, string[]> = {};
    users
      .filter((user) => user.role === "parent")
      .forEach((user) => {
        (user.studentIds ?? []).forEach((id) => {
          map[id] = [...(map[id] ?? []), user.email];
        });
      });
    return map;
  }, [users]);

  return (
    <motion.div className="iz-page" variants={pageVariants} initial="initial" animate="enter" exit="exit">
      <SectionTitle
        hint="اسحبي الصفوف لإعادة ترتيب ظهورهن في الصفحة الرئيسية"
        action={
          <>
            {/* استخراج الروابط عمل يُفعل مرة ويُرسل لثماني أسر: زر واحد
                هنا أقصر من ثماني جولات داخل صفوف الطالبات. */}
            <ClayButton
              variant="soft"
              icon={<Link2 size={18} strokeWidth={2.6} />}
              onClick={() => setAllLinks(true)}
            >
              كل الروابط
            </ClayButton>
            <ClayButton icon={<Plus size={18} strokeWidth={2.6} />} onClick={() => setEditor({ open: true, row: null })}>
              إضافة طالبة
            </ClayButton>
          </>
        }
      >
        الطالبات ({students.length})
      </SectionTitle>

      <div className="iz-filters">
        <div className="iz-search">
          <Search size={18} strokeWidth={2.4} aria-hidden="true" />
          <input
            className="iz-search__input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحثي باسم الطالبة"
            aria-label="بحث"
          />
        </div>
      </div>

      {loading ? (
        <p className="iz-field__meter">جارٍ التحميل…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          object="bag"
          tone="lilac"
          title={query ? "لا توجد نتيجة" : "لم تُضَف أي طالبة بعد"}
          body={query ? "جرّبي جزءًا من الاسم." : "أضيفي أول طالبة لتظهر بطاقتها في الصفحة الرئيسية."}
          action={
            <ClayButton size="lg" icon={<Plus size={18} strokeWidth={2.6} />} onClick={() => setEditor({ open: true, row: null })}>
              إضافة طالبة
            </ClayButton>
          }
        />
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="enter">
          <SortableList
            items={rows}
            disabled={query.trim().length > 0}
            onReorder={async (ids) => {
              await reorder(COL.students, ids);
              showToast("تم حفظ الترتيب");
            }}
            renderItem={(student) => (
              <motion.div className="iz-admin-row" variants={riseItem}>
                <span className="iz-admin-row__avatar">
                  {student.photoUrl ? (
                    <Media src={student.photoUrl} alt="" fallback={<span aria-hidden="true">{student.name.charAt(0)}</span>} />
                  ) : (
                    <span aria-hidden="true">{student.name.charAt(0)}</span>
                  )}
                </span>

                <span className="iz-admin-row__text">
                  <strong>{student.name}</strong>
                  <span className="iz-admin-row__meta">
                    {student.grade} · {THEMES.find((theme) => theme.id === student.themeId)?.name ?? "—"}
                  </span>
                  <span className="iz-chip-row">
                    {!student.active && <Chip tone="warn">مخفيّة</Chip>}
                    {student.visibility !== "public" && <Chip tone="info">{VISIBILITY_LABEL[student.visibility]}</Chip>}
                    {(parentsByStudent[student.id] ?? []).map((email) => (
                      <Chip key={email} tone="success" icon={<Link2 size={13} strokeWidth={2.6} />}>
                        {email}
                      </Chip>
                    ))}
                    <Chip icon={<Icon name={student.decorIcon} size={13} />}>{student.decorIcon}</Chip>
                  </span>
                </span>

                <span className="iz-admin-row__actions">
                  <ClayButton size="sm" variant="ghost" to={`/student/${student.id}`} icon={<Eye size={15} strokeWidth={2.4} />} ariaLabel={`عرض ملف ${student.name}`}>
                    الملف
                  </ClayButton>
                  <ClayButton size="sm" variant="ghost" icon={<Link2 size={15} strokeWidth={2.4} />} onClick={() => setLinkFor(student)}>
                    رابطها
                  </ClayButton>
                  <ClayButton size="sm" variant="ghost" icon={<UserPlus size={15} strokeWidth={2.4} />} onClick={() => setParentFor(student)}>
                    ولي الأمر
                  </ClayButton>
                  <button type="button" className="iz-icon-btn" aria-label={`تعديل ${student.name}`} onClick={() => setEditor({ open: true, row: student })}>
                    <Pencil size={16} strokeWidth={2.5} />
                  </button>
                  <button type="button" className="iz-icon-btn iz-icon-btn--danger" aria-label={`حذف ${student.name}`} onClick={() => setConfirm(student)}>
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                </span>
              </motion.div>
            )}
          />
        </motion.div>
      )}

      <AllLinksDialog
        open={allLinks}
        students={rows}
        links={studentLinks}
        onClose={() => setAllLinks(false)}
      />

      <StudentLinkDialog
        student={linkFor}
        link={linkFor ? (studentLinks.find((row) => row.studentId === linkFor.id) ?? null) : null}
        users={users}
        actorName={profile?.name ?? "مشرفة"}
        onClose={() => setLinkFor(null)}
      />

      <StudentEditor
        open={editor.open}
        row={editor.row}
        actorName={profile?.name ?? "مشرفة"}
        onClose={() => setEditor({ open: false, row: null })}
      />

      {parentFor && (
        <ParentLinker student={parentFor} onClose={() => setParentFor(null)} />
      )}

      <ConfirmDialog
        open={confirm !== null}
        title="حذف الطالبة"
        message={`سيُحذف ملف «${confirm?.name}» مع كل مشاريعها وإنجازاتها وتقييماتها نهائيًا. هل أنتِ متأكدة؟`}
        onConfirm={async () => {
          if (!confirm) return;
          await deleteStudent(confirm.id);
          await logActivity("student.delete", `تم حذف الطالبة ${confirm.name}`, profile?.name ?? "مشرفة", "admin");
          showToast("تم حذف الطالبة", "info");
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  );
}

// ------------------------------------------------------------- النموذج

/*
  رابط الطالبة.
  رابط واحد تفتحه الطالبة وولي أمرها معًا — لا رابطان. من يفتحه يعدّل
  ملف هذه الطالبة وحدها، ولا يصل إلى لوحة الإدارة ولا إلى تقييم المعلمة
  ولا إلى ملف أي زميلة، مهما عُبث بالعنوان.
*/
function StudentLinkDialog({
  student,
  link,
  users,
  actorName,
  onClose,
}: {
  student: Student | null;
  link: StudentLink | null;
  users: UserDoc[];
  actorName: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  useEffect(() => {
    if (student) {
      setError(null);
      setConfirmRevoke(false);
    }
  }, [student]);

  const url = link ? studentUrl(link.id) : "";

  async function generate() {
    if (!student || busy) return;
    setBusy(true);
    setError(null);
    try {
      const code = await createStudentLink({ studentId: student.id, studentName: student.name });
      await copyText(studentUrl(code));
      await logActivity("student.link", `أُنشئ رابط ملف الطالبة ${student.name}`, actorName, "admin");
      showToast("أُنشئ الرابط ونُسخ");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إنشاء الرابط.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    const okay = await copyText(url);
    showToast(okay ? "نُسخ الرابط" : "تعذّر النسخ — انسخيه من المربّع", okay ? "success" : "info");
  }

  async function revoke() {
    if (!student || !link || busy) return;
    setBusy(true);
    setError(null);
    try {
      await revokeStudentLink(link.id);
      // ملفات الصلاحيات التي وُلدت من هذا الرابط لا معنى لها بعده.
      for (const user of users.filter((row) => row.linkCode === link.id)) {
        await deleteUserDoc(user.id);
      }
      await logActivity("student.link.revoke", `أُلغي رابط ملف الطالبة ${student.name}`, actorName, "admin");
      showToast("أُلغي الرابط", "info");
      setConfirmRevoke(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إلغاء الرابط.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={student !== null}
      title={student ? `رابط ملف ${student.name}` : "رابط الطالبة"}
      onClose={onClose}
      footer={
        <>
          <ClayButton variant="soft" onClick={onClose} disabled={busy}>
            إغلاق
          </ClayButton>
          {link ? (
            <ClayButton onClick={copy} icon={<Copy size={17} strokeWidth={2.4} />}>
              نسخ الرابط
            </ClayButton>
          ) : (
            <ClayButton onClick={generate} loading={busy} icon={<Link2 size={17} strokeWidth={2.4} />}>
              إنشاء الرابط
            </ClayButton>
          )}
        </>
      }
    >
      {link ? (
        <>
          <Field
            label={`أرسلي هذا الرابط لـ ${student?.name} ولولي أمرها`}
            hint="رابط واحد يفتحه الاثنان — بلا بريد ولا كلمة مرور."
          >
            <TextInput value={url} readOnly onFocus={(event) => event.target.select()} />
          </Field>

          <Notice tone="warn">
            من يفتح هذا الرابط يستطيع إضافة إنجازات ومشاريع إلى ملف {student?.name} وتعديله.
            أرسليه لها ولولي أمرها وحدهما.
          </Notice>

          <p className="iz-field__meter">
            ولا يصل صاحبه إلى شيء آخر: لا ملف زميلة، ولا لوحة الإدارة، ولا تقييمات المعلمات
            — ولو غُيّر العنوان يدويًا.
          </p>

          {confirmRevoke ? (
            <Notice tone="danger">
              <span>
                الإلغاء يوقف الرابط فورًا على كل جهاز فُتح به، ولا يُحذف شيء من ملف الطالبة.
              </span>
              <span className="iz-chip-row" style={{ marginTop: 10 }}>
                <ClayButton variant="danger" onClick={revoke} loading={busy}>
                  نعم، ألغي الرابط
                </ClayButton>
                <ClayButton variant="soft" onClick={() => setConfirmRevoke(false)} disabled={busy}>
                  تراجع
                </ClayButton>
              </span>
            </Notice>
          ) : (
            <p style={{ margin: "14px 0 0" }}>
              <button type="button" className="iz-linkish" onClick={() => setConfirmRevoke(true)}>
                إلغاء هذا الرابط
              </button>
            </p>
          )}
        </>
      ) : (
        <p className="iz-field__meter">
          لم يُنشأ رابط بعد. الرابط هو طريقة دخول الطالبة وولي أمرها: يفتحانه من الجوال أو
          الحاسب فيصلان إلى ملفها ويضيفان إنجازاتها.
        </p>
      )}

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}

function StudentEditor({
  open,
  row,
  actorName,
  onClose,
}: {
  open: boolean;
  row: Student | null;
  actorName: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("الصف الرابع / 2");
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(row?.name ?? "");
    setGrade(row?.grade ?? "الصف الرابع / 2");
    setThemeId(row?.themeId ?? THEMES[0].id);
    setVisibility(row?.visibility ?? "public");
    setActive(row?.active ?? true);
    setError(null);
  }, [open, row]);

  async function save() {
    if (name.trim().length < 2 || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (row) {
        await updateStudent(row.id, { name: name.trim(), grade, themeId, visibility, active });
        showToast("تم حفظ بيانات الطالبة");
      } else {
        await createStudent({ name: name.trim(), grade, themeId, visibility, active });
        showToast("تمت إضافة الطالبة");
      }
      await logActivity(
        row ? "student.update" : "student.create",
        `${row ? "تم تعديل" : "تمت إضافة"} الطالبة ${name.trim()}`,
        actorName,
        "admin",
      );
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
      title={row ? "تعديل الطالبة" : "إضافة طالبة"}
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
      <Field label="اسم الطالبة">
        <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="الاسم الثلاثي" />
      </Field>

      <div className="iz-form-grid">
        <Field label="الصف">
          <TextInput value={grade} onChange={(event) => setGrade(event.target.value)} maxLength={40} />
        </Field>
        <Field label="الثيم الافتراضي">
          <SelectInput value={themeId} onChange={(event) => setThemeId(event.target.value)}>
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="ظهور الملف">
          <SelectInput value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)}>
            {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((key) => (
              <option key={key} value={key}>
                {VISIBILITY_LABEL[key]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="الحالة">
          <SelectInput value={active ? "1" : "0"} onChange={(event) => setActive(event.target.value === "1")}>
            <option value="1">تظهر في المعرض</option>
            <option value="0">مخفيّة</option>
          </SelectInput>
        </Field>
      </div>

      <p className="iz-field__meter">الصورة والنبذة والهوايات تُضاف من داخل ملف الطالبة نفسه.</p>

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}

// -------------------------------------------------- ربط حساب ولي الأمر

function ParentLinker({ student, onClose }: { student: Student; onClose: () => void }) {
  const { data: users } = useUsers();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linked = users.filter((user) => user.role === "parent" && user.studentIds?.includes(student.id));
  const existing = users.find(
    (user) => user.role === "parent" && user.email.toLowerCase() === email.trim().toLowerCase(),
  );

  async function link() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (existing) {
        // حساب موجود: نضيف الطالبة إلى قائمته بدل إنشاء حساب مكرر.
        await saveUserDoc(existing.id, {
          studentIds: Array.from(new Set([...(existing.studentIds ?? []), student.id])),
        });
        showToast("تم ربط الحساب الموجود بالطالبة");
      } else {
        await createAccount(email, password, name.trim() || `ولي أمر ${student.name}`, "parent", {
          studentIds: [student.id],
        });
        showToast("تم إنشاء حساب ولي الأمر");
      }
      await logActivity("parent.link", `تم ربط ولي أمر بالطالبة ${student.name}`, "مشرفة", "admin");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الربط.");
    } finally {
      setBusy(false);
    }
  }

  async function unlink(userId: string, current: string[]) {
    await saveUserDoc(userId, { studentIds: current.filter((id) => id !== student.id) });
    showToast("تم فك الربط", "info");
  }

  return (
    <Modal
      open
      title={`ولي أمر ${student.name}`}
      onClose={onClose}
      footer={
        <>
          <ClayButton variant="soft" onClick={onClose} disabled={busy}>
            إغلاق
          </ClayButton>
          <ClayButton
            onClick={link}
            loading={busy}
            disabled={!email.trim() || (!existing && password.length < 6)}
          >
            {existing ? "ربط الحساب الموجود" : "إنشاء وربط"}
          </ClayButton>
        </>
      }
    >
      {linked.length > 0 && (
        <section className="iz-editor-block">
          <h3 className="iz-editor-block__title">حسابات مرتبطة</h3>
          {linked.map((user) => (
            <div key={user.id} className="iz-hobby-row">
              <span className="iz-hobby-row__icon">
                <UserPlus size={17} strokeWidth={2.4} />
              </span>
              <span style={{ flex: 1 }}>{user.email}</span>
              <button
                type="button"
                className="iz-icon-btn iz-icon-btn--danger"
                aria-label={`فك ربط ${user.email}`}
                onClick={() => unlink(user.id, user.studentIds ?? [])}
              >
                <Trash2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </section>
      )}

      <Field label="بريد ولي الأمر">
        <TextInput
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="parent@example.com"
          inputMode="email"
        />
      </Field>

      {!existing && (
        <>
          <Field label="اسم ولي الأمر">
            <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={60} />
          </Field>
          <Field label="كلمة مرور مبدئية" hint="٦ أحرف على الأقل — يستطيع تغييرها لاحقًا من «نسيت كلمة المرور».">
            <TextInput
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              autoComplete="new-password"
            />
          </Field>
        </>
      )}

      {existing && <Notice>هذا البريد يملك حسابًا بالفعل — سيُربط بالطالبة دون إنشاء حساب جديد.</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}
