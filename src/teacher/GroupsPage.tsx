import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useGroups, useStudents } from "./useTeacherData";
import { createGroup, deleteGroup, moveStudentToGroup, updateGroup } from "@/lib/repo";

const RECOMMENDED_GROUP_SIZE = 5;

export function GroupsPage() {
  const { students } = useStudents();
  const groups = useGroups();
  const { appUser } = useAuth();

  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");
  const [assignTarget, setAssignTarget] = useState<Record<string, string>>({});

  const membersOf = (groupId: string) => students.filter((s) => s.groupId === groupId);
  const candidatesFor = (groupId: string) => students.filter((s) => s.groupId !== groupId);

  const handleCreate = async () => {
    if (!newName.trim() || !appUser) return;
    await createGroup({ name: newName.trim(), createdBy: appUser.uid });
    setNewName("");
  };

  const handleDelete = async (groupId: string, groupNameLabel: string) => {
    const members = membersOf(groupId);
    if (!confirm(`حذف مجموعة "${groupNameLabel}"؟ ستبقى الطالبات (${members.length}) بدون حذف، فقط تُفصل عن المجموعة.`))
      return;
    await deleteGroup(
      groupId,
      members.map((m) => m.id)
    );
  };

  return (
    <div className="groups-page">
      <div className="page-header">
        <h1>المجموعات ({groups.length})</h1>
      </div>

      <div className="inline-form">
        <input
          type="text"
          placeholder="اسم المجموعة الجديدة"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button className="primary-btn" onClick={handleCreate} disabled={!newName.trim()}>
          + إنشاء مجموعة
        </button>
      </div>
      <p className="muted">الحجم المقترح لكل مجموعة نحو {RECOMMENDED_GROUP_SIZE} طالبات (اقتراح فقط، بلا حد أقصى).</p>

      <div className="sets-list">
        {groups.map((g) => {
          const members = membersOf(g.id);
          return (
            <div key={g.id} className="group-card">
              <div className="set-row">
                {renamingId === g.id ? (
                  <input
                    value={renamingValue}
                    onChange={(e) => setRenamingValue(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && renamingValue.trim()) {
                        await updateGroup(g.id, { name: renamingValue.trim() });
                        setRenamingId(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <strong>
                    {g.name} <span className="muted">({members.length} طالبة)</span>
                    {members.length > RECOMMENDED_GROUP_SIZE && (
                      <span className="muted"> — أكبر من الحجم المقترح</span>
                    )}
                  </strong>
                )}
                <div className="set-row__actions">
                  {renamingId === g.id ? (
                    <button
                      onClick={async () => {
                        if (renamingValue.trim()) await updateGroup(g.id, { name: renamingValue.trim() });
                        setRenamingId(null);
                      }}
                    >
                      حفظ
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setRenamingId(g.id);
                        setRenamingValue(g.name);
                      }}
                    >
                      إعادة تسمية
                    </button>
                  )}
                  <button className="danger" onClick={() => handleDelete(g.id, g.name)}>
                    حذف المجموعة
                  </button>
                </div>
              </div>

              <ul className="group-members">
                {members.map((m) => (
                  <li key={m.id}>
                    <span>{m.name}</span>
                    <button onClick={() => moveStudentToGroup(m.id, undefined)}>إزالة من المجموعة</button>
                  </li>
                ))}
                {members.length === 0 && <li className="muted">لا توجد طالبات في هذه المجموعة بعد.</li>}
              </ul>

              {candidatesFor(g.id).length > 0 && (
                <div className="inline-form">
                  <select
                    value={assignTarget[g.id] || ""}
                    onChange={(e) => setAssignTarget((prev) => ({ ...prev, [g.id]: e.target.value }))}
                  >
                    <option value="">اختاري طالبة لإضافتها أو نقلها...</option>
                    {candidatesFor(g.id).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.groupId ? " (من مجموعة أخرى)" : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      const sid = assignTarget[g.id];
                      if (!sid) return;
                      await moveStudentToGroup(sid, g.id);
                      setAssignTarget((prev) => ({ ...prev, [g.id]: "" }));
                    }}
                    disabled={!assignTarget[g.id]}
                  >
                    إضافة للمجموعة
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {groups.length === 0 && <p>لا توجد مجموعات بعد. أنشئي مجموعة من الأعلى.</p>}
      </div>
    </div>
  );
}
