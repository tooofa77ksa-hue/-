/*
  محرّر المشروع.
  نموذج واحد للإضافة والتعديل. كل زر فيه يعمل: رفع صورة غلاف، رفع مرفقات
  متعددة (صور/PDF/فيديو)، حذف مرفق من Storage ومن المستند معًا، إضافة
  روابط مع توليد QR فوري لكل رابط، وضبط الخصوصية.
*/
import { useEffect, useState } from "react";
import { Media } from "@/injazi/ui/Media";
import { AnimatePresence, motion } from "motion/react";
import { FileText, Film, Link2, Plus, Trash2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { LottieMoment } from "@/injazi/components/LottieMoment";
import { Modal } from "@/injazi/ui/Modal";
import { Field, Notice, SelectInput, TextArea, TextInput } from "@/injazi/ui/primitives";
import { QRCard } from "@/injazi/ui/QRCard";
import { QR_FRAMES, detectLinkKind, normalizeUrl, type QrFrame } from "@/injazi/ui/qr";
import { Uploader, type UploadedFile } from "@/injazi/ui/Uploader";
import { MEDIA_BACKEND, deleteFile, studentScope } from "@/injazi/services/storage";
import { createProject, logActivity, updateProject } from "@/injazi/services/repo";
import { showToast } from "@/injazi/lib/toast";
import { VISIBILITY_LABEL } from "@/injazi/lib/permissions";
import { DUR, EASE_POP } from "@/injazi/motion/motion";
import type { LinkItem, MediaItem, Project, Student, Subject, UserDoc, Visibility } from "@/injazi/types/models";

type Props = {
  open: boolean;
  student: Student;
  subjects: Subject[];
  project: Project | null;
  actor: UserDoc | null;
  onClose: () => void;
};

const EMPTY = {
  title: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  subjectId: "",
  visibility: "public" as Visibility,
};

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function ProjectEditor({ open, student, subjects, project, actor, onClose }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [cover, setCover] = useState<{ url: string; path: string } | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [linkDraft, setLinkDraft] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [frame, setFrame] = useState<QrFrame>("classic");
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // إعادة التعبئة عند كل فتح: بدونها يحمل النموذج بقايا المشروع السابق.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setCelebrate(false);
    setLinkDraft("");
    setLinkLabel("");
    if (project) {
      setForm({
        title: project.title,
        description: project.description,
        date: project.date,
        subjectId: project.subjectId,
        visibility: project.visibility,
      });
      setCover(project.coverUrl ? { url: project.coverUrl, path: project.coverPath ?? "" } : null);
      setMedia(project.media ?? []);
      setLinks(project.links ?? []);
    } else {
      setForm({ ...EMPTY, subjectId: subjects[0]?.id ?? "" });
      setCover(null);
      setMedia([]);
      setLinks([]);
    }
  }, [open, project, subjects]);

  const scope = studentScope(student.id);
  const ready = form.title.trim().length >= 2 && form.subjectId !== "";

  function addLink() {
    const url = normalizeUrl(linkDraft);
    if (!url) {
      setError("الرابط غير صالح. استخدمي رابطًا يبدأ بـ https://");
      return;
    }
    setError(null);
    const kind = detectLinkKind(url);
    setLinks((current) => [
      ...current,
      { id: uid(), url, label: linkLabel.trim() || new URL(url).hostname.replace("www.", ""), kind },
    ]);
    setLinkDraft("");
    setLinkLabel("");
  }

  async function removeMedia(item: MediaItem) {
    // الحذف من التخزين أولًا ثم من الحالة: العكس كان سيترك ملفًا يتيمًا
    // يستهلك مساحة بلا أي مرجع إليه.
    await deleteFile(item.path);
    setMedia((current) => current.filter((entry) => entry.id !== item.id));
  }

  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        studentId: student.id,
        subjectId: form.subjectId,
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        coverUrl: cover?.url ?? null,
        coverPath: cover?.path ?? null,
        media,
        links,
        visibility: form.visibility,
      };

      if (project) {
        await updateProject(project.id, payload);
        showToast("تم حفظ تعديلات المشروع");
      } else {
        await createProject(payload);
        showToast("تمت إضافة المشروع");
      }
      await logActivity(
        project ? "project.update" : "project.create",
        `${project ? "تم تعديل" : "تمت إضافة"} مشروع «${payload.title}» لـ ${student.name}`,
        actor?.name ?? "زائرة",
        actor?.role ?? "guest",
      );

      setCelebrate(true);
      window.setTimeout(() => {
        setCelebrate(false);
        onClose();
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={project ? "تعديل المشروع" : "إضافة مشروع"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <ClayButton variant="soft" onClick={onClose} disabled={saving}>
            إلغاء
          </ClayButton>
          <ClayButton onClick={save} disabled={!ready} loading={saving}>
            {project ? "حفظ التعديلات" : "إضافة المشروع"}
          </ClayButton>
        </>
      }
    >
      <AnimatePresence>
        {celebrate && (
          <motion.div
            className="iz-form__success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base, ease: EASE_POP }}
          >
            <LottieMoment name="success" size={116} label="تم الحفظ" />
            <p className="iz-form__success-text">تم الحفظ بنجاح</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="iz-form-grid">
        <Field label="عنوان المشروع">
          <TextInput
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="مثال: مجسّم دورة الماء"
            maxLength={90}
          />
        </Field>

        <Field label="المادة">
          <SelectInput
            value={form.subjectId}
            onChange={(event) => setForm({ ...form, subjectId: event.target.value })}
          >
            {subjects.length === 0 && <option value="">لا توجد مواد بعد</option>}
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="التاريخ">
          <TextInput
            type="date"
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
        </Field>

        <Field label="الظهور">
          <SelectInput
            value={form.visibility}
            onChange={(event) => setForm({ ...form, visibility: event.target.value as Visibility })}
          >
            {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((key) => (
              <option key={key} value={key}>
                {VISIBILITY_LABEL[key]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <Field label="الوصف">
        <TextArea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="ماذا نفّذتِ؟ ماذا تعلّمتِ منه؟"
          rows={4}
          maxLength={900}
        />
      </Field>

      {/* ---------------- صورة الغلاف ---------------- */}
      <section className="iz-editor-block">
        <h3 className="iz-editor-block__title">صورة الغلاف</h3>
        <div className="iz-cover-row">
          {cover ? (
            <div className="iz-thumb">
              <Media src={cover.url} alt="غلاف المشروع" />
              <button
                type="button"
                className="iz-thumb__remove"
                aria-label="حذف صورة الغلاف"
                onClick={async () => {
                  await deleteFile(cover.path);
                  setCover(null);
                }}
              >
                <Trash2 size={15} strokeWidth={2.6} />
              </button>
            </div>
          ) : (
            <p className="iz-field__meter">لم تُضَف صورة غلاف بعد.</p>
          )}
          <Uploader
            scope={scope}
            kind="projects/covers"
            accept="image"
            crop
            cropAspect={4 / 3}
            label={cover ? "استبدال الغلاف" : "رفع غلاف"}
            onUploaded={async (files) => {
              if (cover) await deleteFile(cover.path);
              setCover({ url: files[0].url, path: files[0].path });
            }}
          />
        </div>
      </section>

      {/* ---------------- المرفقات ---------------- */}
      <section className="iz-editor-block">
        <h3 className="iz-editor-block__title">صور المشروع</h3>
        {media.length > 0 && (
          <div className="iz-media-grid">
            {media.map((item) => (
              <div key={item.id} className="iz-thumb">
                {item.kind === "image" ? (
                  <Media src={item.url} alt={item.name} />
                ) : (
                  <a className="iz-thumb__file" href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.kind === "video" ? <Film size={22} /> : <FileText size={22} />}
                    <span>{item.name}</span>
                  </a>
                )}
                <button
                  type="button"
                  className="iz-thumb__remove"
                  aria-label={`حذف ${item.name}`}
                  onClick={() => removeMedia(item)}
                >
                  <Trash2 size={15} strokeWidth={2.6} />
                </button>
              </div>
            ))}
          </div>
        )}
        <Uploader
          scope={scope}
          kind="projects/media"
          accept={MEDIA_BACKEND === "firestore" ? "image" : "media"}
          multiple
          label="رفع صور"
          onUploaded={(files: UploadedFile[]) =>
            setMedia((current) => [
              ...current,
              ...files.map((file) => ({
                id: uid(),
                kind: file.kind,
                url: file.url,
                path: file.path,
                name: file.name,
                size: file.size,
                mime: file.mime,
              })),
            ])
          }
        />
      </section>

      {/* ---------------- الروابط و QR ---------------- */}
      <section className="iz-editor-block">
        <h3 className="iz-editor-block__title">روابط (Drive، YouTube، Telegram، أي رابط)</h3>
        <p className="iz-field__meter" style={{ marginBlockEnd: "var(--iz-s-3)" }}>
          أوراق العمل وملفات PDF والفيديو تُرفع على Google Drive أو YouTube، ويُلصق رابطها هنا —
          ويُولَّد له رمز QR تلقائيًا.
        </p>
        <div className="iz-link-row">
          <TextInput
            value={linkDraft}
            onChange={(event) => setLinkDraft(event.target.value)}
            placeholder="https://drive.google.com/..."
            aria-label="الرابط"
            inputMode="url"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addLink();
              }
            }}
          />
          <TextInput
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
            placeholder="اسم الرابط (اختياري)"
            aria-label="اسم الرابط"
          />
          <ClayButton variant="soft" icon={<Plus size={17} strokeWidth={2.6} />} onClick={addLink}>
            إضافة
          </ClayButton>
        </div>

        {links.length > 0 && (
          <>
            <Field label="إطار رمز QR">
              <SelectInput value={frame} onChange={(event) => setFrame(event.target.value as QrFrame)}>
                {QR_FRAMES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <div className="iz-qr-grid">
              {links.map((link) => (
                <div key={link.id} className="iz-qr-cell">
                  <QRCard link={link} frame={frame} size={150} />
                  <ClayButton
                    size="sm"
                    variant="ghost"
                    className="iz-btn--danger"
                    icon={<Trash2 size={15} strokeWidth={2.6} />}
                    onClick={() => setLinks((current) => current.filter((entry) => entry.id !== link.id))}
                  >
                    حذف الرابط
                  </ClayButton>
                </div>
              ))}
            </div>
          </>
        )}

        {links.length === 0 && (
          <p className="iz-field__meter">
            <Link2 size={14} strokeWidth={2.4} aria-hidden="true" /> عند إضافة أي رابط يُولَّد رمز QR له تلقائيًا.
          </p>
        )}
      </section>

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}
