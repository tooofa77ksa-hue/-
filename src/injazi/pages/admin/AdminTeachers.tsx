/*
  إدارة المعلمات.
  ------------------------------------------------------------------
  الطريق الأساسي للدخول رابط لا حساب: تُضاف المعلمة باسمها ومادتها، ثم
  يُنسخ رابطها ويُرسَل لها، فتفتحه وتبدأ التصحيح — بلا بريد ولا كلمة
  مرور ولا «نسيت كلمة المرور».

  البريد وكلمة المرور ما زالا متاحين لمن تفضّلهما، لكنهما اختياريان.

  تغيير مواد المعلمة يحدّث ثلاثة مواضع معًا: مستند المعلمة، ورابطها،
  وملفات صلاحيات الأجهزة التي فتحته — لأن القواعد الأمنية تقرأ
  subjectIds من ملف الصلاحيات وتقارنه بالرابط، لا بمستند المعلمة.
*/
import { useEffect, useMemo, useState } from "react";
import { Media } from "@/injazi/ui/Media";
import { motion } from "motion/react";
import { Copy, Link2, Mail, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { EmptyState } from "@/injazi/components/EmptyState";
import { ConfirmDialog, Modal } from "@/injazi/ui/Modal";
import { Chip, Field, Notice, SectionTitle, SelectInput, TextInput } from "@/injazi/ui/primitives";
import { SortableList } from "@/injazi/ui/SortableList";
import { Uploader } from "@/injazi/ui/Uploader";
import { Icon } from "@/injazi/ui/IconPicker";
import {
  COL,
  createInvite,
  createTeacher,
  deleteTeacher,
  deleteUserDoc,
  logActivity,
  reorder,
  revokeInvite,
  saveUserDoc,
  updateInvite,
  updateSubject,
  updateTeacher,
} from "@/injazi/services/repo";
import { createAccount } from "@/injazi/services/auth";
import { PLATFORM_SCOPE, deleteFile } from "@/injazi/services/storage";
import { useInvites, useSession, useSubjects, useTeachers, useUsers } from "@/injazi/hooks/useLive";
import { showToast } from "@/injazi/lib/toast";
import { pageVariants, riseItem, staggerContainer } from "@/injazi/motion/motion";
import { copyText, inviteUrl } from "@/injazi/lib/inviteLink";
import type { Subject, Teacher, TeacherInvite, UserDoc } from "@/injazi/types/models";
import { textMatches } from "@/injazi/lib/arabicSearch";

export function AdminTeachers() {
  const { profile } = useSession();
  const { data: teachers, loading } = useTeachers();
  const { data: subjects } = useSubjects();
  const { data: users } = useUsers();
  const { data: invites } = useInvites();

  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ open: boolean; row: Teacher | null }>({ open: false, row: null });
  const [linkFor, setLinkFor] = useState<Teacher | null>(null);
  const [confirm, setConfirm] = useState<Teacher | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim();
    return needle
      ? teachers.filter(
          (teacher) => textMatches(teacher.name, needle) || textMatches(teacher.email, needle),
        )
      : teachers;
  }, [teachers, query]);

  return (
    <motion.div className="iz-page" variants={pageVariants} initial="initial" animate="enter" exit="exit">
      <SectionTitle
        hint="أضيفي المعلمة ومادتها، ثم أرسلي لها رابطها — بلا بريد ولا كلمة مرور"
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
              const account = users.find((user) => user.teacherId === teacher.id && !user.inviteCode);
              const invite = invites.find((row) => row.teacherId === teacher.id);
              const owned = subjects.filter((subject) => teacher.subjectIds.includes(subject.id));
              return (
                <motion.div className="iz-admin-row" variants={riseItem}>
                  <span className="iz-admin-row__avatar">
                    {teacher.photoUrl ? (
                      <Media src={teacher.photoUrl} alt="" fallback={<span aria-hidden="true">{teacher.name.charAt(0)}</span>} />
                    ) : (
                      <span aria-hidden="true">{teacher.name.charAt(0)}</span>
                    )}
                  </span>

                  <span className="iz-admin-row__text">
                    <strong>{teacher.name}</strong>
                    {teacher.email && (
                      <span className="iz-admin-row__meta">
                        <Mail size={13} strokeWidth={2.4} aria-hidden="true" /> {teacher.email}
                      </span>
                    )}
                    <span className="iz-chip-row">
                      {!teacher.active && <Chip tone="warn">معطَّلة</Chip>}
                      {invite ? (
                        <Chip tone="success" icon={<Link2 size={13} strokeWidth={2.6} />}>
                          رابطها جاهز
                        </Chip>
                      ) : account ? (
                        <Chip tone="info">تدخل ببريدها</Chip>
                      ) : (
                        <Chip tone="warn">بلا رابط دخول</Chip>
                      )}
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
                      aria-label={`رابط دخول ${teacher.name}`}
                      title="رابط الدخول"
                      onClick={() => setLinkFor(teacher)}
                    >
                      <Link2 size={16} strokeWidth={2.5} />
                    </button>
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

      <InviteDialog
        teacher={linkFor}
        invite={linkFor ? (invites.find((row) => row.teacherId === linkFor.id) ?? null) : null}
        users={users}
        actorName={profile?.name ?? "مشرفة"}
        onClose={() => setLinkFor(null)}
      />

      <TeacherEditor
        open={editor.open}
        row={editor.row}
        subjects={subjects}
        users={users}
        invites={invites}
        actorName={profile?.name ?? "مشرفة"}
        onClose={() => setEditor({ open: false, row: null })}
      />

      <ConfirmDialog
        open={confirm !== null}
        title="حذف المعلمة"
        message={`سيُحذف ملف «${confirm?.name}» وتُفكّ موادها، ويتوقّف رابط دخولها في الحال. هل أنتِ متأكدة؟`}
        onConfirm={async () => {
          if (!confirm) return;
          // الرابط أولًا: ما دام قائمًا فالصلاحية قائمة على كل جهاز فُتح به.
          const link = invites.find((row) => row.teacherId === confirm.id);
          if (link) await revokeInvite(link.id);
          for (const user of users.filter((row) => row.teacherId === confirm.id)) {
            // ملفات الرابط تُحذف (لا معنى لها بعده)، وحسابات البريد
            // تُعطَّل فقط لأن حساب Auth نفسه يبقى وتحذفه المشرفة من هناك.
            if (user.inviteCode) await deleteUserDoc(user.id);
            else await saveUserDoc(user.id, { active: false, subjectIds: [] });
          }
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

/*
  رابط الدخول.
  الرابط قدرة: من يفتحه يقيّم مواد هذه المعلمة. ولذلك نقول ذلك صراحةً
  في الواجهة بدل أن نتركه مفهومًا ضمنًا، ونجعل الإلغاء بضغطة واحدة.
*/
function InviteDialog({
  teacher,
  invite,
  users,
  actorName,
  onClose,
}: {
  teacher: Teacher | null;
  invite: TeacherInvite | null;
  users: UserDoc[];
  actorName: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  useEffect(() => {
    if (teacher) {
      setError(null);
      setConfirmRevoke(false);
    }
  }, [teacher]);

  const url = invite ? inviteUrl(invite.id) : "";

  async function generate() {
    if (!teacher || busy) return;
    setBusy(true);
    setError(null);
    try {
      const code = await createInvite({
        teacherId: teacher.id,
        teacherName: teacher.name,
        subjectIds: teacher.subjectIds,
      });
      // النسخ داخل نفس إيماءة الضغط: بعض المتصفّحات ترفض الحافظة إن
      // تأخّرت كثيرًا، لكن إن رفضت فالرابط معروض أمامها على أي حال.
      await copyText(inviteUrl(code));
      await logActivity("teacher.invite", `أُنشئ رابط دخول للمعلمة ${teacher.name}`, actorName, "admin");
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
    if (!teacher || !invite || busy) return;
    setBusy(true);
    setError(null);
    try {
      await revokeInvite(invite.id);
      // حذف الدعوة يكفي وحده (القواعد تفحصها حيّة عند كل كتابة)، لكن
      // ملفات الصلاحيات التي وُلدت منها تبقى بلا معنى — فتُحذف، فلا يبقى
      // في القاعدة دور teacher لا يسنده شيء.
      for (const user of users.filter((row) => row.inviteCode === invite.id)) {
        await deleteUserDoc(user.id);
      }
      await logActivity("teacher.invite.revoke", `أُلغي رابط دخول المعلمة ${teacher.name}`, actorName, "admin");
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
      open={teacher !== null}
      title={teacher ? `رابط دخول ${teacher.name}` : "رابط الدخول"}
      onClose={onClose}
      footer={
        <>
          <ClayButton variant="soft" onClick={onClose} disabled={busy}>
            إغلاق
          </ClayButton>
          {invite ? (
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
      {invite ? (
        <>
          <Field label="أرسلي هذا الرابط للمعلمة" hint="تفتحه فتدخل مباشرة — بلا بريد ولا كلمة مرور.">
            <TextInput value={url} readOnly onFocus={(event) => event.target.select()} />
          </Field>

          <Notice tone="warn">
            من يفتح هذا الرابط يستطيع تقييم مشاريع مواد {teacher?.name} والكتابة عليها. أرسليه
            لها وحدها، ولا تنشريه في مجموعة.
          </Notice>

          <p className="iz-field__meter">
            ولا ترى صاحبته شيئًا آخر: لا ملفات أولياء الأمور، ولا مواد زميلاتها، ولا لوحة
            الإدارة.
          </p>

          {confirmRevoke ? (
            <Notice tone="danger">
              <span>
                الإلغاء يوقف الرابط فورًا على كل جهاز فُتح به، ولا يمكن التراجع — يلزم رابط
                جديد.
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
            // فعل هادم لا يصحّ أن يُقرأ كجزء من الجملة قبله.
            <p style={{ margin: "14px 0 0" }}>
              <button type="button" className="iz-linkish" onClick={() => setConfirmRevoke(true)}>
                إلغاء هذا الرابط
              </button>
            </p>
          )}
        </>
      ) : (
        <>
          <p className="iz-field__meter">
            لم يُنشأ رابط بعد. الرابط هو طريقة دخول المعلمة: تفتحه من الجوال أو الحاسب فتصل
            إلى مشاريع موادها وتبدأ التصحيح.
          </p>
          {teacher && teacher.subjectIds.length === 0 && (
            <Notice tone="warn">
              لم تُسنَد إلى {teacher.name} أي مادة بعد. الرابط سيعمل، لكنها لن ترى مشاريع حتى
              تُسنَد إليها مادة.
            </Notice>
          )}
        </>
      )}

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}

function TeacherEditor({
  open,
  row,
  subjects,
  users,
  invites,
  actorName,
  onClose,
}: {
  open: boolean;
  row: Teacher | null;
  subjects: Subject[];
  users: UserDoc[];
  invites: TeacherInvite[];
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

  const account = row ? users.find((user) => user.teacherId === row.id && !user.inviteCode) : undefined;
  // كلمة المرور تُطلب فقط إن اختارت المشرفة طريق البريد؛ الطريق الافتراضي
  // رابط، ولا كلمة مرور فيه أصلًا.
  const wantsEmailLogin = email.trim().length > 0 && !account;

  function toggleSubject(id: string) {
    setSubjectIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  async function save() {
    if (name.trim().length < 2 || busy) return;
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

      // ملفات صلاحيات هذه المعلمة كلها — لا الأول فقط: قد تكون فتحت
      // رابطها على الجوال والحاسب، ولكل جهاز ملفه.
      for (const user of users.filter((entry) => entry.teacherId === teacherId)) {
        await saveUserDoc(user.id, { name: payload.name, subjectIds, active, teacherId });
      }

      // ورابطها كذلك: القواعد تقارن ملف الصلاحيات بالرابط عند أول فتح،
      // فرابط بمواد قديمة يمنع جهازًا جديدًا من الدخول بمواد صحيحة.
      const link = invites.find((entry) => entry.teacherId === teacherId);
      if (link) await updateInvite(link.id, { teacherName: payload.name, subjectIds });

      if (!account && password.length >= 6 && payload.email) {
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
            disabled={name.trim().length < 2 || (wantsEmailLogin && password.length > 0 && password.length < 6)}
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
        <Field label="البريد الإلكتروني (اختياري)" hint="اتركيه فارغًا — المعلمة تدخل برابطها.">
          <TextInput
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            inputMode="email"
            disabled={Boolean(account)}
          />
        </Field>
      </div>

      {wantsEmailLogin && (
        <Field
          label="كلمة مرور الدخول (اختياري)"
          hint="اتركيها فارغة إن كانت ستدخل بالرابط. وإن ملأتِها فـ ٦ أحرف على الأقل."
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
                <Media src={photo.url} alt="صورة المعلمة" />
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
              scope={PLATFORM_SCOPE}
              kind="teachers"
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
