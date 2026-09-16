/*
  محرّر الإنجازات والشهادات.
  نموذج واحد لنوعين (إنجاز/شهادة) لأن الحقول متطابقة والفرق هو مكان
  العرض فقط — نموذجان منفصلان كانا سيضاعفان الصيانة بلا مقابل.
*/
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { Modal } from "@/injazi/ui/Modal";
import { Field, Notice, SelectInput, TextArea, TextInput } from "@/injazi/ui/primitives";
import { Uploader } from "@/injazi/ui/Uploader";
import { deleteFile } from "@/injazi/services/storage";
import { createAchievement, logActivity, updateAchievement } from "@/injazi/services/repo";
import { showToast } from "@/injazi/lib/toast";
import { VISIBILITY_LABEL } from "@/injazi/lib/permissions";
import type { Achievement, Student, UserDoc, Visibility } from "@/injazi/types/models";

type Props = {
  open: boolean;
  student: Student;
  kind: Achievement["kind"];
  achievement: Achievement | null;
  actor: UserDoc | null;
  onClose: () => void;
};

export function AchievementEditor({ open, student, kind, achievement, actor, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [image, setImage] = useState<{ url: string; path: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noun = kind === "certificate" ? "الشهادة" : "الإنجاز";

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(achievement?.title ?? "");
    setDescription(achievement?.description ?? "");
    setDate(achievement?.date ?? new Date().toISOString().slice(0, 10));
    setVisibility(achievement?.visibility ?? "public");
    setImage(
      achievement?.imageUrl ? { url: achievement.imageUrl, path: achievement.imagePath ?? "" } : null,
    );
  }, [open, achievement]);

  async function save() {
    if (title.trim().length < 2 || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        studentId: student.id,
        kind,
        title: title.trim(),
        description: description.trim(),
        date,
        imageUrl: image?.url ?? null,
        imagePath: image?.path ?? null,
        visibility,
      };
      if (achievement) {
        await updateAchievement(achievement.id, payload);
        showToast(`تم حفظ ${noun}`);
      } else {
        await createAchievement(payload);
        showToast(`تمت إضافة ${noun}`);
      }
      await logActivity(
        "achievement.save",
        `${achievement ? "تم تعديل" : "تمت إضافة"} ${noun} «${payload.title}» لـ ${student.name}`,
        actor?.name ?? "زائرة",
        actor?.role ?? "guest",
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={`${achievement ? "تعديل" : "إضافة"} ${noun}`}
      onClose={onClose}
      footer={
        <>
          <ClayButton variant="soft" onClick={onClose} disabled={saving}>
            إلغاء
          </ClayButton>
          <ClayButton onClick={save} disabled={title.trim().length < 2} loading={saving}>
            حفظ
          </ClayButton>
        </>
      }
    >
      <Field label={`عنوان ${noun}`}>
        <TextInput
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={kind === "certificate" ? "مثال: شهادة تفوّق الفصل الأول" : "مثال: المركز الأول في مسابقة القراءة"}
          maxLength={90}
        />
      </Field>

      <Field label="الوصف">
        <TextArea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          maxLength={600}
        />
      </Field>

      <div className="iz-form-grid">
        <Field label="التاريخ">
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Field label="الظهور">
          <SelectInput
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as Visibility)}
          >
            {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((key) => (
              <option key={key} value={key}>
                {VISIBILITY_LABEL[key]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <section className="iz-editor-block">
        <h3 className="iz-editor-block__title">صورة {noun}</h3>
        <div className="iz-cover-row">
          {image ? (
            <div className="iz-thumb">
              <img src={image.url} alt={`صورة ${noun}`} />
              <button
                type="button"
                className="iz-thumb__remove"
                aria-label="حذف الصورة"
                onClick={async () => {
                  await deleteFile(image.path);
                  setImage(null);
                }}
              >
                <Trash2 size={15} strokeWidth={2.6} />
              </button>
            </div>
          ) : (
            <p className="iz-field__meter">لا توجد صورة.</p>
          )}
          <Uploader
            folder={`students/${student.id}/achievements`}
            accept="image"
            crop
            cropAspect={4 / 3}
            label={image ? "استبدال الصورة" : "رفع صورة"}
            onUploaded={async (files) => {
              if (image) await deleteFile(image.path);
              setImage({ url: files[0].url, path: files[0].path });
            }}
          />
        </div>
      </section>

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}
