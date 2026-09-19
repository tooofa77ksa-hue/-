/*
  محرّر «عني» — سيرة الطالبة بكلماتها.
  ------------------------------------------------------------------
  أقسام حرّة لا حقولًا ثابتة: الطالبة تكتب عنوان القسم ونصّه، فتقول ما
  تريد («نبذة عني»، «مهاراتي»، «طموحي»، «أشياء أحبّها»، أو ما لم يخطر
  لنا). الحقول الثابتة تحبس غير المتوقَّع وتترك الفارغ منها ندبةً.

  العناوين المقترحة اقتراح لا قالب: ضغطة تملأ العنوان وتترك المؤشّر في
  النصّ — تبدأ الطالبة من شيء بدل صفحة بيضاء، وتبقى حرّة في تغييره.

  التحرير على نسخة محلية ويُحفظ كله بضغطة، كما في محرّر الهوايات:
  نمط واحد في المنصّة أسهل على من تتعلّمه مرة.
*/
import { useEffect, useRef, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { Modal } from "@/injazi/ui/Modal";
import { Field, Notice, TextArea, TextInput } from "@/injazi/ui/primitives";
import { Icon, IconPicker } from "@/injazi/ui/IconPicker";
import { SortableList } from "@/injazi/ui/SortableList";
import { logActivity, updateStudent } from "@/injazi/services/repo";
import { writeErrorMessage } from "@/injazi/lib/firestoreError";
import { showToast } from "@/injazi/lib/toast";
import type { AboutEntry, Student, UserDoc } from "@/injazi/types/models";

type Props = {
  open: boolean;
  student: Student;
  actor: UserDoc | null;
  onClose: () => void;
};

/** بدايات شائعة — لتكسر الصفحة البيضاء، لا لتحدّ ما يمكن كتابته. */
const SUGGESTIONS: { title: string; icon: string }[] = [
  { title: "نبذة عني", icon: "Sparkles" },
  { title: "اهتماماتي", icon: "Heart" },
  { title: "مهاراتي", icon: "Star" },
  { title: "طموحاتي", icon: "Rocket" },
  { title: "أشياء أحبّها", icon: "Smile" },
  { title: "سيرتي الذاتية", icon: "BookOpen" },
];

function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function AboutEditor({ open, student, actor, onClose }: Props) {
  const [entries, setEntries] = useState<AboutEntry[]>(student.about ?? []);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [icon, setIcon] = useState("Sparkles");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  /*
    التعبئة مرّة واحدة لكل فتح — للسبب نفسه المشروح في HobbiesEditor:
    student قراءة حيّة، وأي لقطة تصل أثناء الكتابة كانت تمسح ما كُتب
    وتُعطّل زر الحفظ. ولذلك لم يُكتب قسم «عني» واحد لأي طالبة قط.
  */
  const filled = useRef(false);
  const [baseline, setBaseline] = useState<AboutEntry[]>([]);

  useEffect(() => {
    if (!open) {
      filled.current = false;
      return;
    }
    if (filled.current) return;
    filled.current = true;
    const stored = student.about ?? [];
    setEntries(stored);
    setBaseline(stored);
    setTitle("");
    setBody("");
    setError(null);
  }, [open, student]);

  const saved = baseline;
  const dirty = JSON.stringify(entries) !== JSON.stringify(saved);
  const canAdd = title.trim().length >= 2 && body.trim().length >= 2;

  function add() {
    if (!canAdd) return;
    setEntries((current) => [
      ...current,
      { id: newId(), title: title.trim(), body: body.trim(), icon },
    ]);
    setTitle("");
    setBody("");
  }

  function patch(id: string, change: Partial<AboutEntry>) {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...change } : entry)),
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      // النصوص تُشذَّب عند الحفظ لا أثناء الكتابة: التشذيب أثناء الكتابة
      // يبتلع المسافة التي تكتبها الطالبة بين الكلمتين.
      const clean = entries
        .map((entry) => ({ ...entry, title: entry.title.trim(), body: entry.body.trim() }))
        .filter((entry) => entry.title.length > 0 && entry.body.length > 0);

      await updateStudent(student.id, { about: clean });
      await logActivity(
        "student.about",
        `تم تحديث «عني» في ملف ${student.name}`,
        actor?.name ?? "زائرة",
        actor?.role ?? "guest",
      );
      setBaseline(clean);
      showToast("تم حفظ «عني»");
      onClose();
    } catch (err) {
      setError(writeErrorMessage(err, "about"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="عني"
      onClose={onClose}
      dirty={dirty}
      footer={
        <>
          <ClayButton
            variant="ghost"
            icon={<RotateCcw size={16} strokeWidth={2.4} />}
            onClick={() => setEntries(saved)}
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
      <p className="iz-field__meter">
        اكتبي عن نفسك ما تحبّين: نبذة، مهاراتك، طموحك، أو أي شيء يخصّك. أضيفي كل ما تريدين.
      </p>

      <Field label="عنوان القسم">
        <TextInput
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="مثال: طموحاتي"
          aria-label="عنوان القسم"
          maxLength={40}
        />
      </Field>

      <div className="iz-chip-row" style={{ marginBottom: 12 }}>
        {SUGGESTIONS.map((hint) => (
          <button
            key={hint.title}
            type="button"
            className="iz-linkish"
            onClick={() => {
              setTitle(hint.title);
              setIcon(hint.icon);
              bodyRef.current?.focus();
            }}
          >
            {hint.title}
          </button>
        ))}
      </div>

      <Field label="النصّ">
        <TextArea
          ref={bodyRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="اكتبي هنا…"
          aria-label="نصّ القسم"
          rows={4}
          maxLength={1200}
        />
      </Field>

      <IconPicker value={icon} onChange={setIcon} label="أيقونة القسم الجديد" />

      <ClayButton
        variant="soft"
        icon={<Plus size={17} strokeWidth={2.6} />}
        onClick={add}
        disabled={!canAdd}
      >
        إضافة القسم
      </ClayButton>

      {entries.length === 0 ? (
        <p className="iz-field__meter" style={{ marginTop: 14 }}>
          لم يُضَف قسم بعد.
        </p>
      ) : (
        <div style={{ marginTop: 16 }}>
          <Field label="أقسامك (اسحبي لإعادة الترتيب)">
            <SortableList
              items={entries}
              onReorder={(ids) =>
                setEntries((current) =>
                  ids
                    .map((id) => current.find((entry) => entry.id === id))
                    .filter((entry): entry is AboutEntry => Boolean(entry)),
                )
              }
              renderItem={(entry) => (
                <div className="iz-about-row">
                  <span className="iz-hobby-row__icon">
                    <Icon name={entry.icon} size={18} />
                  </span>
                  <div className="iz-about-row__fields">
                    <input
                      className="iz-input iz-input--inline"
                      value={entry.title}
                      aria-label={`عنوان قسم ${entry.title}`}
                      maxLength={40}
                      onChange={(event) => patch(entry.id, { title: event.target.value })}
                    />
                    <textarea
                      className="iz-input iz-input--inline iz-about-row__body"
                      value={entry.body}
                      aria-label={`نصّ قسم ${entry.title}`}
                      rows={3}
                      maxLength={1200}
                      onChange={(event) => patch(entry.id, { body: event.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="iz-icon-btn iz-icon-btn--danger"
                    aria-label={`حذف قسم ${entry.title}`}
                    onClick={() =>
                      setEntries((current) => current.filter((row) => row.id !== entry.id))
                    }
                  >
                    <Trash2 size={16} strokeWidth={2.6} />
                  </button>
                </div>
              )}
            />
          </Field>
        </div>
      )}

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}
