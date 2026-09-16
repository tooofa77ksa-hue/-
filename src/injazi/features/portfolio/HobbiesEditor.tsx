/*
  محرّر الهوايات.
  الهوايات مصفوفة داخل مستند الطالبة (لا مجموعة مستقلة): عددها صغير
  دائمًا وتُقرأ مع الملف، فمجموعة منفصلة كانت ستعني طلبًا إضافيًا
  بلا فائدة.
  التعديل يحدث على نسخة محلية، ويُحفظ كله بضغطة واحدة مع إمكانية
  التراجع عمّا لم يُحفظ بعد.
*/
import { useEffect, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { Modal } from "@/injazi/ui/Modal";
import { Field, Notice, TextInput } from "@/injazi/ui/primitives";
import { Icon, IconPicker } from "@/injazi/ui/IconPicker";
import { SortableList } from "@/injazi/ui/SortableList";
import { logActivity, updateStudent } from "@/injazi/services/repo";
import { showToast } from "@/injazi/lib/toast";
import type { Hobby, Student, UserDoc } from "@/injazi/types/models";

type Props = {
  open: boolean;
  student: Student;
  actor: UserDoc | null;
  onClose: () => void;
};

export function HobbiesEditor({ open, student, actor, onClose }: Props) {
  const [hobbies, setHobbies] = useState<Hobby[]>(student.hobbies ?? []);
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("Heart");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setHobbies(student.hobbies ?? []);
    setLabel("");
    setError(null);
  }, [open, student]);

  const dirty = JSON.stringify(hobbies) !== JSON.stringify(student.hobbies ?? []);

  function add() {
    const text = label.trim();
    if (text.length < 2) return;
    setHobbies((current) => [
      ...current,
      { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, label: text, icon },
    ]);
    setLabel("");
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateStudent(student.id, { hobbies });
      await logActivity(
        "student.hobbies",
        `تم تحديث هوايات ${student.name}`,
        actor?.name ?? "زائرة",
        actor?.role ?? "guest",
      );
      showToast("تم حفظ الهوايات");
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
      title="هواياتي"
      onClose={onClose}
      footer={
        <>
          <ClayButton
            variant="ghost"
            icon={<RotateCcw size={16} strokeWidth={2.4} />}
            onClick={() => setHobbies(student.hobbies ?? [])}
            disabled={!dirty || saving}
          >
            تراجع
          </ClayButton>
          <ClayButton variant="soft" onClick={onClose} disabled={saving}>
            إلغاء
          </ClayButton>
          <ClayButton onClick={save} loading={saving} disabled={!dirty}>
            حفظ
          </ClayButton>
        </>
      }
    >
      <div className="iz-link-row">
        <TextInput
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="مثال: الرسم"
          aria-label="اسم الهواية"
          maxLength={40}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <ClayButton
          variant="soft"
          icon={<Plus size={17} strokeWidth={2.6} />}
          onClick={add}
          disabled={label.trim().length < 2}
        >
          إضافة
        </ClayButton>
      </div>

      <IconPicker value={icon} onChange={setIcon} label="أيقونة الهواية الجديدة" />

      {hobbies.length === 0 ? (
        <p className="iz-field__meter">لم تُضَف هواية بعد.</p>
      ) : (
        <Field label="الهوايات (اسحبي لإعادة الترتيب)">
          <SortableList
            items={hobbies}
            onReorder={(ids) =>
              setHobbies((current) =>
                ids
                  .map((id) => current.find((hobby) => hobby.id === id))
                  .filter((hobby): hobby is Hobby => Boolean(hobby)),
              )
            }
            renderItem={(hobby) => (
              <div className="iz-hobby-row">
                <span className="iz-hobby-row__icon">
                  <Icon name={hobby.icon} size={18} />
                </span>
                <input
                  className="iz-input iz-input--inline"
                  value={hobby.label}
                  aria-label={`اسم الهواية ${hobby.label}`}
                  onChange={(event) =>
                    setHobbies((current) =>
                      current.map((entry) =>
                        entry.id === hobby.id ? { ...entry, label: event.target.value } : entry,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="iz-icon-btn iz-icon-btn--danger"
                  aria-label={`حذف ${hobby.label}`}
                  onClick={() =>
                    setHobbies((current) => current.filter((entry) => entry.id !== hobby.id))
                  }
                >
                  <Trash2 size={16} strokeWidth={2.6} />
                </button>
              </div>
            )}
          />
        </Field>
      )}

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}
