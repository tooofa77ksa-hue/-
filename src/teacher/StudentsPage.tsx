import { useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useGroups, useStudents } from "./useTeacherData";
import { createStudent, deleteStudent, moveStudentToGroup, updateStudent } from "@/lib/repo";

export function StudentsPage() {
  const { students, loading } = useStudents();
  const groups = useGroups();
  const { appUser } = useAuth();

  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return students;
    return students.filter((s) => s.name.includes(q));
  }, [students, search]);

  const handleAdd = async () => {
    if (!newName.trim() || !appUser) return;
    setAdding(true);
    try {
      await createStudent({ name: newName.trim(), createdBy: appUser.uid });
      setNewName("");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    await updateStudent(editingId, { name: editingName.trim() });
    setEditingId(null);
  };

  if (loading) return <div>جارٍ التحميل...</div>;

  return (
    <div className="students-page">
      <div className="page-header">
        <h1>الطالبات ({students.length})</h1>
      </div>

      <div className="inline-form">
        <input
          type="text"
          placeholder="اسم الطالبة الجديدة"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className="primary-btn" onClick={handleAdd} disabled={adding || !newName.trim()}>
          + إضافة طالبة
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="search"
          placeholder="ابحثي عن اسم طالبة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="students-list">
        {filtered.map((s) => (
          <div key={s.id} className="student-row">
            {editingId === s.id ? (
              <input
                className="student-row__edit-input"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                autoFocus
              />
            ) : (
              <span className="student-row__name">{s.name}</span>
            )}

            <select
              value={s.groupId || ""}
              onChange={(e) => moveStudentToGroup(s.id, e.target.value || undefined)}
              className="student-row__group"
            >
              <option value="">بلا مجموعة</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <div className="student-row__actions">
              {editingId === s.id ? (
                <button onClick={saveEdit}>حفظ</button>
              ) : (
                <button onClick={() => startEdit(s.id, s.name)}>تعديل الاسم</button>
              )}
              <button
                className="danger"
                onClick={() => {
                  if (confirm(`هل تريدين حذف الطالبة "${s.name}"؟`)) deleteStudent(s.id);
                }}
              >
                حذف
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p>لا توجد طالبات مطابقة. أضيفي طالبة من الأعلى.</p>}
      </div>
    </div>
  );
}
