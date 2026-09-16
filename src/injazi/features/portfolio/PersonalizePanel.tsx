/*
  تخصيص الملف.
  كل خيار هنا محصور في قائمة مغلقة (ثيم، لون من لوحة مختبَرة، نمط غلاف،
  نمط بطاقة، أيقونة) — فالطالبة تحصل على ملف يشبهها دون أي احتمال لكسر
  التصميم أو لتباين نصّ غير مقروء.
  المعاينة حيّة: التغيير يظهر في البطاقة أعلى النافذة قبل الحفظ.
*/
import { useEffect, useState } from "react";
import { Media } from "@/injazi/ui/Media";
import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { Check, Trash2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { Modal } from "@/injazi/ui/Modal";
import { Field, Notice, TextArea, TextInput } from "@/injazi/ui/primitives";
import { IconPicker, Icon } from "@/injazi/ui/IconPicker";
import { Uploader } from "@/injazi/ui/Uploader";
import { deleteFile, studentScope } from "@/injazi/services/storage";
import { logActivity, updateStudent } from "@/injazi/services/repo";
import { showToast } from "@/injazi/lib/toast";
import { ACCENT_PRESETS, CARD_STYLES, COVER_STYLES, THEMES, themeVars } from "@/injazi/themes/themes";
import { DUR, EASE_POP } from "@/injazi/motion/motion";
import type { Student, UserDoc } from "@/injazi/types/models";

type Props = {
  open: boolean;
  student: Student;
  actor: UserDoc | null;
  onClose: () => void;
};

export function PersonalizePanel({ open, student, actor, onClose }: Props) {
  const [name, setName] = useState(student.name);
  const [bio, setBio] = useState(student.bio);
  const [themeId, setThemeId] = useState(student.themeId);
  const [accent, setAccent] = useState<string | null>(student.accentColor);
  const [coverStyle, setCoverStyle] = useState(student.coverStyle);
  const [cardStyle, setCardStyle] = useState(student.cardStyle);
  const [decorIcon, setDecorIcon] = useState(student.decorIcon);
  const [photo, setPhoto] = useState<{ url: string; path: string } | null>(
    student.photoUrl ? { url: student.photoUrl, path: student.photoPath ?? "" } : null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(student.name);
    setBio(student.bio);
    setThemeId(student.themeId);
    setAccent(student.accentColor);
    setCoverStyle(student.coverStyle);
    setCardStyle(student.cardStyle);
    setDecorIcon(student.decorIcon);
    setPhoto(student.photoUrl ? { url: student.photoUrl, path: student.photoPath ?? "" } : null);
    setError(null);
  }, [open, student]);

  const previewStyle = themeVars(themeId, accent) as CSSProperties;

  async function save() {
    if (name.trim().length < 2 || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateStudent(student.id, {
        name: name.trim(),
        bio: bio.trim(),
        themeId,
        accentColor: accent,
        coverStyle,
        cardStyle,
        decorIcon,
        photoUrl: photo?.url ?? null,
        photoPath: photo?.path ?? null,
      });
      await logActivity(
        "student.personalize",
        `تم تحديث ملف ${name.trim()}`,
        actor?.name ?? "زائرة",
        actor?.role ?? "guest",
      );
      showToast("تم حفظ التخصيص");
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
      title="تخصيص الملف"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <ClayButton variant="soft" onClick={onClose} disabled={saving}>
            إلغاء
          </ClayButton>
          <ClayButton onClick={save} disabled={name.trim().length < 2} loading={saving}>
            حفظ التخصيص
          </ClayButton>
        </>
      }
    >
      {/* معاينة حيّة */}
      <div className={`iz-preview iz-student-card--${cardStyle}`} style={previewStyle}>
        <div className={`iz-preview__cover iz-cover--${coverStyle}`} aria-hidden="true" />
        <div className="iz-preview__avatar">
          {photo ? (
            <Media src={photo.url} alt={`صورة ${name}`} />
          ) : (
            <span aria-hidden="true">{name.trim().charAt(0) || "؟"}</span>
          )}
        </div>
        <span className="iz-preview__decor" aria-hidden="true">
          <Icon name={decorIcon} size={18} />
        </span>
        <strong className="iz-preview__name">{name || "اسم الطالبة"}</strong>
      </div>

      {/* الصورة */}
      <section className="iz-editor-block">
        <h3 className="iz-editor-block__title">صورة الطالبة</h3>
        <div className="iz-cover-row">
          <Uploader
            scope={studentScope(student.id)}
            kind="profile"
            accept="image"
            crop
            cropAspect={1}
            label={photo ? "استبدال الصورة" : "اختيار صورة"}
            onUploaded={async (files) => {
              if (photo) await deleteFile(photo.path);
              setPhoto({ url: files[0].url, path: files[0].path });
            }}
          />
          {photo && (
            <ClayButton
              variant="ghost"
              className="iz-btn--danger"
              icon={<Trash2 size={16} strokeWidth={2.4} />}
              onClick={async () => {
                await deleteFile(photo.path);
                setPhoto(null);
              }}
            >
              حذف الصورة
            </ClayButton>
          )}
        </div>
      </section>

      <Field label="اسم الطالبة">
        <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={60} />
      </Field>

      <Field label="نبذة">
        <TextArea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={3}
          maxLength={400}
          placeholder="جملتان تعرّفان بكِ وبما تحبّين."
        />
      </Field>

      {/* الثيم */}
      <section className="iz-editor-block">
        <h3 className="iz-editor-block__title">الثيم</h3>
        <div className="iz-theme-grid" role="radiogroup" aria-label="الثيم">
          {THEMES.map((theme) => (
            <motion.button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={themeId === theme.id}
              className={`iz-theme-option ${themeId === theme.id ? "is-active" : ""}`}
              style={{ background: theme.cover }}
              onClick={() => {
                setThemeId(theme.id);
                // اختيار ثيم يمسح اللون المخصّص، وإلا ظهر الثيم بلا أثر
                // ظاهر وبدت الواجهة معطّلة.
                setAccent(null);
              }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: DUR.tap, ease: EASE_POP }}
            >
              <span>{theme.name}</span>
              {themeId === theme.id && <Check size={16} strokeWidth={3} aria-hidden="true" />}
            </motion.button>
          ))}
        </div>
      </section>

      {/* اللون المميّز */}
      <section className="iz-editor-block">
        <h3 className="iz-editor-block__title">لون مميّز (اختياري)</h3>
        <div className="iz-swatches" role="radiogroup" aria-label="اللون المميّز">
          <button
            type="button"
            role="radio"
            aria-checked={accent === null}
            className={`iz-swatch iz-swatch--auto ${accent === null ? "is-active" : ""}`}
            onClick={() => setAccent(null)}
            title="لون الثيم"
          >
            تلقائي
          </button>
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={accent === color}
              aria-label={`لون ${color}`}
              className={`iz-swatch ${accent === color ? "is-active" : ""}`}
              style={{ background: color }}
              onClick={() => setAccent(color)}
            />
          ))}
        </div>
      </section>

      {/* الغلاف والبطاقة */}
      <div className="iz-form-grid">
        <section className="iz-editor-block">
          <h3 className="iz-editor-block__title">نمط الغلاف</h3>
          <div className="iz-pill-row" role="radiogroup" aria-label="نمط الغلاف">
            {COVER_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                role="radio"
                aria-checked={coverStyle === style.id}
                className={`iz-pill ${coverStyle === style.id ? "is-active" : ""}`}
                onClick={() => setCoverStyle(style.id)}
              >
                {style.name}
              </button>
            ))}
          </div>
        </section>

        <section className="iz-editor-block">
          <h3 className="iz-editor-block__title">نمط البطاقة</h3>
          <div className="iz-pill-row" role="radiogroup" aria-label="نمط البطاقة">
            {CARD_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                role="radio"
                aria-checked={cardStyle === style.id}
                className={`iz-pill ${cardStyle === style.id ? "is-active" : ""}`}
                onClick={() => setCardStyle(style.id)}
              >
                {style.name}
              </button>
            ))}
          </div>
        </section>
      </div>

      <IconPicker value={decorIcon} onChange={setDecorIcon} label="الأيقونة الزخرفية" />

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}
