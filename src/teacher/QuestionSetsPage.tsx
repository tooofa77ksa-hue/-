import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthContext";
import { useQuestionSets } from "./useTeacherData";
import { createQuestionSet, deleteQuestionSet, updateQuestionSet } from "@/lib/repo";

export function QuestionSetsPage() {
  const { appUser } = useAuth();
  const sets = useQuestionSets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gradeLevel, setGradeLevel] = useState("الثالث الابتدائي");

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!appUser || !title.trim()) return;
    await createQuestionSet({
      title: title.trim(),
      description: description.trim() || undefined,
      gradeLevel,
      order: sets.length + 1,
      active: true,
      createdBy: appUser.uid,
    });
    setTitle("");
    setDescription("");
  };

  return (
    <div className="sets-page">
      <h1>مجموعات الأسئلة ({sets.length})</h1>

      <form className="inline-form" onSubmit={handleCreate}>
        <input
          placeholder="عنوان المجموعة الجديدة"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          placeholder="وصف مختصر (اختياري)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          placeholder="المستوى الدراسي"
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
        />
        <button className="primary-btn" type="submit">
          + إضافة مجموعة
        </button>
      </form>

      <div className="sets-list">
        {sets.map((s) => (
          <div className="set-row" key={s.id}>
            <div>
              <strong>{s.title}</strong>
              <p>{s.description}</p>
              <span className="muted">{s.gradeLevel}</span>
            </div>
            <div className="set-row__actions">
              <button
                className={`badge-toggle ${s.active ? "on" : ""}`}
                onClick={() => updateQuestionSet(s.id, { active: !s.active })}
              >
                {s.active ? "مفعّلة" : "معطّلة"}
              </button>
              <button
                className="danger"
                onClick={() => {
                  if (confirm("حذف هذه المجموعة؟ (لن يحذف الأسئلة المرتبطة بها)")) {
                    deleteQuestionSet(s.id);
                  }
                }}
              >
                حذف
              </button>
            </div>
          </div>
        ))}
        {sets.length === 0 && <p>لا توجد مجموعات بعد.</p>}
      </div>
    </div>
  );
}
