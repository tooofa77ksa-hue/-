import { useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useAllQuestions, useGroups, useStudents, useTestSessions } from "./useTeacherData";
import { createTestSession, deleteTestSession, setSessionActive } from "@/lib/repo";
import { GAME_MODE_LABELS_AR, SKILL_LABELS } from "@/lib/constants";
import type { GameMode, SkillKey } from "@/types/models";

function sessionLink(sessionId: string): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`;
  return `${base}#/play/t/${sessionId}`;
}

export function TestsPage() {
  const { questions } = useAllQuestions();
  const { students } = useStudents();
  const groups = useGroups();
  const sessions = useTestSessions();
  const { appUser } = useAuth();

  const [testType, setTestType] = useState<"individual" | "group">("individual");
  const [studentId, setStudentId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [skillFilter, setSkillFilter] = useState<SkillKey | "all">("all");
  const [gameMode, setGameMode] = useState<GameMode>("rocket_mission");
  const [questionCount, setQuestionCount] = useState(6);
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const availableQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (!q.published || !q.active) return false;
      if (q.gameMode !== gameMode) return false;
      if (skillFilter !== "all" && q.skill !== skillFilter) return false;
      return true;
    });
  }, [questions, gameMode, skillFilter]);

  const handleCreate = async () => {
    if (!appUser) return;
    if (testType === "individual" && !studentId) return;
    if (testType === "group" && !groupId) return;
    if (availableQuestions.length === 0) {
      alert("لا توجد أسئلة منشورة مطابقة لهذا الاختيار. غيّري اللعبة أو المهارة، أو انشري أسئلة أولًا.");
      return;
    }

    setCreating(true);
    setCopied(false);
    try {
      const questionIds = [...availableQuestions]
        .sort((a, b) => a.order - b.order)
        .slice(0, questionCount)
        .map((q) => q.id);

      let participants: Array<{ studentId: string; name: string }> = [];
      if (testType === "individual") {
        const s = students.find((x) => x.id === studentId);
        if (!s) return;
        participants = [{ studentId: s.id, name: s.name }];
      } else {
        participants = students
          .filter((s) => s.groupId === groupId)
          .map((s) => ({ studentId: s.id, name: s.name }));
        if (participants.length === 0) {
          alert("هذه المجموعة لا تحوي طالبات بعد.");
          return;
        }
      }

      const group = groups.find((g) => g.id === groupId);
      const id = await createTestSession({
        type: testType,
        groupId: testType === "group" ? groupId : undefined,
        groupNameSnapshot: testType === "group" ? group?.name : undefined,
        participants,
        participantIds: participants.map((p) => p.studentId),
        questionIds,
        gameMode,
        skill: skillFilter === "all" ? undefined : skillFilter,
        active: true,
        createdBy: appUser.uid,
      });
      setCreatedLink(sessionLink(id));
    } finally {
      setCreating(false);
    }
  };

  const studentName = (id: string) => students.find((s) => s.id === id)?.name || "—";

  return (
    <div className="tests-page">
      <div className="page-header">
        <h1>إنشاء اختبار</h1>
      </div>

      <div className="test-create-card">
        <div className="test-type-toggle">
          <button
            className={testType === "individual" ? "on" : ""}
            onClick={() => setTestType("individual")}
          >
            اختبار فردي
          </button>
          <button className={testType === "group" ? "on" : ""} onClick={() => setTestType("group")}>
            اختبار جماعي
          </button>
        </div>

        {testType === "individual" ? (
          <label>
            الطالبة
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">اختاري طالبة...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            المجموعة
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">اختاري مجموعة...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="form-row">
          <label>
            اللعبة
            <select value={gameMode} onChange={(e) => setGameMode(e.target.value as GameMode)}>
              {Object.entries(GAME_MODE_LABELS_AR).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            المهارة
            <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value as SkillKey | "all")}>
              <option value="all">كل المهارات</option>
              {Object.entries(SKILL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          عدد الأسئلة (المتاح حاليًا: {availableQuestions.length})
          <input
            type="number"
            min={1}
            max={Math.max(1, availableQuestions.length)}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
          />
        </label>

        <button className="primary-btn" onClick={handleCreate} disabled={creating}>
          {creating ? "جارٍ الإنشاء..." : "إنشاء اختبار"}
        </button>

        {createdLink && (
          <div className="created-link-box">
            <p>تم إنشاء الاختبار! شاركي هذا الرابط مع {testType === "individual" ? "الطالبة" : "المجموعة"}:</p>
            <div className="created-link-box__row">
              <input readOnly value={createdLink} onFocus={(e) => e.target.select()} />
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(createdLink);
                  setCopied(true);
                }}
              >
                {copied ? "تم النسخ ✓" : "نسخ الرابط"}
              </button>
            </div>
          </div>
        )}
      </div>

      <h2>الاختبارات المُنشأة ({sessions.length})</h2>
      <div className="sessions-list">
        {sessions.map((s) => (
          <div key={s.id} className="session-row">
            <div className="session-row__main">
              <strong>
                {s.type === "individual" ? studentName(s.participantIds[0]) : s.groupNameSnapshot || "مجموعة"}
              </strong>
              <span className="muted">
                {GAME_MODE_LABELS_AR[s.gameMode]} · {s.questionIds.length} سؤال ·{" "}
                {s.type === "individual" ? "فردي" : `جماعي (${s.participants.length} طالبة)`}
              </span>
            </div>
            <div className="session-row__actions">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(sessionLink(s.id));
                }}
              >
                نسخ الرابط
              </button>
              <button
                className={`badge-toggle ${s.active ? "on" : ""}`}
                onClick={() => setSessionActive(s.id, !s.active)}
              >
                {s.active ? "نشط" : "متوقف"}
              </button>
              <button
                className="danger"
                onClick={() => {
                  if (confirm("حذف هذا الاختبار نهائيًا؟")) deleteTestSession(s.id);
                }}
              >
                حذف
              </button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && <p>لا توجد اختبارات بعد.</p>}
      </div>
    </div>
  );
}
